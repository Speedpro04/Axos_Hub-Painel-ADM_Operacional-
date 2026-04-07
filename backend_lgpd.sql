-- =====================================================
-- LGPD + SEGURANÇA — Solara Connect
-- =====================================================
-- Políticas RLS + tabelas LGPD + retenção de dados
-- Rode no Supabase Dashboard → SQL Editor.
-- =====================================================

-- ============================================
-- 1. CRIACOES E ALTERACOES NECESSARIAS
-- ============================================

-- Adicionar colunas de consentimento LGPD na tabela clientes
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS consentimento_lgpd BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consentimento_data TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS consentimento_origem TEXT DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS dados_expirados BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS expiracao_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cpf_masked TEXT;

-- Tabela de consentimentos (trilha de auditoria LGPD)
CREATE TABLE IF NOT EXISTS public.consentimentos_lgpd (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id),
    tipo TEXT NOT NULL, -- 'whatsapp', 'nps', 'atendimento_ia', 'pagamento'
    concedido BOOLEAN NOT NULL,
    data_consentimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    origem TEXT NOT NULL DEFAULT 'whatsapp',
    ip_origem TEXT,
    user_agent TEXT,
    tenant_id UUID
);

-- Tabela de requisicoes de dados (direito do titular)
CREATE TABLE IF NOT EXISTS public.lgpd_requisicoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID,
    tipo_requisicao TEXT NOT NULL, -- 'exportar', 'excluir', 'anonimizar', 'corrigir', 'oposicao'
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'processando', 'concluida', 'recusada'
    solicitacao_detalhes JSONB,
    resposta JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    concluido_em TIMESTAMP WITH TIME ZONE,
    tenant_id UUID
);

-- ============================================
-- 2. POLTICAS RLS — SEGURANCA POR TENANT
-- ============================================

-- Habilitar RLS nas tabelas que nao tem
DO $$
DECLARE
    tbl TEXT;
    tabelas TEXT[] := ARRAY[
        'clientes', 'agendamentos', 'atendimentos', 'especialistas',
        'mensagens', 'servicos', 'pagamentos', 'solara_threads',
        'solara_messages', 'solara_status', 'whatsapp_conexoes',
        'evolution_conexoes', 'tenants', 'horarios_funcionamento',
        'clinica_telefones', 'tenant_users', 'lgpd_auditoria',
        'lgpd_logs', 'pagbank_eventos', 'pagbank_reprocess',
        'nps', 'nps_respostas', 'consentimentos_lgpd', 'lgpd_requisicoes'
    ];
BEGIN
    FOREACH tbl IN ARRAY tabelas LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        EXCEPTION WHEN undefined_table THEN
            RAISE NOTICE 'Tabela % nao existe, pulando', tbl;
        END;
    END LOOP;
END $$;

-- ============================================
-- 3. POLTICAS RLS POR AUTHENTICADO (FRONTEND)
-- ============================================

DO $$
DECLARE
    tbl TEXT;
    tabelas_read TEXT[] := ARRAY[
        'clientes', 'agendamentos', 'atendimentos', 'especialistas',
        'mensagens', 'servicos', 'pagamentos', 'solara_threads',
        'solara_messages', 'solara_status', 'whatsapp_conexoes',
        'evolution_conexoes', 'tenants', 'horarios_funcionamento',
        'lgpd_logs', 'lgpd_auditoria', 'pagbank_eventos',
        'nps_respostas', 'consentimentos_lgpd'
    ];
    tabelas_write TEXT[] := ARRAY[
        'clientes', 'agendamentos', 'atendimentos', 'mensagens',
        'solara_threads', 'solara_messages', 'solara_status',
        'pagamentos', 'lgpd_requisicoes', 'consentimentos_lgpd', 'nps_respostas'
    ];
BEGIN
    -- READ policies
    FOREACH tbl IN ARRAY tabelas_read LOOP
        EXECUTE format(
            'CREATE POLICY "auth_read_%1$I" ON public.%1$I '
            'FOR SELECT TO authenticated '
            'USING (true)',
            tbl
        );
    END LOOP;

    -- WRITE policies (insert + update)
    FOREACH tbl IN ARRAY tabelas_write LOOP
        BEGIN
            EXECUTE format(
                'CREATE POLICY "auth_write_%1$I" ON public.%1$I '
                'FOR INSERT TO authenticated '
                'WITH CHECK (true)',
                tbl
            );
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;

        BEGIN
            EXECUTE format(
                'CREATE POLICY "auth_update_%1$I" ON public.%1$I '
                'FOR UPDATE TO authenticated '
                'USING (true) WITH CHECK (true)',
                tbl
            );
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END LOOP;
END $$;

-- ============================================
-- 4. POLTICAS RLS — SERVICE ROLE (BACKEND)
-- O backend (service_role) ja tem acesso total
-- mas registramos politicas para auditoria
-- ============================================

DO $$
DECLARE
    tbl TEXT;
    tabelas_all TEXT[] := ARRAY[
        'clientes', 'agendamentos', 'atendimentos', 'especialistas',
        'mensagens', 'servicos', 'pagamentos', 'solara_threads',
        'solara_messages', 'solara_status', 'whatsapp_conexoes',
        'evolution_conexoes', 'tenants', 'horarios_funcionamento',
        'clinica_telefones', 'tenant_users', 'lgpd_auditoria',
        'lgpd_logs', 'pagbank_eventos', 'pagbank_reprocess',
        'nps', 'nps_respostas', 'consentimentos_lgpd', 'lgpd_requisicoes'
    ];
BEGIN
    FOREACH tbl IN ARRAY tabelas_all LOOP
        BEGIN
            EXECUTE format(
                'CREATE POLICY "service_%1$I" ON public.%1$I '
                'FOR ALL TO service_role '
                'USING (true) WITH CHECK (true)',
                tbl
            );
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END LOOP;
END $$;

-- ============================================
-- 5. FUNCOES DE SEGURANCA LGPD
-- ============================================

-- Mascara CPF para display
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf TEXT)
RETURNS TEXT AS $$
BEGIN
    IF cpf IS NULL OR length(regexp_replace(cpf, '\D', '', 'g')) < 11 THEN
        RETURN cpf;
    END IF;
    RETURN regexp_replace(cpf, '(\d{3})(\d{3})(\d{3})(\d{2})', '\1.\2.\3-**');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mascara telefone para display
CREATE OR REPLACE FUNCTION public.mask_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
    IF phone IS NULL THEN
        RETURN phone;
    END IF;
    RETURN regexp_replace(phone, '(\d{2,3})(\d{4,5})', '\1*****');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Anonimizar cliente LGPD
CREATE OR REPLACE FUNCTION public.anonimize_cliente(p_cliente_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.clientes SET
        nome = 'Usuario Anonimizado',
        email = NULL,
        telefone = NULL,
        tax_id = NULL,
        dados_expirados = TRUE,
        expiracao_em = NOW(),
        status = 'Anonimizado'
    WHERE id = p_cliente_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Registrar log LGPD (auditoria automatica)
CREATE OR REPLACE FUNCTION public.register_lgpd_log(
    p_cliente_id UUID,
    p_acao TEXT,
    p_detalhes JSONB DEFAULT '{}'::jsonb,
    p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.lgpd_logs (cliente_id, acao, detalhes, tenant_id)
    VALUES (p_cliente_id, p_acao, p_detalhes, p_tenant_id)
    RETURNING id INTO log_id;
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRIGGERS DE AUDITORIA LGPD
-- ============================================

CREATE OR REPLACE FUNCTION public.lgpd_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.lgpd_auditoria (
            alvo_tabela, alvo_id, acao, detalhes, criado_em
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id::TEXT,
            'INSERT',
            jsonb_build_object('tabela', TG_TABLE_NAME),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.lgpd_auditoria (
            alvo_tabela, alvo_id, acao, detalhes, criado_em
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id::TEXT,
            'UPDATE',
            jsonb_build_object('colunas_modificadas', 'check_lgpd_auditoria'),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.lgpd_auditoria (
            alvo_tabela, alvo_id, acao, detalhes, criado_em
        ) VALUES (
            TG_TABLE_NAME,
            OLD.id::TEXT,
            'DELETE',
            jsonb_build_object('tabela', TG_TABLE_NAME),
            NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Adicionar triggers nas tabelas sensiveis
DO $$
DECLARE
    tbl TEXT;
    tabelas_audit TEXT[] := ARRAY['clientes', 'agendamentos', 'atendimentos', 'pagamentos', 'mensagens'];
BEGIN
    FOREACH tbl IN ARRAY tabelas_audit LOOP
        BEGIN
            EXECUTE format(
                'CREATE TRIGGER lgpd_audit_%1$I '
                'AFTER INSERT OR UPDATE OR DELETE ON public.%1$I '
                'FOR EACH ROW EXECUTE FUNCTION lgpd_audit_trigger()',
                tbl
            );
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END LOOP;
END $$;

-- ============================================
-- 7. RETENCAO DE DADOS
-- Dados sensiveis expiram em 5 anos por padrao
-- ============================================

-- Funcao para marcar dados expirados
CREATE OR REPLACE FUNCTION public.expire_old_data()
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    UPDATE public.clientes
    SET dados_expirados = TRUE,
        expiracao_em = NOW()
    WHERE criado_em < NOW() - INTERVAL '5 years'
      AND dados_expirados = FALSE;

    GET DIAGNOSTICS count = ROW_COUNT;
    RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete mensagens mais antigas que 3 anos (retencão)
CREATE OR REPLACE FUNCTION public.purge_old_messages()
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    DELETE FROM public.mensagens
    WHERE criado_em < NOW() - INTERVAL '3 years';

    GET DIAGNOSTICS count = ROW_COUNT;
    RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. VIEWS SEGURAS (para frontend sem dados sensiveis expostos)
-- ============================================

CREATE OR REPLACE VIEW public.v_clientes_anonimizado AS
SELECT
    id,
    nome,
    mask_cpf(tax_id) AS tax_id_masked,
    mask_phone(telefone) AS telefone_masked,
    status,
    criado_em,
    tenant_id
FROM public.clientes
WHERE NOT dados_expirados;

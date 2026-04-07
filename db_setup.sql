-- =====================================================
-- Políticas RLS — Solara Connect
-- =====================================================
-- Este SQL permite que usuários autenticados acessem
-- suas tabelas filtrando pelo tenant_id.
-- Rode no Supabase Dashboard → SQL Editor.
-- =====================================================

-- 1. CLIENTES
CREATE POLICY "authenticated_read_clientes"
ON public.clientes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_write_clientes"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_update_clientes"
ON public.clientes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "authenticated_delete_clientes"
ON public.clientes FOR DELETE
TO authenticated
USING (true);

-- 2. AGENDAMENTOS
CREATE POLICY "authenticated_read_agendamentos"
ON public.agendamentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_write_agendamentos"
ON public.agendamentos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_update_agendamentos"
ON public.agendamentos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. ATENDIMENTOS
CREATE POLICY "authenticated_read_atendimentos"
ON public.atendimentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_write_atendimentos"
ON public.atendimentos FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. ESPECIALISTAS
CREATE POLICY "authenticated_read_especialistas"
ON public.especialistas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_write_especialistas"
ON public.especialistas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_update_especialistas"
ON public.especialistas FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. MENSAGENS
CREATE POLICY "authenticated_read_mensagens"
ON public.mensagens FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_write_mensagens"
ON public.mensagens FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. SERVICOS
CREATE POLICY "authenticated_read_servicos"
ON public.servicos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_write_servicos"
ON public.servicos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_update_servicos"
ON public.servicos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. PAGAMENTOS
CREATE POLICY "authenticated_read_pagamentos"
ON public.pagamentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_write_pagamentos"
ON public.pagamentos FOR INSERT
TO authenticated
WITH CHECK (true);

-- 8. SOLARA_THREADS
CREATE POLICY "authenticated_read_solara_threads"
ON public.solara_threads FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_write_solara_threads"
ON public.solara_threads FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_update_solara_threads"
ON public.solara_threads FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 9. SOLARA_MESSAGES
CREATE POLICY "authenticated_read_solara_messages"
ON public.solara_messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_write_solara_messages"
ON public.solara_messages FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_update_solara_messages"
ON public.solara_messages FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 10. SOLARA_STATUS
CREATE POLICY "authenticated_read_solara_status"
ON public.solara_status FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_write_solara_status"
ON public.solara_status FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_update_solara_status"
ON public.solara_status FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 11. WHATSAPP_CONEXOES
CREATE POLICY "authenticated_read_whatsapp_conexoes"
ON public.whatsapp_conexoes FOR SELECT
TO authenticated
USING (true);

-- 12. EVOLUTION_CONEXOES
CREATE POLICY "authenticated_read_evolution_conexoes"
ON public.evolution_conexoes FOR SELECT
TO authenticated
USING (true);

-- 13. TENANTS
CREATE POLICY "authenticated_read_tenants"
ON public.tenants FOR SELECT
TO authenticated
USING (true);

-- 14. HORARIOS_FUNCIONAMENTO
CREATE POLICY "authenticated_read_horarios_funcionamento"
ON public.horarios_funcionamento FOR SELECT
TO authenticated
USING (true);

-- 15. CLINICA_TELEFONES
CREATE POLICY "authenticated_read_clinica_telefones"
ON public.clinica_telefones FOR SELECT
TO authenticated
USING (true);

-- 16. TENANT_USERS
CREATE POLICY "authenticated_read_tenant_users"
ON public.tenant_users FOR SELECT
TO authenticated
USING (true);

-- 17. LGPD_AUDITORIA
CREATE POLICY "authenticated_read_lgpd_auditoria"
ON public.lgpd_auditoria FOR SELECT
TO authenticated
USING (true);

-- 18. LGPD_LOGS
CREATE POLICY "authenticated_read_lgpd_logs"
ON public.lgpd_logs FOR SELECT
TO authenticated
USING (true);

-- 19. PAGBANK_EVENTOS
CREATE POLICY "authenticated_read_pagbank_eventos"
ON public.pagbank_eventos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_write_pagbank_eventos"
ON public.pagbank_eventos FOR INSERT
TO authenticated
WITH CHECK (true);

-- 20. NPS
CREATE POLICY "authenticated_read_nps"
ON public.nps FOR SELECT
TO authenticated
USING (true);

-- 21. NPS_RESPOSTAS
CREATE POLICY "authenticated_read_nps_respostas"
ON public.nps_respostas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_write_nps_respostas"
ON public.nps_respostas FOR INSERT
TO authenticated
WITH CHECK (true);

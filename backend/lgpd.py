"""
LGPD Compliance Module — Solara Connect
Art. 18: Direitos do titular
Art. 7: Bases legais
Art. 46: Segurança dos dados
"""

import os
from datetime import datetime

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
TENANT_ID = os.getenv("TENANT_ID", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================
# CONSENTIMENTO (Base Legal — Art. 7, LGPD)
# ============================================
async def register_consent(cliente_id: str, tipo: str, origem: str = "whatsapp"):
    """Registra que o cliente consentiu com o tratamento de dados."""
    supabase.table("clientes").update({
        "consentimento_lgpd": True,
        "consentimento_data": datetime.utcnow().isoformat(),
        "consentimento_origem": origem,
    }).eq("id", cliente_id).execute()

    supabase.table("consentimentos_lgpd").insert({
        "cliente_id": cliente_id,
        "tipo": tipo,
        "concedido": True,
        "origem": origem,
        "tenant_id": TENANT_ID,
    }).execute()

    _log_lgpd(cliente_id, "consentimento", {"tipo": tipo, "origem": origem})


async def withdraw_consent(cliente_id: str):
    """Revoga consentimento — cliente pode pedir a qualquer momento."""
    supabase.table("clientes").update({
        "consentimento_lgpd": False,
        "status": "Inativo",
    }).eq("id", cliente_id).execute()

    supabase.table("consentimentos_lgpd").insert({
        "cliente_id": cliente_id,
        "tipo": "revogacao",
        "concedido": False,
        "origem": "cliente_solicitou",
        "tenant_id": TENANT_ID,
    }).execute()

    _log_lgpd(cliente_id, "revogacao_consentimento", {})


# ============================================
# DIREITO DE ACESSO (Art. 18, II — LGPD)
# ============================================
async def export_client_data(cliente_id: str) -> dict:
    """
    Exporta TODOS os dados do titular.
    Retorna um dicionario completo com todas as informacoes.
    """
    # Dados pessoais
    cliente = supabase.table("clientes").select("*").eq("id", cliente_id).execute()

    # Agendamentos
    agendamentos = supabase.table("agendamentos").select("*").eq("cliente_id", cliente_id).execute()

    # Atendimentos
    atendimentos = supabase.table("atendimentos").select("*").eq("cliente_id", cliente_id).execute()

    # Mensagens
    mensagens = supabase.table("mensagens").select("texto, direcao, criado_em").eq("cliente_id", cliente_id).execute()

    # Pagamentos
    pagamentos = supabase.table("pagamentos").select("valor, status, criado_em, vencimento").eq("cliente_id", cliente_id).execute()

    # Consentimentos
    consentimentos = supabase.table("consentimentos_lgpd").select("*").eq("cliente_id", cliente_id).execute()

    _log_lgpd(cliente_id, "exportacao_dados", {"solicitado_em": datetime.utcnow().isoformat()})

    return {
        "dados_pessoais": cliente.data[0] if cliente.data else None,
        "agendamentos": agendamentos.data or [],
        "atendimentos": atendimentos.data or [],
        "mensagens": mensagens.data or [],
        "pagamentos": pagamentos.data or [],
        "consentimentos": consentimentos.data or [],
        "exportado_em": datetime.utcnow().isoformat(),
        "finalidade": "Solicitação do titular — Art. 18, LGPD (Lei 13.709/2018)",
    }


# ============================================
# DIREITO DE EXCLUSÃO (Art. 18, VI — LGPD)
# ============================================
async def request_deletion(cliente_id: str) -> dict:
    """
    Solicita exclusão dos dados do titular.
    Na verdade, anonimiza (preserva registros financeiros por obrigação legal).
    """
    # Anonimiza dados pessoais
    supabase.rpc("anonimize_cliente", {"p_cliente_id": cliente_id}).execute()

    # Registra requisicao
    supabase.table("lgpd_requisicoes").insert({
        "cliente_id": cliente_id,
        "tipo_requisicao": "excluir",
        "status": "concluida",
        "concluido_em": datetime.utcnow().isoformat(),
        "tenant_id": TENANT_ID,
    }).execute()

    _log_lgpd(cliente_id, "exclusao_dados", {"metodo": "anonimizacao"})

    return {"status": "dados_anonimizados", "cliente_id": cliente_id}


# ============================================
# DIREITO DE CORREÇÃO (Art. 18, III — LGPD)
# ============================================
async def correct_data(cliente_id: str, campos: dict) -> dict:
    """Corrige dados incompletos, inexatos ou desatualizados."""
    campos_permitidos = {"nome", "email", "telefone", "tax_id"}
    campos_filtrados = {k: v for k, v in campos.items() if k in campos_permitidos}

    supabase.table("clientes").update(campos_filtrados).eq("id", cliente_id).execute()

    supabase.table("lgpd_requisicoes").insert({
        "cliente_id": cliente_id,
        "tipo_requisicao": "corrigir",
        "status": "concluida",
        "solicitacao_detalhes": campos_filtrados,
        "concluido_em": datetime.utcnow().isoformat(),
        "tenant_id": TENANT_ID,
    }).execute()

    _log_lgpd(cliente_id, "correcao_dados", {"campos": list(campos_filtrados.keys())})

    return {"status": "dados_corrigidos", "campos": list(campos_filtrados.keys())}


# ============================================
# DIREITO DE OPOSIÇÃO (Art. 18, VII — LGPD)
# ============================================
async def request_opt_out(cliente_id: str) -> dict:
    """Cliente pode se opor a mensagens marketing, NPS etc."""
    supabase.table("clientes").update({
        "status": "Opt-out",
    }).eq("id", cliente_id).execute()

    supabase.table("lgpd_requisicoes").insert({
        "cliente_id": cliente_id,
        "tipo_requisicao": "oposicao",
        "status": "concluida",
        "concluido_em": datetime.utcnow().isoformat(),
        "tenant_id": TENANT_ID,
    }).execute()

    _log_lgpd(cliente_id, "oposicao", {"motivo": "solicitado_pelo_cliente"})

    return {"status": "opt_out_registrado"}


# ============================================
# LOG DE AUDITORIA INTERNO
# ============================================
def _log_lgpd(cliente_id: str, acao: str, detalhes: dict):
    """Registra acao no log de auditoria LGPD interno."""
    try:
        supabase.table("lgpd_logs").insert({
            "cliente_id": cliente_id,
            "acao": acao,
            "detalhes": detalhes,
            "criado_em": datetime.utcnow().isoformat(),
            "tenant_id": TENANT_ID,
        }).execute()
    except Exception as e:
        print(f"Erro ao registrar log LGPD: {e}")


# ============================================
# LIMPEZA PERIODICA (Data Retention)
# ============================================
async def purge_old_data():
    """Limpa dados antigos conforme politica de retencao."""
    # Mensagens (+ 3 anos)
    supabase.rpc("purge_old_messages").execute()

    # Dados expirados (+ 5 anos)
    supabase.rpc("expire_old_data").execute()

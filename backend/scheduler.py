"""
Scheduler de tarefas automaticas da Solara
- Envio de lembretes de consulta (1 dia antes)
- Envio de NPS (2 horas apos consulta)
"""

import asyncio
import os
from datetime import datetime, timedelta

from solara_ai import SOLARA_PERSONA
from whatsapp_client import evolution_send_text, clean_phone, extract_first_name

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


async def send_appointment_reminders():
    """Envia lembretes para consultas do dia seguinte."""
    tomorrow = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")

    result = supabase.table("agendamentos").select(
        "id, data_hora, status, cliente!inner(nome, telefone)"
    ).gte("data_hora", f"{tomorrow}T00:00:00").lt(
        "data_hora", f"{tomorrow}T23:59:59"
    ).eq("status", "agendado").execute()

    if not result.data:
        print("Nenhum lembrete para enviar hoje.")
        return

    for appt in result.data:
        cliente = appt.get("cliente", {})
        phone = clean_phone(cliente.get("telefone", ""))
        name = extract_first_name(cliente.get("nome", "cliente"))
        time_str = appt.get("data_hora", "")[:5]

        msg = f"Ola, {name}! Aqui e a Solara da Solara Connect! ☀️\n\n"
        msg += f"Lembrando que voce tem amanha as {time_str}!\n\n"
        msg += "Responda 1 para confirmar ou 2 para reagendar. 💙"

        print(f"Enviando lembrete para {name} ({phone})")
        await evolution_send_text(phone, msg)


async def send_nps_followup():
    """Envia NPS para atendimentos finalizados nas ultimas 2h."""
    two_hours_ago = (datetime.utcnow() - timedelta(hours=2)).isoformat()

    result = supabase.table("atendimentos").select(
        "id, cliente_id, responsavel, criado_em"
    ).eq("status", "finalizado").gte("criado_em", two_hours_ago).execute()

    if not result.data:
        print("Nenhum NPS para enviar.")
        return

    for atendimento in result.data:
        cliente_id = atendimento.get("cliente_id")
        responsavel = atendimento.get("responsavel", "nosso profissional")

        # Busca cliente
        cliente_result = supabase.table("clientes").select("telefone, nome").eq("id", cliente_id).execute()
        if not cliente_result.data:
            continue

        cliente = cliente_result.data[0]
        phone = clean_phone(cliente.get("telefone", ""))
        name = extract_first_name(cliente.get("nome", "cliente"))

        msg = f"Ola, {name}! Aqui e a Solara da Solara Connect! 🌸\n\n"
        msg += f"Voce foi atendida hoje pelo {responsavel}. Como esta se sentindo?\n\n"
        msg += "De 0 a 10, o quanto voce recomendaria a Solara Connect para uma amiga? 💙"

        print(f"Enviando NPS para {name} ({phone})")
        await evolution_send_text(phone, msg)


async def run_scheduler():
    """Loop principal do scheduler."""
    print("Scheduler da Solara iniciado!")
    while True:
        try:
            await send_appointment_reminders()
            await send_nps_followup()
        except Exception as e:
            print(f"Erro no scheduler: {e}")

        # Roda a cada 15 minutos
        await asyncio.sleep(900)


if __name__ == "__main__":
    asyncio.run(run_scheduler())

"""
Solara Connect AI - Sistema de Atendimento Inteligente
Backend FastAPI integrado com Evolution API (WhatsApp), Supabase e Gemini AI.

Solara e a gestora do sistema — empathic, eficiente, e sempre pronta para
atender, agendar, confirmar, fazer follow-up e NPS.
"""

import json
import re
import os
from datetime import datetime, timedelta
from enum import Enum
from fastapi import HTTPException

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

from lgpd import (
    register_consent,
    export_client_data,
    request_deletion,
    correct_data,
    request_opt_out,
    purge_old_data,
)

load_dotenv()

# ============================================
# CONFIG
# ============================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "axos-evoapi")
TENANT_ID = os.getenv("TENANT_ID", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Solara Connect AI", version="1.0.0")

# ============================================
# SEGURANCA — RATE LIMIT SIMPLES
# ============================================
from collections import defaultdict
import time

_request_log: dict = defaultdict(list)

MAX_REQUESTS_PER_MINUTE = 60

async def rate_limit_check(client_ip: str) -> bool:
    """Rate limit simples baseado em IP."""
    now = time.time()
    # Limpa logs antigos (+ de 1 min)
    _request_log[client_ip] = [t for t in _request_log[client_ip] if now - t < 60]
    if len(_request_log[client_ip]) >= MAX_REQUESTS_PER_MINUTE:
        return False
    _request_log[client_ip].append(now)
    return True

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    """Middleware de seguranc: rate limit + logs."""
    client_ip = request.client.host if request.client else "unknown"

    # Rate limit
    if not await rate_limit_check(client_ip):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=429,
            content={"error": "Muitas requisicoes. Aguarde um momento."}
        )

    # Log de auditoria para endpoints sensíveis
    if request.url.path.startswith("/lgpd"):
        _log_lgpd_action("request", request.url.path, client_ip)

    return await call_next(request)


def _log_lgpd_action(acao: str, path: str, ip: str):
    """Log de auditoria para acesso a endpoints LGPD."""
    try:
        supabase.table("lgpd_logs").insert({
            "acao": f"lgpd_{acao}",
            "detalhes": {"path": path, "ip": ip},
            "criado_em": datetime.utcnow().isoformat(),
            "tenant_id": TENANT_ID,
        }).execute()
    except:
        pass


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://evoapi.axoshub.com",
        "https://kfeflgdqftycmmoyrtpg.supabase.co",
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    allow_credentials=True,
)


# ============================================
# EVOLUTION API CLIENT
# ============================================
async def evolution_send_text(phone: str, message: str) -> dict:
    """Envia mensagem de texto via Evolution API."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}",
            headers={"apikey": EVOLUTION_API_KEY},
            json={"number": phone, "text": message},
        )
        return resp.json()


async def evolution_send_audio_base64(phone: str, audio_base64: str) -> dict:
    """Envia audio em base64 via Evolution API."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{EVOLUTION_API_URL}/message/sendAudio/{EVOLUTION_INSTANCE}",
            headers={"apikey": EVOLUTION_API_KEY},
            json={
                "number": phone,
                "audio": audio_base64,
                "caption": "",
            },
        )
        return resp.json()


# ============================================
# SOLARA AI — PERSONA E PROMPT
# ============================================
SOLARA_SYSTEM_PROMPT = """
Voce e a **Solara**, assistente virtual da Solara Connect — sistema de gestao inteligente para clinicas.

## SUA PERSONALIDADE
- Empatica, educada e acolhedora, mas eficiente e objetiva
- Sempre chama o cliente pelo primeiro nome
- Fala portugues brasileiro natural, sem termos tecnicos
- Trata o cliente com respeito e calor humano
- Quando o cliente estiver ansioso ou preocupado, mostra compreensao
- Nunca diz "como modelo de linguagem" ou "sou IA" - voce e a Solara

## SUAS TAREFAS

### 1. ATENDIMENTO INICIAL
- Cumprimente pelo nome: "Ola, [nome]! Sou a Solara, assistente da Solara Connect. Como posso ajudar?"
- Ofereca opcoes claras: agendar consulta, reagendar, informacoes, etc.

### 2. CONFIRMAR CONSULTA
- Busque no banco de dados a proxima consulta do cliente
- Confirme data, hora, profissional e localizacao
- Peca confirmacao: "Posso confirmar sua consulta?"

### 3. REAGENDAR CONSULTA
- Ofereca alternativas de horarios disponiveis
- Atualize no banco o reagendamento
- Envie confirmacao do novo horario

### 4. NPS (NET PROMOTER SCORE)
- 2h apos consulta: envie mensagem de follow-up + NPS
- "Ola, [nome]! Aqui e a Solara. Voce foi atendida hoje pelo {profissional}. Como esta se sentindo? De 0 a 10, o quanto voce recomendaria a Solara Connect para uma amiga?"
- Responda com empatia baseado na nota:
  - 9-10: "Que otimo! Ficamos muito felizes! Seu feedback e muito importante."
  - 7-8: "Obrigada pelo feedback. Sempre queremos melhorar!"
  - 0-6: "Sinto muito que nao tenha sido uma otima experiencia. Vou encaminhar sua sugestao para nossa equipe melhorar."

### 5. AGENDAR NOVA CONSULTA
- Pergunte qual especialidade deseja e qual dia/horario prefere
- Verifique disponibilidade
- Confirme o agendamento

## FORMATO DAS RESPOSTAS
- Respostas claras e curtas (maximo 3-4 linhas por mensagem)
- Use emojis com moderao (1-2 por mensagem)
- Quebre em multiplas mensagens se necessario

## REGRAS DE SEGURANCA
- Nao revele informacoes de outros clientes
- Nao altere dados de consultas sem confirmao
- Nao compartilhe dados de pagamento
- Se nao souber algo, diga: "Vou verificar para voce, um momento!"
"""


# ============================================
# GEMINI AI CLIENT
# ============================================
async def solara_ai_response(messages: list[dict]) -> str:
    """Gera resposta usando Gemini AI com a persona da Solara."""
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if not gemini_key:
        return "Desculpe, estou com um pequeno problema tcnico. Minha equipe j foi notificada e vamos resolver logo. Enquanto isso, posso ajudar ligando para a clinica!"

    conversation = "\n".join(
        [f"{m['role']}: {m['content']}" for m in messages]
    )

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}",
            json={
                "contents": [
                    {
                        "parts": [
                            {
                                "text": f"SYSTEM: {SOLARA_SYSTEM_PROMPT}\n\nCONVERSA:\n{conversation}\n\nResponda como a Solara:"
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 500,
                },
            },
        )
        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError):
            return "Desculpe, nao entendi. Pode reformular?"


# ============================================
# HELPERS
# ============================================
def clean_phone(phone: str) -> str:
    """Limpa numero de telefone para formato padrao."""
    # Remove tudo que nao e digito
    cleaned = re.sub(r"\D", "", phone)
    # Se comeca com 55, mantem
    if cleaned.startswith("55"):
        return cleaned
    # Adiciona 55 se nao tem
    return "55" + cleaned


def extract_first_name(full_name: str) -> str:
    """Extrai o primeiro nome."""
    if not full_name:
        return "cliente"
    return full_name.split()[0].capitalize()


async def get_or_create_client(phone: str) -> dict | None:
    """Busca ou cria cliente pelo telefone."""
    clean = clean_phone(phone)

    # Busca no banco
    result = supabase.table("clientes").select("*").eq("telefone", clean).limit(1).execute()

    if result.data and len(result.data) > 0:
        return result.data[0]

    # Cria novo cliente
    result = supabase.table("clientes").insert({
        "telefone": clean,
        "status": "Novo",
    }).execute()

    if result.data and len(result.data) > 0:
        return result.data[0]

    return None


async def get_upcoming_appointments(client_id: str) -> list:
    """Busca proximas consultas do cliente."""
    result = supabase.table("agendamentos").select(
        "id, data_hora, status, especialista!inner(nome, especialidade)"
    ).eq("cliente_id", client_id).order("data_hora", desc=True).limit(3).execute()

    return result.data if result.data else []


# ============================================
# WEBHOOK PRINCIPAL (RECEBE MENSAGENS)
# ============================================
@app.post("/webhook/evolution")
async def webhook_evolution(request: Request, background_tasks: BackgroundTasks):
    """
    Recebe webhooks da Evolution API.
    Processa mensagens de texto, audio, imagem, etc.
    """
    body = await request.json()

    # Log do webhook SEM dados pessoais (minimizacao de dados - Art. 6, LGPD)
    supabase.table("evolution_eventos").insert({
        "payload": {"event": body.get("event", "unknown"), "timestamp": datetime.utcnow().isoformat()},
        "tipo": body.get("event", "unknown"),
        "criado_em": datetime.utcnow().isoformat(),
    }).execute()

    # Verifica se e mensagem
    event = body.get("event", "")
    if event not in ("messages.upsert", "messages.update"):
        return {"status": "ok", "event": event}

    # Dados da mensagem
    message_data = body.get("data", {}) or body.get("message", body)
    if not message_data:
        return {"status": "ok", "warning": "no message data"}

    phone = message_data.get("key", {}).get("remoteJid", "")
    if not phone:
        return {"status": "ok", "warning": "no phone"}

    # Ignora mensagens do proprio bot
    if "g.us" in phone or not phone.endswith("@s.whatsapp.net"):
        return {"status": "ok", "ignored": "group or invalid"}

    # Limpa telefone
    phone_clean = phone.replace("@s.whatsapp.net", "")

    # Processa em background para nao travar o webhook
    background_tasks.add_task(process_message, phone_clean, message_data)

    return {"status": "ok"}


async def process_message(phone: str, message_data: dict):
    """Processa a mensagem e gera resposta da Solara."""
    try:
        # Busca ou cria cliente
        cliente = await get_or_create_client(phone)
        if not cliente:
            await evolution_send_text(phone, "Ola! Tivemos um probleminha tecnico. Por favor, tente novamente em instantes!")
            return

        # Identifica tipo de mensagem
        msg_type = message_data.get("messageType", "texto")
        first_name = extract_first_name(cliente.get("nome", ""))

        # Atualiza ultima interacao
        supabase.table("clientes").update({
            "status": "Ativo",
        }).eq("id", cliente["id"]).execute()

        # Monta historico de conversa para a IA
        messages = [{"role": "user", "content": ""}]

        if msg_type == "texto":
            text = message_data.get("message", {}).get("conversation", "")
            if not text:
                # Pode estar em outro formato
                text = ""
                for key, val in message_data.get("message", {}).items():
                    if isinstance(val, dict) and "text" in val:
                        text = val.get("text", "")
                        break

            messages[0]["content"] = text

            # Salva mensagem no banco
            supabase.table("mensagens").insert({
                "cliente_id": cliente["id"],
                "texto": text,
                "direcao": "entrada",
                "metadata": {"tipo": "texto"},
            }).execute()

        elif msg_type in ("audio", "audioMessage"):
            audio_url = ""
            for key, val in message_data.get("message", {}).items():
                if isinstance(val, dict) and "url" in val:
                    audio_url = val.get("url", "")
                    break

            # Se nao tem URL, manda transcrição simples
            if text_content := message_data.get("contextInfo", {}).get("quotedMessage", {}).get("conversation"):
                messages[0]["content"] = f"(audio transcrito): {text_content}"
            else:
                messages[0]["content"] = f"(audio recebido do cliente {first_name}. Como lidar?)"

            supabase.table("mensagens").insert({
                "cliente_id": cliente["id"],
                "texto": "(mensagem de audio)",
                "direcao": "entrada",
                "metadata": {"tipo": "audio", "url": audio_url},
            }).execute()

        elif msg_type in ("imagem", "imageMessage"):
            messages[0]["content"] = "(imagem recebida). Descreva o que voce ve e como pode ajudar."
            supabase.table("mensagens").insert({
                "cliente_id": cliente["id"],
                "texto": "(mensagem de imagem)",
                "direcao": "entrada",
                "metadata": {"tipo": "imagem"},
            }).execute()

        else:
            messages[0]["content"] = message_data.get("message", {})
            supabase.table("mensagens").insert({
                "cliente_id": cliente["id"],
                "texto": f"(msg tipo {msg_type})",
                "direcao": "entrada",
                "metadata": {"tipo": msg_type},
            }).execute()

        # Busca contexto: proximas consultas
        appointments = await get_upcoming_appointments(cliente["id"])
        if appointments:
            prox = appointments[0]
            context = f"Cliente {first_name} tem consulta agendada: {prox.get('data_hora', 'sem data')} com {prox.get('especialista', {}).get('nome', 'sem profissional')}"
        else:
            context = f"Cliente {first_name} nao tem consultas agendadas."

        messages.append({"role": "system", "content": f"CONTEXTO: {context}"})

        # Gera resposta da Solara via Gemini AI
        response_text = await solara_ai_response(messages)

        # Salva resposta da Solara
        supabase.table("mensagens").insert({
            "cliente_id": cliente["id"],
            "texto": response_text,
            "direcao": "saida",
            "metadata": {"tipo": "ai_response"},
        }).execute()

        # Envia resposta via WhatsApp
        await evolution_send_text(phone, response_text)

    except Exception as e:
        print(f"Erro ao processar mensagem: {e}")
        # Fallback
        try:
            await evolution_send_text(phone, "Desculpe, tive um probleminha tecnico. Minha equipe foi notificada e vou resolver logo!")
        except:
            pass


# ============================================
# SCHEDULED TASKS — NPS E FOLLOW-UP
# ============================================
@app.post("/cron/nps-check")
async def cron_nps_check(background_tasks: BackgroundTasks):
    """
    Endpoint chamado a cada hora (via cron/scheduler).
    Verifica consultas concluidas nas ultimas 2h e envia NPS.
    """
    two_hours_ago = (datetime.utcnow() - timedelta(hours=2)).isoformat()

    # Busca atendimentos finalizados recentes
    result = supabase.table("atendimentos").select(
        "id, cliente_id, responsavel, criado_em"
    ).eq("status", "finalizado").gte("criado_em", two_hours_ago).execute()

    if not result.data:
        return {"status": "ok", "message": "No recent finished attendances"}

    attended_ids = [a["id"] for a in result.data]

    # Verifica quais ja receberam NPS
    nps_log = supabase.table("nps_respostas").select("atendimento_id").in_(
        "atendimento_id", attended_ids
    ).execute()
    already_sent = {n["atendimento_id"] for n in nps_log.data} if nps_log.data else set()

    for atendimento in result.data:
        if atendimento["id"] in already_sent:
            continue

        background_tasks.add_task(send_nps, atendimento)

    return {"status": "ok", "nps_sent": len(result.data) - len(already_sent)}


async def send_nps(atendimento: dict):
    """Envia mensagem de follow-up + NPS para o cliente."""
    cliente_id = atendimento.get("cliente_id", "")
    responsavel = atendimento.get("responsavel", "nosso profissional")

    # Busca dados do cliente
    cliente_result = supabase.table("clientes").select("telefone").eq("id", cliente_id).execute()
    if not cliente_result.data:
        return

    telefone = cliente_result.data[0]["telefone"]
    first_name = extract_first_name(cliente_result.data[0].get("nome", ""))

    # Mensagem de follow-up + NPS
    msg = f"Ola, {first_name}! Aqui e a Solara da Solara Connect! 🌸\n\n"
    msg += f"Voce foi atendida hoje pelo {responsavel}. Como esta se sentindo?\n\n"
    msg += "De 0 a 10, o quanto voce recomendaria a Solara Connect para uma amiga? 💙"

    await evolution_send_text(telefone, msg)


# ============================================
# CONFIRMAR CONSULTA (endpoint automatico)
# ============================================
@app.post("/cron/appointment-reminders")
async def cron_appointment_reminders(background_tasks: BackgroundTasks):
    """
    Verifica consultas do proximo dia e envia lembretes.
    Chame a cada hora via cron.
    """
    now = datetime.utcnow()
    tomorrow = now + timedelta(days=1)

    tomorrow_str = tomorrow.strftime("%Y-%m-%d")

    result = supabase.table("agendamentos").select(
        "id, data_hora, status, cliente!inner(nome, telefone)"
    ).gte("data_hora", f"{tomorrow_str}T00:00:00").lt(
        "data_hora", f"{tomorrow_str}T23:59:59"
    ).eq("status", "agendado").execute()

    if not result.data:
        return {"status": "ok", "message": "No appointments tomorrow"}

    for appt in result.data:
        cliente = appt.get("cliente", {})
        phone = clean_phone(cliente.get("telefone", ""))
        name = extract_first_name(cliente.get("nome", "cliente"))
        time_str = appt.get("data_hora", "horario a confirmar")[:5]

        msg = f"Ola, {name}! Aqui e a Solara da Solara Connect! ☀️\n\n"
        msg += f"Lembrando que voce tem amanha as {time_str}!\n\n"
        msg += "Responda 1 para confirmar ou 2 para reagendar. 💙"

        await evolution_send_text(phone, msg)

    return {"status": "ok", "reminders_sent": len(result.data)}


# ============================================
# PROCESSAR RESPOSTA DE CONFIRMACAO
# ============================================
@app.post("/webhook/confirmation")
async def process_confirmation(request: Request):
    """Processa respostas de confirmacao (1=confirmar, 2=reagendar)."""
    body = await request.json()
    phone = body.get("phone", "")
    response = body.get("response", "")

    if response == "1":
        await evolution_send_text(phone, "Otimo! Sua consulta esta confirmada! Te amanha! 💙")
    elif response == "2":
        await evolution_send_text(phone, "Sem problema! Vou verificar horarios disponiveis e te mando em instantes. Um momento! ⏳")
    else:
        await evolution_send_text(phone, "Desculpe, nao entendi. Responda 1 para confirmar ou 2 para reagendar. 😊")

    return {"status": "ok"}


# ============================================
# HEALTH CHECK
# ============================================
@app.get("/health")
async def health():
    """Verifica se o backend esta funcionando."""
    try:
        resp = supabase.table("clientes").select("id").limit(1).execute()
        db_status = "ok" if resp.data is not None else "error"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "running",
        "solara": "online",
        "database": db_status,
    }


# ============================================
# PROCESSAR NPS RESPONSE
# ============================================
@app.post("/webhook/nps-response")
async def process_nps_response(request: Request):
    """Processa resposta do NPS do cliente."""
    body = await request.json()
    phone = body.get("phone", "")
    score_str = body.get("score", "")

    try:
        score = int(score_str)
    except (ValueError, TypeError):
        # Nao foi um numero, a IA vai lidar
        return {"status": "not_a_score"}

    # Classifica
    if score >= 9:
        response = f"Que otimo ficamos muito felizes! 😄\n\nSeu feedback e muito importante para nos. Voce e o tipo de cliente que nos motiva a melhorar sempre!\n\nA Solara Connect agradece! 💙"
    elif score >= 7:
        response = f"Obrigada pelo feedback! 🙏\n\nSempre queremos melhorar. Se tiver alguma sugestao, e so falar!\n\nA Solara Connect agradece! 💙"
    else:
        response = f"Sinto muito que nao tenha sido uma otima experiencia. 😔\n\nVou encaminhar sua sugestao para nossa equipe melhorar. Sua opiniao e muito importante!\n\nA Solara Connect quer te oferecer o melhor. 💙"

    await evolution_send_text(phone, response)
    return {"status": "ok", "score": score}


# ============================================
# ENDPOINTS LGPD (Art. 18 — Direitos do Titular)
# ============================================
@app.post("/lgpd/export")
async def lgpd_export(request: Request):
    """
    EXPORTAR DADOS DO TITULAR (Art. 18, II, LGPD)
    Recebe: {"cliente_id": "uuid"}
    Retorna TODOS os dados do titular.
    """
    body = await request.json()
    cliente_id = body.get("cliente_id", "")
    if not cliente_id:
        raise HTTPException(status_code=400, detail="cliente_id é obrigatório")

    data = await export_client_data(cliente_id)
    return data


@app.post("/lgpd/delete")
async def lgpd_delete(request: Request):
    """
    EXCLUIR DADOS DO TITULAR (Art. 18, VI, LGPD)
    Recebe: {"cliente_id": "uuid"}
    Anonimiza os dados (não deleta — para auditoria).
    """
    body = await request.json()
    cliente_id = body.get("cliente_id", "")
    if not cliente_id:
        raise HTTPException(status_code=400, detail="cliente_id é obrigatório")

    result = await request_deletion(cliente_id)
    return result


@app.post("/lgpd/correct")
async def lgpd_correct(request: Request):
    """
    CORRIGIR DADOS DO TITULAR (Art. 18, III, LGPD)
    Recebe: {"cliente_id": "uuid", "dados": {"nome": "...", "telefone": "..."}}
    """
    body = await request.json()
    cliente_id = body.get("cliente_id", "")
    campos = body.get("dados", {})

    if not cliente_id or not campos:
        raise HTTPException(status_code=400, detail="cliente_id e dados são obrigatórios")

    result = await correct_data(cliente_id, campos)
    return result


@app.post("/lgpd/opt-out")
async def lgpd_optout(request: Request):
    """
    OPOSIÇÃO DO TITULAR (Art. 18, VII, LGPD)
    Recebe: {"cliente_id": "uuid"}
    Cliente para de receber mensagens automáticas.
    """
    body = await request.json()
    cliente_id = body.get("cliente_id", "")
    if not cliente_id:
        raise HTTPException(status_code=400, detail="cliente_id é obrigatório")

    result = await request_opt_out(cliente_id)
    return result


@app.post("/lgpd/consent")
async def lgpd_consent(request: Request):
    """
    REGISTRA CONSENTIMENTO DO TITULAR (Art. 7, I, LGPD)
    Recebe: {"cliente_id": "uuid", "tipo": "whatsapp"}
    """
    body = await request.json()
    cliente_id = body.get("cliente_id", "")
    tipo = body.get("tipo", "whatsapp")

    if not cliente_id or not tipo:
        raise HTTPException(status_code=400, detail="cliente_id e tipo são obrigatórios")

    await register_consent(cliente_id, tipo)
    return {"status": "consentimento_registrado", "tipo": tipo}


@app.post("/lgpd/withdraw-consent")
async def lgpd_withdraw(request: Request):
    """
    REVOGA CONSENTIMENTO DO TITULAR (Art. 8, §5, LGPD)
    Recebe: {"cliente_id": "uuid"}
    """
    from lgpd import withdraw_consent

    body = await request.json()
    cliente_id = body.get("cliente_id", "")
    if not cliente_id:
        raise HTTPException(status_code=400, detail="cliente_id é obrigatório")

    await withdraw_consent(cliente_id)
    return {"status": "consentimento_revogado"}


@app.post("/cron/purge-data")
async def cron_purge_data():
    """
    Limpeza periódica de dados antigos (Retention Policy)
    """
    await purge_old_data()
    return {"status": "ok", "message": "Dados antigos removidos"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


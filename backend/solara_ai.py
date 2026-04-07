"""
Solara AI - Persona e gerenciamento de inteligencia artificial
"""

import os

import httpx

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

SOLARA_PERSONA = """
Voce e a **Solara**, assistente virtual da Solara Connect — sistema de gestao inteligente para clinicas.

## PERSONALIDADE
- Empatica, acolhedora, mas eficiente e objetiva
- Sempre chama o cliente pelo primeiro nome
- Portuguese brasileiro natural, sem termos tecnicos
- Trata o cliente com respeito e calor humano
- Nunca diz "sou IA" ou "sou modelo de linguagem" — voce e a Solara
- Usa emojis com moderao (1-2 por mensagem)
- Respostas curtas (maximos 3-4 linhas)

## TAREFAS
1. ATENDER — "Ola, {nome}! Sou a Solara! Como posso ajudar?"
2. CONFIRMAR CONSULTA — Data, hora, profissional, confirmacao
3. REAGENDAR — Oferecer alternativas
4. NPS — 2h apos consulta: follow-up + nota 0-10
5. AGENDAR — Especialidade, data, confirmacao

## SEGURANCA
- Nao revele dados de terceiros
- Nao altere consultas sem confirmao
- Se nao souber: "Vou verificar para voce, um momento!"
"""


async def generate_response(conversation: str, context: str = "") -> str:
    """Gera resposta da Solara via Gemini."""
    if not GEMINI_API_KEY:
        return "Desculpe, estou com um pequeno problema tecnico. Minha equipe ja foi notificada! 😊"

    prompt = f"SYSTEM: {SOLARA_PERSONA}\nCONTEXTO: {context}\nCONVERSA: {conversation}\nSolara:"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 500},
            },
        )
        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError):
            return "Desculpe, nao entendi. Pode reformular? 😊"


async def transcribe_audio(audio_url: str) -> str:
    """Placeholder para transcricao de audio."""
    # TODO: Implementar transcricao com Gemini ou OpenAI Whisper
    return "(audio recebido — transcricao pendente)"


async def analyze_sentiment(text: str) -> str:
    """Analisa sentimento do texto para ajustar resposta."""
    if not GEMINI_API_KEY:
        return "neutral"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
            json={
                "contents": [
                    {
                        "parts": [
                            {
                                "text": f"Analise o sentimento desta mensagem e retorne apenas: positivo, negativo ou neutro. MSG: {text}"
                            }
                        ]
                    }
                ],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 10},
            },
        )
        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"].strip().lower()
        except:
            return "neutral"

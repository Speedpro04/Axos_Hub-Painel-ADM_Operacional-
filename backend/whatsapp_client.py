"""
WhatsApp Client for Evolution API
"""

import os
import re

import httpx

EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "https://evoapi.axoshub.com")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "axos-evoapi")


def clean_phone(phone: str) -> str:
    """Limpa numero de telefone para formato padrao internacional."""
    cleaned = re.sub(r"\D", "", phone)
    if cleaned.startswith("55"):
        return cleaned
    return "55" + cleaned


def extract_first_name(full_name: str) -> str:
    """Extrai o primeiro nome."""
    if not full_name:
        return "cliente"
    return full_name.split()[0].capitalize()


async def evolution_send_text(phone: str, message: str) -> dict:
    """Envia mensagem de texto via Evolution API."""
    clean = clean_phone(phone)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}",
            headers={"apikey": EVOLUTION_API_KEY},
            json={"number": clean, "text": message},
        )
        return resp.json()


async def evolution_send_audio(phone: str, audio_path: str) -> dict:
    """Envia audio (arquivo) via Evolution API."""
    clean = clean_phone(phone)
    with open(audio_path, "rb") as f:
        import base64

        audio_base64 = base64.b64encode(f.read()).decode()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{EVOLUTION_API_URL}/message/sendAudio/{EVOLUTION_INSTANCE}?number={clean}",
            headers={"apikey": EVOLUTION_API_KEY},
            json={
                "number": clean,
                "audio": audio_base64,
            },
        )
        return resp.json()


async def evolution_send_image(phone: str, image_url: str, caption: str = "") -> dict:
    """Envia imagem via Evolution API."""
    clean = clean_phone(phone)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{EVOLUTION_API_URL}/message/sendMedia/{EVOLUTION_INSTANCE}",
            headers={"apikey": EVOLUTION_API_KEY},
            json={
                "number": clean,
                "mediatype": "image",
                "media": image_url,
                "caption": caption,
            },
        )
        return resp.json()


async def evolution_send_link_preview(phone: str, url: str, caption: str = "") -> dict:
    """Envia link preview via Evolution API."""
    clean = clean_phone(phone)
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{EVOLUTION_API_URL}/message/sendLink/{EVOLUTION_INSTANCE}",
            headers={"apikey": EVOLUTION_API_KEY},
            json={
                "number": clean,
                "text": caption,
                "url": url,
            },
        )
        return resp.json()


async def get_connection_status() -> dict:
    """Verifica status da conexo da instncia."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{EVOLUTION_API_URL}/instance/connectionState/{EVOLUTION_INSTANCE}",
            headers={"apikey": EVOLUTION_API_KEY},
        )
        return resp.json()


async def create_instance(instance_name: str = None) -> dict:
    """Cria uma nova instncia na Evolution API."""
    name = instance_name or EVOLUTION_INSTANCE
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{EVOLUTION_API_URL}/instance/create",
            headers={"apikey": EVOLUTION_API_KEY},
            json={
                "instanceName": name,
                "qrcode": True,
            },
        )
        return resp.json()

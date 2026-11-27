"""Cliente mínimo para hablar con Ollama por HTTP (sin dependencias externas)."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
MODEL = os.environ.get("CVB_MODEL", "qwen2.5:3b-instruct")
TIMEOUT = int(os.environ.get("CVB_OLLAMA_TIMEOUT", "180"))


class OllamaError(RuntimeError):
    """Ollama no está disponible o respondió un error."""


def _request(path: str, payload: dict | None = None, timeout: int = TIMEOUT) -> dict:
    url = f"{OLLAMA_HOST}{path}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"} if data else {},
        method="POST" if data else "GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")[:500]
        raise OllamaError(f"Ollama respondió HTTP {exc.code}: {body}") from exc
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise OllamaError(
            f"No se pudo conectar con Ollama en {OLLAMA_HOST}. "
            f"Verifica que esté corriendo (agent/start.ps1 lo inicia). Detalle: {exc}"
        ) from exc


def tags() -> dict:
    """Lista de modelos instalados; sirve como health check."""
    return _request("/api/tags", timeout=5)


def model_installed(model: str = MODEL) -> bool:
    try:
        names = [item.get("name", "") for item in tags().get("models", [])]
    except OllamaError:
        return False
    return any(name == model or name.startswith(f"{model}:") for name in names)


def chat(
    messages: list[dict],
    model: str = MODEL,
    tools: list[dict] | None = None,
    timeout: int = TIMEOUT,
) -> dict:
    """Devuelve el mensaje del asistente (content y/o tool_calls)."""
    payload: dict = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.3},
    }
    if tools:
        payload["tools"] = tools
    response = _request("/api/chat", payload, timeout=timeout)
    return response.get("message", {})

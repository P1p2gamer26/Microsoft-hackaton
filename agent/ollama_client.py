"""Cliente mínimo para hablar con Ollama por HTTP (sin dependencias externas)."""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
MODEL = os.environ.get("CVB_MODEL", "qwen3")
TIMEOUT = int(os.environ.get("CVB_OLLAMA_TIMEOUT", "180"))
# Qwen3 soporta modo "thinking"; lo desactivamos por defecto para respuestas
# limpias y tool-calling confiable. Se puede reactivar con CVB_OLLAMA_THINK=1.
THINK = os.environ.get("CVB_OLLAMA_THINK", "0").strip().lower() in {"1", "true", "yes", "on"}

_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)
_TOOL_CALL_RE = re.compile(r"<tool_call>\s*(\{.*?\})\s*</tool_call>", re.DOTALL)


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


def strip_thinking(text: str) -> str:
    """Quita bloques <think>...</think> que algunos modelos (Qwen3) pueden emitir."""
    return _THINK_RE.sub("", text or "").strip()


def _normalize_tool_calls(message: dict) -> list[dict]:
    """Devuelve tool_calls nativos de Ollama o los extrae de <tool_call> en el content."""
    calls = message.get("tool_calls") or []
    if calls:
        return calls
    # Respaldo para modelos que emiten <tool_call>{...}</tool_call> como texto.
    content = message.get("content") or ""
    parsed: list[dict] = []
    for match in _TOOL_CALL_RE.findall(content):
        try:
            data = json.loads(match)
        except json.JSONDecodeError:
            continue
        name = data.get("name") or data.get("function", {}).get("name")
        arguments = data.get("arguments", data.get("function", {}).get("arguments", {}))
        if isinstance(arguments, str):
            try:
                arguments = json.loads(arguments)
            except json.JSONDecodeError:
                arguments = {}
        if name:
            parsed.append({"function": {"name": str(name), "arguments": arguments or {}}})
    return parsed


def chat(
    messages: list[dict],
    model: str = MODEL,
    tools: list[dict] | None = None,
    timeout: int = TIMEOUT,
    think: bool = THINK,
) -> dict:
    """Devuelve el mensaje del asistente (content y/o tool_calls)."""
    payload: dict = {
        "model": model,
        "messages": messages,
        "stream": False,
        "think": bool(think),
        "options": {"temperature": 0.3},
    }
    if tools:
        payload["tools"] = tools
    response = _request("/api/chat", payload, timeout=timeout)
    message = dict(response.get("message", {}))
    # El razonamiento interno de Qwen3 llega en message.thinking; no lo exponemos.
    message.pop("thinking", None)
    raw_content = message.get("content") or ""
    calls = _normalize_tool_calls(message)
    message["content"] = strip_thinking(_TOOL_CALL_RE.sub("", raw_content).strip())
    if calls:
        message["tool_calls"] = calls
    elif "tool_calls" in message:
        message.pop("tool_calls", None)
    return message

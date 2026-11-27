"""Servidor HTTP local del agente Coffee Value Bridge.

Endpoints:
  GET  /api/health   -> estado de Ollama y del modelo
  GET  /api/sources  -> documentos indexados
  POST /api/chat     -> {"message": "...", "history": [{"role","content"}]}

Se escucha solo en 127.0.0.1. Sin dependencias externas (Python 3.14 friendly).
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

import knowledge
import ollama_client
from ollama_client import OllamaError
from tools import TOOL_SPECS, run_tool

HERE = Path(__file__).resolve().parent
MODEL = ollama_client.MODEL
PORT = int(os.environ.get("CVB_PORT", "8000"))
MAX_HISTORY = 10

SYSTEM_PROMPT_FILE = HERE / "prompts" / "system.md"
DEFAULT_SYSTEM_PROMPT = (
    "Eres el analista de Coffee Value Bridge. Responde en español, cita fuentes, "
    "no inventes datos y diferencia hechos, cálculos y recomendaciones."
)


def system_prompt() -> str:
    if SYSTEM_PROMPT_FILE.is_file():
        return SYSTEM_PROMPT_FILE.read_text(encoding="utf-8").strip()
    return DEFAULT_SYSTEM_PROMPT


def _history_messages(history: object) -> list[dict]:
    messages: list[dict] = []
    if not isinstance(history, list):
        return messages
    for item in history[-MAX_HISTORY:]:
        if not isinstance(item, dict):
            continue
        role = "assistant" if item.get("role") == "assistant" else "user"
        content = str(item.get("content", "")).strip()[:2000]
        if content:
            messages.append({"role": role, "content": content})
    return messages


def _collect_sources(value: object, found: list[str]) -> None:
    if isinstance(value, dict):
        for key, item in value.items():
            if key in {"fuente", "source"} and isinstance(item, str):
                found.append(item)
            else:
                _collect_sources(item, found)
    elif isinstance(value, list):
        for item in value:
            _collect_sources(item, found)


def respond(message: str, history: object) -> dict:
    messages = [{"role": "system", "content": system_prompt()}]
    messages.extend(_history_messages(history))
    messages.append({"role": "user", "content": message})

    tools_used: list[dict] = []
    sources: list[str] = []
    mode = "direct"

    try:
        first = ollama_client.chat(MODEL, messages, tools=TOOL_SPECS)
        calls = first.get("tool_calls") or []

        if calls:
            mode = "tools"
            messages.append(
                {
                    "role": "assistant",
                    "content": first.get("content", ""),
                    "tool_calls": calls,
                }
            )
            for call in calls:
                function = call.get("function", {}) if isinstance(call, dict) else {}
                name = str(function.get("name", ""))
                arguments = function.get("arguments") or {}
                if isinstance(arguments, str):
                    try:
                        arguments = json.loads(arguments)
                    except json.JSONDecodeError:
                        arguments = {}
                result = run_tool(name, arguments)
                tools_used.append({"name": name, "arguments": arguments})
                _collect_sources(result, sources)
                messages.append(
                    {
                        "role": "tool",
                        "content": json.dumps(result, ensure_ascii=False),
                    }
                )
            final = ollama_client.chat(MODEL, messages)
            answer = str(final.get("content", "")).strip()
        else:
            answer = str(first.get("content", "")).strip()
    except OllamaError:
        # Fallback: inyectamos contexto del repo sin tool-calling.
        mode = "context"
        snippets = knowledge.search(message, 5)
        blocks = "\n\n".join(
            f"[{item['source']} · {item['heading']}]\n{item['text']}" for item in snippets
        )
        messages[0] = {
            "role": "system",
            "content": system_prompt()
            + "\n\nCONTEXTO DE DOCUMENTOS:\n"
            + (blocks or "No hay documentos indexados."),
        }
        sources.extend(item["source"] for item in snippets)
        final = ollama_client.chat(MODEL, messages)
        answer = str(final.get("content", "")).strip()

    if not sources:
        sources = [item["source"] for item in knowledge.search(message, 3)]

    # Dejar únicas las fuentes, conservando el orden.
    sources = list(dict.fromkeys(sources))

    return {
        "answer": answer or "No obtuve una respuesta del modelo.",
        "sources": sources,
        "tools_used": tools_used,
        "mode": mode,
        "model": MODEL,
    }


class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802 - API de http.server
        self._send(200, {})

    def do_GET(self) -> None:  # noqa: N802
        path = urlsplit(self.path).path
        if path == "/api/health":
            try:
                ollama_client.tags()
                reachable = True
            except OllamaError:
                reachable = False
            self._send(
                200,
                {
                    "status": "ok",
                    "ollama": reachable,
                    "model": MODEL,
                    "model_installed": ollama_client.model_installed(),
                    "documents": len(knowledge.index()),
                    "host": ollama_client.OLLAMA_HOST,
                },
            )
        elif path == "/api/sources":
            self._send(200, {"sources": knowledge.sources()})
        elif path == "/":
            self._send(
                200,
                {
                    "message": "Agente Coffee Value Bridge activo. "
                    "Abre coffee-value-bridge.html y usa la vista 'Coffee Intelligence Copilot'.",
                    "endpoints": ["/api/health", "/api/sources", "/api/chat"],
                },
            )
        else:
            self._send(404, {"error": "Ruta no encontrada"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlsplit(self.path).path
        if path != "/api/chat":
            self._send(404, {"error": "Ruta no encontrada"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            message = str(body.get("message", "")).strip()
            if not message:
                self._send(400, {"error": "El campo 'message' es obligatorio"})
                return
            self._send(200, respond(message[:4000], body.get("history", [])))
        except (ValueError, json.JSONDecodeError) as exc:
            self._send(400, {"error": f"JSON inválido: {exc}"})
        except OllamaError as exc:
            self._send(503, {"error": str(exc)})
        except Exception as exc:  # noqa: BLE001 - no derribar el servidor
            self._send(500, {"error": f"Error interno: {exc}"})

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"[agente] {fmt % args}")


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Agente Coffee Value Bridge en http://127.0.0.1:{PORT}")
    print(f"Modelo: {MODEL} | Ollama: {ollama_client.OLLAMA_HOST}")
    print(f"Documentos indexados: {len(knowledge.index())}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nAgente detenido.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

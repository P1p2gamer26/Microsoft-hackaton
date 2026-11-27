"""Índice simple (por palabras clave) de los documentos del proyecto.

No usa bases de datos vectoriales: con unos pocos archivos Markdown es suficiente
y evita instalar dependencias en Python 3.14.
"""

from __future__ import annotations

import os
import re
import unicodedata
from pathlib import Path

ROOT = Path(os.environ.get("CVB_ROOT", Path(__file__).resolve().parent.parent))
CHUNK_SIZE = 900

STOPWORDS = {
    "de", "del", "la", "las", "el", "los", "un", "una", "unos", "unas", "y", "o",
    "en", "por", "para", "con", "sin", "se", "su", "sus", "es", "son", "ser",
    "que", "cual", "cuales", "como", "cuando", "donde", "porque", "qué", "qué",
    "este", "esta", "esto", "estos", "estas", "al", "lo", "más", "menos", "muy",
    "hay", "hacer", "tiene", "tienen", "puede", "pueden", "nuestro", "nuestra",
}

_INDEX = None


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in text if not unicodedata.combining(ch)).lower()


def _tokens(text: str) -> list[str]:
    return [
        word
        for word in re.findall(r"[a-z0-9]+", normalize(text))
        if len(word) > 2 and word not in STOPWORDS
    ]


def _documents() -> list[Path]:
    docs = [ROOT / "Propuesta.md"]
    docs.extend(sorted((ROOT / "docs").glob("*.md")))
    return [path for path in docs if path.is_file()]


def build_index() -> list[dict]:
    chunks: list[dict] = []

    for path in _documents():
        text = path.read_text(encoding="utf-8", errors="replace")
        source = path.relative_to(ROOT).as_posix()
        heading = ""
        buffer: list[str] = []
        size = 0

        def flush() -> None:
            nonlocal buffer, size
            if buffer:
                chunks.append(
                    {
                        "source": source,
                        "heading": heading,
                        "text": " ".join(buffer).strip(),
                    }
                )
                buffer = []
                size = 0

        for raw_line in text.splitlines():
            line = raw_line.strip()
            if line.startswith("#"):
                flush()
                heading = line.lstrip("#").strip()
                continue
            if not line:
                flush()
                continue
            clean = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", line)
            if len(clean) > CHUNK_SIZE:
                for start in range(0, len(clean), CHUNK_SIZE):
                    chunks.append(
                        {
                            "source": source,
                            "heading": heading,
                            "text": clean[start : start + CHUNK_SIZE],
                        }
                    )
                continue
            if size + len(clean) > CHUNK_SIZE:
                flush()
            buffer.append(clean)
            size += len(clean)
        flush()

    return chunks


def index() -> list[dict]:
    global _INDEX
    if _INDEX is None:
        _INDEX = build_index()
    return _INDEX


def search(query: str, limit: int = 4) -> list[dict]:
    """Devuelve los fragmentos más relacionados con la pregunta."""
    tokens = _tokens(query)
    if not tokens:
        return []

    scored: list[dict] = []
    for chunk in index():
        words = _tokens(f"{chunk['heading']} {chunk['text']}")
        if not words:
            continue
        score = sum(min(words.count(token), 3) for token in tokens)
        if not score:
            continue
        if chunk["heading"] and any(t in _tokens(chunk["heading"]) for t in tokens):
            score += 2
        scored.append({**chunk, "score": score})

    scored.sort(key=lambda item: -item["score"])
    return scored[:limit]


def sources() -> list[str]:
    return sorted({chunk["source"] for chunk in index()})


def context(max_chars: int = 6000) -> str:
    """Contexto completo recortado, usado como fallback si falla tool-calling."""
    parts: list[str] = []
    used = 0
    for chunk in index():
        block = f"[{chunk['source']} · {chunk['heading']}]\n{chunk['text']}"
        if used + len(block) > max_chars:
            break
        parts.append(block)
        used += len(block)
    return "\n\n".join(parts)

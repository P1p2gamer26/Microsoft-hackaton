FROM python:3.12-slim

WORKDIR /app

# El contexto es la raíz del repo: así el agente indexa Propuesta.md y docs/*.md.
COPY Propuesta.md ./Propuesta.md
COPY docs ./docs
COPY agent ./agent

ENV CVB_ROOT=/app \
    CVB_HOST=0.0.0.0 \
    PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python", "agent/server.py"]

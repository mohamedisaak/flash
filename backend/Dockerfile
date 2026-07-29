# syntax=docker/dockerfile:1
#
# Production image for the Django API + Celery (same image, different commands).
# Used by both the web service and the worker in render.yaml.
#
# Serving: gunicorn (process manager) running a uvicorn ASGI worker against
# config.asgi:application. Static files are collected at build time and served
# by WhiteNoise from inside the app — no nginx needed.
FROM python:3.14-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

# Toolchain + libraries for the native deps (psycopg, lxml, pillow, cffi).
# Almost everything installs from wheels; these cover any source build on 3.14.
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential libpq-dev libffi-dev libxml2-dev libxslt1-dev \
      libjpeg-dev zlib1g-dev \
 && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv

WORKDIR /app

# 1) Dependencies first — this layer is cached unless pyproject.toml/uv.lock change.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# 2) Application source.
COPY . .

# 3) Collect static assets for WhiteNoise. The build-time SECRET_KEY is a
#    throwaway that doesn't trip the production guard; the real key is injected
#    at runtime by the host. No database is touched here.
RUN SECRET_KEY=build-time-not-secret DEBUG=False \
    python manage.py collectstatic --noinput

# Render (and most PaaS) inject $PORT; fall back to 8000 for local `docker run`.
EXPOSE 8000
CMD gunicorn config.asgi:application \
      -k uvicorn.workers.UvicornWorker \
      -b 0.0.0.0:${PORT:-8000} \
      --workers ${WEB_CONCURRENCY:-3} \
      --timeout 60 \
      --access-logfile - --error-logfile -

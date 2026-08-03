"""
Django settings for the Flash news publishing platform.

Configuration is environment-driven (12-factor style) via ``django-environ``:
every value that changes between local/staging/production is read from an
environment variable (or a local ``.env`` file), never hard-coded. See
``teaching/05-django/project-files/settings-py-explained.md`` for a guided
tour of this file.
"""

from pathlib import Path

import environ

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
# BASE_DIR points at the ``backend/`` directory (two parents up from this
# file: config/settings.py -> config/ -> backend/).
BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CSRF_TRUSTED_ORIGINS=(list, []),
)

# Load a local .env file if present (never committed; see .env.example).
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env(
    "SECRET_KEY",
    default="django-insecure-dev-key-change-me-in-production-please",
)
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")
CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS")

# Fail fast rather than boot a production server with the shared insecure dev
# key (a forgeable-session / signed-cookie risk). Render (see render.yaml) sets a
# generated SECRET_KEY, so this only trips a genuine misconfiguration.
if not DEBUG and SECRET_KEY.startswith("django-insecure"):
    from django.core.exceptions import ImproperlyConfigured

    raise ImproperlyConfigured(
        "SECRET_KEY is unset/insecure while DEBUG=False. Set a strong SECRET_KEY."
    )

# On Render every service is injected with RENDER_EXTERNAL_HOSTNAME; trust it
# automatically so the API's own domain works without hand-editing ALLOWED_HOSTS.
_render_host = env("RENDER_EXTERNAL_HOSTNAME", default="")
if _render_host:
    ALLOWED_HOSTS = [*ALLOWED_HOSTS, _render_host]
    CSRF_TRUSTED_ORIGINS = [*CSRF_TRUSTED_ORIGINS, f"https://{_render_host}"]

# Which browser origins (the web app, dashboards) may call the API cross-origin.
CORS_ALLOWED_ORIGINS = env(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:3000", "http://127.0.0.1:3000"],
)

# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",  # full-text search, array/JSON helpers
    "django.contrib.sitemaps",  # sitemap.xml framework
]

THIRD_PARTY_APPS = [
    "corsheaders",  # Cross-Origin Resource Sharing (browser calls from the web app)
    "rest_framework",  # Django REST Framework — the JSON API layer
    "django_filters",  # declarative filtering/search on list endpoints
    "drf_spectacular",  # OpenAPI 3 schema + Swagger/Redoc docs
]

# Local apps — one Django app per bounded context (modular monolith).
# Each app owns its own models/services and stays loosely coupled to the rest.
LOCAL_APPS = [
    "apps.common",
    "apps.accounts",
    "apps.categories",
    "apps.articles",
    "apps.livecoverage",
    "apps.videos",
    "apps.galleries",
    "apps.media",
    "apps.ads",
    "apps.newsletters",
    "apps.notifications",
    "apps.comments",
    "apps.analytics",
    "apps.seo",
    "apps.search",
    "apps.cms",
    "apps.aggregation",
    "apps.synthesis",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise serves collected static files (admin, DRF, Swagger) straight
    # from the app process with far-future caching — no nginx/CDN required for
    # them. Must sit directly after SecurityMiddleware.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    # CORS must sit high, before CommonMiddleware, so it can add headers to (and
    # short-circuit) cross-origin preflight requests from the web/mobile clients.
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Records who did what on write requests to the API (see apps/common/middleware.py).
    "apps.common.middleware.AuditLogMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
# DATABASE_URL example (matches infrastructure/docker-compose.dev.yml):
#   postgres://flash:flash@localhost:5432/flash
# Falls back to a local SQLite file so `manage.py check` and quick experiments
# work with zero infrastructure; production/CI always set DATABASE_URL.
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
    )
}

# Reuse database connections across requests instead of opening a fresh one each
# time (persistent connections). On Postgres this removes the TCP + auth
# handshake from every request's critical path and cuts connection churn/CPU on
# the DB. CONN_HEALTH_CHECKS makes Django validate a reused connection before use
# so a dropped connection is transparently replaced. Ignored by SQLite.
# Set CONN_MAX_AGE=0 to restore per-request connections.
if not DATABASES["default"]["ENGINE"].endswith("sqlite3"):
    DATABASES["default"]["CONN_MAX_AGE"] = env.int("CONN_MAX_AGE", default=60)
    DATABASES["default"]["CONN_HEALTH_CHECKS"] = True

# ---------------------------------------------------------------------------
# Cache (Redis)
# ---------------------------------------------------------------------------
# Falls back to the in-process local-memory cache when REDIS_URL is unset.
REDIS_URL = env("REDIS_URL", default="")
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }

# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
# Custom user model — set before the first migration so accounts.User is the
# canonical user everywhere (see the accounts app).
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static & media files (with a pluggable storage backend)
# ---------------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
# MEDIA_ROOT is overridable so a host can point it at a persistent disk (e.g. a
# Render Disk mounted at /var/media) instead of the ephemeral container fs.
MEDIA_ROOT = env("MEDIA_ROOT", default=str(BASE_DIR / "media"))

# In production, hash + compress static filenames so they can be cached forever
# (WhiteNoise manifest storage). In DEBUG we keep the plain storage so the dev
# server doesn't require a collectstatic run.
_staticfiles_backend = (
    "django.contrib.staticfiles.storage.StaticFilesStorage"
    if DEBUG
    else "whitenoise.storage.CompressedManifestStaticFilesStorage"
)

# Django's STORAGES abstraction lets us swap where uploaded files live without
# touching model code. Default: local disk. Set USE_S3=True (and `uv sync
# --extra s3`) to store media in any S3-compatible service, including MinIO.
# See teaching/25-docker/ and apps/media/.
USE_S3 = env.bool("USE_S3", default=False)
if USE_S3:
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3.S3Storage",
            "OPTIONS": {
                "bucket_name": env("S3_BUCKET", default="flash-media"),
                "endpoint_url": env("S3_ENDPOINT_URL", default=None),  # MinIO URL
                "access_key": env("S3_ACCESS_KEY", default=""),
                "secret_key": env("S3_SECRET_KEY", default=""),
                "region_name": env("S3_REGION", default=""),
                "file_overwrite": False,
            },
        },
        "staticfiles": {"BACKEND": _staticfiles_backend},
    }
else:
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": _staticfiles_backend},
    }

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Django REST Framework  (see teaching/06-django-rest-framework/)
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    # How a request proves who it is. JWT for API clients (web/mobile); session
    # auth is kept so the browsable API works while you're logged into /admin/.
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    # Safe default: authenticated-only. Individual views relax this (e.g. public
    # read access) explicitly, so nothing is public by accident.
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    # List endpoints are paginated by default so we never dump a whole table.
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.DefaultPagination",
    "PAGE_SIZE": 20,
    # Filtering, search, and ordering wired globally; views declare their fields.
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    # Rate limiting (throttling): abuse protection for anon vs. logged-in users.
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": env("THROTTLE_ANON", default="60/min"),
        "user": env("THROTTLE_USER", default="1000/min"),
        # Tight, per-scope limits for sensitive/abusable endpoints (brute-force,
        # account/newsletter spam). Applied via ScopedRateThrottle on the views.
        "login": env("THROTTLE_LOGIN", default="10/min"),
        "register": env("THROTTLE_REGISTER", default="5/min"),
        "subscribe": env("THROTTLE_SUBSCRIBE", default="10/min"),
        "report": env("THROTTLE_REPORT", default="20/min"),
    },
    # drf-spectacular generates the OpenAPI schema from our views/serializers.
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# JSON Web Token settings (djangorestframework-simplejwt).
from datetime import timedelta  # noqa: E402  (kept next to the setting it configures)

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("JWT_ACCESS_MINUTES", default=30)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("JWT_REFRESH_DAYS", default=7)),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# OpenAPI / Swagger metadata (drf-spectacular).
SPECTACULAR_SETTINGS = {
    "TITLE": "Flash News API",
    "DESCRIPTION": "REST API for the Flash news publishing platform.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,  # hide the raw schema endpoint from the docs
    "COMPONENT_SPLIT_REQUEST": True,
    # Several models have a "status" field with different choice sets; give each
    # generated enum a distinct, stable name instead of an auto hash suffix.
    "ENUM_NAME_OVERRIDES": {
        "ArticleStatusEnum": "apps.articles.models.ArticleStatus.choices",
        "CommentStatusEnum": "apps.comments.models.CommentStatus.choices",
        "LiveBlogStatusEnum": "apps.livecoverage.models.LiveBlogStatus.choices",
        "UserStatusEnum": "apps.accounts.models.UserStatus.choices",
        "AdPlacementEnum": "apps.ads.models.AdPlacement.choices",
        "AdEffectEnum": "apps.ads.models.AdEffect.choices",
        "OverlayPositionEnum": "apps.ads.models.OverlayPosition.choices",
    },
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
# The audit middleware writes to the "flash.audit" logger. In production, point
# this at a file/handler or a log aggregator; here it goes to the console.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "[{asctime}] {levelname} {name}: {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "simple"},
    },
    "loggers": {
        "flash.audit": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}

# ---------------------------------------------------------------------------
# Celery (background tasks & scheduling)  — see teaching/09-celery/
# ---------------------------------------------------------------------------
# Broker = the queue tasks are pushed onto (Redis). Result backend = where task
# return values/status are stored. Both default to Redis; both reuse REDIS_URL's
# host if a dedicated URL isn't given.
_redis_default = REDIS_URL or "redis://localhost:6379/0"
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default=_redis_default)
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default=_redis_default)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

# When True, tasks run synchronously in-process (no worker/broker needed).
# Tests turn this on; never enable it in production.
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=False)

# Periodic tasks run by `celery -A config beat`. Each entry names a task and how
# often to run it. See the app's tasks.py for what each does.
from celery.schedules import crontab  # noqa: E402

CELERY_BEAT_SCHEDULE = {
    "publish-scheduled-articles": {
        # Flip scheduled articles live the moment their time arrives.
        "task": "apps.articles.tasks.publish_scheduled_articles",
        "schedule": 60.0,  # every minute
    },
    "aggregate-daily-analytics": {
        # Roll raw pageviews up into per-day summary rows.
        "task": "apps.analytics.tasks.aggregate_daily_analytics",
        "schedule": crontab(minute=15, hour=0),  # daily at 00:15
    },
}

# ---------------------------------------------------------------------------
# SEO & site identity  — see teaching/23-seo/
# ---------------------------------------------------------------------------
# Public canonical origin, used to build absolute URLs in sitemaps, feeds, and
# JSON-LD (search engines require absolute URLs).
SITE_URL = env("SITE_URL", default="http://localhost:8000")
ORGANIZATION_NAME = env("ORGANIZATION_NAME", default="Flash News")
ORGANIZATION_LOGO_URL = env("ORGANIZATION_LOGO_URL", default="")

# ---------------------------------------------------------------------------
# AI synthesis  — see teaching/41-ai-synthesis/
# ---------------------------------------------------------------------------
# Which LLM backend powers the "Synthesise article" feature in News Ingestion.
#   ollama   — a self-hosted model on this VPS (default; free, private)
#   groq     — Groq's OpenAI-compatible hosted API (free tier; needs GROQ_API_KEY)
#   disabled — turn the feature off
AI_PROVIDER = env("AI_PROVIDER", default="ollama")
# Local Ollama server + model (only used when AI_PROVIDER=ollama). The model must
# be pulled once on the server: `ollama pull llama3.1:8b`.
OLLAMA_BASE_URL = env("OLLAMA_BASE_URL", default="http://localhost:11434")
OLLAMA_MODEL = env("OLLAMA_MODEL", default="llama3.1:8b")
# Hosted fallback (only used when AI_PROVIDER=groq).
GROQ_API_KEY = env("GROQ_API_KEY", default="")
GROQ_MODEL = env("GROQ_MODEL", default="llama-3.1-8b-instant")
# Per-request budget for a generation call (seconds). Local models on CPU are
# slow, so this is generous.
AI_SYNTHESIS_TIMEOUT = env.int("AI_SYNTHESIS_TIMEOUT", default=120)

# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------
# Which search implementation to use. "postgres" uses PostgreSQL full-text
# search (with a plain-lookup fallback on SQLite for local/dev). "opensearch"
# selects the (deferred) OpenSearch backend behind the same interface.
SEARCH_BACKEND = env("SEARCH_BACKEND", default="postgres")

# ---------------------------------------------------------------------------
# Security hardening  (OWASP; see docs/DEVELOPMENT.md and `manage.py check --deploy`)
# ---------------------------------------------------------------------------
# Always-on protections (safe in dev too):
SECURE_CONTENT_TYPE_NOSNIFF = True  # block MIME-sniffing (X-Content-Type-Options)
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"  # clickjacking: never allow framing
SESSION_COOKIE_HTTPONLY = True  # session cookie not readable by JS
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

# Production-only (HTTPS assumed behind nginx/Let's Encrypt). Gated on DEBUG so
# local HTTP dev isn't force-redirected to https. Override via env if needed.
if not DEBUG:
    # Trust the proxy's X-Forwarded-Proto so Django knows the edge served HTTPS.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
    SESSION_COOKIE_SECURE = True  # cookies only sent over HTTPS
    CSRF_COOKIE_SECURE = True
    # HSTS: tell browsers to always use HTTPS for this domain. Start smaller and
    # raise once you're confident; 1 year + preload is the hardened target.
    SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=31536000)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

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
]

THIRD_PARTY_APPS = [
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
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
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
MEDIA_ROOT = BASE_DIR / "media"

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
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
else:
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
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

# Flash — developer task runner.
#
# One entry point for the three surfaces (backend / web / mobile), each of which
# uses its own toolchain (uv / pnpm / npm). Run `make` or `make help` for a list.
#
# Full onboarding guide: docs/DEVELOPMENT.md

BACKEND := backend
WEB     := web
MOBILE  := mobile
DJANGO  := DJANGO_SETTINGS_MODULE=config.settings uv run python manage.py

.DEFAULT_GOAL := help
.PHONY: help install \
        dev-backend dev-web dev-mobile services \
        migrate superuser \
        test check verify lint format format-check

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

## --- Setup -----------------------------------------------------------------
install: ## Install dependencies for all three surfaces
	cd $(BACKEND) && uv sync
	cd $(WEB) && pnpm install
	cd $(MOBILE) && npm install

## --- Run -------------------------------------------------------------------
dev-backend: ## Run the Django API on 0.0.0.0:8000 (LAN-reachable for devices)
	cd $(BACKEND) && $(DJANGO) runserver 0.0.0.0:8000

dev-web: ## Run the Next.js dev server on :3000
	cd $(WEB) && pnpm dev

dev-mobile: ## Start the Expo dev server
	cd $(MOBILE) && npx expo start

services: ## Start Postgres + Redis via Docker (optional; SQLite works without)
	docker compose -f infrastructure/docker-compose.dev.yml up -d

migrate: ## Apply backend migrations
	cd $(BACKEND) && $(DJANGO) migrate

superuser: ## Create a backend admin user
	cd $(BACKEND) && $(DJANGO) createsuperuser

## --- Quality gates ---------------------------------------------------------
test: ## Run the backend test suite
	cd $(BACKEND) && uv run pytest -q

lint: ## Lint all surfaces
	cd $(BACKEND) && uv run ruff check .
	cd $(WEB) && pnpm lint
	cd $(MOBILE) && npm run lint

format: ## Auto-format all surfaces
	cd $(BACKEND) && uv run ruff format .
	cd $(WEB) && pnpm format
	cd $(MOBILE) && npm run format

format-check: ## Verify formatting without writing (CI)
	cd $(BACKEND) && uv run ruff format --check .
	cd $(WEB) && pnpm format:check
	cd $(MOBILE) && npm run format:check

check: verify ## Alias for `verify`
verify: ## Full verification: backend (check+migrations+lint+tests), web (typecheck+lint+build), mobile (typecheck)
	cd $(BACKEND) && $(DJANGO) check && $(DJANGO) makemigrations --check --dry-run \
		&& uv run ruff check . && uv run pytest -q
	cd $(WEB) && pnpm typecheck && pnpm lint && pnpm build
	cd $(MOBILE) && npm run typecheck

# Running Dev Services with Docker Compose

**Topic:** Docker · **Level:** Beginner

## 1. The idea in one sentence

> Docker lets you run software (like PostgreSQL) in an isolated **container** —
> a lightweight, disposable box — without installing it directly on your machine.

## 2. Analogy

A container is a **shipping container**: the app inside is packed with everything
it needs, and it runs the same way on your laptop, a teammate's, or the server.
No more "works on my machine."

## 3. Why we use it in Phase 1

We need PostgreSQL and Redis for real development, but installing and configuring
them per machine is fiddly. Instead, one file describes them and one command runs
them. Real file:
[`infrastructure/docker-compose.dev.yml`](../../infrastructure/docker-compose.dev.yml).

```yaml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: flash
      POSTGRES_USER: flash
      POSTGRES_PASSWORD: flash
    ports: ["5432:5432"]
    volumes: [flash_pg_data:/var/lib/postgresql/data]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

Key ideas:
- **image** — a prebuilt package of the software (pulled from Docker Hub).
- **ports** — `5432:5432` maps the container's port to your machine so Django can
  connect at `localhost:5432`.
- **volumes** — a named disk so your data survives container restarts. Without
  it, stopping the container would wipe the database.

## 4. Usage

```bash
docker compose -f infrastructure/docker-compose.dev.yml up -d   # start (detached)
docker compose -f infrastructure/docker-compose.dev.yml ps      # see status
docker compose -f infrastructure/docker-compose.dev.yml down    # stop
```

Then set `DATABASE_URL=postgres://flash:flash@localhost:5432/flash` in
`backend/.env` and run `manage.py migrate`.

## 5. Why only databases in Docker (for now)?

We run **Django itself on the host** during development for the fast
edit-and-reload loop, and only the stateful services (Postgres, Redis) in Docker.
The full production compose file that containerizes *everything* (backend,
Celery, web, Nginx) arrives in Phase 8.

## 6. Common mistakes

- Forgetting the volume → losing your data on `down`.
- A port already in use (e.g. a locally installed Postgres also on 5432).

## 7. Exercises

- **Beginner:** Start the services, run `docker compose ... ps`, then connect with
  `uv run python manage.py dbshell`.
- **Intermediate:** Stop and restart the db container; confirm your data is still
  there (thanks to the volume).

## 8. Interview questions

- **Junior:** What problem do containers solve?
- **Mid:** Difference between an image and a container; what are volumes for?
- **Senior:** Why keep databases as managed/stateful services separate from
  stateless app containers?

← [Docker index](README.md)

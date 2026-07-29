# Security posture

How Flash defends against the main web risks (OWASP-aligned), and the checklist
to stay safe in production. See also [`DEVELOPMENT.md`](DEVELOPMENT.md).

## Controls in place

| Risk | Defence |
|------|---------|
| **SQL injection** | Django ORM only — no raw SQL / string-built queries anywhere. Filtering/search/ordering use declared DRF fields, never raw input. |
| **XSS (stored/reflected)** | Aggregated external HTML is escaped at extraction **and** run through the `nh3` allow-list sanitiser (`apps/common/sanitize.py`) before storage. React auto-escapes by default; the few `dangerouslySetInnerHTML` sites render staff-authored content only. JSON-LD is escaped (`<`,`>`,`&`) to prevent `</script>` breakout. A Content-Security-Policy (`frame-ancestors 'none'`, `object-src 'none'`, `base-uri`/`form-action 'self'`) is set in `web/next.config.ts`. |
| **CSRF** | The API is stateless JWT (bearer header, no ambient cookie) → not CSRF-able. DRF `SessionAuthentication` (browsable API only) still enforces CSRF; `CSRF_COOKIE_*` hardened. |
| **Broken authentication** | Passwords hashed (`create_user`/`set_password`) + Django validators. JWT access tokens short-lived (30 min) with refresh rotation. **Login is rate-limited** (`login` scope, per-IP) against brute force. |
| **Broken authorization** | Default DRF permission is `IsAuthenticated` (nothing public by accident). User management + role assignment is **admin-only** (`IsAdmin`), never general editorial staff; only a super-admin can grant the super-admin role; self-profile can't change `role`/`status`. Object-level ownership checks on comments/bookmarks. |
| **Mass assignment** | No serializer uses `fields = "__all__"`. Sensitive fields (`role`, `status`, counters, `impressions`/`clicks`, moderation `status`) are `read_only`. Registration can't set a role. |
| **Rate limiting** | Global throttles (anon 60/min, user 1000/min) plus tight per-scope limits on `login`, `register`, `subscribe`, `report` (all env-overridable). |
| **Transport / headers** | Production (`DEBUG=False`): HSTS (1y + preload), SSL redirect, secure cookies, `SECURE_PROXY_SSL_HEADER`. Always on: `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`. |
| **Mobile** | No WebView / no raw-HTML rendering (article HTML → plain text), so no client XSS surface; consumes the same hardened API. |

Regression tests: `apps/accounts/tests/test_security.py` (escalation + brute force),
`apps/common/tests/test_sanitize.py` (sanitiser). Run `manage.py check --deploy`
with `DEBUG=False` to audit the production posture.

## Production checklist (must do before going live)

1. **Set a strong `SECRET_KEY`** — the dev default is flagged by `check --deploy`.
   Generate one: `python -c "import secrets; print(secrets.token_urlsafe(64))"`.
2. **`DEBUG=False`** and set real `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`,
   `CORS_ALLOWED_ORIGINS` (no wildcards), and `SITE_URL` in the backend env.
3. **Serve over HTTPS** (nginx + Let's Encrypt). The proxy must send
   `X-Forwarded-Proto: https` so Django's SSL settings work.
4. Add your production media/CDN host to `web/next.config.ts` `remotePatterns`
   and the CSP `connect-src`/`img-src` as needed.
5. Run `make verify` and `cd backend && DEBUG=False uv run python manage.py check --deploy`
   (expect zero warnings once `SECRET_KEY` is set).
6. Rotate the demo accounts (`admin`/`author`) — change or remove their passwords.

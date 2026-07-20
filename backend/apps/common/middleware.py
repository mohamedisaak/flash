"""
Audit logging middleware.

Security and accountability require knowing *who changed what*. This middleware
writes a log line for every state-changing API request (POST/PUT/PATCH/DELETE)
under ``/api/`` — capturing the user, method, path, and response status.

It logs to the ``flash.audit`` logger (configured in settings' ``LOGGING``), so
in production you can route it to a file or log aggregator without code changes.
See ``teaching/31-security/`` (added in a later phase) and
``teaching/06-django-rest-framework/05-middleware-and-audit.md``.
"""

import logging

logger = logging.getLogger("flash.audit")

WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class AuditLogMiddleware:
    """Log write requests to the API with the acting user and outcome."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.method in WRITE_METHODS and request.path.startswith("/api/"):
            user = getattr(request, "user", None)
            actor = (
                f"user:{user.id}({user.get_username()})"
                if user is not None and user.is_authenticated
                else "anonymous"
            )
            logger.info(
                "audit %s %s -> %s by %s",
                request.method,
                request.path,
                response.status_code,
                actor,
            )

        return response

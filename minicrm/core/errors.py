"""Structured errors.

Every error carries a machine-readable code plus a human/agent readable message.
Adapters (REST, CLI, MCP) translate these into their own transport format.
"""


class CRMError(Exception):
    code = "crm_error"
    http_status = 400

    def __init__(self, message: str, **details):
        super().__init__(message)
        self.message = message
        self.details = details

    def to_dict(self) -> dict:
        return {
            "ok": False,
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details,
            },
        }


class NotFound(CRMError):
    code = "not_found"
    http_status = 404


class ValidationFailed(CRMError):
    code = "validation_failed"
    http_status = 422


class Conflict(CRMError):
    code = "conflict"
    http_status = 409

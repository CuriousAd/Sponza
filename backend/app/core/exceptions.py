from fastapi import Request, status
from fastapi.responses import JSONResponse


class SponsaException(Exception):
    """Base exception for all Sponsa platform errors."""
    def __init__(self, message: str, status_code: int = 400, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class AuthenticationError(SponsaException):
    def __init__(self, message: str = "Authentication failed", details: dict = None):
        super().__init__(message, status_code=401, details=details)

class NotFoundError(SponsaException):
    def __init__(self, message: str = "Resource not found", details: dict = None):
        super().__init__(message, status_code=404, details=details)

class PaymentError(SponsaException):
    def __init__(self, message: str = "Payment processing failed", details: dict = None):
        super().__init__(message, status_code=400, details=details)

async def sponsa_exception_handler(request: Request, exc: SponsaException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.message,
                "type": exc.__class__.__name__,
                "details": exc.details
            }
        }
    )

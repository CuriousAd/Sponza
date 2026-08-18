from fastapi import Request, status
from fastapi.responses import JSONResponse


class SponzaException(Exception):
    """Base exception for application domain errors."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthenticationError(SponzaException):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)


class NotFoundError(SponzaException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)


class PaymentError(SponzaException):
    def __init__(self, message: str = "Payment processing failed"):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST)


async def sponza_exception_handler(request: Request, exc: SponzaException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )

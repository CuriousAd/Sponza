from pydantic import BaseModel


class WebhookAck(BaseModel):
    received: bool
    status: str = "enqueued"

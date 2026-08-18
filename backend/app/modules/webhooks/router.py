from fastapi import APIRouter, BackgroundTasks, Header, Request
from app.modules.webhooks.schemas import WebhookAck
from app.modules.webhooks.service import handle_cashfree_webhook

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


@router.post("/cashfree", response_model=WebhookAck)
async def cashfree_webhook(
    request: Request,
    bg_tasks: BackgroundTasks,
    x_webhook_timestamp: str = Header(default=""),
    x_webhook_signature: str = Header(default=""),
):
    """Inbound webhook receiver from Cashfree Payment Gateway."""
    raw_body = await request.body()
    res = await handle_cashfree_webhook(
        raw_body,
        x_webhook_timestamp,
        x_webhook_signature,
        bg_tasks,
    )
    return WebhookAck(received=res["received"], status=res["status"])

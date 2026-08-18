import asyncio
import logging
from datetime import datetime, timezone
from decimal import Decimal
from beanie import PydanticObjectId
from app.modules.creators.models import Creator
from app.modules.payments.models import Tip, SponzaRevenue
from app.modules.webhooks.models import WebhookEvent
from app.modules.overlay.manager import connection_manager

logger = logging.getLogger("sponza.payments.processor")

_tip_semaphore = asyncio.Semaphore(20)


async def process_payment_captured(event_id: str, payload: dict):
    """Background task for processing payment captured webhooks with idempotency and concurrency caps."""
    async with _tip_semaphore:
        webhook_event = await WebhookEvent.get(PydanticObjectId(event_id))
        if not webhook_event or webhook_event.status == "done":
            return

        webhook_event.status = "processing"
        webhook_event.attempts += 1
        await webhook_event.save()

        try:
            payment_data = payload.get("data", {}).get("payment", {})
            order_data = payload.get("data", {}).get("order", {})

            payment_id = str(payment_data.get("cf_payment_id", ""))
            order_id = str(order_data.get("order_id", ""))
            amount = Decimal(str(payment_data.get("payment_amount", "0")))

            # Check idempotency at Tip document level
            existing_tip = await Tip.find_one(Tip.cashfree_payment_id == payment_id)
            if existing_tip:
                logger.info(f"Payment {payment_id} already processed as tip {existing_tip.id}")
                webhook_event.status = "done"
                webhook_event.processed_at = datetime.now(timezone.utc)
                await webhook_event.save()
                return

            # Extract creator slug or ID encoded into order_id e.g. tip_{creator_id}_{timestamp}
            parts = order_id.split("_")
            if len(parts) >= 2:
                creator_id_str = parts[1]
                creator = await Creator.get(PydanticObjectId(creator_id_str))
            else:
                creator = None

            if not creator:
                logger.error(f"Creator could not be identified for order_id: {order_id}")
                webhook_event.status = "failed"
                webhook_event.last_error = "Creator not found for order"
                await webhook_event.save()
                return

            # Calculate 90% creator share and 10% platform fee
            creator_share = Decimal(str(round(float(amount) * 0.9, 2)))
            sponza_fee = amount - creator_share

            # Extract donor details from order tags or payload
            donor_name = payment_data.get("bank_reference", "Anonymous Donor")
            message = None

            # Create Tip document
            tip = Tip(
                creator_id=creator.id,
                donor_name=donor_name[:30],
                message=message,
                amount=amount,
                creator_share=creator_share,
                sponza_fee=sponza_fee,
                cashfree_payment_id=payment_id,
                cashfree_order_id=order_id,
            )
            await tip.insert()

            # Atomic increment of creator's wallet balance
            creator.wallet_balance += creator_share
            await creator.save()

            # Record Sponza Platform Revenue
            revenue = SponzaRevenue(tip_id=tip.id, amount=sponza_fee)
            await revenue.insert()

            # Broadcast real-time tip alert to OBS Overlay & Dashboard via WebSocket
            await connection_manager.broadcast_tip(
                creator_id=str(creator.id),
                obs_token=creator.obs_token,
                tip_data={
                    "id": str(tip.id),
                    "donorName": tip.donor_name,
                    "amount": float(tip.amount),
                    "message": tip.message or "",
                    "timestamp": int(tip.timestamp.timestamp() * 1000),
                },
            )

            webhook_event.status = "done"
            webhook_event.processed_at = datetime.now(timezone.utc)
            await webhook_event.save()
            logger.info(f"Successfully processed payment {payment_id} for creator {creator.slug}")

        except Exception as e:
            logger.exception(f"Error processing payment captured for event {event_id}: {str(e)}")
            webhook_event.status = "failed"
            webhook_event.last_error = str(e)
            await webhook_event.save()

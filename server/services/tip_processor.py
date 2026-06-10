import asyncio
from decimal import Decimal
from datetime import datetime

from bson import Decimal128

from models.webhook_event import WebhookEvent
from models.tip import Tip
from models.creator import Creator
from models.revenue import SponSaRevenue
from services.ws_manager import ws_manager

# Safeguard database concurrency under heavy load
_tip_semaphore = asyncio.Semaphore(20)


async def process_payment_captured(event_id, payload):
    async with _tip_semaphore:
        event = await WebhookEvent.get(event_id)
        if not event:
            return

        try:
            event.status = "processing"
            await event.save()

            data = payload["data"]
            order_id = data["order"]["order_id"]
            amount = Decimal(str(data["order"]["order_amount"]))
            payment_id = str(data["payment"]["cf_payment_id"])

            # Deduce fees
            creator_share = amount * Decimal("0.90")
            sponsa_fee = amount * Decimal("0.10")

            # Find matching creator using the vendor ID in the split payload
            split_details = data.get("splits", [{}])[0]
            vendor_id = split_details.get("vendor_id")
            creator = await Creator.find_one(Creator.cashfree_vendor_id == vendor_id)
            if not creator:
                raise ValueError(f"No creator found matching vendor_id: {vendor_id}")

            # 1. Write Tip Document (unique key on cashfree_payment_id stops duplicates)
            tip = Tip(
                creator_id=creator.id,
                donor_name=data.get("customer_details", {}).get(
                    "customer_name", "Anonymous"
                ),
                message=data.get("notes", {}).get("message"),
                amount=amount,
                creator_share=creator_share,
                sponsa_fee=sponsa_fee,
                cashfree_payment_id=payment_id,
                cashfree_order_id=order_id,
            )
            await tip.insert()

            # 2. Increment Wallet Ledger (Atomic Update)
            await Creator.get_motor_collection().update_one(
                {"_id": creator.id},
                {"$inc": {"wallet_balance": Decimal128(str(creator_share))}},
            )

            # 3. Log Revenue Record
            revenue = SponSaRevenue(
                tip_id=tip.id,
                cashfree_payment_id=payment_id,
                amount=sponsa_fee,
            )
            await revenue.insert()

            # 4. Trigger Real-Time OBS broadcast (omit messages for privacy)
            await ws_manager.broadcast_tip(
                str(creator.id),
                {
                    "type": "tip",
                    "donor_name": tip.donor_name,
                    "amount": float(tip.amount),
                },
            )

            # Mark complete
            event.status = "done"
            event.processed_at = datetime.utcnow()
            await event.save()

        except Exception as e:
            event.status = "failed"
            event.attempts += 1
            event.last_error = str(e)
            await event.save()

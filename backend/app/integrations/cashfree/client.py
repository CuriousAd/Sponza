import logging
import httpx
from decimal import Decimal
from app.config import settings

logger = logging.getLogger("sponza.integrations.cashfree")


class CashfreeClient:
    """Async client wrapper for Cashfree Payment Gateway, EasySplit, and Payout APIs."""

    def __init__(self):
        self.base_url = settings.cashfree_base_url.rstrip("/")
        self.payout_base_url = settings.cashfree_payout_base_url.rstrip("/")
        self.headers = {
            "x-client-id": settings.cashfree_client_id,
            "x-client-secret": settings.cashfree_client_secret,
            "x-api-version": settings.cashfree_api_version,
            "Content-Type": "application/json",
        }

    async def create_order(
        self,
        order_id: str,
        amount: float,
        customer_name: str,
        customer_email: str = "donor@sponza.in",
        customer_phone: str = "9999999999",
        vendor_id: str | None = None,
        split_percentage: float = 90.0,
    ) -> dict:
        """Create a Cashfree order, optionally attaching an EasySplit vendor split."""
        url = f"{self.base_url}/orders"
        payload = {
            "order_id": order_id,
            "order_amount": round(amount, 2),
            "order_currency": "INR",
            "customer_details": {
                "customer_id": f"cust_{order_id}",
                "customer_name": customer_name,
                "customer_email": customer_email,
                "customer_phone": customer_phone,
            },
            "order_meta": {
                "return_url": f"{settings.frontend_url}/tip/success?order_id={{order_id}}",
            },
        }

        if vendor_id:
            vendor_amount = round(amount * (split_percentage / 100.0), 2)
            payload["order_splits"] = [
                {
                    "vendor_id": vendor_id,
                    "percentage": split_percentage,
                    "amount": vendor_amount,
                }
            ]

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=self.headers)
            if resp.status_code not in (200, 201):
                logger.error(f"Cashfree create_order failed: {resp.status_code} - {resp.text}")
                resp.raise_for_status()
            return resp.json()

    async def create_vendor(
        self,
        vendor_id: str,
        name: str,
        email: str,
        phone: str,
        upi_id: str,
    ) -> dict:
        """Register a creator as an EasySplit vendor on Cashfree."""
        url = f"{self.base_url}/easy-split/vendors"
        payload = {
            "vendor_id": vendor_id,
            "name": name,
            "email": email,
            "phone": phone,
            "upi": {"vpa": upi_id, "account_holder": name},
            "status": "ACTIVE",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=self.headers)
            if resp.status_code not in (200, 201):
                logger.error(f"Cashfree create_vendor failed: {resp.status_code} - {resp.text}")
                resp.raise_for_status()
            return resp.json()

    async def initiate_payout(
        self,
        transfer_id: str,
        amount: Decimal,
        upi_id: str,
        name: str,
    ) -> dict:
        """Initiate an instant UPI payout via Cashfree Payouts."""
        url = f"{self.payout_base_url}/v1/requestTransfer"
        payout_headers = {
            "X-Client-Id": settings.cashfree_payout_client_id or settings.cashfree_client_id,
            "X-Client-Secret": settings.cashfree_payout_client_secret or settings.cashfree_client_secret,
            "Content-Type": "application/json",
        }
        payload = {
            "transferId": transfer_id,
            "amount": str(amount),
            "transferMode": "upi",
            "vpa": upi_id,
            "name": name,
            "remarks": "Sponza Creator Withdrawal",
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=payout_headers)
            if resp.status_code not in (200, 201):
                logger.error(f"Cashfree initiate_payout failed: {resp.status_code} - {resp.text}")
                resp.raise_for_status()
            return resp.json()


cashfree_client = CashfreeClient()

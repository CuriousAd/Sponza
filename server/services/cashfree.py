import httpx

from config import settings


class CashfreeClient:
    """Async wrapper for Cashfree PG + EasySplit + Payouts APIs."""

    def __init__(self):
        self.headers = {
            "x-client-id": settings.cashfree_client_id,
            "x-client-secret": settings.cashfree_client_secret,
            "x-api-version": settings.cashfree_api_version,
            "Content-Type": "application/json",
        }
        self.payout_headers = {
            "x-client-id": settings.cashfree_payout_client_id or settings.cashfree_client_id,
            "x-client-secret": settings.cashfree_payout_client_secret or settings.cashfree_client_secret,
            "Content-Type": "application/json",
        }
        self.base_url = settings.cashfree_base_url
        self.payout_url = settings.cashfree_payout_base_url

    async def create_order(
        self,
        order_id: str,
        amount: float,
        customer_name: str,
        vendor_id: str,
        split_pct: float = 90.0,
    ):
        """Create a payment session order with static EasySplit split mapping."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {
                "order_id": order_id,
                "order_amount": amount,
                "order_currency": "INR",
                "customer_details": {
                    "customer_id": f"cust_{order_id}",
                    "customer_name": customer_name,
                    "customer_phone": "9999999999",  # Placeholder required parameter
                },
                "order_splits": [
                    {
                        "vendor_id": vendor_id,
                        "percentage": split_pct,
                    }
                ],
            }
            resp = await client.post(
                f"{self.base_url}/orders",
                json=payload,
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()

    async def create_vendor(
        self,
        vendor_id: str,
        name: str,
        email: str,
        upi_vpa: str,
        kyc_details: dict,
    ):
        """Onboard a new creator as a Cashfree EasySplit vendor."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {
                "vendor_id": vendor_id,
                "name": name,
                "email": email,
                "phone": kyc_details.get("phone", "9999999999"),
                "upi": upi_vpa,
                "kyc_details": kyc_details,
            }
            resp = await client.post(
                f"{self.base_url}/easy-split/vendors",
                json=payload,
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()

    async def initiate_payout(
        self,
        vendor_id: str,
        amount: float,
        upi_vpa: str,
        transfer_id: str,
    ):
        """Send funds instantly from vendor's Virtual Vault to their UPI address."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {
                "beneId": vendor_id,
                "amount": amount,
                "transferId": transfer_id,
                "transferMode": "upi",
                "beneDetails": {
                    "vpa": upi_vpa,
                },
            }
            resp = await client.post(
                f"{self.payout_url}/v1/directTransfer",
                json=payload,
                headers=self.payout_headers,
            )
            resp.raise_for_status()
            return resp.json()


cashfree_client = CashfreeClient()

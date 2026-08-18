import time
from datetime import datetime, timezone
from decimal import Decimal
from app.core.exceptions import SponzaException
from app.integrations.cashfree.client import cashfree_client
from app.modules.creators.models import Creator
from app.modules.payments.models import Tip
from app.modules.wallet.models import Withdrawal, WithdrawalStatus
from app.modules.wallet.schemas import WithdrawRequest, WithdrawResponse, TipFeedItem


async def process_withdrawal(creator: Creator, req: WithdrawRequest) -> WithdrawResponse:
    if not creator.upi_id:
        raise SponzaException("Creator has not configured a UPI ID for withdrawals")

    if req.amount > creator.wallet_balance:
        raise SponzaException("Insufficient wallet balance for requested withdrawal")

    transfer_id = f"wd_{str(creator.id)}_{int(time.time() * 1000)}"

    # Create pending withdrawal record
    withdrawal = Withdrawal(
        creator_id=creator.id,
        amount=req.amount,
        upi_id=creator.upi_id,
        cashfree_transfer_id=transfer_id,
        status=WithdrawalStatus.PENDING,
    )
    await withdrawal.insert()

    # Deduct creator balance
    creator.wallet_balance -= req.amount
    await creator.save()

    try:
        cf_res = await cashfree_client.initiate_payout(
            transfer_id=transfer_id,
            amount=req.amount,
            upi_id=creator.upi_id,
            name=creator.display_name,
        )
        withdrawal.status = WithdrawalStatus.SUCCESS
        withdrawal.processed_at = datetime.now(timezone.utc)
        await withdrawal.save()
    except Exception as e:
        # Revert balance on payout failure
        creator.wallet_balance += req.amount
        await creator.save()
        withdrawal.status = WithdrawalStatus.FAILED
        withdrawal.failure_reason = str(e)
        await withdrawal.save()
        raise SponzaException(f"Withdrawal transfer failed: {str(e)}")

    return WithdrawResponse(
        withdrawal_id=str(withdrawal.id),
        amount=str(withdrawal.amount),
        upi_id=withdrawal.upi_id,
        status=withdrawal.status.value,
    )


async def fetch_recent_tips(creator: Creator, limit: int = 50) -> list[TipFeedItem]:
    tips = await Tip.find(Tip.creator_id == creator.id).sort("-timestamp").limit(limit).to_list()
    return [
        TipFeedItem(
            id=str(t.id),
            donor_name=t.donor_name,
            amount=float(t.amount),
            message=t.message,
            timestamp=int(t.timestamp.timestamp() * 1000),
        )
        for t in tips
    ]

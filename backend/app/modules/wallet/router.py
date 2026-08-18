from fastapi import APIRouter, Depends
from app.core.dependencies import require_current_creator
from app.modules.creators.models import Creator
from app.modules.wallet.schemas import WalletBalanceResponse, WithdrawRequest, WithdrawResponse, TipFeedItem
from app.modules.wallet.service import process_withdrawal, fetch_recent_tips

router = APIRouter(prefix="/api/wallet", tags=["Wallet & Ledger"])


@router.get("/balance", response_model=WalletBalanceResponse)
async def get_balance(creator: Creator = Depends(require_current_creator)):
    return WalletBalanceResponse(
        wallet_balance=str(creator.wallet_balance),
        upi_id=creator.upi_id,
        upi_verified=creator.upi_verified,
    )


@router.get("/tips", response_model=list[TipFeedItem])
async def get_tips_feed(creator: Creator = Depends(require_current_creator)):
    return await fetch_recent_tips(creator)


@router.post("/withdraw", response_model=WithdrawResponse)
async def request_withdraw(
    req: WithdrawRequest,
    creator: Creator = Depends(require_current_creator),
):
    return await process_withdrawal(creator, req)

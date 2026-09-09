from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.api import dependencies
from app.models.user import User

router = APIRouter()

import stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@router.post("/create-checkout-session")
async def create_checkout_session(
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    """
    Create a Stripe Checkout Session for upgrading to a Pro tier.
    """
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe is not configured")
        
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'Pro Tier Upgrade',
                    },
                    'unit_amount': 2000,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url='http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:3000/cancel',
            client_reference_id=str(current_user.id)
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(dependencies.get_db)):
    """
    Listen to Stripe webhooks (e.g. checkout.session.completed)
    """
    payload = await request.body()
    # verify signature here using stripe.Webhook.construct_event
    return {"status": "success"}

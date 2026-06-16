from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import Transaction, User
from app.schemas.schemas import ForecastResponse
from app.services.ai_forecast import ForecastingService

router = APIRouter()

@router.get("/", response_model=ForecastResponse)
def get_spend_forecast(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate expenditure forecasts for the next N days.
    Pulls transaction history, fits it, and generates projection lines.
    """
    # 1. Fetch historical data for this user
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense"
    ).order_by(Transaction.transaction_date.asc()).all()
    
    # 2. Format history for forecast pipeline
    history_data = [
        {"date": t.transaction_date, "amount": t.amount}
        for t in transactions
    ]
    
    # 3. Process forecasting
    forecast_points = ForecastingService.forecast_spending(history_data, days_to_predict=days)
    
    # 4. Format to match validation schema
    formatted_points = [
        {"date": pt["date"], "predicted_amount": pt["predicted_amount"]}
        for pt in forecast_points
    ]
    
    return {
        "category": "Total Expenses",
        "forecast": formatted_points
    }

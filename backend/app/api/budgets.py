from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from datetime import datetime, date
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import Budget, Transaction, User
from app.schemas.schemas import BudgetCreate, BudgetResponse

router = APIRouter()

@router.get("/", response_model=List[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all budgets for the current user, dynamically calculating 'spent_amount'
    for the current calendar month for each budget category.
    """
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    
    # Calculate spending for the current month
    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    
    for budget in budgets:
        # Sum transactions for this user, for this category, in the current month that are 'expense'
        total_spent = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.category == budget.category,
            Transaction.type == "expense",
            Transaction.transaction_date >= start_of_month
        ).scalar()
        
        budget.spent_amount = float(total_spent) if total_spent else 0.0
        
    db.commit() # Save the updated spent amounts
    return budgets


@router.post("/", response_model=BudgetResponse)
def create_or_update_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Define a new budget ceiling or update an existing one for a category.
    """
    # Check if budget for this category already exists
    db_budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == budget_in.category
    ).first()
    
    if db_budget:
        # Update limit
        db_budget.limit_amount = budget_in.limit_amount
        db_budget.period = budget_in.period
    else:
        # Create new budget
        db_budget = Budget(
            user_id=current_user.id,
            category=budget_in.category,
            limit_amount=budget_in.limit_amount,
            period=budget_in.period,
            spent_amount=0.0
        )
        db.add(db_budget)
        
    db.commit()
    db.refresh(db_budget)
    
    # Re-calculate spent amount
    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    total_spent = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.category == db_budget.category,
        Transaction.type == "expense",
        Transaction.transaction_date >= start_of_month
    ).scalar()
    db_budget.spent_amount = float(total_spent) if total_spent else 0.0
    db.commit()
    
    return db_budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a budget.
    """
    db_budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget limit not found")
        
    db.delete(db_budget)
    db.commit()
    return None


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: UUID,
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a budget.
    """
    db_budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db_budget.category = budget_in.category
    db_budget.limit_amount = budget_in.limit_amount
    db_budget.period = budget_in.period
    
    db.commit()
    db.refresh(db_budget)
    
    # Re-calculate spent amount
    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    total_spent = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.category == db_budget.category,
        Transaction.type == "expense",
        Transaction.transaction_date >= start_of_month
    ).scalar()
    db_budget.spent_amount = float(total_spent) if total_spent else 0.0
    db.commit()
    
    return db_budget

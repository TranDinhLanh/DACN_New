from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import Transaction, User
from app.schemas.schemas import TransactionCreate, TransactionResponse, TransactionUpdate
from app.services.ai_classify import CategoryClassifier

router = APIRouter()

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None
):
    """
    Retrieve all transactions for the current user.
    """
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if category:
        query = query.filter(Transaction.category == category)
        
    return query.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new transaction. If category is 'Other' or blank, auto-classify via AI classifier.
    """
    category = transaction_in.category
    # Automatically classify category if it is 'Other' or left blank and a description is present
    if (category == "Other" or not category) and transaction_in.description:
        category = CategoryClassifier.classify(transaction_in.description)

    db_transaction = Transaction(
        user_id=current_user.id,
        amount=transaction_in.amount,
        type=transaction_in.type,
        category=category,
        description=transaction_in.description,
        transaction_date=transaction_in.transaction_date,
        merchant_name=transaction_in.merchant_name,
        ocr_log_id=transaction_in.ocr_log_id
    )
    
    # Check if budget limits are affected (optional callback logic in services)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: UUID,
    transaction_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing transaction.
    """
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    update_data = transaction_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_transaction, field, value)
        
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a transaction.
    """
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    db.delete(db_transaction)
    db.commit()
    return None

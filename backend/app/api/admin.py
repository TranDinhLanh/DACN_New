from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from pydantic import BaseModel
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Transaction
from app.schemas.schemas import UserResponse

router = APIRouter()

# Request model for role change
class RoleChangeRequest(BaseModel):
    new_role: str

# Request model for category change
class CategoryChangeRequest(BaseModel):
    new_category: str

# Response model for user details
class UserDetailResponse(BaseModel):
    id: UUID
    email: str
    full_name: str | None
    role: str
    is_active: bool
    created_at: str
    total_transactions: int
    total_spent: float
    total_income: float

    class Config:
        from_attributes = True

# Helper function to check if user is admin
def check_is_admin(user: User):
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới có thể truy cập chức năng này"
        )

@router.get("/users", response_model=List[UserDetailResponse])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all users in the system with detailed statistics.
    Only accessible to admins.
    
    Trả về:
    - id, email, full_name, role, is_active, created_at
    - total_transactions: tổng số giao dịch
    - total_spent: tổng chi tiêu
    - total_income: tổng thu nhập
    """
    check_is_admin(current_user)
    
    users = db.query(User).all()
    result = []
    
    for user in users:
        # Tính tổng giao dịch
        total_tx = db.query(func.count(Transaction.id)).filter(
            Transaction.user_id == user.id
        ).scalar() or 0
        
        # Tính tổng chi tiêu
        total_spent = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user.id,
            Transaction.type == "expense"
        ).scalar() or 0.0
        
        # Tính tổng thu nhập
        total_income = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user.id,
            Transaction.type == "income"
        ).scalar() or 0.0
        
        result.append(UserDetailResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            total_transactions=int(total_tx),
            total_spent=float(total_spent),
            total_income=float(total_income)
        ))
    
    return result

@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all users in the system with full details. Only accessible to admins.
    Returns: id, email, full_name, role, is_active, created_at, số lượng giao dịch, tổng chi tiêu, tổng thu nhập
    """
    check_is_admin(current_user)
    
    users = db.query(User).all()
    return users


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: UUID,
    role_request: RoleChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update user role.
    - Users can promote others to admin
    - Only admins can change roles, and they can ONLY promote to admin (not demote)
    """
    # Find target user
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User không tồn tại")
    
    # Prevent self-role change
    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể thay đổi vai trò của chính mình"
        )
    
    new_role = role_request.new_role
    
    # Validate role value
    if new_role not in ["user", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vai trò phải là 'user' hoặc 'admin'"
        )
    
    # If current user is admin
    if current_user.role == "admin":
        # Admin can only promote to admin, NOT demote from admin to user
        if new_role == "user" and target_user.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin không thể hạ cấp admin về user"
            )
        target_user.role = new_role
    # If current user is regular user
    else:
        # Regular users can ONLY promote others to admin
        if new_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User thường chỉ có thể nâng cấp người khác lên admin"
            )
        target_user.role = "admin"
    
    db.commit()
    db.refresh(target_user)
    return {
        "id": target_user.id,
        "email": target_user.email,
        "full_name": target_user.full_name,
        "role": target_user.role,
        "is_active": target_user.is_active,
        "created_at": target_user.created_at
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a user. Only accessible to admins.
    """
    check_is_admin(current_user)
    
    # Prevent self-deletion
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa chính mình"
        )
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User không tồn tại")
    
    db.delete(target_user)
    db.commit()
    return {"message": "User đã được xóa thành công"}


@router.get("/events/all")
def get_all_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all events from all users with statistics.
    Only accessible to admins.
    """
    check_is_admin(current_user)
    
    from app.models.models import Event, Transaction
    from sqlalchemy import func
    
    events = db.query(Event).all()
    
    result = []
    for event in events:
        # Get transactions for this event
        transactions = db.query(Transaction).filter(
            Transaction.event_id == event.id
        ).all()
        
        total_spent = sum(t.amount for t in transactions if t.type == "expense")
        user = db.query(User).filter(User.id == event.user_id).first()
        
        result.append({
            "id": str(event.id),
            "name": event.name,
            "user_id": str(event.user_id),
            "user_email": user.email if user else "Unknown",
            "user_name": user.full_name if user else "Unknown",
            "budget_limit": event.budget_limit,
            "total_spent": total_spent,
            "remaining": event.budget_limit - total_spent if event.budget_limit else 0,
            "is_completed": event.is_completed,
            "start_date": event.start_date.isoformat() if event.start_date else None,
            "end_date": event.end_date.isoformat() if event.end_date else None,
            "created_at": event.created_at.isoformat(),
            "transaction_count": len(transactions),
        })
    
    return result


@router.delete("/events/{event_id}")
def delete_event_admin(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an event. Only accessible to admins.
    """
    check_is_admin(current_user)
    
    from app.models.models import Event
    from uuid import UUID
    
    try:
        event_uuid = UUID(event_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    event = db.query(Event).filter(Event.id == event_uuid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}


@router.get("/recurring-templates/all")
def get_all_recurring_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all recurring templates from all users with statistics.
    Only accessible to admins.
    """
    check_is_admin(current_user)
    
    from app.models.models import RecurringTemplate
    
    templates = db.query(RecurringTemplate).all()
    
    result = []
    for template in templates:
        user = db.query(User).filter(User.id == template.user_id).first()
        
        result.append({
            "id": str(template.id),
            "user_id": str(template.user_id),
            "user_email": user.email if user else "Unknown",
            "user_name": user.full_name if user else "Unknown",
            "amount": template.amount,
            "type": template.type,
            "category": template.category,
            "description": template.description,
            "frequency": template.frequency,
            "day_of_week": template.day_of_week,
            "day_of_month": template.day_of_month,
            "next_run_date": template.next_run_date.isoformat(),
            "end_date": template.end_date.isoformat() if template.end_date else None,
            "is_active": template.is_active,
            "is_auto_execute": template.is_auto_execute,
            "created_at": template.created_at.isoformat(),
        })
    
    return result


@router.delete("/recurring-templates/{template_id}")
def delete_recurring_template_admin(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a recurring template. Only accessible to admins.
    """
    check_is_admin(current_user)
    
    from app.models.models import RecurringTemplate
    from uuid import UUID
    
    try:
        template_uuid = UUID(template_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid template ID")
    
    template = db.query(RecurringTemplate).filter(RecurringTemplate.id == template_uuid).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully"}


@router.put("/recurring-templates/{template_id}/toggle")
def toggle_recurring_template_admin(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle recurring template active status. Only accessible to admins.
    """
    check_is_admin(current_user)
    
    from app.models.models import RecurringTemplate
    from uuid import UUID
    
    try:
        template_uuid = UUID(template_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid template ID")
    
    template = db.query(RecurringTemplate).filter(RecurringTemplate.id == template_uuid).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template.is_active = not template.is_active
    db.commit()
    db.refresh(template)
    
    return {
        "id": str(template.id),
        "is_active": template.is_active,
        "message": f"Template {'activated' if template.is_active else 'deactivated'}"
    }


@router.get("/miscategorized-transactions/all")
def get_all_miscategorized_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all miscategorized transactions from all users.
    Only accessible to admins.
    """
    check_is_admin(current_user)
    
    from app.models.models import Transaction
    
    transactions = db.query(Transaction).filter(Transaction.is_miscategorized == True).all()
    
    result = []
    for tx in transactions:
        user = db.query(User).filter(User.id == tx.user_id).first()
        
        result.append({
            "id": str(tx.id),
            "user_id": str(tx.user_id),
            "user_email": user.email if user else "Unknown",
            "user_name": user.full_name if user else "Unknown",
            "amount": tx.amount,
            "type": tx.type,
            "category": tx.category,
            "description": tx.description,
            "merchant_name": tx.merchant_name,
            "transaction_date": tx.transaction_date.isoformat(),
            "note": tx.miscategorization_note,
            "created_at": tx.created_at.isoformat(),
        })
    
    return result


from pydantic import BaseModel


@router.put("/miscategorized-transactions/{transaction_id}/fix")
def fix_miscategorized_transaction(
    transaction_id: str,
    category_request: CategoryChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fix a miscategorized transaction and mark it as fixed.
    Only accessible to admins.
    """
    check_is_admin(current_user)
    
    from app.models.models import Transaction
    from uuid import UUID
    
    try:
        tx_uuid = UUID(transaction_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid transaction ID")
    
    transaction = db.query(Transaction).filter(Transaction.id == tx_uuid).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction.category = category_request.new_category
    transaction.is_miscategorized = False
    transaction.miscategorization_note = None
    
    db.commit()
    db.refresh(transaction)
    
    return {
        "id": str(transaction.id),
        "category": transaction.category,
        "is_miscategorized": transaction.is_miscategorized,
        "message": "Transaction fixed successfully"
    }


@router.delete("/miscategorized-transactions/{transaction_id}")
def delete_miscategorized_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a miscategorized transaction. Only accessible to admins.
    """
    check_is_admin(current_user)
    
    from app.models.models import Transaction
    from uuid import UUID
    
    try:
        tx_uuid = UUID(transaction_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid transaction ID")
    
    transaction = db.query(Transaction).filter(Transaction.id == tx_uuid).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}

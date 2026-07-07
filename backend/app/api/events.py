from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import Event, Transaction, User
from app.schemas.schemas import EventCreate, EventResponse, EventUpdate, EventDetailResponse, EventListResponse

router = APIRouter()

def calculate_event_stats(event: Event, db: Session):
    # Sum transactions of type 'expense' for this event
    total_spent = db.query(func.sum(Transaction.amount)).filter(
        Transaction.event_id == event.id,
        Transaction.type == "expense"
    ).scalar() or 0.0

    total_spent = float(total_spent)
    remaining_budget = float(event.budget_limit - total_spent)
    
    if event.budget_limit > 0:
        percent_used = float((total_spent / event.budget_limit) * 100)
    else:
        percent_used = 0.0

    is_over_budget = total_spent > event.budget_limit

    return {
        "total_spent": total_spent,
        "remaining_budget": remaining_budget,
        "percent_used": percent_used,
        "is_over_budget": is_over_budget
    }

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo sự kiện mới
    """
    db_event = Event(
        user_id=current_user.id,
        name=event_in.name,
        budget_limit=event_in.budget_limit,
        start_date=event_in.start_date,
        end_date=event_in.end_date,
        is_completed=event_in.is_completed
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/", response_model=List[EventListResponse])
def get_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách sự kiện kèm tổng chi và ngân sách
    """
    events = db.query(Event).filter(Event.user_id == current_user.id).all()
    response = []
    for event in events:
        stats = calculate_event_stats(event, db)
        
        # Construct the response item
        event_dict = {
            "id": event.id,
            "user_id": event.user_id,
            "name": event.name,
            "budget_limit": event.budget_limit,
            "start_date": event.start_date,
            "end_date": event.end_date,
            "is_completed": event.is_completed,
            "created_at": event.created_at,
            **stats
        }
        response.append(event_dict)
    return response

@router.get("/{event_id}", response_model=EventDetailResponse)
def get_event_detail(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy chi tiết sự kiện và danh sách transactions thuộc sự kiện
    """
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.user_id == current_user.id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")
        
    stats = calculate_event_stats(event, db)
    
    # Get all transactions belonging to this event
    transactions = db.query(Transaction).filter(
        Transaction.event_id == event.id
    ).order_by(Transaction.transaction_date.desc()).all()
    
    return {
        "id": event.id,
        "user_id": event.user_id,
        "name": event.name,
        "budget_limit": event.budget_limit,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "is_completed": event.is_completed,
        "created_at": event.created_at,
        "transactions": transactions,
        **stats
    }

@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: UUID,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cập nhật thông tin sự kiện
    """
    db_event = db.query(Event).filter(
        Event.id == event_id,
        Event.user_id == current_user.id
    ).first()
    
    if not db_event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")
        
    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)
        
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa sự kiện. Khi xóa, khóa ngoại event_id trong bảng transactions tự động chuyển thành NULL nhờ cấu hình ondelete='SET NULL'.
    """
    db_event = db.query(Event).filter(
        Event.id == event_id,
        Event.user_id == current_user.id
    ).first()
    
    if not db_event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")
        
    db.delete(db_event)
    db.commit()
    return None

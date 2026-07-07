from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, RecurringTemplate
from app.schemas.schemas import (
    RecurringTemplateCreate,
    RecurringTemplateUpdate,
    RecurringTemplateResponse
)
from app.services.recurring_service import calculate_initial_next_run_date

router = APIRouter()


@router.get("/", response_model=List[RecurringTemplateResponse])
def get_recurring_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lay danh sach tat ca lich trinh dinh ky cua user hien tai."""
    templates = db.query(RecurringTemplate).filter(
        RecurringTemplate.user_id == current_user.id
    ).order_by(RecurringTemplate.created_at.desc()).all()
    return templates


@router.post("/", response_model=RecurringTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_recurring_template(
    payload: RecurringTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tao moi mot lich trinh dinh ky."""
    from datetime import date, datetime, timezone
    from app.models.models import Transaction
    from app.services.recurring_service import calculate_next_run_date

    next_run = calculate_initial_next_run_date(
        start_date=payload.start_date,
        frequency=payload.frequency,
        day_of_week=payload.day_of_week,
        day_of_month=payload.day_of_month
    )

    template = RecurringTemplate(
        user_id=current_user.id,
        amount=payload.amount,
        type=payload.type,
        category=payload.category,
        description=payload.description,
        frequency=payload.frequency,
        day_of_week=payload.day_of_week,
        day_of_month=payload.day_of_month,
        next_run_date=next_run,
        end_date=payload.end_date,
        is_active=payload.is_active,
        is_auto_execute=payload.is_auto_execute
    )
    db.add(template)
    db.flush()  # Gen ID/created_at

    today = date.today()
    if next_run <= today and payload.is_auto_execute:
        new_tx = Transaction(
            user_id=current_user.id,
            amount=payload.amount,
            type=payload.type,
            category=payload.category,
            description=payload.description or f"Giao dich dinh ky: {payload.category}",
            transaction_date=today
        )
        db.add(new_tx)

        # Calculate next execution date
        next_date = calculate_next_run_date(
            current_date=next_run,
            frequency=payload.frequency,
            original_created_at=template.created_at or datetime.now(timezone.utc),
            day_of_week=payload.day_of_week,
            day_of_month=payload.day_of_month
        )

        if payload.end_date and next_date > payload.end_date:
            template.is_active = False
        else:
            template.next_run_date = next_date

    db.commit()
    db.refresh(template)
    return template


@router.put("/{template_id}", response_model=RecurringTemplateResponse)
def update_recurring_template(
    template_id: UUID,
    payload: RecurringTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cap nhat mot lich trinh dinh ky."""
    template = db.query(RecurringTemplate).filter(
        RecurringTemplate.id == template_id,
        RecurringTemplate.user_id == current_user.id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Khong tim thay lich trinh.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    # Neu thay doi frequency/day_of_week/day_of_month -> tinh lai next_run_date
    if any(k in update_data for k in ("frequency", "day_of_week", "day_of_month")):
        from datetime import date
        template.next_run_date = calculate_initial_next_run_date(
            start_date=date.today(),
            frequency=template.frequency,
            day_of_week=template.day_of_week,
            day_of_month=template.day_of_month
        )

    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xoa mot lich trinh dinh ky."""
    template = db.query(RecurringTemplate).filter(
        RecurringTemplate.id == template_id,
        RecurringTemplate.user_id == current_user.id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Khong tim thay lich trinh.")

    db.delete(template)
    db.commit()
    return None

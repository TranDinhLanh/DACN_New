import logging
import calendar
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import Transaction, RecurringTemplate

logger = logging.getLogger(__name__)


def calculate_initial_next_run_date(
    start_date: date,
    frequency: str,
    day_of_week: Optional[int] = None,
    day_of_month: Optional[int] = None
) -> date:
    """
    Tinh ngay chay dau tien (initial next_run_date) dua tren start_date.
    - weekly  + day_of_week  (0=Mon..6=Sun): tim ngay co thu khop dau tien tu start_date
    - monthly + day_of_month (1-31)        : tim ngay trong thang, neu qua thi sang thang sau
    - Cac truong hop con lai: tra ve start_date
    """
    if frequency == "weekly" and day_of_week is not None:
        days_ahead = day_of_week - start_date.weekday()
        if days_ahead < 0:
            days_ahead += 7
        return start_date + timedelta(days=days_ahead)

    if frequency == "monthly" and day_of_month is not None:
        year, month = start_date.year, start_date.month
        _, max_days = calendar.monthrange(year, month)
        target = min(day_of_month, max_days)
        if start_date.day > target:
            month += 1
            if month > 12:
                month, year = 1, year + 1
            _, max_days = calendar.monthrange(year, month)
            target = min(day_of_month, max_days)
        return date(year, month, target)

    return start_date


def calculate_next_run_date(
    current_date: date,
    frequency: str,
    original_created_at: datetime,
    day_of_week: Optional[int] = None,
    day_of_month: Optional[int] = None
) -> date:
    """
    Tinh ngay chay ke tiep sau khi thuc thi.
    """
    target_day = original_created_at.day

    if frequency == "daily":
        return current_date + timedelta(days=1)

    if frequency == "weekly":
        if day_of_week is not None:
            days_ahead = day_of_week - current_date.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            return current_date + timedelta(days=days_ahead)
        return current_date + timedelta(weeks=1)

    if frequency == "monthly":
        year, month = current_date.year, current_date.month + 1
        if month > 12:
            month, year = 1, year + 1
        _, max_days = calendar.monthrange(year, month)
        day = min(day_of_month if day_of_month is not None else target_day, max_days)
        return date(year, month, day)

    if frequency == "yearly":
        year = current_date.year + 1
        t_month = original_created_at.month
        if t_month == 2 and target_day == 29 and not calendar.isleap(year):
            return date(year, 2, 28)
        _, max_days = calendar.monthrange(year, t_month)
        return date(year, t_month, min(target_day, max_days))

    raise ValueError(f"Tan suat lap khong hop le: {frequency}")


def process_recurring_transactions(db: Session) -> dict:
    """
    Quet lich trinh dinh ky moi ngay (goi boi cron job).
    """
    today = date.today()
    logger.info(f"--- QUET LICH TRINH DINH KY: {today} ---")

    templates = db.query(RecurringTemplate).filter(
        RecurringTemplate.is_active == True,
        RecurringTemplate.next_run_date <= today
    ).all()

    summary = {"total_scanned": len(templates), "auto_executed": 0, "reminded": 0, "failed": 0}

    for template in templates:
        try:
            with db.begin_nested():
                if template.is_auto_execute:
                    new_tx = Transaction(
                        user_id=template.user_id,
                        amount=template.amount,
                        type=template.type,
                        category=template.category,
                        description=template.description or f"Giao dich dinh ky: {template.category}",
                        transaction_date=today,
                        merchant_name=None,
                        ocr_log_id=None
                    )
                    db.add(new_tx)
                    summary["auto_executed"] += 1
                    logger.info(f"  -> Auto-execute: {template.amount} | {template.category}")
                else:
                    logger.info(f"  -> Reminder only for user {template.user_id}")
                    summary["reminded"] += 1

                next_date = calculate_next_run_date(
                    current_date=template.next_run_date,
                    frequency=template.frequency,
                    original_created_at=template.created_at,
                    day_of_week=template.day_of_week,
                    day_of_month=template.day_of_month
                )

                if template.end_date and next_date > template.end_date:
                    template.is_active = False
                    logger.info(f"  -> Het han ({template.end_date}). Da tat lich trinh.")
                else:
                    template.next_run_date = next_date
                    logger.info(f"  -> Next run: {next_date}")

            db.commit()
        except Exception as e:
            db.rollback()
            summary["failed"] += 1
            logger.error(f"Loi xu ly template {template.id}: {str(e)}", exc_info=True)

    logger.info(f"--- HOAN TAT: {summary} ---")
    return summary

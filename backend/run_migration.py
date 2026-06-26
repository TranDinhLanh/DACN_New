"""Add day_of_week and day_of_month INTEGER columns to recurring_templates."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings
from sqlalchemy import create_engine, text

engine = create_engine(settings.get_database_url(), pool_pre_ping=True)

with engine.connect() as conn:
    result = conn.execute(text(
        "SELECT column_name FROM information_schema.columns WHERE table_name='recurring_templates'"
    ))
    cols = [r[0] for r in result.fetchall()]
    print("Existing:", cols)

    changed = False
    if 'day_of_week' not in cols:
        conn.execute(text("ALTER TABLE public.recurring_templates ADD COLUMN day_of_week INTEGER DEFAULT NULL"))
        print("Added day_of_week INTEGER")
        changed = True
    if 'day_of_month' not in cols:
        conn.execute(text("ALTER TABLE public.recurring_templates ADD COLUMN day_of_month INTEGER DEFAULT NULL"))
        print("Added day_of_month INTEGER")
        changed = True

    if not cols:  # table does not exist at all - let SQLAlchemy create it
        print("Table not found - will be created by SQLAlchemy on startup")
    elif changed:
        conn.commit()
        print("Migration done!")
    else:
        print("No migration needed.")

    result2 = conn.execute(text(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='recurring_templates' ORDER BY ordinal_position"
    ))
    print("\nFinal columns:")
    for r in result2.fetchall():
        print(f"  {r[0]:25} {r[1]}")

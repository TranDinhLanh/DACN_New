import sys
import os
from datetime import date, datetime

# Add root backend to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.recurring_service import (
    calculate_initial_next_run_date,
    calculate_next_run_date
)

def run_tests():
    print("=" * 50)
    print("RUNNING RECURRING TRANSACTIONS DATE LOGIC TESTS")
    print("=" * 50)

    # Test 1: Monthly next run date on 31st (May 31 -> June 30)
    # Start date May 31, 2026. Target day of month = 31.
    start = date(2026, 5, 31)
    next_run = calculate_initial_next_run_date(start, "monthly", day_of_month=31)
    print(f"Test 1 (Initial 31/05 -> monthly): Result = {next_run} (Expected: 2026-05-31)")
    assert next_run == date(2026, 5, 31), f"Expected 2026-05-31, got {next_run}"

    # Test 2: Advance from May 31 -> June 30
    next_date = calculate_next_run_date(
        current_date=date(2026, 5, 31),
        frequency="monthly",
        original_created_at=datetime(2026, 5, 31, 12, 0),
        day_of_month=31
    )
    print(f"Test 2 (Advance 31/05 -> monthly): Result = {next_date} (Expected: 2026-06-30)")
    assert next_date == date(2026, 6, 30), f"Expected 2026-06-30, got {next_date}"

    # Test 3: Advance from June 30 -> July 31
    next_date2 = calculate_next_run_date(
        current_date=date(2026, 6, 30),
        frequency="monthly",
        original_created_at=datetime(2026, 5, 31, 12, 0), # Original created on 31st
        day_of_month=31
    )
    print(f"Test 3 (Advance 30/06 with original 31st -> monthly): Result = {next_date2} (Expected: 2026-07-31)")
    assert next_date2 == date(2026, 7, 31), f"Expected 2026-07-31, got {next_date2}"

    # Test 4: Leap year 29/02/2024 -> yearly should yield 28/02/2025
    next_leap = calculate_next_run_date(
        current_date=date(2024, 2, 29),
        frequency="yearly",
        original_created_at=datetime(2024, 2, 29, 12, 0)
    )
    print(f"Test 4 (Leap year 29/02/2024 -> yearly): Result = {next_leap} (Expected: 2025-02-28)")
    assert next_leap == date(2025, 2, 28), f"Expected 2025-02-28, got {next_leap}"

    # Test 5: Standard yearly progression restoring 29th on leap year 2028
    # 2027-02-28 -> 2028-02-29 (next leap year)
    next_leap2 = calculate_next_run_date(
        current_date=date(2027, 2, 28),
        frequency="yearly",
        original_created_at=datetime(2024, 2, 29, 12, 0) # Original created on leap day
    )
    print(f"Test 5 (Restore leap day 28/02/2027 -> 2028): Result = {next_leap2} (Expected: 2028-02-29)")
    assert next_leap2 == date(2028, 2, 29), f"Expected 2028-02-29, got {next_leap2}"

    # Test 6: Weekly on Wednesday (day_of_week = 2). Start date Friday June 26, 2026 (weekday 4).
    # Expected: Wednesday July 1, 2026.
    start_weekly = date(2026, 6, 26)
    next_weekly = calculate_initial_next_run_date(start_weekly, "weekly", day_of_week=2)
    print(f"Test 6 (Weekly on Wed from Fri 26/06): Result = {next_weekly} (Expected: 2026-07-01)")
    assert next_weekly == date(2026, 7, 1), f"Expected 2026-07-01, got {next_weekly}"

    print("\nALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 50)

if __name__ == "__main__":
    run_tests()

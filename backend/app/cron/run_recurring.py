import os
import sys
import logging
from datetime import datetime

# Add the backend root directory to the python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal
from app.services.recurring_service import process_recurring_transactions

# Configure logging
log_dir = os.path.dirname(os.path.abspath(__file__))
log_file = os.path.join(log_dir, "recurring_cron.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("recurring_cron")

def main():
    logger.info("Starting recurring templates execution cron job...")
    db = SessionLocal()
    try:
        summary = process_recurring_transactions(db)
        logger.info(f"Execution summary: {summary}")
    except Exception as e:
        logger.error(f"Error during execution: {str(e)}", exc_info=True)
    finally:
        db.close()
    logger.info("Cron job finished.")

if __name__ == "__main__":
    main()

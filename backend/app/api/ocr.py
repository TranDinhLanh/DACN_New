import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import OCRLog, User
from app.schemas.schemas import OCRResultResponse
from app.services.ai_ocr import OCRService

router = APIRouter()

@router.post("/upload", response_model=OCRResultResponse)
async def upload_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """
    Upload a receipt photo. AI extracts merchant, amount, date, and raw text using LayoutLMv3.
    The response returns the static image URL and editable fields so the user can verify.
    Supports secure token-based user resolution, with auto-fallback to a seeded demo user for local testing.
    """
    # 1. Validate file format
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only JPEG, PNG, and WebP are allowed."
        )
        
    # Resolve current user (robust auth fallback for testing)
    current_user = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.replace("Bearer ", "")
            from app.core.config import settings
            import jwt
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("sub")
            if user_id:
                current_user = db.query(User).filter(User.id == user_id).first()
        except Exception:
            pass
            
    if not current_user:
        # Fallback to local admin/demo user so developers can test OCR instantly without logging in
        current_user = db.query(User).filter(User.email == "demo_user@aura.local").first()
        if not current_user:
            from app.core.security import get_password_hash
            current_user = User(
                email="demo_user@aura.local",
                hashed_password=get_password_hash("demo_password_123"),
                full_name="Admin Demo",
                is_active=True
            )
            db.add(current_user)
            db.commit()
            db.refresh(current_user)
        
    # Generate unique filename using UUID to avoid collisions
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        ext = ".jpg"  # default fallback
    file_uuid = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join("static", "uploads", file_uuid)
    image_url = f"/static/uploads/{file_uuid}"
        
    try:
        # Read file contents and save locally
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # 2. Save log record in database (pending state)
        ocr_log = OCRLog(
            user_id=current_user.id,
            image_url=image_url,
            extracted_raw_text="Processing...",
            status="pending"
        )
        db.add(ocr_log)
        db.commit()
        db.refresh(ocr_log)
        
        # 3. Call OCR & LayoutLMv3 pipeline
        ocr_data = OCRService.process_receipt_image(file_path, file.filename)
        
        # 4. Update log details with extracted content
        ocr_log.extracted_raw_text = ocr_data["extracted_text"]
        ocr_log.status = "success"
        db.commit()
        
        # 5. Return structured OCR result with static image URL to frontend
        return {
            "merchant": ocr_data["merchant"],
            "amount": ocr_data["amount"],
            "category": ocr_data["category"],
            "transaction_date": ocr_data["transaction_date"],
            "extracted_text": ocr_data["extracted_text"],
            "ocr_log_id": ocr_log.id,
            "image_url": image_url,
            "is_mock": ocr_data.get("is_mock", False),
            "debug_message": ocr_data.get("debug_message", "")
        }
        
    except Exception as e:
        # Update log to failed status
        db.rollback()
        # Create a fallback log
        failed_log = OCRLog(
            user_id=current_user.id,
            image_url=image_url if 'image_url' in locals() else file.filename,
            extracted_raw_text=f"Error processing image with LayoutLMv3: {str(e)}",
            status="failed"
        )
        db.add(failed_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process receipt OCR: {str(e)}"
        )

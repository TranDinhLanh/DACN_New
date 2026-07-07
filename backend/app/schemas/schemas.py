from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID

# --- AUTHENTICATION SCHEMAS ---

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[UUID] = None

class UserRegister(UserCreate):
    captcha_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=6, description="New password must be at least 6 characters")

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, description="New password must be at least 6 characters")


# --- TRANSACTION SCHEMAS ---

class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0, description="Amount must be positive")
    type: str = Field("expense", description="'income' or 'expense'")
    category: str = Field("Other", description="Spending or income category")
    description: Optional[str] = None
    transaction_date: date
    merchant_name: Optional[str] = None
    event_id: Optional[UUID] = None

class TransactionCreate(TransactionBase):
    ocr_log_id: Optional[UUID] = None

class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None
    merchant_name: Optional[str] = None
    event_id: Optional[UUID] = None

class TransactionResponse(TransactionBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# --- BUDGET SCHEMAS ---

class BudgetBase(BaseModel):
    category: str
    limit_amount: float = Field(..., gt=0)
    period: str = Field("monthly", description="'weekly' or 'monthly'")

class BudgetCreate(BudgetBase):
    pass

class BudgetResponse(BudgetBase):
    id: UUID
    user_id: UUID
    spent_amount: float
    created_at: datetime

    class Config:
        from_attributes = True


# --- OCR SCHEMAS ---

class OCRResultResponse(BaseModel):
    merchant: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    transaction_date: Optional[date] = None
    extracted_text: str
    ocr_log_id: UUID
    image_url: Optional[str] = None
    is_mock: Optional[bool] = False
    debug_message: Optional[str] = None


# --- FORECAST SCHEMAS ---

class ForecastDataPoint(BaseModel):
    date: date
    predicted_amount: float

class ForecastResponse(BaseModel):
    category: str
    forecast: List[ForecastDataPoint]


# --- CHAT SCHEMAS ---

class ChatMessage(BaseModel):
    role: str  # 'user' or 'model' / 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None

class ChatResponse(BaseModel):
    response: str
    suggested_questions: Optional[List[str]] = None


# --- RECURRING TEMPLATE SCHEMAS ---

class RecurringTemplateCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Amount must be positive")
    type: str = Field("expense", description="'income' or 'expense'")
    category: str = Field(..., description="Category name")
    description: Optional[str] = None
    frequency: str = Field("monthly", description="'daily', 'weekly', 'monthly', 'yearly'")
    day_of_week: Optional[int] = Field(None, ge=0, le=6, description="0=Mon..6=Sun (weekly only)")
    day_of_month: Optional[int] = Field(None, ge=1, le=31, description="1-31 (monthly only)")
    start_date: date = Field(..., description="Start date of the recurrence")
    end_date: Optional[date] = None
    is_active: bool = True
    is_auto_execute: bool = True

class RecurringTemplateUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    next_run_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    is_auto_execute: Optional[bool] = None

class RecurringTemplateResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount: float
    type: str
    category: str
    description: Optional[str] = None
    frequency: str
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None
    next_run_date: date
    end_date: Optional[date] = None
    is_active: bool
    is_auto_execute: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- EVENT SCHEMAS ---

class EventBase(BaseModel):
    name: str
    budget_limit: float = Field(0.0, ge=0.0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_completed: bool = False

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    name: Optional[str] = None
    budget_limit: Optional[float] = Field(None, ge=0.0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_completed: Optional[bool] = None

class EventResponse(EventBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class EventDetailResponse(EventResponse):
    transactions: List[TransactionResponse] = []
    total_spent: float = 0.0
    remaining_budget: float = 0.0
    percent_used: float = 0.0
    is_over_budget: bool = False

    class Config:
        from_attributes = True

class EventListResponse(EventResponse):
    total_spent: float = 0.0
    remaining_budget: float = 0.0
    percent_used: float = 0.0
    is_over_budget: bool = False

    class Config:
        from_attributes = True

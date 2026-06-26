import os

# FIX: Disable OneDNN NGAY KHI APP KHỞI ĐỘNG (Windows compatibility)
os.environ['FLAGS_use_mkldnn'] = '0'
os.environ['PADDLE_SKIP_CHECK_MKLDNN'] = '1'

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, transactions, budgets, ocr, forecast, chat, events

# Attempt database table initialization automatically on startup
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not auto-create database tables (Database might not be running yet): {str(e)}")

# Ensure local directories for file uploads exist
os.makedirs("static/uploads", exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Mount static folder so frontend can preview the scanned bill image
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS configuration
# Allows communication from local Next.js frontend server (usually http://localhost:3000)
origins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers under versioned endpoint prefix
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(transactions.router, prefix=f"{settings.API_V1_STR}/transactions", tags=["Transactions"])
app.include_router(budgets.router, prefix=f"{settings.API_V1_STR}/budgets", tags=["Budgets"])
app.include_router(ocr.router, prefix=f"{settings.API_V1_STR}/ocr", tags=["AI OCR"])
app.include_router(forecast.router, prefix=f"{settings.API_V1_STR}/forecast", tags=["AI Forecast"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["AI Chat"])
app.include_router(events.router, prefix=f"{settings.API_V1_STR}/events", tags=["Events"])

@app.get("/")
def read_root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME}!",
        "status": "Online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

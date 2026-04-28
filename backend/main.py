"""
main.py — FastAPI application entry point.

Configures CORS, registers routers, creates tables on startup,
seeds demo data, and provides global exception handling.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from database import engine, get_db, Base, SessionLocal
from models import User, Patient, Appointment  # noqa — ensure models are registered
from schemas import LoginRequest, TokenResponse
from auth import authenticate_user
from seed import seed_database

from routers import patients, appointments


# ── Lifespan (startup / shutdown) ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and seed data on startup."""
    Base.metadata.create_all(bind=engine)
    print("[DB] Database tables created / verified")

    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    yield  # Application runs
    print("[INFO] Shutting down MediCare+ API")


# ── FastAPI App ──
app = FastAPI(
    title="MediCare+ API",
    description="REST API backend for the MediCare+ Patient Management System",
    version="1.0.0",
    lifespan=lifespan,
)


# ── CORS Configuration ──
# Allow the frontend served by VS Code Live Server (or any localhost origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Exception Handlers ──
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Clean JSON for all HTTP exceptions (401, 403, 404, 409, etc.)."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "detail": exc.detail},
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Clean JSON for Pydantic validation errors (422)."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "detail": "Validation error",
            "errors": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all for unexpected server errors."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": True, "detail": "Internal server error"},
    )


# ── Auth Route (not behind a router, kept at app level) ──
@app.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
def login(data: LoginRequest):
    """
    Authenticate a user and return a JWT access token.
    """
    db = SessionLocal()
    try:
        result = authenticate_user(db, data)
    finally:
        db.close()

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return result


# ── Health Check ──
@app.get("/health", tags=["System"])
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "service": "MediCare+ API", "version": "1.0.0"}


# ── Register Routers ──
app.include_router(patients.router)
app.include_router(appointments.router)

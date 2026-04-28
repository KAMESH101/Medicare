"""
schemas.py — Pydantic request/response schemas for MediCare+.
"""

from typing import Optional
from pydantic import BaseModel, Field


# ── Auth ──
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    name: str
    doctor_id: Optional[int] = None

    model_config = {"from_attributes": True}


# ── Patient ──
class PatientCreate(BaseModel):
    name: str = Field(..., min_length=2)
    age: int = Field(..., ge=0, le=130)
    gender: str
    blood: str
    phone: str = Field(..., pattern=r"^\d{10}$")
    email: Optional[str] = ""
    address: Optional[str] = ""
    condition: Optional[str] = "General"
    status: Optional[str] = "Active"


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = None
    blood: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    condition: Optional[str] = None
    status: Optional[str] = None


class PatientOut(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    blood: str
    phone: str
    email: str
    address: str
    condition: str
    status: str
    joined: str

    model_config = {"from_attributes": True}


# ── Appointment ──
class AppointmentCreate(BaseModel):
    patient_id: int
    patient_name: str
    doctor_id: int
    doctor_name: str
    date: str  # ISO date
    time: str  # HH:MM
    type: Optional[str] = "Consultation"
    status: Optional[str] = "Pending"
    notes: Optional[str] = ""


class AppointmentUpdate(BaseModel):
    patient_id: Optional[int] = None
    patient_name: Optional[str] = None
    doctor_id: Optional[int] = None
    doctor_name: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    doctor_id: int
    doctor_name: str
    date: str
    time: str
    type: str
    status: str
    notes: str

    model_config = {"from_attributes": True}

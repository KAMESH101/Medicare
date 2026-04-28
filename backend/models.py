"""
models.py — SQLAlchemy ORM table models for MediCare+.
"""

from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)  # bcrypt hashed
    role = Column(String, nullable=False)  # admin | doctor | receptionist
    name = Column(String, nullable=False)
    doctor_id = Column(Integer, nullable=True)  # Links doctor user to DOCTORS list


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    blood = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True, default="")
    address = Column(String, nullable=True, default="")
    condition = Column(String, nullable=True, default="General")
    status = Column(String, nullable=False, default="Active")
    joined = Column(String, nullable=False)  # ISO date string


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    patient_name = Column(String, nullable=False)
    doctor_id = Column(Integer, nullable=False)
    doctor_name = Column(String, nullable=False)
    date = Column(String, nullable=False)  # ISO date string
    time = Column(String, nullable=False)  # HH:MM
    type = Column(String, nullable=False, default="Consultation")
    status = Column(String, nullable=False, default="Pending")
    notes = Column(String, nullable=True, default="")

"""
routers/appointments.py — Appointment CRUD endpoints with role-based access control.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Appointment, User
from schemas import AppointmentCreate, AppointmentUpdate, AppointmentOut
from dependencies import get_current_user, require_role

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.get("", response_model=list[AppointmentOut])
def get_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get appointments.
    - Admin / Receptionist: see all appointments.
    - Doctor: see only their own assigned appointments.
    """
    query = db.query(Appointment)

    if current_user.role == "doctor":
        query = query.filter(Appointment.doctor_id == current_user.doctor_id)

    return query.order_by(Appointment.id).all()


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "receptionist")),
):
    """
    Book a new appointment.
    Accessible by: Admin, Receptionist.
    """
    # Slot conflict check: same doctor + date + time (exclude cancelled)
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == data.doctor_id,
        Appointment.date == data.date,
        Appointment.time == data.time,
        Appointment.status != "Cancelled",
    ).first()
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This slot is already booked for {conflict.patient_name}",
        )

    appointment = Appointment(
        patient_id=data.patient_id,
        patient_name=data.patient_name,
        doctor_id=data.doctor_id,
        doctor_name=data.doctor_name,
        date=data.date,
        time=data.time,
        type=data.type or "Consultation",
        status=data.status or "Pending",
        notes=data.notes or "",
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """
    Update an existing appointment.
    Accessible by: Admin only.
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    update_data = data.model_dump(exclude_unset=True)

    # Slot conflict check when date/time/doctor changes
    new_doctor = update_data.get("doctor_id", appointment.doctor_id)
    new_date = update_data.get("date", appointment.date)
    new_time = update_data.get("time", appointment.time)
    new_status = update_data.get("status", appointment.status)

    if new_status != "Cancelled":
        conflict = db.query(Appointment).filter(
            Appointment.id != appointment_id,
            Appointment.doctor_id == new_doctor,
            Appointment.date == new_date,
            Appointment.time == new_time,
            Appointment.status != "Cancelled",
        ).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"This slot is already booked for {conflict.patient_name}",
            )

    for key, value in update_data.items():
        setattr(appointment, key, value)

    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}", response_model=AppointmentOut)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """
    Cancel an appointment (sets status to 'Cancelled').
    Accessible by: Admin only.
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    appointment.status = "Cancelled"
    db.commit()
    db.refresh(appointment)
    return appointment

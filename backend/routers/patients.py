"""
routers/patients.py — Patient CRUD endpoints with role-based access control.
"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Patient, Appointment, User
from schemas import PatientCreate, PatientUpdate, PatientOut
from dependencies import get_current_user, require_role

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=list[PatientOut])
def get_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all patients. Accessible by all authenticated roles."""
    return db.query(Patient).order_by(Patient.id).all()


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(
    data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "receptionist")),
):
    """
    Register a new patient.
    Accessible by: Admin, Receptionist.
    """
    # Duplicate check: same name + phone
    existing = db.query(Patient).filter(
        Patient.name == data.name.strip(),
        Patient.phone == data.phone.strip(),
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A patient with this name and phone already exists",
        )

    patient = Patient(
        name=data.name.strip(),
        age=data.age,
        gender=data.gender,
        blood=data.blood,
        phone=data.phone.strip(),
        email=(data.email or "").strip(),
        address=(data.address or "").strip(),
        condition=data.condition or "General",
        status=data.status or "Active",
        joined=date.today().isoformat(),
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """
    Update an existing patient record.
    Accessible by: Admin only.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    update_data = data.model_dump(exclude_unset=True)

    # Strip strings
    for field in ("name", "phone", "email", "address"):
        if field in update_data and update_data[field] is not None:
            update_data[field] = update_data[field].strip()

    # Duplicate check (exclude self)
    if "name" in update_data or "phone" in update_data:
        check_name = update_data.get("name", patient.name)
        check_phone = update_data.get("phone", patient.phone)
        dup = db.query(Patient).filter(
            Patient.id != patient_id,
            Patient.name == check_name,
            Patient.phone == check_phone,
        ).first()
        if dup:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A patient with this name and phone already exists",
            )

    for key, value in update_data.items():
        setattr(patient, key, value)

    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """
    Delete a patient and cascade-delete their appointments.
    Accessible by: Admin only.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Delete associated appointments first
    db.query(Appointment).filter(Appointment.patient_id == patient_id).delete()
    db.delete(patient)
    db.commit()

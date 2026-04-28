"""
seed.py — Seeds the database with demo users, patients, and appointments on first run.
"""

from sqlalchemy.orm import Session
from models import User, Patient, Appointment
from auth import hash_password


def seed_database(db: Session) -> None:
    """
    Populates the database with initial demo data if tables are empty.
    Called once during application startup.
    """

    # ── Only seed if the users table is empty ──
    if db.query(User).first() is not None:
        return

    print("[SEED] Seeding database with demo data...")

    # ── Users (4 demo accounts) ──
    users = [
        User(
            id=1, username="admin", name="Administrator",
            password=hash_password("admin123"),
            role="admin", doctor_id=None,
        ),
        User(
            id=2, username="dr.anitha", name="Dr. Anitha Krishnan",
            password=hash_password("doc123"),
            role="doctor", doctor_id=1,
        ),
        User(
            id=3, username="dr.suresh", name="Dr. Suresh Patel",
            password=hash_password("doc456"),
            role="doctor", doctor_id=2,
        ),
        User(
            id=4, username="riya", name="Riya Sharma",
            password=hash_password("rec123"),
            role="receptionist", doctor_id=None,
        ),
    ]
    db.add_all(users)

    # ── Patients (4 sample records) ──
    patients = [
        Patient(
            id=1, name="Priya Nair", age=34, gender="Female", blood="O+",
            phone="9876543210", email="priya@email.com",
            address="Anna Nagar, Chennai", condition="Hypertension",
            status="Active", joined="2024-01-15",
        ),
        Patient(
            id=2, name="Rajan Kumar", age=58, gender="Male", blood="A+",
            phone="9876543211", email="rajan@email.com",
            address="T Nagar, Chennai", condition="Diabetes Type 2",
            status="Active", joined="2024-02-20",
        ),
        Patient(
            id=3, name="Meena Pillai", age=42, gender="Female", blood="B-",
            phone="9876543212", email="meena@email.com",
            address="Adyar, Chennai", condition="Asthma",
            status="Inactive", joined="2024-03-05",
        ),
        Patient(
            id=4, name="Arjun Sharma", age=27, gender="Male", blood="AB+",
            phone="9876543213", email="arjun@email.com",
            address="Velachery, Chennai", condition="Migraine",
            status="Active", joined="2024-04-10",
        ),
    ]
    db.add_all(patients)

    # ── Appointments (4 sample records) ──
    appointments = [
        Appointment(
            id=1, patient_id=1, patient_name="Priya Nair",
            doctor_id=1, doctor_name="Dr. Anitha Krishnan",
            date="2026-05-12", time="10:00", type="Follow-up",
            status="Confirmed", notes="BP check",
        ),
        Appointment(
            id=2, patient_id=2, patient_name="Rajan Kumar",
            doctor_id=2, doctor_name="Dr. Suresh Patel",
            date="2026-05-13", time="14:30", type="Consultation",
            status="Pending", notes="Sugar level check",
        ),
        Appointment(
            id=3, patient_id=3, patient_name="Meena Pillai",
            doctor_id=3, doctor_name="Dr. Kavya Reddy",
            date="2026-05-14", time="11:00", type="Routine",
            status="Confirmed", notes="Breathing test",
        ),
        Appointment(
            id=4, patient_id=4, patient_name="Arjun Sharma",
            doctor_id=1, doctor_name="Dr. Anitha Krishnan",
            date="2026-05-15", time="09:30", type="Consultation",
            status="Cancelled", notes="Migraine analysis",
        ),
    ]
    db.add_all(appointments)

    db.commit()
    print("[OK] Seed data inserted successfully (4 users, 4 patients, 4 appointments)")

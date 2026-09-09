import os
import django
import datetime
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User, AuditLog
from hospital.models import Department, Doctor, Patient, DoctorSchedule
from appointments.models import Appointment, AppointmentStatusHistory
from records.models import MedicalRecord, Prescription, PrescriptionItem
from billing.models import Invoice, InvoiceItem, Payment
from documents.models import Document
from notifications.models import Notification

def seed():
    print("Seeding database...")

    # 1. Create Super Admin / Admin
    admin_user, created = User.objects.get_or_create(
        email='admin@hospital.com',
        defaults={
            'first_name': 'Hospital',
            'last_name': 'Administrator',
            'role': User.Role.ADMIN,
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('Admin@123')
        admin_user.save()
        print("Created Admin: admin@hospital.com")

    # 2. Create Receptionist
    receptionist_user, created = User.objects.get_or_create(
        email='receptionist@hospital.com',
        defaults={
            'first_name': 'Alice',
            'last_name': 'Cooper',
            'role': User.Role.RECEPTIONIST,
            'is_staff': False
        }
    )
    if created:
        receptionist_user.set_password('Reception@123')
        receptionist_user.save()
        print("Created Receptionist: receptionist@hospital.com")

    # 3. Create Departments
    departments_data = [
        ("Cardiology", "Cardiovascular diagnosis, interventions, and cardiac health."),
        ("Neurology", "Disorders of the nervous system, brain, and spinal cord."),
        ("Pediatrics", "Comprehensive medical care for infants, children, and adolescents."),
        ("Orthopedics", "Treatment of musculoskeletal system, bones, and joints."),
        ("General Medicine", "Primary healthcare, internal medicine, and preventative care."),
    ]
    departments = {}
    for name, desc in departments_data:
        dept, _ = Department.objects.get_or_create(name=name, defaults={'description': desc, 'is_active': True})
        departments[name] = dept
    print("Created Departments")

    # 4. Create Doctors
    doctors_data = [
        {
            'email': 'doctor.smith@hospital.com',
            'first_name': 'David',
            'last_name': 'Smith',
            'dept': 'Cardiology',
            'spec': 'Interventional Cardiology',
            'qual': 'MD, FACC - Harvard Medical School',
            'exp': 15,
            'fee': Decimal('150.00'),
            'bio': 'Board-certified cardiologist with over 15 years of experience treating coronary artery disease.'
        },
        {
            'email': 'doctor.sarah@hospital.com',
            'first_name': 'Sarah',
            'last_name': 'Jenkins',
            'dept': 'Neurology',
            'spec': 'Clinical Neurophysiology',
            'qual': 'MD, PhD - Johns Hopkins University',
            'exp': 12,
            'fee': Decimal('180.00'),
            'bio': 'Specialist in migraine management, neuromuscular disorders, and advanced neurological evaluations.'
        },
        {
            'email': 'doctor.john@hospital.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'dept': 'General Medicine',
            'spec': 'Internal Medicine',
            'qual': 'MD - Stanford University School of Medicine',
            'exp': 10,
            'fee': Decimal('100.00'),
            'bio': 'Dedicated to holistic health, annual checkups, chronic disease management, and preventative screening.'
        },
    ]

    doctor_objs = []
    for doc_info in doctors_data:
        doc_user, created = User.objects.get_or_create(
            email=doc_info['email'],
            defaults={
                'first_name': doc_info['first_name'],
                'last_name': doc_info['last_name'],
                'role': User.Role.DOCTOR
            }
        )
        if created:
            doc_user.set_password('Doctor@123')
            doc_user.save()
        
        doctor, _ = Doctor.objects.get_or_create(
            user=doc_user,
            defaults={
                'department': departments[doc_info['dept']],
                'specialization': doc_info['spec'],
                'qualification': doc_info['qual'],
                'experience_years': doc_info['exp'],
                'consultation_fee': doc_info['fee'],
                'bio': doc_info['bio'],
                'is_active': True
            }
        )
        doctor_objs.append(doctor)

        # Create doctor weekly schedule (Monday to Friday, 9:00 to 17:00, 30 min slots)
        for day in range(0, 5):
            DoctorSchedule.objects.get_or_create(
                doctor=doctor,
                day_of_week=day,
                defaults={
                    'start_time': datetime.time(9, 0),
                    'end_time': datetime.time(17, 0),
                    'slot_duration': 30,
                    'is_active': True
                }
            )
    print("Created Doctors & Schedules")

    # 5. Create Patients
    patients_data = [
        {
            'email': 'patient@hospital.com',
            'first_name': 'Michael',
            'last_name': 'Brown',
            'dob': '1990-05-14',
            'gender': 'M',
            'contact': '+1-555-0199',
            'blood': 'O+',
            'address': '742 Evergreen Terrace, Springfield',
            'em_name': 'Laura Brown',
            'em_phone': '+1-555-0198'
        },
        {
            'email': 'jane@hospital.com',
            'first_name': 'Jane',
            'last_name': 'Williams',
            'dob': '1995-11-23',
            'gender': 'F',
            'contact': '+1-555-0144',
            'blood': 'A+',
            'address': '124 Conch Street, Bikini Bottom',
            'em_name': 'Robert Williams',
            'em_phone': '+1-555-0145'
        }
    ]

    patient_objs = []
    for pat_info in patients_data:
        pat_user, created = User.objects.get_or_create(
            email=pat_info['email'],
            defaults={
                'first_name': pat_info['first_name'],
                'last_name': pat_info['last_name'],
                'role': User.Role.PATIENT
            }
        )
        if created:
            pat_user.set_password('Patient@123')
            pat_user.save()

        patient, _ = Patient.objects.get_or_create(
            user=pat_user,
            defaults={
                'date_of_birth': pat_info['dob'],
                'gender': pat_info['gender'],
                'contact_number': pat_info['contact'],
                'blood_group': pat_info['blood'],
                'address': pat_info['address'],
                'emergency_contact_name': pat_info['em_name'],
                'emergency_contact_number': pat_info['em_phone']
            }
        )
        patient_objs.append(patient)
    print("Created Patients")

    # 6. Create Sample Appointments
    today = datetime.date.today()
    tomorrow = today + datetime.timedelta(days=1)
    
    # Check weekday for appointments
    appt1_date = tomorrow if tomorrow.weekday() < 5 else today + datetime.timedelta(days=(7 - today.weekday()))

    appt1, _ = Appointment.objects.get_or_create(
        doctor=doctor_objs[0],
        patient=patient_objs[0],
        appointment_date=appt1_date,
        start_time=datetime.time(10, 0),
        defaults={
            'end_time': datetime.time(10, 30),
            'status': Appointment.StatusChoices.CONFIRMED,
            'reason': 'Routine blood pressure and cardiovascular checkup.'
        }
    )

    appt2, _ = Appointment.objects.get_or_create(
        doctor=doctor_objs[1],
        patient=patient_objs[1],
        appointment_date=today,
        start_time=datetime.time(14, 0),
        defaults={
            'end_time': datetime.time(14, 30),
            'status': Appointment.StatusChoices.CHECKED_IN,
            'reason': 'Persistent tension headaches for the last three weeks.'
        }
    )

    # Completed appointment for past medical records
    past_date = today - datetime.timedelta(days=7)
    appt_past, _ = Appointment.objects.get_or_create(
        doctor=doctor_objs[2],
        patient=patient_objs[0],
        appointment_date=past_date,
        start_time=datetime.time(11, 0),
        defaults={
            'end_time': datetime.time(11, 30),
            'status': Appointment.StatusChoices.COMPLETED,
            'reason': 'Annual comprehensive wellness evaluation.'
        }
    )
    print("Created Appointments")

    # 7. Create Medical Record & Prescription for past appointment
    record, _ = MedicalRecord.objects.get_or_create(
        appointment=appt_past,
        defaults={
            'patient': patient_objs[0],
            'doctor': doctor_objs[2],
            'symptoms': 'Mild fatigue during late evenings, normal appetite.',
            'observations': 'BP: 122/80 mmHg, Pulse: 72 bpm, SpO2: 99%, Clear chest auscultation.',
            'diagnosis': 'Seasonal physical fatigue with mild vitamin D deficiency.',
            'treatment_plan': 'Increase outdoor activity, maintain adequate hydration, take prescribed dietary supplements.',
            'notes': 'Follow up in 6 months for routine re-test.'
        }
    )

    presc, _ = Prescription.objects.get_or_create(
        medical_record=record,
        defaults={'notes': 'Take supplements with morning meal.'}
    )

    PrescriptionItem.objects.get_or_create(
        prescription=presc,
        medicine_name='Cholecalciferol (Vitamin D3) 60,000 IU',
        defaults={
            'dosage': '1 Capsule',
            'frequency': 'Once weekly',
            'duration': '8 weeks',
            'instructions': 'Take after breakfast with water or milk.'
        }
    )
    PrescriptionItem.objects.get_or_create(
        prescription=presc,
        medicine_name='Multivitamin & Mineral Complex',
        defaults={
            'dosage': '1 Tablet',
            'frequency': 'Once daily',
            'duration': '30 days',
            'instructions': 'Take with lunch.'
        }
    )
    print("Created Medical Records & Prescriptions")

    # 8. Create Invoices and Payments
    inv_number = f"INV-{today.strftime('%Y%m')}-001"
    inv, created = Invoice.objects.get_or_create(
        invoice_number=inv_number,
        defaults={
            'patient': patient_objs[0],
            'appointment': appt_past,
            'due_date': today + datetime.timedelta(days=14),
            'tax_rate': Decimal('5.00'),
            'discount': Decimal('10.00'),
            'total_amount': Decimal('95.00'),
            'amount_paid': Decimal('95.00'),
            'status': Invoice.StatusChoices.PAID
        }
    )
    if created:
        InvoiceItem.objects.create(
            invoice=inv,
            description="General Consultation Fee",
            quantity=1,
            unit_price=Decimal('100.00'),
            amount=Decimal('100.00')
        )
        Payment.objects.create(
            invoice=inv,
            amount=Decimal('95.00'),
            payment_method=Payment.MethodChoices.CARD,
            transaction_id='TXN-98234710',
            status=Payment.StatusChoices.SUCCESS,
            notes='Paid via Visa Card terminal'
        )

    # Pending invoice for today's appointment
    inv2_number = f"INV-{today.strftime('%Y%m')}-002"
    inv2, created2 = Invoice.objects.get_or_create(
        invoice_number=inv2_number,
        defaults={
            'patient': patient_objs[1],
            'appointment': appt2,
            'due_date': today + datetime.timedelta(days=7),
            'tax_rate': Decimal('5.00'),
            'discount': Decimal('0.00'),
            'total_amount': Decimal('189.00'),
            'amount_paid': Decimal('0.00'),
            'status': Invoice.StatusChoices.PENDING
        }
    )
    if created2:
        InvoiceItem.objects.create(
            invoice=inv2,
            description="Neurology Consultation & Initial Assessment",
            quantity=1,
            unit_price=Decimal('180.00'),
            amount=Decimal('180.00')
        )
    print("Created Invoices & Payments")

    # 9. Create Notifications
    Notification.objects.get_or_create(
        user=patient_objs[0].user,
        title="Appointment Reminder",
        defaults={
            'message': f"Your appointment with Dr. David Smith is scheduled for {appt1_date} at 10:00 AM.",
            'notification_type': Notification.NotificationType.INFO,
            'is_read': False
        }
    )
    Notification.objects.get_or_create(
        user=admin_user,
        title="System Initialized",
        defaults={
            'message': "PostgreSQL database connected and system successfully initialized.",
            'notification_type': Notification.NotificationType.SUCCESS,
            'is_read': True
        }
    )

    # 10. Audit Log
    AuditLog.objects.create(
        user=admin_user,
        action='SYSTEM_SEED',
        resource_type='Database',
        resource_id='postgres',
        status='SUCCESS',
        details='Initial database seed completed successfully.'
    )

    print("\nDatabase Seeding Completed Successfully!")
    print("=" * 60)
    print("Test Credentials:")
    print("  Super Admin:   admin@hospital.com       / Admin@123")
    print("  Doctor Smith:  doctor.smith@hospital.com / Doctor@123")
    print("  Doctor Sarah:  doctor.sarah@hospital.com / Doctor@123")
    print("  Receptionist:  receptionist@hospital.com / Reception@123")
    print("  Patient Brown: patient@hospital.com      / Patient@123")
    print("  Patient Jane:  jane@hospital.com         / Patient@123")
    print("=" * 60)

if __name__ == '__main__':
    seed()

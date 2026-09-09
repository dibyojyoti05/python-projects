from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from hospital.models import Department, Doctor, Patient, DoctorSchedule
from appointments.models import Appointment
import datetime
from decimal import Decimal

User = get_user_model()

class AppointmentTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.doc_user = User.objects.create_user(
            email='doc@test.com', password='Password123!', first_name='Doc', last_name='Tor', role=User.Role.DOCTOR
        )
        self.pat_user = User.objects.create_user(
            email='pat@test.com', password='Password123!', first_name='Pat', last_name='Ient', role=User.Role.PATIENT
        )
        self.recep_user = User.objects.create_user(
            email='recep@test.com', password='Password123!', first_name='Rec', last_name='Ep', role=User.Role.RECEPTIONIST
        )

        # Department & Profiles
        self.dept = Department.objects.create(name='Cardiology', description='Heart care')
        self.doctor = Doctor.objects.create(
            user=self.doc_user,
            department=self.dept,
            specialization='Cardiology',
            qualification='MD',
            consultation_fee=Decimal('100.00')
        )
        self.patient = Patient.objects.create(user=self.pat_user, blood_group='O+')

        # Doctor Schedule on Mondays (day_of_week=0) from 09:00 to 12:00 (30 min slots)
        DoctorSchedule.objects.create(
            doctor=self.doctor,
            day_of_week=0,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(12, 0),
            slot_duration=30,
            is_active=True
        )

    def test_available_slots_calculation(self):
        self.client.force_authenticate(user=self.pat_user)
        # Find next Monday in future
        today = datetime.date.today()
        days_ahead = 0 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        next_monday = today + datetime.timedelta(days=days_ahead)

        response = self.client.get(f'/api/appointments/available_slots/?doctor_id={self.doctor.id}&date={next_monday.isoformat()}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 9:00 to 12:00 in 30-min intervals = 6 slots
        self.assertEqual(len(response.data), 6)

    def test_appointment_booking_and_cancellation(self):
        self.client.force_authenticate(user=self.pat_user)
        today = datetime.date.today()
        future_date = today + datetime.timedelta(days=14)

        # Book appointment
        response = self.client.post('/api/appointments/', {
            'doctor': self.doctor.id,
            'patient': self.patient.id,
            'appointment_date': future_date.isoformat(),
            'start_time': '10:00:00',
            'end_time': '10:30:00',
            'reason': 'Checkup'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        appt_id = response.data['id']

        # Cancel appointment
        cancel_resp = self.client.post(f'/api/appointments/{appt_id}/cancel/', {
            'reason': 'Personal emergency'
        })
        self.assertEqual(cancel_resp.status_code, status.HTTP_200_OK)

        appt = Appointment.objects.get(id=appt_id)
        self.assertEqual(appt.status, Appointment.StatusChoices.CANCELLED)
        self.assertEqual(appt.cancellation_reason, 'Personal emergency')

    def test_receptionist_check_in(self):
        today = datetime.date.today()
        appt = Appointment.objects.create(
            doctor=self.doctor,
            patient=self.patient,
            appointment_date=today,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(10, 30),
            status=Appointment.StatusChoices.CONFIRMED
        )

        self.client.force_authenticate(user=self.recep_user)
        resp = self.client.post(f'/api/appointments/{appt.id}/check_in/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        appt.refresh_from_db()
        self.assertEqual(appt.status, Appointment.StatusChoices.CHECKED_IN)

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from hospital.models import Patient
from billing.models import Invoice, InvoiceItem, Payment
import datetime
from decimal import Decimal

User = get_user_model()

class BillingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin@test.com', password='Password123!', role=User.Role.ADMIN
        )
        self.pat_user = User.objects.create_user(
            email='pat@test.com', password='Password123!', role=User.Role.PATIENT
        )
        self.patient = Patient.objects.create(user=self.pat_user)

    def test_invoice_creation_and_totals(self):
        today = datetime.date.today()
        inv = Invoice.objects.create(
            invoice_number='INV-TEST-001',
            patient=self.patient,
            due_date=today + datetime.timedelta(days=7),
            tax_rate=Decimal('10.00'),
            discount=Decimal('5.00')
        )
        InvoiceItem.objects.create(
            invoice=inv,
            description='Lab Test',
            quantity=2,
            unit_price=Decimal('50.00')
        )
        inv.refresh_from_db()
        # Items total = 100, tax 10% = 10, discount = 5 -> total = 105
        self.assertEqual(inv.total_amount, Decimal('105.00'))
        self.assertEqual(inv.status, Invoice.StatusChoices.PENDING)

        # Make Payment
        Payment.objects.create(
            invoice=inv,
            amount=Decimal('105.00'),
            payment_method=Payment.MethodChoices.ONLINE,
            status=Payment.StatusChoices.SUCCESS
        )
        inv.refresh_from_db()
        self.assertEqual(inv.status, Invoice.StatusChoices.PAID)
        self.assertEqual(inv.amount_paid, Decimal('105.00'))

    def test_pdf_download_action(self):
        today = datetime.date.today()
        inv = Invoice.objects.create(
            invoice_number='INV-PDF-001',
            patient=self.patient,
            due_date=today + datetime.timedelta(days=7),
            total_amount=Decimal('100.00'),
            status=Invoice.StatusChoices.PAID
        )
        InvoiceItem.objects.create(
            invoice=inv,
            description='General Consultation',
            quantity=1,
            unit_price=Decimal('100.00')
        )

        self.client.force_authenticate(user=self.pat_user)
        response = self.client.get(f'/api/invoices/{inv.id}/download_pdf/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(len(response.content) > 500)

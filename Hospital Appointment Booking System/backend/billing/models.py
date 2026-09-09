from django.db import models
from decimal import Decimal
from hospital.models import Patient
from appointments.models import Appointment

class Invoice(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
        PAID = 'PAID', 'Paid'
        REFUNDED = 'REFUNDED', 'Refunded'
        CANCELLED = 'CANCELLED', 'Cancelled'

    invoice_number = models.CharField(max_length=50, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='invoices')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice {self.invoice_number} for {self.patient}"

    def update_totals(self):
        items_total = sum((item.amount for item in self.items.all()), Decimal('0.00'))
        tax_rate_dec = Decimal(str(self.tax_rate))
        discount_dec = Decimal(str(self.discount))
        tax_amount = (items_total * tax_rate_dec) / Decimal('100.0')
        self.total_amount = items_total + tax_amount - discount_dec
        if self.amount_paid >= self.total_amount:
            self.status = self.StatusChoices.PAID
        elif self.amount_paid > 0:
            self.status = self.StatusChoices.PARTIALLY_PAID
        else:
            self.status = self.StatusChoices.PENDING
        self.save()

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        self.invoice.update_totals()

    def __str__(self):
        return f"{self.description} x {self.quantity}"

class Payment(models.Model):
    class MethodChoices(models.TextChoices):
        CASH = 'CASH', 'Cash'
        CARD = 'CARD', 'Card'
        ONLINE = 'ONLINE', 'Online'
        INSURANCE = 'INSURANCE', 'Insurance'

    class StatusChoices(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=MethodChoices.choices)
    transaction_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING)
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.status == self.StatusChoices.SUCCESS:
            self.invoice.amount_paid += self.amount
            self.invoice.update_totals()

    def __str__(self):
        return f"Payment {self.id} for Invoice {self.invoice.invoice_number}"

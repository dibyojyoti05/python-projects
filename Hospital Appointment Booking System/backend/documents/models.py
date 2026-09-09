from django.db import models
from hospital.models import Patient
from django.conf import settings

class Document(models.Model):
    class DocumentType(models.TextChoices):
        LAB_REPORT = 'LAB_REPORT', 'Lab Report'
        PRESCRIPTION = 'PRESCRIPTION', 'Prescription'
        MEDICAL_RECORD = 'MEDICAL_RECORD', 'Medical Record'
        INSURANCE = 'INSURANCE', 'Insurance Document'
        OTHER = 'OTHER', 'Other'

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='documents')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=200)
    document_type = models.CharField(max_length=20, choices=DocumentType.choices, default=DocumentType.OTHER)
    file = models.FileField(upload_to='secure_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} for {self.patient}"

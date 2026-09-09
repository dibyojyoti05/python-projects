from rest_framework import viewsets, permissions
from .models import MedicalRecord, Prescription, PrescriptionItem
from .serializers import MedicalRecordSerializer, PrescriptionSerializer, PrescriptionItemSerializer
from users.permissions import IsSuperAdmin, IsAdmin, IsDoctor, IsPatient

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return MedicalRecord.objects.filter(patient__user=user)
        elif user.role == 'DOCTOR':
            return MedicalRecord.objects.filter(doctor__user=user)
        elif user.role in ['ADMIN', 'SUPER_ADMIN']:
            return MedicalRecord.objects.all()
        return MedicalRecord.objects.none()

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return Prescription.objects.filter(medical_record__patient__user=user)
        elif user.role == 'DOCTOR':
            return Prescription.objects.filter(medical_record__doctor__user=user)
        elif user.role in ['ADMIN', 'SUPER_ADMIN']:
            return Prescription.objects.all()
        return Prescription.objects.none()

class PrescriptionItemViewSet(viewsets.ModelViewSet):
    queryset = PrescriptionItem.objects.all()
    serializer_class = PrescriptionItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return PrescriptionItem.objects.filter(prescription__medical_record__patient__user=user)
        elif user.role == 'DOCTOR':
            return PrescriptionItem.objects.filter(prescription__medical_record__doctor__user=user)
        elif user.role in ['ADMIN', 'SUPER_ADMIN']:
            return PrescriptionItem.objects.all()
        return PrescriptionItem.objects.none()

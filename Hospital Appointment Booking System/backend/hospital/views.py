from rest_framework import viewsets, permissions
from .models import Department, Doctor, Patient, DoctorSchedule, DoctorLeave
from .serializers import (DepartmentSerializer, DoctorSerializer, PatientSerializer,
                          DoctorScheduleSerializer, DoctorLeaveSerializer)
from users.permissions import IsSuperAdmin, IsAdmin, IsDoctor, IsReceptionist, IsPatient

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsAdmin | IsSuperAdmin]
        return [permission() for permission in permission_classes]

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsDoctor | IsAdmin | IsSuperAdmin]
        else:
            permission_classes = [IsAdmin | IsSuperAdmin]
        return [permission() for permission in permission_classes]

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Patient.objects.none()
        if user.role in ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST']:
            return Patient.objects.all()
        # Patients can only see their own profile
        return Patient.objects.filter(user=user)

class DoctorScheduleViewSet(viewsets.ModelViewSet):
    queryset = DoctorSchedule.objects.all()
    serializer_class = DoctorScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DOCTOR':
            return DoctorSchedule.objects.filter(doctor__user=user)
        return DoctorSchedule.objects.all()

class DoctorLeaveViewSet(viewsets.ModelViewSet):
    queryset = DoctorLeave.objects.all()
    serializer_class = DoctorLeaveSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DOCTOR':
            return DoctorLeave.objects.filter(doctor__user=user)
        return DoctorLeave.objects.all()

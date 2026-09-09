import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Appointment, AppointmentStatusHistory
from .serializers import (AppointmentSerializer, AppointmentCreateSerializer,
                          AppointmentStatusHistorySerializer, AvailableSlotQuerySerializer)
from hospital.models import DoctorSchedule, DoctorLeave, Doctor
from users.permissions import IsSuperAdmin, IsAdmin, IsDoctor, IsReceptionist, IsPatient

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return Appointment.objects.filter(patient__user=user)
        elif user.role == 'DOCTOR':
            return Appointment.objects.filter(doctor__user=user)
        elif user.role in ['ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST']:
            return Appointment.objects.all()
        return Appointment.objects.none()

    def perform_create(self, serializer):
        appointment = serializer.save()
        AppointmentStatusHistory.objects.create(
            appointment=appointment,
            status=appointment.status,
            changed_by=self.request.user,
            notes="Appointment booked."
        )

    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """
        Dynamically calculate available slots based on DoctorSchedule, 
        DoctorLeave, and existing appointments.
        """
        serializer = AvailableSlotQuerySerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        doctor_id = serializer.validated_data['doctor_id']
        query_date = serializer.validated_data['date']

        # 1. Check if doctor is on leave
        leaves = DoctorLeave.objects.filter(
            doctor_id=doctor_id, 
            start_date__lte=query_date, 
            end_date__gte=query_date,
            is_approved=True
        )
        if leaves.exists():
            return Response([], status=status.HTTP_200_OK) # No slots if on leave

        # 2. Get schedule for the day of week (0=Monday, 6=Sunday)
        day_of_week = query_date.weekday()
        schedules = DoctorSchedule.objects.filter(
            doctor_id=doctor_id,
            day_of_week=day_of_week,
            is_active=True
        )

        # 3. Get existing bookings for that day
        existing_appointments = Appointment.objects.filter(
            doctor_id=doctor_id,
            appointment_date=query_date,
            status__in=[
                Appointment.StatusChoices.PENDING,
                Appointment.StatusChoices.CONFIRMED,
                Appointment.StatusChoices.CHECKED_IN
            ]
        ).values_list('start_time', flat=True)

        available_slots = []
        for schedule in schedules:
            current_time = datetime.datetime.combine(query_date, schedule.start_time)
            end_time = datetime.datetime.combine(query_date, schedule.end_time)
            slot_duration = datetime.timedelta(minutes=schedule.slot_duration)

            while current_time + slot_duration <= end_time:
                slot_time = current_time.time()
                # If slot is not already booked, and is in the future (if today)
                is_future = True
                if query_date == timezone.now().date():
                    if slot_time <= timezone.now().time():
                        is_future = False

                if slot_time not in existing_appointments and is_future:
                    available_slots.append({
                        "start_time": slot_time.strftime("%H:%M:%S"),
                        "end_time": (current_time + slot_duration).time().strftime("%H:%M:%S")
                    })
                
                current_time += slot_duration

        return Response(available_slots, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        
        # Check permissions for cancellation
        user = request.user
        if user.role == 'PATIENT' and appointment.patient.user != user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        if appointment.status in [Appointment.StatusChoices.COMPLETED, Appointment.StatusChoices.CANCELLED]:
            return Response({"error": f"Cannot cancel an appointment that is {appointment.status}"}, status=status.HTTP_400_BAD_REQUEST)

        appointment.status = Appointment.StatusChoices.CANCELLED
        appointment.cancelled_by = user
        appointment.cancelled_at = timezone.now()
        appointment.cancellation_reason = request.data.get('reason', '')
        appointment.save()

        AppointmentStatusHistory.objects.create(
            appointment=appointment,
            status=appointment.status,
            changed_by=user,
            notes=appointment.cancellation_reason
        )

        return Response({"status": "Cancelled successfully"})

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        appointment = self.get_object()
        user = request.user
        if user.role not in ['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN']:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        if appointment.status != Appointment.StatusChoices.CONFIRMED and appointment.status != Appointment.StatusChoices.PENDING:
            return Response({"error": "Can only check in pending or confirmed appointments."}, status=status.HTTP_400_BAD_REQUEST)

        appointment.status = Appointment.StatusChoices.CHECKED_IN
        appointment.save()

        AppointmentStatusHistory.objects.create(
            appointment=appointment,
            status=appointment.status,
            changed_by=user,
            notes="Patient checked in."
        )

        return Response({"status": "Checked in successfully"})

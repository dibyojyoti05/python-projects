from rest_framework import serializers
from .models import Appointment, AppointmentStatusHistory
from hospital.serializers import DoctorSerializer, PatientSerializer

class AppointmentStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentStatusHistory
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_details = DoctorSerializer(source='doctor', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)
    status_history = AppointmentStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('status', 'cancellation_reason', 'cancelled_by', 'cancelled_at')

class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ('id', 'doctor', 'patient', 'appointment_date', 'start_time', 'end_time', 'reason')
        read_only_fields = ('id',)

    def validate(self, data):
        # Double booking check - database unique_together constraint also catches this
        # but doing it here provides a cleaner API error
        if Appointment.objects.filter(
            doctor=data['doctor'],
            appointment_date=data['appointment_date'],
            start_time=data['start_time'],
            status__in=[Appointment.StatusChoices.PENDING, Appointment.StatusChoices.CONFIRMED, Appointment.StatusChoices.CHECKED_IN]
        ).exists():
            raise serializers.ValidationError({"start_time": "This slot is already booked."})
        return data

class AvailableSlotQuerySerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField(required=True)
    date = serializers.DateField(required=True)

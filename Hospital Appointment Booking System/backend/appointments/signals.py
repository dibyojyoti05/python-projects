from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Appointment
from notifications.models import Notification

@receiver(post_save, sender=Appointment)
def create_appointment_notification(sender, instance, created, **kwargs):
    if created:
        msg_patient = f"Hello {instance.patient.user.first_name},\n\nYour appointment with Dr. {instance.doctor.user.first_name} {instance.doctor.user.last_name} has been booked for {instance.appointment_date} at {instance.start_time}.\n\nThank you,\nMedPro Health Center"
        
        # Notify Patient (In-App)
        Notification.objects.create(
            user=instance.patient.user,
            title="Appointment Booked",
            message=f"Your appointment with Dr. {instance.doctor.user.first_name} {instance.doctor.user.last_name} is scheduled for {instance.appointment_date} at {instance.start_time}.",
            notification_type=Notification.NotificationType.SUCCESS
        )

        # Notify Patient (Email)
        if instance.patient.user.email:
            send_mail(
                subject="Appointment Confirmation - MedPro",
                message=msg_patient,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.patient.user.email],
                fail_silently=True
            )

        # Notify Doctor (In-App)
        Notification.objects.create(
            user=instance.doctor.user,
            title="New Appointment",
            message=f"New appointment booked by {instance.patient} for {instance.appointment_date} at {instance.start_time}.",
            notification_type=Notification.NotificationType.INFO
        )
    elif instance.status == Appointment.StatusChoices.CANCELLED:
        msg_cancel = f"Hello {instance.patient.user.first_name},\n\nYour appointment with Dr. {instance.doctor.user.first_name} {instance.doctor.user.last_name} on {instance.appointment_date} has been cancelled.\nReason: {instance.cancellation_reason or 'None provided'}\n\nMedPro Health Center"

        Notification.objects.create(
            user=instance.patient.user,
            title="Appointment Cancelled",
            message=f"Your appointment with Dr. {instance.doctor.user.first_name} {instance.doctor.user.last_name} on {instance.appointment_date} has been cancelled.",
            notification_type=Notification.NotificationType.WARNING
        )

        if instance.patient.user.email:
            send_mail(
                subject="Appointment Cancelled - MedPro",
                message=msg_cancel,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.patient.user.email],
                fail_silently=True
            )

        Notification.objects.create(
            user=instance.doctor.user,
            title="Appointment Cancelled",
            message=f"Appointment with {instance.patient} on {instance.appointment_date} has been cancelled.",
            notification_type=Notification.NotificationType.WARNING
        )


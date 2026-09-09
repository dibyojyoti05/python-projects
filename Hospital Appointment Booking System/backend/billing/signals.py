from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Invoice, Payment
from notifications.models import Notification

@receiver(post_save, sender=Invoice)
def create_invoice_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.patient.user,
            title="New Invoice",
            message=f"A new invoice {instance.invoice_number} has been generated for amount {instance.total_amount}.",
            notification_type=Notification.NotificationType.INFO
        )

@receiver(post_save, sender=Payment)
def create_payment_notification(sender, instance, created, **kwargs):
    if created and instance.status == Payment.StatusChoices.SUCCESS:
        Notification.objects.create(
            user=instance.invoice.patient.user,
            title="Payment Successful",
            message=f"Your payment of {instance.amount} for invoice {instance.invoice.invoice_number} was successful.",
            notification_type=Notification.NotificationType.SUCCESS
        )

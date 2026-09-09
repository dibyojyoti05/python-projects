from celery import Celery
import os
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.task_routes = {
    "app.worker.send_test_email": "main-queue",
    "app.worker.process_overdue_fines": "main-queue"
}

@celery_app.task
def send_test_email(email_to: str):
    # Integration with email sending service
    print(f"Sending test email to {email_to}")
    return True

@celery_app.task
def process_overdue_fines():
    # Job to check overdue books and apply daily fine
    print("Processing overdue fines...")
    return True

from rest_framework import serializers
from .models import Invoice, InvoiceItem, Payment
from hospital.serializers import PatientSerializer

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = '__all__'
        read_only_fields = ('amount',)

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('total_amount', 'amount_paid', 'status')

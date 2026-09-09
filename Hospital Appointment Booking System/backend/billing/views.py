from rest_framework import viewsets, permissions
from .models import Invoice, InvoiceItem, Payment
from .serializers import InvoiceSerializer, InvoiceItemSerializer, PaymentSerializer
from users.permissions import IsSuperAdmin, IsAdmin, IsReceptionist, IsPatient

import io
from django.http import HttpResponse
from rest_framework.decorators import action
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return Invoice.objects.filter(patient__user=user)
        elif user.role in ['ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST']:
            return Invoice.objects.all()
        return Invoice.objects.none()

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        invoice = self.get_object()

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        styles = getSampleStyleSheet()
        elements = []

        # Header Title
        title_style = ParagraphStyle(
            'HospitalTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#1e40af"),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'HospitalSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=15
        )

        elements.append(Paragraph("MedPro Health Center", title_style))
        elements.append(Paragraph("123 Healthcare Blvd, Medical City | Tel: (555) 019-9000 | billing@medpro.com", subtitle_style))
        elements.append(Spacer(1, 10))

        # Invoice Metadata Table
        patient_name = f"{invoice.patient.user.first_name} {invoice.patient.user.last_name}" if invoice.patient else "N/A"
        doctor_name = f"Dr. {invoice.appointment.doctor.user.first_name} {invoice.appointment.doctor.user.last_name}" if (invoice.appointment and invoice.appointment.doctor) else "Hospital Care"

        meta_data = [
            [
                Paragraph(f"<b>Invoice #:</b> {invoice.invoice_number}<br/><b>Date:</b> {invoice.date}<br/><b>Due Date:</b> {invoice.due_date}", styles['Normal']),
                Paragraph(f"<b>Billed To:</b> {patient_name}<br/><b>Doctor:</b> {doctor_name}<br/><b>Status:</b> <b>{invoice.status}</b>", styles['Normal'])
            ]
        ]
        meta_table = Table(meta_data, colWidths=[260, 260])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 20))

        # Line Items Table
        items_data = [
            ["#", "Description", "Qty", "Unit Price ($)", "Amount ($)"]
        ]
        items = list(invoice.items.all())
        subtotal = 0
        if items:
            for idx, item in enumerate(items, 1):
                items_data.append([
                    str(idx),
                    item.description,
                    str(item.quantity),
                    f"{item.unit_price:.2f}",
                    f"{item.amount:.2f}"
                ])
                subtotal += float(item.amount)
        else:
            items_data.append(["1", "Medical Consultation Fee", "1", f"{float(invoice.total_amount):.2f}", f"{float(invoice.total_amount):.2f}"])
            subtotal = float(invoice.total_amount)

        tax_amt = subtotal * (float(invoice.tax_rate) / 100.0)
        discount_amt = float(invoice.discount)
        total_amt = float(invoice.total_amount)
        paid_amt = float(invoice.amount_paid)
        balance_due = max(0.0, total_amt - paid_amt)

        # Summary rows
        items_data.append(["", "", "", "Subtotal:", f"${subtotal:.2f}"])
        if invoice.tax_rate > 0:
            items_data.append(["", "", "", f"Tax ({invoice.tax_rate}%):", f"${tax_amt:.2f}"])
        if invoice.discount > 0:
            items_data.append(["", "", "", "Discount:", f"-${discount_amt:.2f}"])
        items_data.append(["", "", "", "Total Due:", f"${total_amt:.2f}"])
        items_data.append(["", "", "", "Amount Paid:", f"${paid_amt:.2f}"])
        items_data.append(["", "", "", "Balance Due:", f"${balance_due:.2f}"])

        items_table = Table(items_data, colWidths=[30, 260, 45, 95, 90])
        table_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e40af")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, len(items)), 0.5, colors.HexColor("#cbd5e1")),
            ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (3, len(items) + 1), (-1, -1), 'Helvetica-Bold'),
            ('BACKGROUND', (3, len(items) + 1), (-1, -1), colors.HexColor("#f1f5f9")),
        ]
        items_table.setStyle(TableStyle(table_style))
        elements.append(items_table)
        elements.append(Spacer(1, 30))

        # Footer Note
        note = Paragraph("<i>Thank you for choosing MedPro Health Center. For any billing questions, please reach out to billing@medpro.com within 30 days.</i>", styles['Normal'])
        elements.append(note)

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
        return response

class InvoiceItemViewSet(viewsets.ModelViewSet):
    queryset = InvoiceItem.objects.all()
    serializer_class = InvoiceItemSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [IsAdmin | IsSuperAdmin | IsReceptionist]
        return [permission() for permission in permission_classes]

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return Payment.objects.filter(invoice__patient__user=user)
        elif user.role in ['ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST']:
            return Payment.objects.all()
        return Payment.objects.none()

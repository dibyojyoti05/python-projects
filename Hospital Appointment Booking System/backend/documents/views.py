from rest_framework import viewsets, permissions
from .models import Document
from .serializers import DocumentSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return Document.objects.filter(patient__user=user)
        elif user.role == 'DOCTOR':
            return Document.objects.filter(uploaded_by=user) | Document.objects.filter(patient__medical_records__doctor__user=user).distinct()
        elif user.role in ['ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST']:
            return Document.objects.all()
        return Document.objects.none()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

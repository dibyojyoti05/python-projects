from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, DoctorViewSet, PatientViewSet, DoctorScheduleViewSet, DoctorLeaveViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'schedules', DoctorScheduleViewSet, basename='schedule')
router.register(r'doctor-schedules', DoctorScheduleViewSet, basename='doctor-schedule')
router.register(r'leaves', DoctorLeaveViewSet, basename='leave')

urlpatterns = [
    path('', include(router.urls)),
]

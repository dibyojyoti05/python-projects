'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Calendar as CalendarIcon, Clock, User, Search, XCircle, CheckCircle, AlertCircle } from 'lucide-react';

export default function AppointmentsPage() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Cancellation modal state
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/appointments/');
            setAppointments(res.data);
        } catch (err) {
            console.error('Error fetching appointments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleCancel = async () => {
        if (!cancellingId) return;
        setActionLoading(true);
        try {
            await api.post(`/appointments/${cancellingId}/cancel/`, { reason: cancelReason });
            setCancellingId(null);
            setCancelReason('');
            fetchAppointments();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to cancel appointment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckIn = async (id: number) => {
        setActionLoading(true);
        try {
            await api.post(`/appointments/${id}/check_in/`);
            fetchAppointments();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to check in patient');
        } finally {
            setActionLoading(false);
        }
    };

    const filtered = appointments.filter((appt) => {
        // Status filter
        if (filterStatus === 'UPCOMING' && !['PENDING', 'CONFIRMED'].includes(appt.status)) return false;
        if (filterStatus === 'CHECKED_IN' && appt.status !== 'CHECKED_IN') return false;
        if (filterStatus === 'COMPLETED' && appt.status !== 'COMPLETED') return false;
        if (filterStatus === 'CANCELLED' && appt.status !== 'CANCELLED') return false;

        // Search query
        if (searchQuery) {
            const docName = `${appt.doctor_details?.user?.first_name || ''} ${appt.doctor_details?.user?.last_name || ''}`.toLowerCase();
            const patName = `${appt.patient_details?.user?.first_name || ''} ${appt.patient_details?.user?.last_name || ''}`.toLowerCase();
            const q = searchQuery.toLowerCase();
            if (!docName.includes(q) && !patName.includes(q) && !appt.reason?.toLowerCase().includes(q)) {
                return false;
            }
        }
        return true;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
            case 'COMPLETED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'CHECKED_IN':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Appointments</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage scheduled consultations and patient appointments</p>
                </div>
                {(user?.role === 'PATIENT' || user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') && (
                    <Link
                        href="/dashboard/patient/book"
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                    >
                        Book Appointment
                    </Link>
                )}
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {['ALL', 'UPCOMING', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilterStatus(tab)}
                            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                                filterStatus === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search doctor, patient, reason..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
                    Loading appointments...
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
                    No appointments found matching your criteria.
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-200">
                        {filtered.map((appt) => (
                            <div key={appt.id} className="p-5 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(appt.status)}`}>
                                            {appt.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-xs text-gray-400">ID #{appt.id}</span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                                        <div className="flex items-center gap-1.5 font-medium text-gray-900">
                                            <User className="h-4 w-4 text-blue-500" />
                                            {user?.role === 'PATIENT' ? (
                                                <span>Dr. {appt.doctor_details?.user?.first_name} {appt.doctor_details?.user?.last_name} ({appt.doctor_details?.specialization})</span>
                                            ) : (
                                                <span>Patient: {appt.patient_details?.user?.first_name} {appt.patient_details?.user?.last_name}</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                                            <span>{appt.appointment_date}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            <span>{appt.start_time.substring(0, 5)} - {appt.end_time.substring(0, 5)}</span>
                                        </div>
                                    </div>

                                    {appt.reason && (
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium text-gray-700">Reason: </span>
                                            {appt.reason}
                                        </p>
                                    )}

                                    {appt.cancellation_reason && (
                                        <p className="text-xs text-red-600 italic">
                                            Cancellation Reason: {appt.cancellation_reason}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 self-end md:self-center">
                                    {/* Doctor action: Start Consultation */}
                                    {user?.role === 'DOCTOR' && appt.status !== 'CANCELLED' && (
                                        <Link
                                            href={`/dashboard/records?patient_id=${appt.patient_details?.id}&appointment_id=${appt.id}`}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                                        >
                                            Consultation & Notes
                                        </Link>
                                    )}

                                    {/* Receptionist action: Check In */}
                                    {(user?.role === 'RECEPTIONIST' || user?.role === 'ADMIN') && (appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                                        <button
                                            onClick={() => handleCheckIn(appt.id)}
                                            disabled={actionLoading}
                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                                        >
                                            Check In
                                        </button>
                                    )}

                                    {/* Patient or Admin action: Cancel */}
                                    {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                                        <button
                                            onClick={() => { setCancellingId(appt.id); setCancelReason(''); }}
                                            className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {cancellingId && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-6 w-6" />
                            <h3 className="text-lg font-bold text-gray-900">Cancel Appointment</h3>
                        </div>
                        <p className="text-sm text-gray-500">
                            Are you sure you want to cancel this appointment? Please state the reason below:
                        </p>
                        <textarea
                            rows={3}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Reason for cancellation..."
                            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setCancellingId(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
                            >
                                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

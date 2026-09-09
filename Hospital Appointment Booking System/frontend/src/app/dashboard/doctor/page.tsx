'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Calendar as CalendarIcon, Clock, Users, Activity } from 'lucide-react';
import Link from 'next/link';

export default function DoctorDashboard() {
    const [stats, setStats] = useState({ today: 0, totalPatients: 0, pending: 0 });
    const [todayAppointments, setTodayAppointments] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const appointmentsRes = await api.get('/appointments/');
                const appointments = appointmentsRes.data;
                const today = new Date().toISOString().split('T')[0];
                
                const todays = appointments.filter((a: any) => a.appointment_date === today);
                const pending = appointments.filter((a: any) => a.status === 'PENDING').length;
                
                // Estimate unique patients
                const patients = new Set(appointments.map((a: any) => a.patient)).size;
                
                setStats({ today: todays.length, totalPatients: patients, pending });
                setTodayAppointments(todays.slice(0, 5));
            } catch (error) {
                console.error("Error fetching doctor dashboard data", error);
            }
        };
        fetchDashboardData();
    }, []);

    return (
        <div>
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Doctor Dashboard
                    </h2>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                                <CalendarIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Appointments</dt>
                                    <dd className="text-3xl font-bold text-gray-900">{stats.today}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                                <Users className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Patients</dt>
                                    <dd className="text-3xl font-bold text-gray-900">{stats.totalPatients}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                                <Activity className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Approvals</dt>
                                    <dd className="text-3xl font-bold text-gray-900">{stats.pending}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white shadow rounded-lg border border-gray-100">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Today's Schedule</h3>
                    <Link href="/dashboard/appointments" className="text-sm text-blue-600 hover:text-blue-500 font-medium">View Calendar</Link>
                </div>
                <div className="divide-y divide-gray-200">
                    {todayAppointments.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">No appointments scheduled for today.</div>
                    ) : (
                        todayAppointments.map((appointment) => (
                            <div key={appointment.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {appointment.patient_details?.user?.first_name?.[0]}{appointment.patient_details?.user?.last_name?.[0]}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">
                                            {appointment.patient_details?.user?.first_name} {appointment.patient_details?.user?.last_name}
                                        </span>
                                        <span className="text-xs text-gray-500">Reason: {appointment.reason || 'Not specified'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center text-sm text-gray-900 font-medium bg-gray-100 px-3 py-1 rounded-md">
                                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                        {appointment.start_time}
                                    </div>
                                    <Link
                                        href={`/dashboard/records?patient_id=${appointment.patient}&appointment_id=${appointment.id}`}
                                        className="text-sm text-blue-600 hover:text-blue-900 border border-blue-200 rounded px-3 py-1 hover:bg-blue-50 transition-colors"
                                    >
                                        Start Consultation
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

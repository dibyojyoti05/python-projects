'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Calendar as CalendarIcon, Clock, Activity, FileText } from 'lucide-react';
import Link from 'next/link';

export default function PatientDashboard() {
    const [stats, setStats] = useState({ upcoming: 0, completed: 0, reports: 0 });
    const [recentAppointments, setRecentAppointments] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const appointmentsRes = await api.get('/appointments/');
                const appointments = appointmentsRes.data;
                const upcoming = appointments.filter((a: any) => a.status === 'PENDING' || a.status === 'CONFIRMED').length;
                const completed = appointments.filter((a: any) => a.status === 'COMPLETED').length;
                setStats({ upcoming, completed, reports: 0 }); // Placeholder for reports
                setRecentAppointments(appointments.slice(0, 5));
            } catch (error) {
                console.error("Error fetching patient dashboard data", error);
            }
        };
        fetchDashboardData();
    }, []);

    return (
        <div>
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Patient Dashboard
                    </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link href="/dashboard/appointments/book" className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                        Book Appointment
                    </Link>
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
                                    <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Appointments</dt>
                                    <dd className="text-3xl font-bold text-gray-900">{stats.upcoming}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                                <Activity className="h-6 w-6 text-green-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Completed Consultations</dt>
                                    <dd className="text-3xl font-bold text-gray-900">{stats.completed}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                                <FileText className="h-6 w-6 text-purple-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Medical Reports</dt>
                                    <dd className="text-3xl font-bold text-gray-900">{stats.reports}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Appointments */}
            <div className="bg-white shadow rounded-lg border border-gray-100">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Appointments</h3>
                    <Link href="/dashboard/appointments" className="text-sm text-blue-600 hover:text-blue-500 font-medium">View all</Link>
                </div>
                <div className="divide-y divide-gray-200">
                    {recentAppointments.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">No recent appointments found.</div>
                    ) : (
                        recentAppointments.map((appointment) => (
                            <div key={appointment.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">
                                        Dr. {appointment.doctor_details?.user?.first_name} {appointment.doctor_details?.user?.last_name}
                                    </span>
                                    <span className="text-sm text-gray-500">{appointment.doctor_details?.specialization}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex flex-col items-end text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                                            {appointment.appointment_date}
                                        </div>
                                        <div className="flex items-center mt-1">
                                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                            {appointment.start_time}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                        appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {appointment.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

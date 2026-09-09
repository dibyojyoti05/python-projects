'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Calendar as CalendarIcon, Clock, Users, Activity, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ReceptionistDashboard() {
    const [stats, setStats] = useState({ today: 0, checkedIn: 0, pending: 0 });
    const [todayAppointments, setTodayAppointments] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const appointmentsRes = await api.get('/appointments/');
                const appointments = appointmentsRes.data;
                const today = new Date().toISOString().split('T')[0];
                
                const todays = appointments.filter((a: any) => a.appointment_date === today);
                const pending = todays.filter((a: any) => a.status === 'PENDING' || a.status === 'CONFIRMED').length;
                const checkedIn = todays.filter((a: any) => a.status === 'CHECKED_IN').length;
                
                setStats({ today: todays.length, checkedIn, pending });
                setTodayAppointments(todays.slice(0, 5));
            } catch (error) {
                console.error("Error fetching receptionist dashboard data", error);
            }
        };
        fetchDashboardData();
    }, []);

    const handleCheckIn = async (id: number) => {
        try {
            await api.post(`/appointments/${id}/check_in/`);
            setTodayAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CHECKED_IN' } : a));
            setStats(s => ({ ...s, checkedIn: s.checkedIn + 1, pending: s.pending - 1 }));
        } catch (error) {
            alert("Check-in failed");
        }
    };

    return (
        <div>
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Reception Desk Overview
                    </h2>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                                <CalendarIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Appointments Today</dt>
                                    <dd className="text-3xl font-bold text-gray-900">{stats.today}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                                <Activity className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Awaiting Check-in</dt>
                                    <dd className="text-3xl font-bold text-gray-900">{stats.pending}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                                <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Checked In</dt>
                                    <dd className="text-3xl font-bold text-gray-900">{stats.checkedIn}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white shadow rounded-lg border border-gray-100">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Today's Appointments</h3>
                    <Link href="/dashboard/appointments" className="text-sm text-blue-600 hover:text-blue-500 font-medium">View All</Link>
                </div>
                <div className="divide-y divide-gray-200">
                    {todayAppointments.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">No appointments scheduled for today.</div>
                    ) : (
                        todayAppointments.map((appointment) => (
                            <div key={appointment.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">
                                            Patient: {appointment.patient_details?.user?.first_name} {appointment.patient_details?.user?.last_name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Doctor: Dr. {appointment.doctor_details?.user?.first_name} {appointment.doctor_details?.user?.last_name}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center text-sm text-gray-900 font-medium bg-gray-100 px-3 py-1 rounded-md">
                                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                        {appointment.start_time}
                                    </div>
                                    {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') ? (
                                        <button 
                                            onClick={() => handleCheckIn(appointment.id)}
                                            className="text-sm text-white bg-green-600 hover:bg-green-700 rounded px-3 py-1 transition-colors"
                                        >
                                            Check In
                                        </button>
                                    ) : (
                                        <span className="text-sm font-medium text-gray-500 px-3 py-1">
                                            {appointment.status.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

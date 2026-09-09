'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Calendar as CalendarIcon, Users, DollarSign, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ 
        totalDoctors: 0, 
        totalPatients: 0, 
        totalAppointments: 0,
        revenue: 0
    });
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch stats concurrently
                const [docsRes, patsRes, apptsRes, invRes] = await Promise.all([
                    api.get('/doctors/'),
                    api.get('/patients/'),
                    api.get('/appointments/'),
                    api.get('/invoices/')
                ]);
                
                const revenue = invRes.data
                    .filter((inv: any) => inv.status === 'PAID')
                    .reduce((sum: number, inv: any) => sum + parseFloat(inv.total_amount), 0);
                    
                setStats({ 
                    totalDoctors: docsRes.data.length, 
                    totalPatients: patsRes.data.length, 
                    totalAppointments: apptsRes.data.length,
                    revenue
                });
            } catch (error) {
                console.error("Error fetching admin dashboard data", error);
            }
        };
        fetchDashboardData();
    }, []);

    return (
        <div>
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Admin Overview
                    </h2>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                                <Users className="h-6 w-6 text-blue-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Doctors</dt>
                                    <dd className="text-2xl font-bold text-gray-900">{stats.totalDoctors}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                                <Activity className="h-6 w-6 text-green-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Patients</dt>
                                    <dd className="text-2xl font-bold text-gray-900">{stats.totalPatients}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                                <CalendarIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Appointments</dt>
                                    <dd className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                                <DollarSign className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                                    <dd className="text-2xl font-bold text-gray-900">${stats.revenue.toFixed(2)}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="bg-white shadow rounded-lg border border-gray-100 p-6 flex flex-col justify-center items-center h-64 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Manage System Settings</h3>
                    <p className="text-gray-500 mb-4">Configure hospital departments, user roles, and system parameters.</p>
                    <Link href="/dashboard/settings" className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
                        Go to Settings
                    </Link>
                </div>
                <div className="bg-white shadow rounded-lg border border-gray-100 p-6 flex flex-col justify-center items-center h-64 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Audit Logs</h3>
                    <p className="text-gray-500 mb-4">View system access logs and monitor activity to ensure compliance.</p>
                    <Link href="/dashboard/settings#audit-logs" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50">
                        View Logs
                    </Link>
                </div>
            </div>
        </div>
    );
}

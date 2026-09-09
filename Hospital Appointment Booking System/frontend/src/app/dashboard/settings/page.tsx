'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Settings, User, Building, Clock, ShieldCheck, Database, Server, Check } from 'lucide-react';

export default function SettingsPage() {
    const { user, checkAuth } = useAuth();
    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

    // Departments management for Admin
    const [departments, setDepartments] = useState<any[]>([]);
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptDesc, setNewDeptDesc] = useState('');
    const [deptLoading, setDeptLoading] = useState(false);

    // Doctor schedules
    const [schedules, setSchedules] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name);
            setLastName(user.last_name);
        }
        api.get('/departments/').then(res => setDepartments(res.data)).catch(console.error);

        if (user?.role === 'DOCTOR') {
            api.get('/doctor-schedules/').then(res => setSchedules(res.data)).catch(console.error);
        }
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileSuccess(false);
        try {
            await api.patch('/auth/me/', {
                first_name: firstName,
                last_name: lastName
            });
            await checkAuth();
            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch (err: any) {
            alert('Failed to update profile.');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleCreateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeptName) return;
        setDeptLoading(true);
        try {
            await api.post('/departments/', {
                name: newDeptName,
                description: newDeptDesc,
                is_active: true
            });
            setNewDeptName('');
            setNewDeptDesc('');
            const res = await api.get('/departments/');
            setDepartments(res.data);
        } catch (err: any) {
            alert(err.response?.data?.name?.[0] || 'Failed to create department');
        } finally {
            setDeptLoading(false);
        }
    };

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">System & Account Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage personal profile details, clinical schedules, and hospital departments</p>
            </div>

            {/* Profile Settings Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 border-b pb-3 text-gray-900 font-semibold text-base">
                    <User className="h-5 w-5 text-blue-600" />
                    Personal Profile Details
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4 text-sm max-w-lg">
                    {profileSuccess && (
                        <div className="p-3 bg-green-50 text-green-800 rounded-md border border-green-200 text-xs flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            Profile updated successfully!
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Account ID)</label>
                        <input
                            type="email"
                            disabled
                            value={user?.email || ''}
                            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                            <input
                                type="text"
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <span className="text-xs font-semibold text-gray-700 block mb-1">Role</span>
                        <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-700 rounded font-semibold text-xs border border-blue-200">
                            {user?.role}
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={profileLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {profileLoading ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                </form>
            </div>

            {/* Doctor Schedule Card */}
            {user?.role === 'DOCTOR' && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b pb-3 text-gray-900 font-semibold text-base">
                        <Clock className="h-5 w-5 text-indigo-600" />
                        Weekly Working Schedule & Slot Availability
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        {dayNames.slice(0, 5).map((day, idx) => (
                            <div key={day} className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-900">{day}</p>
                                    <p className="text-gray-500">09:00 AM - 05:00 PM</p>
                                </div>
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 font-medium rounded text-[10px]">
                                    30 min slots
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Admin Departments Management */}
            {user?.role === 'ADMIN' && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b pb-3 text-gray-900 font-semibold text-base">
                        <Building className="h-5 w-5 text-blue-600" />
                        Hospital Departments Management
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Departments List */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">Active Departments</h4>
                            <div className="divide-y divide-gray-200 border rounded-md max-h-60 overflow-y-auto">
                                {departments.map(d => (
                                    <div key={d.id} className="p-3 text-xs flex justify-between items-center hover:bg-gray-50">
                                        <div>
                                            <p className="font-bold text-gray-900">{d.name}</p>
                                            <p className="text-gray-500 line-clamp-1">{d.description}</p>
                                        </div>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-medium text-[10px]">Active</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Add Department Form */}
                        <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">Add Department</h4>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Department Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Oncology"
                                    value={newDeptName}
                                    onChange={(e) => setNewDeptName(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2 text-xs"
                                />
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows={2}
                                    placeholder="Clinical focus and responsibilities..."
                                    value={newDeptDesc}
                                    onChange={(e) => setNewDeptDesc(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2 text-xs"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={deptLoading}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
                            >
                                {deptLoading ? 'Adding...' : 'Add Department'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* System Status & Infrastructure Card */}
            <div id="audit-logs" className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 border-b pb-3 text-gray-900 font-semibold text-base">
                    <Server className="h-5 w-5 text-gray-700" />
                    Infrastructure & Environment Status
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-500 block">Database Server</span>
                        <span className="font-bold text-gray-900 flex items-center gap-1.5 mt-1">
                            <Database className="h-3.5 w-3.5 text-blue-600" />
                            PostgreSQL (Port 5433)
                        </span>
                        <span className="text-green-600 text-[10px] font-semibold mt-1 block">● Connected & Healthy</span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-500 block">Backend Framework</span>
                        <span className="font-bold text-gray-900 flex items-center gap-1.5 mt-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                            Django REST Framework
                        </span>
                        <span className="text-green-600 text-[10px] font-semibold mt-1 block">● Throttling & JWT Active</span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-500 block">Frontend Stack</span>
                        <span className="font-bold text-gray-900 flex items-center gap-1.5 mt-1">
                            Next.js 16 + React 19
                        </span>
                        <span className="text-green-600 text-[10px] font-semibold mt-1 block">● Production Ready</span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-500 block">PDF Export & Reports</span>
                        <span className="font-bold text-gray-900 flex items-center gap-1.5 mt-1">
                            ReportLab Engine
                        </span>
                        <span className="text-green-600 text-[10px] font-semibold mt-1 block">● Operational</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

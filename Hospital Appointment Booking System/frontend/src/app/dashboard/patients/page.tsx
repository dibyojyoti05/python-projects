'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Users, Search, Phone, Mail, Droplets, Calendar, FileText, ArrowRight } from 'lucide-react';

export default function PatientsPage() {
    const { user } = useAuth();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/patients/');
            setPatients(res.data);
        } catch (err) {
            console.error('Failed to fetch patients', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const filtered = patients.filter((pat) => {
        const name = `${pat.user?.first_name || ''} ${pat.user?.last_name || ''}`.toLowerCase();
        const email = (pat.user?.email || '').toLowerCase();
        const contact = (pat.contact_number || '').toLowerCase();
        const blood = (pat.blood_group || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        return name.includes(q) || email.includes(q) || contact.includes(q) || blood.includes(q);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Patient Directory</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and access patient health records and demographics</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone, blood group..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Patients List */}
            {loading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
                    Loading patients...
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
                    No patients found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((pat) => (
                        <div key={pat.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-11 w-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base">
                                            {pat.user?.first_name?.[0]}{pat.user?.last_name?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-base">
                                                {pat.user?.first_name} {pat.user?.last_name}
                                            </h3>
                                            <span className="text-xs text-gray-400">Patient ID #{pat.id}</span>
                                        </div>
                                    </div>
                                    {pat.blood_group && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                            <Droplets className="h-3 w-3 mr-1" />
                                            {pat.blood_group}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                                        <span>{pat.user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                                        <span>{pat.contact_number || 'No contact number'}</span>
                                    </div>
                                    {pat.date_of_birth && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                            <span>DOB: {pat.date_of_birth}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={() => setSelectedPatient(pat)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    View Profile
                                </button>

                                <Link
                                    href={`/dashboard/records?patient_id=${pat.id}`}
                                    className="inline-flex items-center text-xs font-medium text-gray-700 hover:text-blue-600 gap-1"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    Clinical Records
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Patient Detail Modal */}
            {selectedPatient && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900">
                                Patient Details: {selectedPatient.user?.first_name} {selectedPatient.user?.last_name}
                            </h3>
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 block text-xs">Email</span>
                                <span className="font-medium text-gray-900">{selectedPatient.user?.email}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">Contact</span>
                                <span className="font-medium text-gray-900">{selectedPatient.contact_number || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">Date of Birth</span>
                                <span className="font-medium text-gray-900">{selectedPatient.date_of_birth || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">Gender</span>
                                <span className="font-medium text-gray-900">{selectedPatient.gender === 'M' ? 'Male' : selectedPatient.gender === 'F' ? 'Female' : 'Other'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">Blood Group</span>
                                <span className="font-medium text-red-600 font-bold">{selectedPatient.blood_group || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">Emergency Contact</span>
                                <span className="font-medium text-gray-900">
                                    {selectedPatient.emergency_contact_name || 'N/A'} ({selectedPatient.emergency_contact_number || 'N/A'})
                                </span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-gray-500 block text-xs">Address</span>
                                <span className="font-medium text-gray-900">{selectedPatient.address || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t">
                            <Link
                                href={`/dashboard/records?patient_id=${selectedPatient.id}`}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                            >
                                Open Records
                            </Link>
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

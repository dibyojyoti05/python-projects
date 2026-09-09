'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useSearchParams } from 'next/navigation';
import { Activity, Plus, Pill, Calendar, User, Check, X } from 'lucide-react';

interface PrescriptionItemInput {
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

export default function RecordsPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const preselectedPatientId = searchParams.get('patient_id');
    const preselectedAppointmentId = searchParams.get('appointment_id');

    const [records, setRecords] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // New Record Form State
    const [formPatientId, setFormPatientId] = useState(preselectedPatientId || '');
    const [formAppointmentId, setFormAppointmentId] = useState(preselectedAppointmentId || '');
    const [symptoms, setSymptoms] = useState('');
    const [observations, setObservations] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [treatmentPlan, setTreatmentPlan] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<PrescriptionItemInput[]>([
        { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
    const [submitting, setSubmitting] = useState(false);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await api.get('/records/');
            setRecords(res.data);
        } catch (err) {
            console.error('Error fetching records', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
        if (user?.role === 'DOCTOR' || user?.role === 'ADMIN') {
            api.get('/patients/').then(res => setPatients(res.data)).catch(console.error);
        }
        if (preselectedPatientId || preselectedAppointmentId) {
            setShowCreateModal(true);
        }
    }, [user, preselectedPatientId, preselectedAppointmentId]);

    const handleAddItem = () => {
        setItems([...items, { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof PrescriptionItemInput, value: string) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmitRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Find doctor profile if logged in as doctor
            let doctorId = null;
            if (user?.role === 'DOCTOR') {
                const docs = await api.get('/doctors/');
                const meDoc = docs.data.find((d: any) => d.user?.id === user.id);
                if (meDoc) doctorId = meDoc.id;
            }

            // 1. Create Medical Record
            const recordPayload: any = {
                patient: parseInt(formPatientId),
                doctor: doctorId,
                symptoms,
                observations,
                diagnosis,
                treatment_plan: treatmentPlan,
                notes
            };
            if (formAppointmentId) {
                recordPayload.appointment = parseInt(formAppointmentId);
            }

            const recRes = await api.post('/records/', recordPayload);
            const createdRecord = recRes.data;

            // 2. If prescription items are filled, create Prescription and PrescriptionItems
            const validItems = items.filter(it => it.medicine_name.trim() !== '');
            if (validItems.length > 0) {
                const prescRes = await api.post('/prescriptions/', {
                    medical_record: createdRecord.id,
                    notes: 'Consultation prescription'
                });
                for (const it of validItems) {
                    await api.post('/prescription-items/', {
                        prescription: prescRes.data.id,
                        medicine_name: it.medicine_name,
                        dosage: it.dosage,
                        frequency: it.frequency,
                        duration: it.duration,
                        instructions: it.instructions
                    });
                }
            }

            // If an appointment was linked, mark it as COMPLETED
            if (formAppointmentId) {
                try {
                    await api.patch(`/appointments/${formAppointmentId}/`, { status: 'COMPLETED' });
                } catch (e) {
                    console.error('Could not mark appointment completed', e);
                }
            }

            setShowCreateModal(false);
            setSymptoms('');
            setObservations('');
            setDiagnosis('');
            setTreatmentPlan('');
            setNotes('');
            setItems([{ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
            fetchRecords();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to save medical record.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Clinical Records & Prescriptions</h1>
                    <p className="text-sm text-gray-500 mt-1">Medical history, doctor observations, diagnoses, and drug prescriptions</p>
                </div>
                {(user?.role === 'DOCTOR' || user?.role === 'ADMIN') && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors gap-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        Create Consultation Record
                    </button>
                )}
            </div>

            {/* Records List */}
            {loading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
                    Loading medical records...
                </div>
            ) : records.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
                    No medical records found.
                </div>
            ) : (
                <div className="space-y-4">
                    {records.map((rec) => (
                        <div key={rec.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">
                                            {rec.diagnosis || 'Clinical Consultation'}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span>Patient: <b>{rec.patient_details?.user?.first_name} {rec.patient_details?.user?.last_name}</b></span>
                                            <span>•</span>
                                            <span>Doctor: <b>Dr. {rec.doctor_details?.user?.first_name} {rec.doctor_details?.user?.last_name}</b></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {rec.symptoms && (
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Symptoms</span>
                                        <p className="text-gray-700">{rec.symptoms}</p>
                                    </div>
                                )}
                                {rec.observations && (
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Observations & Vitals</span>
                                        <p className="text-gray-700">{rec.observations}</p>
                                    </div>
                                )}
                                {rec.treatment_plan && (
                                    <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100 col-span-1 md:col-span-2">
                                        <span className="text-xs font-semibold text-blue-700 uppercase block mb-1">Treatment Plan</span>
                                        <p className="text-gray-800">{rec.treatment_plan}</p>
                                    </div>
                                )}
                            </div>

                            {/* Prescriptions Section */}
                            {rec.prescriptions && rec.prescriptions.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                                        <Pill className="h-4 w-4 text-indigo-600" />
                                        Prescribed Medications
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Medicine</th>
                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Dosage</th>
                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Frequency</th>
                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Duration</th>
                                                    <th className="px-3 py-2 text-left font-medium text-gray-500">Instructions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {rec.prescriptions.map((presc: any) =>
                                                    presc.items?.map((item: any) => (
                                                        <tr key={item.id} className="hover:bg-gray-50">
                                                            <td className="px-3 py-2 font-medium text-gray-900">{item.medicine_name}</td>
                                                            <td className="px-3 py-2 text-gray-600">{item.dosage}</td>
                                                            <td className="px-3 py-2 text-gray-600">{item.frequency}</td>
                                                            <td className="px-3 py-2 text-gray-600">{item.duration}</td>
                                                            <td className="px-3 py-2 text-gray-500 italic">{item.instructions || 'As directed'}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Record Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900">New Clinical Consultation & Prescription</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleSubmitRecord} className="space-y-4 text-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Patient *</label>
                                    <select
                                        required
                                        value={formPatientId}
                                        onChange={(e) => setFormPatientId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Select a patient</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.user?.first_name} {p.user?.last_name} ({p.user?.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Linked Appointment ID (Optional)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 2"
                                        value={formAppointmentId}
                                        onChange={(e) => setFormAppointmentId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Symptoms Reported</label>
                                <textarea
                                    rows={2}
                                    placeholder="Patient complaints, duration, severity..."
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Observations & Vitals</label>
                                <textarea
                                    rows={2}
                                    placeholder="BP, Pulse, Temp, Physical examination findings..."
                                    value={observations}
                                    onChange={(e) => setObservations(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Diagnosis *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Acute Bronchitis, Hypertension Stage 1"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Treatment Plan & Recommendations</label>
                                <textarea
                                    rows={2}
                                    placeholder="Dietary changes, rest, follow-up timeline..."
                                    value={treatmentPlan}
                                    onChange={(e) => setTreatmentPlan(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Prescription Items */}
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
                                        <Pill className="h-4 w-4 text-indigo-600" />
                                        Prescriptions
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        + Add Medicine
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {items.map((it, idx) => (
                                        <div key={idx} className="p-3 bg-gray-50 rounded-md border border-gray-200 relative space-y-2">
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Medicine name"
                                                    value={it.medicine_name}
                                                    onChange={(e) => handleItemChange(idx, 'medicine_name', e.target.value)}
                                                    className="border border-gray-300 rounded p-1.5 text-xs col-span-2"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Dosage (500mg)"
                                                    value={it.dosage}
                                                    onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                                                    className="border border-gray-300 rounded p-1.5 text-xs"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Frequency (BID/TID)"
                                                    value={it.frequency}
                                                    onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                                                    className="border border-gray-300 rounded p-1.5 text-xs"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Duration (7 days)"
                                                    value={it.duration}
                                                    onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                                                    className="border border-gray-300 rounded p-1.5 text-xs"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Instructions (after meals)"
                                                    value={it.instructions}
                                                    onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                                                    className="border border-gray-300 rounded p-1.5 text-xs col-span-3"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                                >
                                    {submitting ? 'Saving Record...' : 'Save Consultation Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

export default function BookAppointmentPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    
    const [step, setStep] = useState(1);
    const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [reason, setReason] = useState('');
    
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchDeps = async () => {
            const res = await api.get('/departments/');
            setDepartments(res.data);
        };
        fetchDeps();
    }, []);

    useEffect(() => {
        if (selectedDepartment) {
            const fetchDocs = async () => {
                const res = await api.get('/doctors/');
                const deptDocs = res.data.filter((d: any) => d.department.id === selectedDepartment.id);
                setDoctors(deptDocs);
            };
            fetchDocs();
        }
    }, [selectedDepartment]);

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            const fetchSlots = async () => {
                try {
                    const res = await api.get(`/appointments/available_slots/?doctor_id=${selectedDoctor.id}&date=${selectedDate}`);
                    setAvailableSlots(res.data);
                } catch (err) {
                    console.error("Failed to fetch slots", err);
                    setAvailableSlots([]);
                }
            };
            fetchSlots();
        }
    }, [selectedDoctor, selectedDate]);

    const handleBooking = async () => {
        setLoading(true);
        try {
            // Need patient ID. Fetch profile.
            const userRes = await api.get('/auth/me/');
            const user = userRes.data;
            const patientRes = await api.get('/patients/');
            const patient = patientRes.data.find((p: any) => p.user.id === user.id);

            await api.post('/appointments/', {
                doctor: selectedDoctor.id,
                patient: patient.id,
                appointment_date: selectedDate,
                start_time: selectedSlot.start_time,
                end_time: selectedSlot.end_time,
                reason: reason
            });
            setStep(5); // Success step
        } catch (err: any) {
            alert(err.response?.data?.start_time || "Failed to book appointment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate mb-8">
                Book an Appointment
            </h2>

            {/* Stepper */}
            <nav aria-label="Progress" className="mb-12">
                <ol role="list" className="flex items-center">
                    {[1, 2, 3, 4].map((s, i) => (
                        <li key={s} className={`relative ${i !== 3 ? 'pr-8 sm:pr-20' : ''}`}>
                            <div className="flex items-center">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                    step > s ? 'bg-blue-600' : step === s ? 'border-2 border-blue-600' : 'border-2 border-gray-300'
                                }`}>
                                    {step > s ? (
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    ) : (
                                        <span className={step === s ? 'text-blue-600 font-medium' : 'text-gray-500'}>{s}</span>
                                    )}
                                </div>
                                {i !== 3 && (
                                    <div className={`absolute top-4 w-full h-0.5 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            </nav>

            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    {/* Step 1: Department */}
                    {step === 1 && (
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Select Department</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {departments.map((dept) => (
                                    <div
                                        key={dept.id}
                                        onClick={() => { setSelectedDepartment(dept); setStep(2); }}
                                        className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 cursor-pointer transition-all"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <span className="absolute inset-0" aria-hidden="true" />
                                            <p className="text-sm font-medium text-gray-900">{dept.name}</p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Doctor */}
                    {step === 2 && (
                        <div>
                            <button onClick={() => setStep(1)} className="text-sm text-blue-600 mb-4 hover:underline">← Back to Departments</button>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Select Doctor in {selectedDepartment?.name}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {doctors.length === 0 ? <p className="text-gray-500">No doctors available in this department.</p> : null}
                                {doctors.map((doctor) => (
                                    <div
                                        key={doctor.id}
                                        onClick={() => { setSelectedDoctor(doctor); setStep(3); }}
                                        className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 cursor-pointer"
                                    >
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                {doctor.user.first_name[0]}{doctor.user.last_name[0]}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">Dr. {doctor.user.first_name} {doctor.user.last_name}</p>
                                            <p className="text-sm text-gray-500 truncate">{doctor.specialization}</p>
                                            <p className="text-xs text-green-600 mt-1 font-medium">Fee: ${doctor.consultation_fee}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Date & Slot */}
                    {step === 3 && (
                        <div>
                            <button onClick={() => setStep(2)} className="text-sm text-blue-600 mb-4 hover:underline">← Back to Doctors</button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Select Date</h3>
                                    <input 
                                        type="date" 
                                        min={new Date().toISOString().split('T')[0]}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={selectedDate}
                                        onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Available Slots</h3>
                                    {!selectedDate ? (
                                        <p className="text-gray-500 text-sm">Please select a date first.</p>
                                    ) : availableSlots.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No slots available on this date.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                                            {availableSlots.map((slot, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                                                        selectedSlot?.start_time === slot.start_time
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-500'
                                                    }`}
                                                >
                                                    {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={() => setStep(4)}
                                    disabled={!selectedSlot}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirm */}
                    {step === 4 && (
                        <div>
                            <button onClick={() => setStep(3)} className="text-sm text-blue-600 mb-4 hover:underline">← Back to Slots</button>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Confirm Appointment</h3>
                            
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500 flex items-center"><User className="w-4 h-4 mr-2"/> Doctor</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-semibold">Dr. {selectedDoctor?.user?.first_name} {selectedDoctor?.user?.last_name}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500 flex items-center"><CalendarIcon className="w-4 h-4 mr-2"/> Date</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-semibold">{format(new Date(selectedDate), 'PPPP')}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500 flex items-center"><Clock className="w-4 h-4 mr-2"/> Time</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-semibold">{selectedSlot?.start_time.substring(0,5)}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500 flex items-center">Consultation Fee</dt>
                                        <dd className="mt-1 text-sm text-green-600 font-bold">${selectedDoctor?.consultation_fee}</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-gray-500">Reason for visit (Optional)</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            <textarea
                                                rows={3}
                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                                placeholder="Briefly describe your symptoms..."
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                            />
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleBooking}
                                    disabled={loading}
                                    className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 w-full sm:w-auto"
                                >
                                    {loading ? 'Confirming...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {step === 5 && (
                        <div className="text-center py-12">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h2>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                Your appointment with Dr. {selectedDoctor?.user?.first_name} {selectedDoctor?.user?.last_name} on {format(new Date(selectedDate), 'MMM do')} at {selectedSlot?.start_time.substring(0,5)} has been successfully booked. 
                                We have sent a confirmation notification to your dashboard.
                            </p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => router.push('/dashboard/patient')}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Go to Dashboard
                                </button>
                                <button
                                    onClick={() => { setStep(1); setSelectedDepartment(null); setSelectedDoctor(null); setSelectedSlot(null); setSelectedDate(''); setReason(''); }}
                                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Book Another
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

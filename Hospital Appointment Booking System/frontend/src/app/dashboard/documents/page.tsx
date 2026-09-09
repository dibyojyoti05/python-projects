'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { FileText, Upload, Download, FileCheck, Calendar, User, Tag } from 'lucide-react';

export default function DocumentsPage() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Upload Form State
    const [title, setTitle] = useState('');
    const [documentType, setDocumentType] = useState('LAB_REPORT');
    const [patientId, setPatientId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/documents/');
            setDocuments(res.data);
        } catch (err) {
            console.error('Failed to fetch documents', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
        if (user?.role !== 'PATIENT') {
            api.get('/patients/').then(res => setPatients(res.data)).catch(console.error);
        } else {
            // Get current patient profile id
            api.get('/patients/').then(res => {
                const mePat = res.data.find((p: any) => p.user?.id === user.id);
                if (mePat) setPatientId(mePat.id.toString());
            }).catch(console.error);
        }
    }, [user]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !patientId) {
            alert('Please select a file and patient.');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('document_type', documentType);
            formData.append('patient', patientId);
            formData.append('file', file);

            await api.post('/documents/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setShowUploadModal(false);
            setTitle('');
            setFile(null);
            fetchDocuments();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to upload document.');
        } finally {
            setUploading(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'LAB_REPORT':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'PRESCRIPTION':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'MEDICAL_RECORD':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'INSURANCE':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Medical Documents</h1>
                    <p className="text-sm text-gray-500 mt-1">Upload and access lab reports, medical scans, prescriptions, and insurance files</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors gap-1.5"
                >
                    <Upload className="h-4 w-4" />
                    Upload Document
                </button>
            </div>

            {/* Documents List */}
            {loading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
                    Loading documents...
                </div>
            ) : documents.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
                    No medical documents uploaded yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                        <div key={doc.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <FileCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{doc.title}</h3>
                                            <span className="text-xs text-gray-400">
                                                {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getTypeColor(doc.document_type)}`}>
                                        {doc.document_type.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="mt-4 text-xs text-gray-600 space-y-1">
                                    <p>Patient ID: <b>#{doc.patient}</b></p>
                                    <p>Uploaded by: {doc.uploaded_by ? 'Hospital Staff / Patient' : 'System'}</p>
                                </div>
                            </div>

                            <div className="mt-5 pt-3 border-t flex justify-end">
                                <a
                                    href={doc.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Download / View File
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Upload className="h-5 w-5 text-blue-600" />
                                Upload Medical Document
                            </h3>
                            <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Document Title *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Complete Blood Count (CBC) Report"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Document Type *</label>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="LAB_REPORT">Lab Report</option>
                                    <option value="PRESCRIPTION">Prescription Scan</option>
                                    <option value="MEDICAL_RECORD">Medical Record / Discharge Summary</option>
                                    <option value="INSURANCE">Insurance Document</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            {user?.role !== 'PATIENT' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Patient *</label>
                                    <select
                                        required
                                        value={patientId}
                                        onChange={(e) => setPatientId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Select patient</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.user?.first_name} {p.user?.last_name} ({p.user?.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Select File * (PDF, Image, Doc)</label>
                                <input
                                    type="file"
                                    required
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                                >
                                    {uploading ? 'Uploading...' : 'Upload File'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

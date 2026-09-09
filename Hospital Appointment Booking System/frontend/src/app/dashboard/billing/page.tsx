'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DollarSign, Download, Plus, CreditCard, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export default function BillingPage() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');

    // Payment Modal State
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('ONLINE');
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Create Invoice Modal State
    const [showCreateInvoice, setShowCreateInvoice] = useState(false);
    const [createPatientId, setCreatePatientId] = useState('');
    const [taxRate, setTaxRate] = useState('5');
    const [discount, setDiscount] = useState('0');
    const [dueDate, setDueDate] = useState('');
    const [items, setItems] = useState([
        { description: 'General Consultation & Examination', quantity: 1, unit_price: '100.00' }
    ]);
    const [createLoading, setCreateLoading] = useState(false);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/invoices/');
            setInvoices(res.data);
        } catch (err) {
            console.error('Failed to fetch invoices', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
        if (user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') {
            api.get('/patients/').then(res => setPatients(res.data)).catch(console.error);
        }
    }, [user]);

    const handleDownloadPDF = async (inv: any) => {
        try {
            const response = await api.get(`/invoices/${inv.id}/download_pdf/`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${inv.invoice_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (err) {
            alert('Failed to download invoice PDF.');
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        setPaymentLoading(true);
        try {
            await api.post('/payments/', {
                invoice: selectedInvoice.id,
                amount: parseFloat(paymentAmount),
                payment_method: paymentMethod,
                status: 'SUCCESS',
                transaction_id: `TXN-${Date.now().toString().slice(-8)}`,
                notes: `Processed via ${paymentMethod}`
            });
            setSelectedInvoice(null);
            fetchInvoices();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to process payment.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            const invNumber = `INV-${Date.now().toString().slice(-6)}`;
            const res = await api.post('/invoices/', {
                invoice_number: invNumber,
                patient: parseInt(createPatientId),
                due_date: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                tax_rate: parseFloat(taxRate) || 0,
                discount: parseFloat(discount) || 0
            });

            const createdInv = res.data;
            for (const it of items) {
                await api.post('/invoice-items/', {
                    invoice: createdInv.id,
                    description: it.description,
                    quantity: parseInt(it.quantity.toString()) || 1,
                    unit_price: parseFloat(it.unit_price) || 0
                });
            }

            setShowCreateInvoice(false);
            fetchInvoices();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to create invoice.');
        } finally {
            setCreateLoading(false);
        }
    };

    const filtered = invoices.filter((inv) => {
        if (filterStatus === 'ALL') return true;
        return inv.status === filterStatus;
    });

    const getBadge = (status: string) => {
        switch (status) {
            case 'PAID':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'PARTIALLY_PAID':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Billing & Invoices</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage hospital invoices, payment receipts, and official PDF statements</p>
                </div>
                {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') && (
                    <button
                        onClick={() => setShowCreateInvoice(true)}
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors gap-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        Create Invoice
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex gap-2">
                {['ALL', 'PENDING', 'PARTIALLY_PAID', 'PAID'].map((st) => (
                    <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                            filterStatus === st
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {st.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Invoices List */}
            {loading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
                    Loading invoices...
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
                    No invoices found.
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Invoice #</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Patient</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Due Date</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Paid</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-semibold text-gray-900">{inv.invoice_number}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {inv.patient_details?.user?.first_name} {inv.patient_details?.user?.last_name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{inv.date}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{inv.due_date}</td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900">${parseFloat(inv.total_amount).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-green-600 font-medium">${parseFloat(inv.amount_paid).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getBadge(inv.status)}`}>
                                                {inv.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownloadPDF(inv)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                                                    title="Download Official PDF Invoice"
                                                >
                                                    <Download className="h-3.5 w-3.5 text-blue-600" />
                                                    PDF
                                                </button>
                                                {inv.status !== 'PAID' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedInvoice(inv);
                                                            const remaining = parseFloat(inv.total_amount) - parseFloat(inv.amount_paid);
                                                            setPaymentAmount(remaining.toFixed(2));
                                                        }}
                                                        className="px-2.5 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
                                                    >
                                                        Pay
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-green-600" />
                                Record Payment
                            </h3>
                            <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-4 text-sm">
                            <div>
                                <span className="text-xs text-gray-500">Invoice:</span>
                                <p className="font-semibold text-gray-900">{selectedInvoice.invoice_number}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Amount ($) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-green-500"
                                >
                                    <option value="ONLINE">Online (Stripe / Gateway)</option>
                                    <option value="CARD">Credit / Debit Card POS</option>
                                    <option value="CASH">Cash Desk</option>
                                    <option value="INSURANCE">Insurance Coverage</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setSelectedInvoice(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={paymentLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                                >
                                    {paymentLoading ? 'Processing...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Invoice Modal */}
            {showCreateInvoice && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 my-8 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Generate New Invoice
                            </h3>
                            <button onClick={() => setShowCreateInvoice(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleCreateInvoice} className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Patient *</label>
                                <select
                                    required
                                    value={createPatientId}
                                    onChange={(e) => setCreatePatientId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                >
                                    <option value="">Select patient</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.user?.first_name} {p.user?.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tax (%)</label>
                                    <input
                                        type="number"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Discount ($)</label>
                                    <input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md p-2 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Item */}
                            <div className="space-y-2 pt-2 border-t">
                                <label className="block text-xs font-bold text-gray-700 uppercase">Line Item</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Service Description"
                                    value={items[0].description}
                                    onChange={(e) => setItems([{ ...items[0], description: e.target.value }])}
                                    className="w-full border border-gray-300 rounded-md p-2 text-xs"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="Quantity"
                                        value={items[0].quantity}
                                        onChange={(e) => setItems([{ ...items[0], quantity: parseInt(e.target.value) || 1 }])}
                                        className="border border-gray-300 rounded-md p-2 text-xs"
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Price ($)"
                                        value={items[0].unit_price}
                                        onChange={(e) => setItems([{ ...items[0], unit_price: e.target.value }])}
                                        className="border border-gray-300 rounded-md p-2 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateInvoice(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                                >
                                    {createLoading ? 'Generating...' : 'Create Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

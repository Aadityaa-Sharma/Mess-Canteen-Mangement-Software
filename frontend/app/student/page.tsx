'use client';
import { useEffect, useState } from 'react';
import API from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AbsentRecord {
    date: string;
    shift: string;
}

interface BillBreakdown {
    meals_absent?: number;
    meals_present?: number;
    attendance_days?: number;
    absent_dates?: (string | AbsentRecord)[];
}

interface Bill {
    id: number;
    month: string;
    year: number;
    amount: string;
    status: 'PAID' | 'PENDING';
    generated_at: string;
    breakdown?: BillBreakdown;
}

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchBills = async () => {
        try {
            const { data } = await API.get('/bills');
            setBills(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role !== 'STUDENT') {
            router.push('/login');
        }
        fetchBills();
    }, [user, router]);

    const handlePay = (bill: Bill) => {
        const upiId = "prafullharer@slc";
        const payeeName = "Prafull Harer";
        const amount = parseFloat(bill.amount);

        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=Mess-Bill-${bill.month}-${bill.year}`;
        window.location.href = upiLink;
    };

    const handlePayAll = () => {
        const totalAmount = pendingBills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        const upiId = "prafullharer@slc";
        const payeeName = "Prafull Harer";

        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount}&cu=INR&tn=Mess-All-Dues`;
        window.location.href = upiLink;
    };

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleDownload = async (billId: number, month: string, year: number) => {
        try {
            const response = await API.get(`/bills/${billId}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Bill_${month}_${year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download bill. Please try again.');
        }
    };

    const pendingBills = bills.filter(b => b.status?.toUpperCase() === 'PENDING');
    const historyBills = bills.filter(b => b.status?.toUpperCase() === 'PAID');
    const totalPending = pendingBills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="flex justify-between items-center max-w-lg mx-auto">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Hi, {user?.name}</h1>
                        <p className="text-xs text-gray-500">Student Dashboard</p>
                    </div>
                    <button onClick={logout} className="text-sm text-red-600 font-medium">
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="max-w-lg mx-auto p-4 space-y-6">

                {/* Total Dues Card */}
                {pendingBills.length > 0 && (
                    <div className="bg-gray-900 text-white p-5 rounded-xl">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Pending</p>
                        <p className="text-3xl font-bold mb-3">₹{totalPending.toLocaleString()}</p>
                        <button
                            onClick={handlePayAll}
                            className="w-full py-2.5 rounded-lg bg-white text-gray-900 font-semibold text-sm flex items-center justify-center gap-2"
                        >
                            <CreditCard className="w-4 h-4" />
                            Pay All Dues
                        </button>
                    </div>
                )}

                {/* Pending Bills */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Pending Dues
                    </h2>
                    {pendingBills.length === 0 ? (
                        <div className="bg-white p-6 rounded-xl border border-gray-100 text-center">
                            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                            <p className="text-gray-900 font-medium">All caught up!</p>
                            <p className="text-sm text-gray-500">No pending bills.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingBills.map(bill => (
                                <div key={bill.id} className="bg-white p-4 rounded-xl border border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <p className="font-semibold text-gray-900">{bill.month} {bill.year}</p>
                                            <p className="text-xs text-amber-600">Due Now</p>
                                        </div>
                                        <p className="text-xl font-bold text-gray-900">₹{bill.amount}</p>
                                    </div>

                                    {/* Absent meals indicator */}
                                    {bill.breakdown?.meals_absent !== undefined && bill.breakdown.meals_absent > 0 && (
                                        <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 rounded-lg">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                            <span className="text-xs text-amber-700">
                                                {bill.breakdown.meals_absent} meal{bill.breakdown.meals_absent !== 1 ? 's' : ''} absent this month
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleDownload(bill.id, bill.month, bill.year)}
                                            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50"
                                        >
                                            <Download className="w-4 h-4" /> PDF
                                        </button>
                                        <button
                                            onClick={() => handlePay(bill)}
                                            className="flex-[2] py-2 rounded-lg bg-gray-900 text-white font-medium text-sm flex items-center justify-center gap-2"
                                        >
                                            <CreditCard className="w-4 h-4" /> Pay Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Payment History */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Payment History
                    </h2>
                    {historyBills.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-4">No payment history.</p>
                    ) : (
                        <div className="space-y-2">
                            {historyBills.map(bill => (
                                <div key={bill.id} className="bg-white p-4 rounded-xl border border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-900">{bill.month} {bill.year}</p>
                                            <p className="text-xs text-green-600">Paid</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-gray-600">₹{bill.amount}</span>
                                            <button
                                                onClick={() => handleDownload(bill.id, bill.month, bill.year)}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                                title="Download Receipt"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Attendance summary for paid bills */}
                                    {bill.breakdown && (
                                        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-4 text-xs">
                                            <span className="text-green-600">
                                                ✓ Present: {bill.breakdown.meals_present || 0}
                                            </span>
                                            <span className="text-amber-600">
                                                ✗ Absent: {bill.breakdown.meals_absent || 0}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </main>
        </div>
    );
}

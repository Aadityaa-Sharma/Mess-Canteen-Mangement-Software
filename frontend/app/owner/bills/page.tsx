'use client';
import { useEffect, useState, useCallback } from 'react';
import API from '@/lib/api';
import { Plus, Check, MessageSquare, ChevronLeft, ChevronRight, Calendar, Download } from 'lucide-react';

interface AbsentRecord {
    date: string;
    shift: string;
}

interface BillBreakdown {
    meals_present?: number;
    meals_absent?: number;
    absent_dates?: (string | AbsentRecord)[];
    meal_slot?: string;
    per_meal_rate?: number;
    attendance_days?: number;
    days_in_month?: number;
    days_enrolled?: number;
}

interface Bill {
    id: string;
    student_name: string;
    mobile: string;
    month: string;
    year: number;
    amount: string;
    status: 'PAID' | 'PENDING';
    generated_at: string;
    transaction_ref?: string;
    breakdown?: BillBreakdown;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BillsPage() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Month/Year selector state
    const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const fetchBills = useCallback(async () => {
        try {
            const { data } = await API.get('/bills');
            setBills(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    const handleGenerateBills = async () => {
        const exists = bills.some(b => b.month === selectedMonth && b.year === selectedYear);

        if (exists) {
            if (!confirm(`Regenerate bills for ${selectedMonth} ${selectedYear}? This will OVERWRITE existing pending bills.`)) return;
        } else {
            if (!confirm(`Generate bills for ${selectedMonth} ${selectedYear}?`)) return;
        }

        setIsGenerating(true);
        try {
            await API.post('/bills/generate', { month: selectedMonth, year: selectedYear });
            await fetchBills();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            alert(err?.response?.data?.message || 'Error generating bills');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrevMonth = () => {
        const currentIdx = MONTHS.indexOf(selectedMonth);
        if (currentIdx === 0) {
            setSelectedMonth(MONTHS[11]);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(MONTHS[currentIdx - 1]);
        }
    };

    const handleNextMonth = () => {
        const currentIdx = MONTHS.indexOf(selectedMonth);
        if (currentIdx === 11) {
            setSelectedMonth(MONTHS[0]);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(MONTHS[currentIdx + 1]);
        }
    };

    const handleMarkPaid = async (id: string) => {
        const ref = prompt('Enter Transaction Reference (UPI ID / Cash):');
        if (!ref) return;
        try {
            await API.put(`/bills/${id}/pay`, { transactionRef: ref });
            fetchBills();
        } catch (error) {
            console.error('Failed to update');
        }
    };

    const formatDateForWhatsApp = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleDownload = async (billId: string, month: string, year: number) => {
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

    const handleSendWhatsApp = (bill: Bill) => {
        // Build absent dates string
        let absentDatesStr = '';
        const absentDates = bill.breakdown?.absent_dates || [];
        if (absentDates.length > 0) {
            absentDatesStr = '\n\n*Absent Days:*\n';
            absentDates.forEach((record, idx) => {
                if (typeof record === 'string') {
                    absentDatesStr += `${idx + 1}. ${formatDateForWhatsApp(record)}\n`;
                } else if (record && record.date) {
                    absentDatesStr += `${idx + 1}. ${formatDateForWhatsApp(record.date)} (${record.shift})\n`;
                }
            });
        }

        const mealsPresent = bill.breakdown?.meals_present || 0;
        const mealsAbsent = bill.breakdown?.meals_absent || 0;
        const totalMeals = mealsPresent + mealsAbsent;

        const handleDownload = async (billId: string, month: string, year: number) => {
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

        // UPI Payment Link
        const upiId = "prafullharer@slc";
        const payeeName = "Prafull Harer";
        const amount = parseFloat(bill.amount);
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=Mess-Bill-${bill.month}-${bill.year}`;

        const message = `*Sagar Mess - Bill Notification*

*Student:* ${bill.student_name}
*Month:* ${bill.month} ${bill.year}

*Total Bill: Rs.${bill.amount}*

*Meal Summary:*
Meals Present: ${mealsPresent}
Meals Absent: ${mealsAbsent}
Total Meals: ${totalMeals}${absentDatesStr}

For queries, contact Sagar Mess.

*Pay Now:* ${upiLink}

Thank you for choosing Sagar Mess!`;

        window.open(`https://wa.me/91${bill.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    // Filter bills by selected month/year
    const filteredBills = bills.filter(b => b.month === selectedMonth && b.year === selectedYear);
    const paidCount = filteredBills.filter(b => b.status === 'PAID').length;
    const pendingCount = filteredBills.filter(b => b.status === 'PENDING').length;
    const totalAmount = filteredBills.reduce((sum, b) => sum + parseFloat(b.amount || '0'), 0);
    const paidAmount = filteredBills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + parseFloat(b.amount || '0'), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">Bills</h1>
                    <p className="text-neutral-500 text-sm mt-1">Generate and manage monthly bills</p>
                </div>
            </div>

            {/* Month/Year Selector */}
            <div className="card">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-neutral-100 rounded-xl p-1">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-white rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-neutral-600" />
                            </button>
                            <div className="flex items-center gap-2 px-4 py-2">
                                <Calendar className="w-4 h-4 text-neutral-500" />
                                <span className="font-bold text-[#0A0A0A] min-w-[120px] text-center">
                                    {selectedMonth} {selectedYear}
                                </span>
                            </div>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-white rounded-lg transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-neutral-600" />
                            </button>
                        </div>

                        {/* Quick month selector dropdown */}
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm font-medium bg-white"
                        >
                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm font-medium bg-white"
                        >
                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <button
                        onClick={handleGenerateBills}
                        className="btn-primary flex items-center gap-2"
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                {filteredBills.length > 0 ? 'Regenerate Bills' : 'Generate Bills'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Total Bills</p>
                    <p className="text-2xl font-bold text-[#0A0A0A]">{filteredBills.length}</p>
                </div>
                <div className="card">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-[#0A0A0A]">₹{totalAmount.toLocaleString()}</p>
                </div>
                <div className="card bg-green-50 border-green-200">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Paid ({paidCount})</p>
                    <p className="text-2xl font-bold text-green-700">₹{paidAmount.toLocaleString()}</p>
                </div>
                <div className="card bg-amber-50 border-amber-200">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Pending ({pendingCount})</p>
                    <p className="text-2xl font-bold text-amber-700">₹{(totalAmount - paidAmount).toLocaleString()}</p>
                </div>
            </div>

            {/* Bills List */}
            <div className="space-y-3">
                {filteredBills.length > 0 ? (
                    filteredBills.map(bill => (
                        <div key={bill.id} className="p-4 rounded-xl border border-neutral-200 bg-white flex items-center justify-between gap-4 hover:border-neutral-300 transition-colors">
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#0A0A0A] truncate">{bill.student_name}</p>
                                <p className="text-xs text-neutral-500">{bill.mobile}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-[#0A0A0A]">₹{bill.amount}</p>
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${bill.status === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>
                                    {bill.status === 'PAID' && <Check className="w-3 h-3" />}
                                    {bill.status}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {bill.status === 'PENDING' && (
                                    <button
                                        onClick={() => handleMarkPaid(bill.id)}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-[#0A0A0A] transition-colors"
                                    >
                                        Mark Paid
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDownload(bill.id, bill.month, bill.year)}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-[#0A0A0A] transition-colors flex items-center gap-1"
                                    title="Download PDF"
                                >
                                    <Download className="w-3 h-3" /> PDF
                                </button>
                                <button
                                    onClick={() => handleSendWhatsApp(bill)}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#25D366] text-white hover:bg-[#1da851] transition-colors flex items-center gap-1"
                                >
                                    <MessageSquare className="w-3 h-3" /> WhatsApp
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 text-neutral-500 card">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                        <p className="font-medium">No bills for {selectedMonth} {selectedYear}</p>
                        <p className="text-sm mt-1">Click "Generate Bills" to create bills for this month</p>
                    </div>
                )}
            </div>
        </div>
    );
}

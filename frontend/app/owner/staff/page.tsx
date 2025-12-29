'use client';
import { useEffect, useState } from 'react';
import API from '@/lib/api';
import { Plus, Trash2, Calendar, Home, Zap, ShoppingCart, Wrench, Package, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface FixedExpense {
    id: string;
    name: string;
    amount: number;
    type: 'RENT' | 'SALARY' | 'OTHER';
}

interface MonthlyExpense {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHLY_CATEGORIES = [
    { value: 'ELECTRICITY', label: 'Electricity Bill', icon: Zap, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'GROCERY', label: 'Grocery', icon: ShoppingCart, color: 'bg-green-100 text-green-800' },
    { value: 'MAINTENANCE', label: 'Maintenance', icon: Wrench, color: 'bg-blue-100 text-blue-800' },
    { value: 'MISCELLANEOUS', label: 'Miscellaneous', icon: Package, color: 'bg-purple-100 text-purple-800' },
    { value: 'OTHER', label: 'Custom/Other', icon: Package, color: 'bg-gray-100 text-gray-800' }
];

const FIXED_TYPES = [
    { value: 'RENT', label: 'Rent', icon: Home },
    { value: 'SALARY', label: 'Staff Salary', icon: Users },
    { value: 'OTHER', label: 'Other Fixed', icon: Package }
];

export default function ExpensesPage() {
    // Month/Year selector state
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Fixed expenses state
    const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
    const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
    const [fixedForm, setFixedForm] = useState({ name: '', amount: '', type: 'RENT' });

    // Monthly expenses state
    const [allMonthlyExpenses, setAllMonthlyExpenses] = useState<MonthlyExpense[]>([]);
    const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
    const [monthlyForm, setMonthlyForm] = useState({
        description: '',
        amount: '',
        category: 'GROCERY',
        date: format(new Date(), 'yyyy-MM-dd')
    });

    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch data
    const fetchFixedExpenses = async () => {
        try {
            const { data } = await API.get('/staff');
            setFixedExpenses(data.map((s: { id: string; name: string; salary: number; role: string }) => ({
                id: s.id,
                name: s.name,
                amount: parseFloat(String(s.salary)) || 0,
                type: s.role === 'Rent' ? 'RENT' : s.role === 'Salary' ? 'SALARY' : 'OTHER'
            })));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMonthlyExpenses = async () => {
        try {
            const { data } = await API.get('/staff/expenses');
            setAllMonthlyExpenses(data.expenses || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchFixedExpenses();
        fetchMonthlyExpenses();
    }, []);

    // Filter monthly expenses by selected month/year
    const monthlyExpenses = allMonthlyExpenses.filter(e => {
        const expDate = new Date(e.date);
        return expDate.getMonth() === selectedMonth && expDate.getFullYear() === selectedYear;
    });

    const handlePrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    // Fixed expense handlers
    const handleAddFixed = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await API.post('/staff', {
                name: fixedForm.name,
                role: fixedForm.type === 'RENT' ? 'Rent' : fixedForm.type === 'SALARY' ? 'Salary' : 'Fixed',
                salary: parseFloat(fixedForm.amount)
            });
            fetchFixedExpenses();
            setIsFixedModalOpen(false);
            setFixedForm({ name: '', amount: '', type: 'RENT' });
            showMessage('success', '✅ Fixed expense added');
        } catch (error) {
            showMessage('error', '❌ Failed to add fixed expense');
        }
    };

    const handleDeleteFixed = async (id: string) => {
        if (!confirm('Delete this fixed expense?')) return;
        try {
            await API.delete(`/staff/${id}`);
            fetchFixedExpenses();
            showMessage('success', '✅ Fixed expense deleted');
        } catch (error) {
            showMessage('error', '❌ Failed to delete');
        }
    };

    // Monthly expense handlers
    const handleAddMonthly = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await API.post('/staff/expenses', {
                description: monthlyForm.description,
                amount: parseFloat(monthlyForm.amount),
                category: monthlyForm.category,
                date: monthlyForm.date
            });
            fetchMonthlyExpenses();
            setIsMonthlyModalOpen(false);
            setMonthlyForm({
                description: '',
                amount: '',
                category: 'GROCERY',
                date: format(new Date(), 'yyyy-MM-dd')
            });
            showMessage('success', '✅ Monthly expense added');
        } catch (error) {
            showMessage('error', '❌ Failed to add expense');
        }
    };

    const handleDeleteMonthly = async (id: string) => {
        if (!confirm('Delete this expense?')) return;
        try {
            await API.delete(`/staff/expenses/${id}`);
            fetchMonthlyExpenses();
            showMessage('success', '✅ Expense deleted');
        } catch (error) {
            showMessage('error', '❌ Failed to delete');
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        if (type === 'success') setTimeout(() => setMessage(null), 3000);
    };

    const getCategoryInfo = (category: string) => {
        return MONTHLY_CATEGORIES.find(c => c.value === category) || MONTHLY_CATEGORIES[4];
    };

    const getFixedTypeInfo = (type: string) => {
        return FIXED_TYPES.find(t => t.value === type) || FIXED_TYPES[2];
    };

    const fixedTotal = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const grandTotal = fixedTotal + monthlyTotal;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">Expenses</h1>
                    <p className="text-neutral-500 text-sm mt-1">Manage fixed and monthly expenses</p>
                </div>
            </div>

            {/* Month/Year Selector */}
            <div className="card">
                <div className="flex items-center justify-between flex-wrap gap-4">
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
                                    {MONTHS[selectedMonth]} {selectedYear}
                                </span>
                            </div>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-white rounded-lg transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-neutral-600" />
                            </button>
                        </div>

                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm font-medium bg-white"
                        >
                            {MONTHS.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm font-medium bg-white"
                        >
                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="bg-[#0A0A0A] text-white px-6 py-3 rounded-xl">
                        <span className="text-sm opacity-70">Total for {MONTHS[selectedMonth]}: </span>
                        <span className="text-xl font-bold">₹{grandTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Fixed Monthly</p>
                    <p className="text-2xl font-bold text-[#0A0A0A]">₹{fixedTotal.toLocaleString()}</p>
                </div>
                <div className="card">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Variable ({MONTHS[selectedMonth]})</p>
                    <p className="text-2xl font-bold text-[#0A0A0A]">₹{monthlyTotal.toLocaleString()}</p>
                </div>
                <div className="card bg-red-50 border-red-200">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Grand Total</p>
                    <p className="text-2xl font-bold text-red-700">₹{grandTotal.toLocaleString()}</p>
                </div>
            </div>

            {/* Fixed Expenses Section */}
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-[#0A0A0A]">Fixed Expenses</h2>
                        <p className="text-sm text-neutral-500">Recurring monthly costs (rent, salaries)</p>
                    </div>
                    <button
                        onClick={() => setIsFixedModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Fixed
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fixedExpenses.map((expense) => {
                        const typeInfo = getFixedTypeInfo(expense.type);
                        const TypeIcon = typeInfo.icon;
                        return (
                            <div key={expense.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 hover:border-neutral-300 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#0A0A0A] rounded-lg flex items-center justify-center">
                                            <TypeIcon className="w-5 h-5 text-[#C8FF00]" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#0A0A0A]">{expense.name}</p>
                                            <p className="text-xs text-neutral-500">{typeInfo.label}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteFixed(expense.id)}
                                        className="text-neutral-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="mt-4 pt-3 border-t border-neutral-200">
                                    <p className="text-2xl font-bold text-[#0A0A0A]">₹{expense.amount.toLocaleString()}</p>
                                    <p className="text-xs text-neutral-500">per month</p>
                                </div>
                            </div>
                        );
                    })}
                    {fixedExpenses.length === 0 && (
                        <div className="col-span-full text-center py-8 text-neutral-500">
                            No fixed expenses added. Add rent, staff salaries, etc.
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Expenses Section */}
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-[#0A0A0A]">Monthly Expenses - {MONTHS[selectedMonth]} {selectedYear}</h2>
                        <p className="text-sm text-neutral-500">Variable expenses for selected month</p>
                    </div>
                    <button
                        onClick={() => setIsMonthlyModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Expense
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-200">
                                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Date</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Description</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Category</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Amount</th>
                                <th className="text-right py-3 px-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyExpenses.map((expense) => {
                                const catInfo = getCategoryInfo(expense.category);
                                const CatIcon = catInfo.icon;
                                return (
                                    <tr key={expense.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                                        <td className="py-3 px-4 text-sm text-neutral-600">
                                            {format(new Date(expense.date), 'dd MMM yyyy')}
                                        </td>
                                        <td className="py-3 px-4 font-medium text-[#0A0A0A]">
                                            {expense.description}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${catInfo.color}`}>
                                                <CatIcon className="w-3 h-3" />
                                                {catInfo.label}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-[#0A0A0A]">
                                            ₹{expense.amount.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleDeleteMonthly(expense.id)}
                                                className="text-neutral-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {monthlyExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-neutral-500">
                                        No expenses recorded for {MONTHS[selectedMonth]} {selectedYear}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Fixed Expense Modal */}
            {isFixedModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Fixed Expense</h2>
                        <form onSubmit={handleAddFixed} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {FIXED_TYPES.map(type => {
                                        const TypeIcon = type.icon;
                                        return (
                                            <button
                                                key={type.value}
                                                type="button"
                                                className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center gap-1 transition-all ${fixedForm.type === type.value
                                                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                                                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                                                    }`}
                                                onClick={() => setFixedForm({ ...fixedForm, type: type.value })}
                                            >
                                                <TypeIcon className="w-4 h-4" />
                                                {type.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <input
                                placeholder="Name (e.g., Shop Rent, Cook Salary)"
                                className="input-field"
                                value={fixedForm.name}
                                onChange={e => setFixedForm({ ...fixedForm, name: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Monthly Amount (₹)"
                                className="input-field"
                                type="number"
                                value={fixedForm.amount}
                                onChange={e => setFixedForm({ ...fixedForm, amount: e.target.value })}
                                required
                            />
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsFixedModalOpen(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Add Fixed Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Monthly Expense Modal */}
            {isMonthlyModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Monthly Expense</h2>
                        <form onSubmit={handleAddMonthly} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Category</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {MONTHLY_CATEGORIES.map(cat => {
                                        const CatIcon = cat.icon;
                                        return (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                className={`p-3 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all ${monthlyForm.category === cat.value
                                                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                                                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                                                    }`}
                                                onClick={() => setMonthlyForm({ ...monthlyForm, category: cat.value })}
                                            >
                                                <CatIcon className="w-4 h-4" />
                                                {cat.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <input
                                placeholder="Description (e.g., December electricity bill)"
                                className="input-field"
                                value={monthlyForm.description}
                                onChange={e => setMonthlyForm({ ...monthlyForm, description: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Amount (₹)"
                                className="input-field"
                                type="number"
                                value={monthlyForm.amount}
                                onChange={e => setMonthlyForm({ ...monthlyForm, amount: e.target.value })}
                                required
                            />
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-neutral-400" />
                                <input
                                    type="date"
                                    className="input-field flex-1"
                                    value={monthlyForm.date}
                                    onChange={e => setMonthlyForm({ ...monthlyForm, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsMonthlyModalOpen(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Add Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Message */}
            {message && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg transition-all duration-300 ${message.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    <p className="font-medium text-sm">{message.text}</p>
                </div>
            )}
        </div>
    );
}

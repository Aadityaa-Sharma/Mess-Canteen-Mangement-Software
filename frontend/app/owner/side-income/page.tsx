'use client';
import { useEffect, useState } from 'react';
import API from '@/lib/api';
import { Plus, Trash2, Edit2, Calendar, ChevronLeft, ChevronRight, Cookie, Droplets, Package, X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface SideIncomeEntry {
    id: string;
    category: string;
    amount: number;
    description: string;
    date: string;
    editable: boolean;
}

interface Stats {
    SNACKS: { total: number; count: number };
    PANI_PURI: { total: number; count: number };
    CUSTOM: { total: number; count: number };
    grandTotal: number;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const CATEGORIES = [
    { value: 'SNACKS', label: 'Snacks', icon: Cookie, color: 'bg-amber-100 text-amber-800', borderColor: 'border-amber-500' },
    { value: 'PANI_PURI', label: 'Pani Puri', icon: Droplets, color: 'bg-blue-100 text-blue-800', borderColor: 'border-blue-500' },
    { value: 'CUSTOM', label: 'Custom', icon: Package, color: 'bg-purple-100 text-purple-800', borderColor: 'border-purple-500' }
];

export default function SideIncomePage() {
    // State
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState<'SNACKS' | 'PANI_PURI' | 'CUSTOM'>('SNACKS');
    const [entries, setEntries] = useState<SideIncomeEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<SideIncomeEntry | null>(null);
    const [form, setForm] = useState({
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
    });

    // Date range for validation
    const [dateRange, setDateRange] = useState({ minDate: '', maxDate: '' });

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; entry: SideIncomeEntry | null }>({
        isOpen: false,
        entry: null
    });

    // Message state
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch date range on mount
    useEffect(() => {
        const fetchDateRange = async () => {
            try {
                const { data } = await API.get('/side-income/date-range');
                setDateRange(data);
                setForm(prev => ({ ...prev, date: data.maxDate }));
            } catch (error) {
                console.error('Failed to fetch date range:', error);
            }
        };
        fetchDateRange();
    }, []);

    // Fetch data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [incomeRes, statsRes] = await Promise.all([
                API.get(`/side-income?year=${selectedYear}&month=${selectedMonth + 1}`),
                API.get(`/side-income/stats?year=${selectedYear}&month=${selectedMonth + 1}`)
            ]);
            setEntries(incomeRes.data.income || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch side income:', error);
            showMessage('error', '❌ Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    // Filter entries by active tab
    const filteredEntries = entries.filter(e => e.category === activeTab);

    // Navigation
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

    // Form handlers
    const openAddModal = () => {
        setEditingEntry(null);
        setForm({
            amount: '',
            description: '',
            date: dateRange.maxDate || format(new Date(), 'yyyy-MM-dd')
        });
        setIsModalOpen(true);
    };

    const openEditModal = (entry: SideIncomeEntry) => {
        setEditingEntry(entry);
        setForm({
            amount: entry.amount.toString(),
            description: entry.description,
            date: entry.date
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEntry(null);
        setForm({ amount: '', description: '', date: dateRange.maxDate });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.amount || parseFloat(form.amount) <= 0) {
            showMessage('error', '❌ Please enter a valid amount');
            return;
        }

        if (activeTab === 'CUSTOM' && !form.description.trim()) {
            showMessage('error', '❌ Description is required for custom income');
            return;
        }

        try {
            if (editingEntry) {
                // Update
                await API.put(`/side-income/${editingEntry.id}`, {
                    amount: parseFloat(form.amount),
                    description: form.description,
                    date: form.date,
                    category: activeTab
                });
                showMessage('success', '✅ Income updated');
            } else {
                // Create
                await API.post('/side-income', {
                    category: activeTab,
                    amount: parseFloat(form.amount),
                    description: form.description,
                    date: form.date
                });
                showMessage('success', '✅ Income added');
            }
            closeModal();
            fetchData();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showMessage('error', `❌ ${err.response?.data?.message || 'Failed to save'}`);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await API.delete(`/side-income/${id}`);
            showMessage('success', '✅ Income deleted');
            setDeleteConfirm({ isOpen: false, entry: null });
            fetchData();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showMessage('error', `❌ ${err.response?.data?.message || 'Failed to delete'}`);
        }
    };

    const openDeleteConfirm = (entry: SideIncomeEntry) => {
        setDeleteConfirm({ isOpen: true, entry });
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirm({ isOpen: false, entry: null });
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        if (type === 'success') setTimeout(() => setMessage(null), 3000);
    };

    const getCategoryInfo = (category: string) => {
        return CATEGORIES.find(c => c.value === category) || CATEGORIES[2];
    };

    const activeCategory = getCategoryInfo(activeTab);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">Side Income</h1>
                    <p className="text-neutral-500 text-sm mt-1">Track income from snacks, pani puri, and more</p>
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
                        <span className="text-xl font-bold text-[#C8FF00]">₹{(stats?.grandTotal || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CATEGORIES.map(cat => {
                    const CatIcon = cat.icon;
                    const catStats = stats?.[cat.value as keyof Stats] as { total: number; count: number } | undefined;
                    return (
                        <div
                            key={cat.value}
                            className={`card cursor-pointer transition-all ${activeTab === cat.value
                                ? `ring-2 ring-offset-2 ${cat.borderColor.replace('border', 'ring')}`
                                : 'hover:shadow-md'
                                }`}
                            onClick={() => setActiveTab(cat.value as 'SNACKS' | 'PANI_PURI' | 'CUSTOM')}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color}`}>
                                    <CatIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-[#0A0A0A]">{cat.label}</p>
                                    <p className="text-xs text-neutral-500">{catStats?.count || 0} entries</p>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-[#0A0A0A]">₹{(catStats?.total || 0).toLocaleString()}</p>
                        </div>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="card">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeCategory.color}`}>
                            <activeCategory.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0A0A0A]">{activeCategory.label} Income</h2>
                            <p className="text-sm text-neutral-500">{MONTHS[selectedMonth]} {selectedYear}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-neutral-500">This Month</p>
                            <p className="text-xl font-bold text-[#0A0A0A]">
                                ₹{((stats?.[activeTab as keyof Stats] as { total: number; count: number })?.total || 0).toLocaleString()}
                            </p>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Income
                        </button>
                    </div>
                </div>

                {/* Entries Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200">
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Date</th>
                                    {activeTab === 'CUSTOM' && (
                                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Description</th>
                                    )}
                                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Amount</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                                        <td className="py-3 px-4 text-sm text-neutral-600">
                                            {format(new Date(entry.date), 'dd MMM yyyy')}
                                        </td>
                                        {activeTab === 'CUSTOM' && (
                                            <td className="py-3 px-4 font-medium text-[#0A0A0A]">
                                                {entry.description || '-'}
                                            </td>
                                        )}
                                        <td className="py-3 px-4 text-right font-bold text-[#0A0A0A]">
                                            ₹{entry.amount.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(entry)}
                                                    className="text-neutral-400 hover:text-blue-500 transition-colors p-1"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteConfirm(entry)}
                                                    className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEntries.length === 0 && (
                                    <tr>
                                        <td colSpan={activeTab === 'CUSTOM' ? 4 : 3} className="py-12 text-center text-neutral-500">
                                            No {activeCategory.label.toLowerCase()} income recorded for {MONTHS[selectedMonth]} {selectedYear}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">
                                {editingEntry ? 'Edit' : 'Add'} {activeCategory.label} Income
                            </h2>
                            <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Date</label>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-neutral-400" />
                                    <input
                                        type="date"
                                        className="input-field flex-1"
                                        value={form.date}
                                        min={dateRange.minDate}
                                        max={dateRange.maxDate}
                                        onChange={e => setForm({ ...form, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">
                                    Valid range: {dateRange.minDate} to {dateRange.maxDate}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="Enter amount"
                                    className="input-field"
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                    min="1"
                                    step="0.01"
                                    required
                                />
                            </div>

                            {activeTab === 'CUSTOM' && (
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Description</label>
                                    <input
                                        type="text"
                                        placeholder="What was this income from?"
                                        className="input-field"
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">
                                    {editingEntry ? 'Update' : 'Add'} Income
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.isOpen && deleteConfirm.entry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#0A0A0A]">Delete Income</h2>
                                <p className="text-sm text-neutral-500">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-neutral-500">Amount</p>
                                    <p className="text-xl font-bold text-[#0A0A0A]">₹{deleteConfirm.entry.amount.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-neutral-500">Date</p>
                                    <p className="font-medium text-[#0A0A0A]">{format(new Date(deleteConfirm.entry.date), 'dd MMM yyyy')}</p>
                                </div>
                            </div>
                            {deleteConfirm.entry.description && (
                                <div className="mt-3 pt-3 border-t border-neutral-200">
                                    <p className="text-sm text-neutral-500">Description</p>
                                    <p className="font-medium text-[#0A0A0A]">{deleteConfirm.entry.description}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeDeleteConfirm}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm.entry!.id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
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

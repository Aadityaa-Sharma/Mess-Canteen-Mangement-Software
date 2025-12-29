'use client';
import { useEffect, useState } from 'react';
import API from '@/lib/api';
import { Users, CreditCard, IndianRupee, TrendingUp, FileText, ArrowRight, Receipt } from 'lucide-react';

interface Stats {
    students: number;
    staff: number;
    revenue: number;
    billRevenue?: number;
    sideIncome?: number;
    pending: number;
    expense: number;
    netIncome: number;
}

interface MonthlyStats {
    month: string;
    year: number;
    revenue: number;
    pending: number;
    totalBills: number;
}

interface CurrentMonthExpense {
    fixed: number;
    operational: number;
    total: number;
    month: string;
    year: number;
}

export default function OwnerDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
    const [currentMonthExpense, setCurrentMonthExpense] = useState<CurrentMonthExpense | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await API.get('/dashboard');
                console.log('Dashboard API response:', data);
                setStats(data.stats);
                setMonthlyStats(data.monthlyStats || []);
                setCurrentMonthExpense(data.currentMonthExpense || null);
                setError(false);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: 'Students', value: stats?.students || 0, icon: Users },
        { label: 'Pending Dues', value: `₹${(stats?.pending || 0).toLocaleString()}`, icon: CreditCard },
        { label: 'Revenue', value: `₹${(stats?.revenue || 0).toLocaleString()}`, icon: IndianRupee },
        { label: 'Net Income', value: `₹${(stats?.netIncome || 0).toLocaleString()}`, icon: TrendingUp, accent: true },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-neutral-500 mb-4">Failed to load dashboard data</p>
                <button onClick={() => window.location.reload()} className="btn-secondary">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-sm font-medium text-neutral-500 mb-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">Dashboard</h1>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => (
                    <div
                        key={idx}
                        className={`card group transition-all duration-150 ${stat.accent ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : ''
                            }`}
                    >
                        <div className={`flex items-center gap-2 mb-4 ${stat.accent ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            <stat.icon className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <p className={`text-3xl font-bold tracking-tight ${stat.accent ? 'text-[#C8FF00]' : ''}`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Monthly Breakdown & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Stats Table */}
                <div className="lg:col-span-2 card">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">Monthly Breakdown</h2>
                    {monthlyStats.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-100">
                                        <th className="text-left py-3 font-semibold text-neutral-500">Month</th>
                                        <th className="text-right py-3 font-semibold text-neutral-500">Revenue</th>
                                        <th className="text-right py-3 font-semibold text-neutral-500">Pending</th>
                                        <th className="text-right py-3 font-semibold text-neutral-500">Net</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyStats.map((m, idx) => (
                                        <tr key={idx} className="border-b border-neutral-50 last:border-0">
                                            <td className="py-3 font-medium text-[#0A0A0A]">
                                                {m.month} {m.year}
                                            </td>
                                            <td className="py-3 text-right text-[#0A0A0A] font-semibold">
                                                ₹{m.revenue.toLocaleString()}
                                            </td>
                                            <td className="py-3 text-right text-amber-600 font-medium">
                                                ₹{m.pending.toLocaleString()}
                                            </td>
                                            <td className={`py-3 text-right font-bold ${(m.revenue - m.pending) >= 0 ? 'text-[#0A0A0A]' : 'text-red-500'
                                                }`}>
                                                ₹{(m.revenue).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-neutral-400">
                            No billing data yet. Generate bills to see monthly breakdown.
                        </div>
                    )}
                </div>

                {/* Current Month Expense */}
                <div className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 px-1">
                        {currentMonthExpense?.month || new Date().toLocaleString('default', { month: 'long' })} {currentMonthExpense?.year || new Date().getFullYear()} Expenses
                    </h2>

                    <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
                        <div className="flex items-center gap-2 mb-4 text-red-600">
                            <Receipt className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Total Expense</span>
                        </div>
                        <p className="text-3xl font-bold tracking-tight text-red-600 mb-4">
                            ₹{(currentMonthExpense?.total || 0).toLocaleString()}
                        </p>

                        <div className="space-y-2 pt-3 border-t border-red-100">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-600">Fixed (Rent/Salaries)</span>
                                <span className="font-semibold text-neutral-900">
                                    ₹{(currentMonthExpense?.fixed || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-600">Monthly Variable</span>
                                <span className="font-semibold text-neutral-900">
                                    ₹{(currentMonthExpense?.operational || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <a
                            href="/owner/staff"
                            className="mt-4 flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-white/80 border border-red-200 text-sm font-medium text-red-700 hover:bg-white transition-colors"
                        >
                            <span>View Details</span>
                            <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>

                    {/* Quick Actions */}
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 px-1 pt-4">Quick Actions</h2>

                    <a
                        href="/owner/bills"
                        className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 bg-white hover:border-[#0A0A0A] transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900" />
                            <span className="text-sm font-medium">Generate Bills</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
                    </a>

                    <a
                        href="/owner/students"
                        className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 bg-white hover:border-[#0A0A0A] transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900" />
                            <span className="text-sm font-medium">Add Student</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
                    </a>
                </div>
            </div>
        </div>
    );
}

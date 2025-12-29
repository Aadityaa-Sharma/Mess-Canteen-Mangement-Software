'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, FileText, Receipt, LogOut, Calendar, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
    { name: 'Dashboard', href: '/owner', icon: Home },
    { name: 'Attendance', href: '/owner/attendance', icon: Calendar },
    { name: 'Students', href: '/owner/students', icon: Users },
    { name: 'Bills', href: '/owner/bills', icon: FileText },
    { name: 'Expenses', href: '/owner/staff', icon: Receipt },
    { name: 'Side Income', href: '/owner/side-income', icon: Wallet },
];

export default function OwnerSidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <aside className="w-64 bg-[#0A0A0A] h-screen fixed left-0 top-0 flex flex-col">
            <div className="p-6">
                <h1 className="text-lg font-bold text-white tracking-tight">
                    Sagar Mess
                </h1>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                ? 'bg-[#C8FF00] text-[#0A0A0A]'
                                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-neutral-800">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-neutral-400 hover:text-red-400 rounded-lg text-sm font-medium transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

'use client';
import { useState } from 'react';
import API from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UtensilsCrossed, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            const { data } = await API.post('/auth/login', { mobile, password });
            login(data.token, data.user);
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0A0A0A] relative overflow-hidden">
                {/* Gradient Orbs */}
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#C8FF00]/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#C8FF00]/10 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#C8FF00] rounded-xl flex items-center justify-center">
                            <UtensilsCrossed className="w-5 h-5 text-[#0A0A0A]" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">
                            Sagar Mess
                        </span>
                    </div>

                    {/* Tagline */}
                    <div className="max-w-md">
                        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                            Smart Canteen Management
                        </h1>
                        <p className="text-neutral-400 text-lg leading-relaxed">
                            Streamline your mess operations with digital billing,
                            attendance tracking, and instant WhatsApp notifications.
                        </p>
                    </div>

                    {/* Footer */}
                    <p className="text-neutral-600 text-sm">
                        © 2024 Sagar Mess. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-10">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[#0A0A0A] rounded-xl flex items-center justify-center">
                                <UtensilsCrossed className="w-5 h-5 text-[#C8FF00]" />
                            </div>
                            <span className="text-2xl font-bold text-[#0A0A0A] tracking-tight">
                                Sagar Mess
                            </span>
                        </div>
                    </div>

                    {/* Form Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">
                            Welcome back
                        </h2>
                        <p className="text-neutral-500 mt-2">
                            Sign in to your account to continue
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">
                                Mobile Number
                            </label>
                            <input
                                type="text"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="w-full px-4 py-3.5 bg-white border border-neutral-200 rounded-xl text-[#0A0A0A] placeholder-neutral-400 focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-all"
                                placeholder="Enter your mobile number"
                                maxLength={10}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3.5 bg-white border border-neutral-200 rounded-xl text-[#0A0A0A] placeholder-neutral-400 focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-all"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-[#0A0A0A] text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>


                </div>
            </div>
        </div>
    );
}


'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-brand-dark">
            {/* Background gradient - subtle */}
            <div className="fixed inset-0 bg-gradient-to-br from-brand-dark via-black to-brand-dark opacity-50 -z-10" />

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-6 md:mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">
                        tobie.team
                    </h1>
                    <p className="text-text-secondary mt-2 text-sm md:text-base">governed benefits communication</p>
                </div>

                {/* Login Card */}
                <div className="card backdrop-blur-xl bg-brand-light/5">
                    <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">Welcome back</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="you@tobie.team"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-3 md:py-3.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    {/* Demo credentials */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-xs text-text-secondary text-center mb-3">Demo accounts</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <button
                                type="button"
                                onClick={() => {
                                    setEmail('josh@tobie.team');
                                    // Password matches seed_manual.sql
                                    setPassword('TobieAdmin2026!');
                                }}
                                className="p-3 rounded-lg bg-white/5 hover:bg-brand-blue/10 hover:border-brand-blue/30 border border-white/10 text-text-secondary hover:text-white transition-all text-left touch-manipulation"
                            >
                                <span className="block font-medium text-sm">Admin</span>
                                <span className="text-text-secondary text-xs">josh@tobie.team</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEmail('ann@tobie.team');
                                    setPassword('TobieDesigner2026!');
                                }}
                                className="p-3 rounded-lg bg-white/5 hover:bg-brand-blue/10 hover:border-brand-blue/30 border border-white/10 text-text-secondary hover:text-white transition-all text-left touch-manipulation"
                            >
                                <span className="block font-medium text-sm">Designer</span>
                                <span className="text-text-secondary text-xs">ann@tobie.team</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

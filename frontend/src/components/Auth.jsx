import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosInstance';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // 🔥 NAYA: Loading state add kiya

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true); // 🔥 NAYA: Jaise hi submit ho, loading shuru karo
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            await apiClient.post(endpoint, formData);
            window.location.href = '/';
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Authentication Failed";
            setError(errorMsg);
            setIsLoading(false); // 🔥 NAYA: Error aane par loading band karo
        }
    };

    return (
        <div className="flex min-h-screen bg-[#000000] text-white font-sans selection:bg-cyan-500/30">

            {/* ================= LEFT SIDE (THE BRAND PANEL) ================= */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#050505] border-r border-white/5 overflow-hidden flex-col justify-between p-14">

                {/* Minimalist Abstract Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                {/* Subtle Top Glow */}
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-cyan-500 opacity-20 blur-[100px]"></div>

                {/* Top Branding */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-gray-400 flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <span className="font-bold tracking-widest text-lg">SARHA<span className="text-gray-500">.AI</span></span>
                </div>

                {/* Middle Typography */}
                <div className="relative z-10">
                    <h1 className="text-5xl font-light tracking-tight leading-tight mb-6">
                        The next generation of <br />
                        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">voice intelligence.</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-md font-light leading-relaxed">
                        Authenticate to access your personalized neural workspace. Control your system, access data, and automate tasks using natural language.
                    </p>
                </div>

                {/* Bottom Status */}
                <div className="relative z-10 flex items-center gap-4 text-sm font-mono text-gray-500">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        WAKE UP SARHA
                    </div>
                </div>
            </div>

            {/* ================= RIGHT SIDE (THE FORM) ================= */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative bg-[#000000]">

                {/* Subtle Center Glow for the form */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="w-full max-w-[380px] relative z-10">

                    <div className="mb-10">
                        <h2 className="text-3xl font-semibold tracking-tight mb-2">
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            {isLogin ? 'Enter your details to sign in to your workspace.' : 'Initialize your operator profile to continue.'}
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-sm">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Operator X"
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-[#111] focus:ring-1 focus:ring-cyan-500 outline-none transition-all disabled:opacity-50"
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">Email address</label>
                            <input
                                type="email"
                                required
                                placeholder="operator@example.com"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-[#111] focus:ring-1 focus:ring-cyan-500 outline-none transition-all disabled:opacity-50"
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">Password</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-[#111] focus:ring-1 focus:ring-cyan-500 outline-none transition-all disabled:opacity-50"
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                disabled={isLoading}
                            />
                        </div>

                        {/* 🔥 NAYA: Button with Loading Spinner Logic */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-white text-black font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2 mt-4 
                            ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-200 active:scale-[0.98] cursor-pointer'}`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                                </>
                            ) : (
                                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                                className="text-white hover:text-cyan-400 font-medium transition-colors cursor-pointer"
                                disabled={isLoading}
                            >
                                {isLogin ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
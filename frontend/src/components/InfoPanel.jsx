import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import { User, Key, ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';

const InfoPanel = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ name: '', geminiKey: '', openaiKey: '' });
    const [isAnimating, setIsAnimating] = useState(false);
    const navigate = useNavigate();

    // 🌟 Existing data fetch karna taaki input field empty na lage
    useEffect(() => {
        const fetchExistingData = async () => {
            try {
                const res = await apiClient.get('/api/auth/check-auth');
                if (res.data && res.data.user) {
                    setFormData(prev => ({
                        ...prev,
                        name: res.data.user.name || ''
                    }));
                }
            } catch (err) {
                console.log("No existing user data found.");
            }
        };
        fetchExistingData();
    }, []);

    const handleNextStep = (e) => {
        e.preventDefault();
        setIsAnimating(true);
        setTimeout(() => {
            setStep(2);
            setIsAnimating(false);
        }, 400);
    };

    const handleBackStep = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setStep(1);
            setIsAnimating(false);
        }, 400);
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setIsAnimating(true);

        try {
            console.log("🚀 Syncing updates to AuthUser...");

            // 🔥 STEP 1: Backend mein AuthUser ka name update karna
            try {
                await apiClient.post('/api/auth/update-profile', {
                    name: formData.name
                });
                console.log("✅ AuthUser name updated successfully.");
            } catch (profileErr) {
                console.error("❌ Profile Update Failed:", profileErr.message);
                throw new Error("Failed to sync name with AuthUser.");
            }

            // 🔥 STEP 2: AI Keys save karna (Gemini + OpenAI)
            try {
                // Tumhara backend dono keys handle kar lega agar pass kiye hain toh
                await apiClient.post('/api/ai/save-key', {
                    apiKey: formData.geminiKey,
                    openaiKey: formData.openaiKey // OpenAI key bhi bhej rahe hain
                });
                console.log("✅ AI Keys linked successfully.");
            } catch (keyErr) {
                console.error("❌ Key Save Failed:", keyErr.message);
                throw new Error("Failed to save secure keys.");
            }

            localStorage.setItem('isSetupComplete', 'true');

            // Success animation ke baad redirect
            setTimeout(() => {
                window.location.href = '/sarha/dashboard';
            }, 1500);

        } catch (err) {
            console.error("🚨 Setup Error:", err);
            setIsAnimating(false);
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-900 selection:text-cyan-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Architectural Grid & Ambient Glow */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_40%,transparent_100%)] pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>

            <div className="w-full max-w-[420px] relative z-10">

                {/* Step Indicators */}
                {!isAnimating && step < 3 && (
                    <div className="flex items-center gap-3 mb-10">
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-white/10'}`}></div>
                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-white/10'}`}></div>
                    </div>
                )}

                {/* ----------------- STEP 1: NAME ----------------- */}
                {step === 1 && (
                    <div className={`transition-all duration-400 ease-out transform ${isAnimating ? 'opacity-0 -translate-x-8' : 'opacity-100 translate-x-0'}`}>
                        <div className="mb-10 text-left">
                            <h2 className="text-4xl font-semibold tracking-tight text-white mb-2">Identity Sync</h2>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Change your operator alias. This will update your profile in the core system.
                            </p>
                        </div>

                        <form onSubmit={handleNextStep} className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-400 flex items-center gap-2 uppercase tracking-tighter">
                                    <User size={16} />
                                    Operator Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Enter your name..."
                                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-[#111] focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-lg"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 mt-8 cursor-pointer">
                                Continue to API Settings
                                <ArrowRight size={18} />
                            </button>
                        </form>
                    </div>
                )}

                {/* ----------------- STEP 2: API KEYS ----------------- */}
                {step === 2 && !isAnimating && (
                    <div className={`transition-all duration-400 ease-out transform animate-slide-in-right`}>

                        <button onClick={handleBackStep} type="button" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-6 group cursor-pointer w-max">
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Identity
                        </button>

                        <div className="mb-10 text-left">
                            <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">Network Keys</h2>
                            <p className="text-gray-500 text-sm leading-relaxed">Connect intelligence engines to your neural profile.</p>
                        </div>

                        <form onSubmit={handleFinalSubmit} className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <Key size={16} className="text-cyan-500" />
                                    Gemini API Key
                                </label>
                                <input
                                    type="password"
                                    required
                                    placeholder="AIzaSy..."
                                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-[#111] focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-mono tracking-wide"
                                    value={formData.geminiKey}
                                    onChange={(e) => setFormData({ ...formData, geminiKey: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                    <Key size={16} className="text-gray-500" />
                                    OpenAI API Key <span className="text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase ml-2">Optional</span>
                                </label>
                                <input
                                    type="password"
                                    placeholder="sk-proj..."
                                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:border-gray-500 focus:bg-[#111] focus:ring-1 focus:ring-gray-500 outline-none transition-all font-mono tracking-wide"
                                    value={formData.openaiKey}
                                    onChange={(e) => setFormData({ ...formData, openaiKey: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 mt-8 cursor-pointer">
                                <CheckCircle2 size={18} />
                                Update & Initialize
                            </button>
                        </form>
                    </div>
                )}

                {/* ----------------- STEP 3: FINAL LOADING ----------------- */}
                {step === 2 && isAnimating && (
                    <div className="flex flex-col items-center justify-center space-y-8 py-20 animate-fade-in">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-2 border-r-2 border-blue-500 rounded-full animate-spin-slow"></div>
                            <div className="absolute inset-4 border-b-2 border-white/20 rounded-full animate-spin-reverse"></div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-white font-medium text-lg mb-1">Finalizing Sync</h3>
                            <p className="text-cyan-500 font-mono tracking-[0.2em] uppercase text-xs animate-pulse">Updating Neural ID...</p>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
                .animate-spin-slow { animation: spin 3s linear infinite; }
                .animate-spin-reverse { animation: spin 2s linear infinite reverse; }
            `}</style>
        </div>
    );
};

export default InfoPanel;
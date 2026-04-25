import React from 'react';
import { Computer, ExternalLink, X, Monitor, ShieldAlert } from 'lucide-react';

const LocalActionModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">

            {/* Modal Container */}
            <div className="relative w-full max-w-lg bg-[#050505] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)]">

                {/* Top Glowing Border Line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    {/* Icon Area */}
                    <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 relative group">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse"></div>
                        <ShieldAlert size={32} className="text-cyan-400 relative z-10" />
                    </div>

                    {/* Text Content */}
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-3">
                        Local Environment Required
                    </h2>
                    <p className="text-gray-400 leading-relaxed mb-8 text-sm">
                        System-level actions like <span className="text-cyan-400">Shutdown</span>, <span className="text-cyan-400">Opening Apps</span>, and <span className="text-cyan-400">Hardware Control</span> are restricted in Cloud Mode (Render). To unlock these features, please run the agent locally on your machine.
                    </p>

                    {/* Action Cards */}
                    <div className="space-y-3 mb-8">
                        <a
                            href="https://github.com/Mohan-Kumar-Dalei/sarha-ai-assistant"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-black rounded-lg border border-white/10">
                                    <Github size={18} className="text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white">Pull from GitHub</span>
                                    <span className="text-[10px] text-gray-500 font-mono">git clone sarha-ai-assistant.git</span>
                                </div>
                            </div>
                            <ExternalLink size={16} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                        </a>

                        <div className="flex items-center gap-4 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                            <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                                <Monitor size={18} className="text-cyan-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-cyan-400 italic">Support: Windows / Linux / MacOS</span>
                                <span className="text-[10px] text-cyan-500/50 uppercase tracking-widest">Full Hardware Access</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] tracking-widest text-xs uppercase"
                    >
                        Acknowledge Protocols
                    </button>
                </div>

                {/* Footer Credit */}
                <div className="py-4 border-t border-white/5 text-center">
                    <span className="text-[9px] text-gray-600 tracking-[0.3em] uppercase">
                        Neural Interface by <span className="text-gray-400">Mohan</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LocalActionModal;
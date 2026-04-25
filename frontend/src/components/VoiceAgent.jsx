import React, { useState, useRef, useEffect } from 'react';
import { Activity, PowerOff, Mic, MicOff, LogOut, Settings } from 'lucide-react';
import apiClient from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import LocalActionModal from './ActionModal';

const VoiceAgent = () => {
    const [userName, setUserName] = useState("Operator");
    const [systemState, setSystemState] = useState('offline');
    const [liveTranscript, setLiveTranscript] = useState('');
    const [aiResponseText, setAiResponseText] = useState('');
    const [speakerColor, setSpeakerColor] = useState('gray');
    const [micVolume, setMicVolume] = useState(0);
    const [isMicBridgeOpen, setIsMicBridgeOpen] = useState(false);
    const [sysLogs, setSysLogs] = useState(['[CORE] Awaiting Initialization...']);
    const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);

    const systemStateRef = useRef('offline');
    const recognitionRef = useRef(null);
    const idleTimerRef = useRef(null);
    const aiTextTimeoutRef = useRef(null);
    const audioContextRef = useRef(null);
    const bridgeOpenRef = useRef(false);
    const isSpeakingRef = useRef(false);
    const hasWelcomedRef = useRef(false);
    const navigate = useNavigate();
    const isLocalEnvironment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const addLog = (msg) => {
        setSysLogs(prev => {
            const newLogs = [...prev, msg];
            return newLogs.slice(-8); // Show 8 lines to make it look fuller
        });
    };

    // FETCH EXACT USER DATA
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                addLog('[NET] Syncing Neural Identity...');
                const res = await apiClient.get('/api/user/me');
                if (res.data && res.data.name) {
                    setUserName(res.data.name);
                    addLog(`[AUTH] Welcome, OP ${res.data.name.toUpperCase()}`);
                }
            } catch (err) {
                addLog('[ERR] Profile fetch failed. Using fallback.');
            }
        };
        fetchUserProfile();
    }, []);

    const updateSystemState = (newState) => {
        setSystemState(newState);
        systemStateRef.current = newState;
    };

    const closeBridge = () => {
        bridgeOpenRef.current = false;
        setIsMicBridgeOpen(false);
        setMicVolume(0);
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (e) { }
        }
    };

    const openBridge = () => {
        bridgeOpenRef.current = true;
        setIsMicBridgeOpen(true);
        if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) { }
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        let timeGreeting = "Good morning";
        if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";
        else if (hour >= 17) timeGreeting = "Good evening";
        return `${timeGreeting} ${userName}.`;
    };

    // 🎙️ TUMHARA PURANA ORIGINAL VOICE LOGIC (NO TIMEOUTS, BLOB BASED)
    const speakText = async (textToSpeak, onEndCallback) => {
        if (!textToSpeak) {
            if (onEndCallback) onEndCallback();
            return;
        }

        isSpeakingRef.current = true;
        closeBridge();

        const finishSpeaking = () => {
            isSpeakingRef.current = false;
            if (systemStateRef.current !== 'offline') {
                openBridge();
            }
            if (onEndCallback) onEndCallback();
        };

        const fallbackToBrowserTTS = () => {
            try {
                addLog('[SYS] Switching to Native TTS Engine');
                window.speechSynthesis.cancel();
                const fallbackUtterance = new SpeechSynthesisUtterance(textToSpeak);
                fallbackUtterance.lang = 'en-US';
                fallbackUtterance.rate = 0.9;
                fallbackUtterance.pitch = 1;
                fallbackUtterance.volume = 1;
                fallbackUtterance.onend = finishSpeaking;
                fallbackUtterance.onerror = finishSpeaking;
                window.speechSynthesis.speak(fallbackUtterance);
            } catch (e) {
                console.error("Critical TTS Fallback Error", e);
                addLog('[ERR] TTS Fallback Failed');
                finishSpeaking();
            }
        };

        try {
            addLog('[NET] Fetching Neural Audio Protocol...');
            const response = await apiClient.post('/api/tts',
                { text: textToSpeak },
                { responseType: 'blob' } // ORIGINAL BLOB LOGIC
            );

            // Better validation - check if response is actually audio
            if (!response.data || response.data.size === undefined) {
                console.error("Invalid response structure:", response.data);
                addLog('[ERR] Invalid audio response format');
                throw new Error("Invalid audio response format");
            }

            if (response.data.size === 0) {
                console.error("Empty audio blob received");
                addLog('[ERR] Empty audio blob from server');
                throw new Error("Empty audio blob");
            }

            if (response.data.type && (response.data.type.includes('json') || response.data.type.includes('text'))) {
                console.error("Invalid audio type received:", response.data.type);
                addLog('[ERR] Invalid content type: ' + response.data.type);
                throw new Error("Received non-audio response");
            }

            console.log("Audio blob received:", response.data.size, "bytes, type:", response.data.type);
            const audioUrl = URL.createObjectURL(response.data);
            const sarhaAudio = new Audio(audioUrl);
            sarhaAudio.volume = 1.0;
            sarhaAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                finishSpeaking();
            };

            sarhaAudio.onerror = (e) => {
                console.error("Audio playback error", e);
                addLog('[ERR] Audio playback failed');
                URL.revokeObjectURL(audioUrl);
                fallbackToBrowserTTS();
            };

            console.log("Attempting to play audio...");
            const playPromise = sarhaAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.error("Play prevented by browser:", e);
                    addLog('[ERR] Audio playback blocked');
                    URL.revokeObjectURL(audioUrl);
                    fallbackToBrowserTTS();
                });
            }

        } catch (error) {
            console.error("Failed to fetch backend audio:", error);
            addLog('[ERR] Backend Audio Stream Failed');
            addLog('[INFO] Using fallback voice engine');
            fallbackToBrowserTTS();
        }
    };

    const fetchAIResponse = async (userText) => {
        if (systemStateRef.current !== 'active') return;

        try {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            updateSystemState('processing');
            setAiResponseText('');
            setLiveTranscript('');
            setSpeakerColor('gray');
            addLog(`[API] Processing neural query...`);
            closeBridge();

            const response = await apiClient.post('/api/ai', { message: userText }, {
                onDownloadProgress: (progressEvent) => {
                    const chunk = progressEvent.event.target.responseText;
                    setAiResponseText(chunk);
                }
            });

            const fullResponse = response.data;
            updateSystemState('active');
            addLog(`[API] Response received successfully`);

            // 🛑 CRITICAL SHUTDOWN LOGIC
            const isShutdownCommand = userText.includes("shutdown") ||
                userText.includes("laptop band karo") ||
                userText.includes("system band karo") ||
                userText.includes("system ko shutdown kardo") ||
                userText.includes("shutdown the system");

            if (isShutdownCommand) {
                if (isLocalEnvironment) {
                    setSpeakerColor('red');
                    addLog('[WARN] SHUTDOWN PROTOCOL INITIATED');
                    const customMessage = `Terminating all systems. Good Bye ${userName}.`;
                    setAiResponseText(customMessage);
                    speakText(customMessage, () => { });
                } else {
                    setIsLocalModalOpen(true);
                    setSpeakerColor('yellow'); // Warning color
                    const msg = "System actions are locked in cloud mode. Run locally to use this. Just pull it from the repository on your machine.";
                    setAiResponseText(msg);
                    addLog('[WARN] Local Environment Required for System Actions');
                    speakText(msg, () => { setTimeout(() => setAiResponseText(''), 1000) });
                }
            } else {
                setSpeakerColor('green');
                speakText(fullResponse, () => {
                    setSpeakerColor('gray');
                    resetIdleTimer();
                    if (aiTextTimeoutRef.current) clearTimeout(aiTextTimeoutRef.current);
                    aiTextTimeoutRef.current = setTimeout(() => setAiResponseText(''), 2000);
                });
            }

        } catch (error) {
            if (error.response?.status === 429) {
                addLog('[ERR] API Limit Exceeded!');
            } else if (error.response?.status === 401) {
                addLog('[ERR] Unauthenticated Access');
                setAiResponseText("System Error. Connection failed.");
                setSpeakerColor('red');
                speakText("System error. Connection failed.", () => navigate('/auth'));
                return;
            } else {
                addLog(`[ERR] Net Failure: ${error.message}`);
            }

            updateSystemState('error');
            setSpeakerColor('red');
            setAiResponseText("System encountered an error.");
            speakText("System error. Connection failed.", () => {
                updateSystemState('sleep');
                setSpeakerColor('gray');
                if (aiTextTimeoutRef.current) clearTimeout(aiTextTimeoutRef.current);
                aiTextTimeoutRef.current = setTimeout(() => setAiResponseText(''), 2000);
            });
        }
    };

    const resetIdleTimer = () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (systemStateRef.current === 'active') {
            idleTimerRef.current = setTimeout(() => {
                if (systemStateRef.current === 'active') goToSleep();
            }, 50000);
        }
    };

    const goToSleep = () => {
        setSpeakerColor('green');
        setAiResponseText("Entering sleep mode...");
        addLog('[SYS] Hibernating core...');
        speakText(`Entering sleep mode ${userName}. Just say wake up to activate.`, () => {
            updateSystemState('sleep');
            setSpeakerColor('gray');
            setLiveTranscript('');
            setAiResponseText("");
        });
    };

    const setupRealtimeAudio = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

            // Resume audio context if it's suspended (common on mobile/some browsers)
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const analyser = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                let peak = 0;
                for (let i = 0; i < bufferLength; i++) { if (dataArray[i] > peak) peak = dataArray[i]; }
                if (bridgeOpenRef.current) { setMicVolume(peak > 5 ? peak : 0); } else { setMicVolume(0); }
                requestAnimationFrame(updateVolume);
            };
            updateVolume();
            addLog('[HW] Mic connection established');
        } catch (err) {
            addLog('[ERR] Mic access denied');
            console.error("Mic setup error:", err);
        }
    };

    const initSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            if (!bridgeOpenRef.current || isSpeakingRef.current) return;
            const lastResult = event.results[event.results.length - 1];
            const currentText = lastResult[0].transcript.trim().toLowerCase();
            if (!currentText) return;

            setLiveTranscript(currentText);
            setSpeakerColor('blue');

            if (lastResult.isFinal) {
                if (currentText.includes("so jao") || currentText.includes("go to sleep") || currentText.includes("sleep mode")) {
                    goToSleep();
                    return;
                }
                const isWakeWord = currentText.includes('wake up') || currentText.includes('utho') || currentText.includes('sara activate') || currentText.includes('sarha');

                if (systemStateRef.current === 'sleep') {
                    if (isWakeWord) handleWakeUpSequence();
                    return;
                } else if (systemStateRef.current === 'active') {
                    resetIdleTimer();
                    fetchAIResponse(currentText);
                }
            }
        };

        recognition.onend = () => {
            if (systemStateRef.current !== 'offline' && bridgeOpenRef.current) {
                try { recognition.start(); } catch (e) { }
            }
        };
        recognitionRef.current = recognition;
    };

    const handleWakeUpSequence = () => {
        updateSystemState('waking_up');
        setSpeakerColor('green');
        addLog('[SYS] Waking up core modules...');
        closeBridge();

        const finishWakeUp = () => {
            updateSystemState('active');
            setLiveTranscript('');
            setSpeakerColor('gray');
            resetIdleTimer();
            openBridge();
            if (aiTextTimeoutRef.current) clearTimeout(aiTextTimeoutRef.current);
            aiTextTimeoutRef.current = setTimeout(() => setAiResponseText(''), 2000);
        };

        if (!hasWelcomedRef.current) {
            setAiResponseText("Initializing...");
            speakText(`${userName}, I am waking up. Please wait for a moment while I initialize systems status.`, () => {
                updateSystemState('processing');
                setAiResponseText("Checking system status...");
                setTimeout(() => {
                    const welcomeText = `${getGreeting()} I am ready.`;
                    hasWelcomedRef.current = true;
                    setAiResponseText(welcomeText);
                    speakText(welcomeText, () => finishWakeUp());
                }, 3000);
            });
        } else {
            const shortWelcome = `${getGreeting()} I am ready.`;
            setAiResponseText(shortWelcome);
            speakText(shortWelcome, () => finishWakeUp());
        }
    };

    const bootSystem = () => {
        if (systemState !== 'offline') return;
        setupRealtimeAudio();
        updateSystemState('sleep');
        initSpeechRecognition();
        setSpeakerColor('green');
        addLog('[SYS] System booted successfully');
        setAiResponseText("System booting up...");
        speakText(`System booted. Hello ${userName}, say wake up to begin.`, () => {
            setSpeakerColor('gray');
            setAiResponseText("");
        });
    };

    const handleLogout = async () => {
        try {
            await apiClient.post('/api/auth/logout');
            localStorage.removeItem('isSetupComplete');
            window.location.href = "/auth";
        } catch (err) {
            console.error("Logout failed");
        }
    };

    // VISUAL DYNAMICS
    const getRingGlow = () => {
        if (speakerColor === 'blue') return 'text-cyan-500 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]';
        if (speakerColor === 'green') return 'text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]';
        if (speakerColor === 'red') return 'text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,1)]';
        if (systemState === 'processing') return 'text-purple-500 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]';
        return 'text-white/10';
    };

    const isOnline = systemState !== 'offline';

    return (
        <div onClick={bootSystem} className="relative flex flex-col items-center justify-center h-screen bg-[#020202] overflow-hidden font-sans select-none cursor-pointer">

            {/* Ambient Background & Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#111_0%,#000_100%)] pointer-events-none z-0"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none z-0"></div>

            <style>
                {`
                @keyframes spin-slow { 100% { transform: rotate(360deg); } }
                @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
                .animate-spin-slow { animation: spin-slow 15s linear infinite; }
                .animate-spin-reverse { animation: spin-reverse 10s linear infinite; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
                `}
            </style>

            {/* TOP BAR - PREMIUM HUD STYLE */}
            <div className="absolute top-8 w-full flex justify-between px-8 md:px-16 z-50">
                <div className="flex items-center gap-4 relative">
                    <div className="absolute -top-2 -left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-500/50"></div>
                    <div className="absolute -bottom-2 -right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-500/50"></div>

                    <div className={`w-10 h-10 border border-white/10 bg-white/5 flex items-center justify-center transition-all ${isOnline ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-gray-600'}`}>
                        {isOnline ? <Activity size={20} /> : <PowerOff size={20} />}
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${isOnline ? 'text-cyan-400' : 'text-gray-600'}`}>
                            SYS {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                        <span className="text-[10px] font-mono tracking-[0.2em] text-gray-500 mt-0.5">OP // {userName.toUpperCase()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className={`flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] transition-all duration-300 ${isMicBridgeOpen ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'text-red-500/50'}`}>
                        {isMicBridgeOpen ? <Mic size={16} /> : <MicOff size={16} />}
                        <span>{isMicBridgeOpen ? 'ACTIVE' : 'MUTED'}</span>
                    </div>
                    {isOnline && (
                        <div className="flex items-center gap-5">
                            <Settings size={18} className="text-gray-500 hover:text-cyan-400 transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate('/setup'); }} />
                            <LogOut size={18} className="text-gray-500 hover:text-red-500 transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); handleLogout(); }} />
                        </div>
                    )}
                </div>
            </div>


            {/* RIGHT HUD WIDGET: SYSTEM TELEMETRY */}
            {isOnline && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 opacity-50 z-20 w-24">
                    <div className="text-[9px] font-black tracking-widest text-cyan-500 mb-1 border-b border-cyan-500/30 pb-1 text-right">SYS_CORE</div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[8px] font-mono text-cyan-400"><span>CPU</span><span>{Math.floor(Math.random() * 20 + 30)}%</span></div>
                        <div className="w-full bg-white/5 h-1"><div className="bg-cyan-500 h-full" style={{ width: '45%' }}></div></div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[8px] font-mono text-cyan-400"><span>RAM</span><span>{Math.floor(Math.random() * 10 + 60)}%</span></div>
                        <div className="w-full bg-white/5 h-1"><div className="bg-cyan-500 h-full" style={{ width: '65%' }}></div></div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[8px] font-mono text-cyan-400"><span>NET</span><span>OK</span></div>
                        <div className="w-full bg-white/5 h-1"><div className="bg-emerald-500 h-full" style={{ width: '90%' }}></div></div>
                    </div>
                </div>
            )}

            {/* CENTER UI - HUGE JARVIS ARC REACTOR */}
            {systemState !== 'offline' && (
                <div className="z-30 flex flex-col items-center justify-center w-full max-w-5xl px-6 text-center mt-[-8vh]">

                    <div className="relative flex items-center justify-center w-[480px] h-[480px] top-16">


                        {/* Outer Complex Rings (Background) */}
                        <svg className={`absolute inset-0 w-full h-full animate-spin-slow transition-colors duration-500 ${getRingGlow()} z-0`} viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2 4" opacity="0.3" />
                            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="20 10 5 10" opacity="0.5" />
                        </svg>
                        <svg className={`absolute inset-0 m-auto w-[85%] h-[85%] animate-spin-reverse transition-colors duration-500 ${getRingGlow()} z-0`} viewBox="0 0 100 100" style={{ transform: `scale(${1 + (micVolume / 190)})` }}>
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="40 20" opacity="0.7" />
                        </svg>

                        <svg className={`absolute inset-0 m-auto w-[70%] h-[70%] animate-spin-slow transition-colors duration-500 ${getRingGlow()} z-0`} viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="1 10" opacity="0.4" />
                        </svg>

                        {/* Audio Wave Core Aura (Behind text) */}
                        <div
                            className={`absolute rounded-full blur-[70px] transition-all duration-75 z-0 ${speakerColor === 'blue' ? 'bg-cyan-600/40' : speakerColor === 'green' ? 'bg-emerald-600/40' : speakerColor === 'red' ? 'bg-red-600/60' : 'bg-transparent'}`}
                            style={{ width: `${180 + (micVolume * 2.5)}px`, height: `${100 + (micVolume * 2.5)}px` }}
                        ></div>

                        {/* CENTER TEXT (FRONT) */}
                        <div className="relative z-20 flex flex-col items-center justify-center left-12">
                            <h1 className={`text-6xl md:text-8xl font-black tracking-[0.7em] uppercase transition-colors duration-500 ${speakerColor === 'red' ? 'text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,1)]' : 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]'}`}>
                                SARHA
                            </h1>
                            {systemState === 'processing' && (
                                <span className="absolute -bottom-10 left-1/2 transform -translate-x-28 text-[11px] font-mono tracking-[0.3em] text-purple-400 animate-pulse bg-black/50 px-3 py-1 rounded-full border border-purple-500/30">
                                    PROCESSING...
                                </span>
                            )}
                        </div>
                    </div>

                    {/* CLEAN FLOATING TEXT SUBTITLES */}
                    <div className="mt-10 flex flex-col gap-4 min-h-[120px] w-full max-w-4xl z-20">
                        {aiResponseText && (
                            <p className={`text-xl md:text-xl font-light tracking-wide leading-relaxed transition-all duration-300 ${speakerColor === 'green' ? 'text-emerald-300 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]' : speakerColor === 'red' ? 'text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-gray-200'}`}>
                                {aiResponseText}
                            </p>
                        )}
                        <p className={`text-base md:text-2xl font-light italic transition-all duration-300 ${speakerColor === 'blue' ? 'text-cyan-400 opacity-90 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]' : 'opacity-0 h-0'}`}>
                            {speakerColor === 'blue' ? `"${liveTranscript}"` : ''}
                        </p>
                    </div>
                </div>
            )}

            {/* BOTTOM LEFT: ENLARGED CONSOLE LOG WIDGET */}
            {systemState !== 'offline' && (
                <div className="absolute bottom-12 left-8 w-80 flex flex-col justify-end text-[10px] font-mono text-cyan-500/70 space-y-2 z-20 overflow-hidden">
                    {sysLogs.map((log, index) => (
                        <div key={index} className="animate-fade-in-up">
                            <span className="text-gray-500 mr-2">{'>'}</span>
                            <span className={log.includes('[ERR]') || log.includes('[WARN]') ? 'text-red-400' : 'text-cyan-500'}>{log}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* BOTTOM RIGHT: ENHANCED TELEMETRY WIDGET */}
            {systemState !== 'offline' && (
                <div className="absolute bottom-12 right-8 flex gap-1.5 items-end h-16 z-20 opacity-70">
                    {/* Increased bar count for a fuller look */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => (
                        <div
                            key={bar}
                            className="w-1.5 bg-cyan-500"
                            style={{
                                height: `${Math.max(10, Math.random() * (micVolume > 5 ? micVolume : 20) + Math.random() * 30)}%`,
                                transition: 'height 0.1s ease-out'
                            }}
                        ></div>
                    ))}
                    <div className="ml-4 flex flex-col justify-end text-[9px] font-mono text-cyan-500/80 tracking-[0.2em] uppercase pb-1">
                        <span>AUDIO: {micVolume}Hz</span>
                        <span>UPLINK: ACTIVE</span>
                    </div>
                </div>
            )}

            {/* OFFLINE SCREEN */}
            {systemState === 'offline' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none gap-6">
                    <p className="text-gray-600 font-mono text-sm tracking-[0.5em] opacity-60 animate-pulse">TAP TO INITIALIZE</p>
                </div>
            )}

            {/* Footer */}
            <div className="absolute bottom-4 w-full text-center flex items-center justify-center gap-2 text-[10px] text-gray-600 font-medium tracking-widest z-10 uppercase">
                Made with <span className="text-red-500 animate-[pulse_1.5s_ease-in-out_infinite] drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]">❤️</span> Mohan
            </div>
            <LocalActionModal
                isOpen={isLocalModalOpen}
                onClose={() => setIsLocalModalOpen(false)}
            />
        </div>
    );
};

export default VoiceAgent;
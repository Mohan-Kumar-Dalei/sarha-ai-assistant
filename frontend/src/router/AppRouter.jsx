import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import VoiceAgent from '../components/VoiceAgent';
import Auth from '../components/Auth';
import InfoPanel from '../components/InfoPanel';
import apiClient from '../api/axiosInstance';

const AppRouter = () => {
    const [authStatus, setAuthStatus] = useState({
        loading: true,
        isAuth: false,
        hasKey: false
    });

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await apiClient.get('/api/auth/check-auth');
                const user = res.data.user;

                setAuthStatus({
                    loading: false,
                    isAuth: true,
                    hasKey: !!user.geminiApiKey
                });
            } catch (err) {
                setAuthStatus({ loading: false, isAuth: false, hasKey: false });
            }
        };
        checkStatus();
    }, []);

    if (authStatus.loading) {
        return <div className="min-h-screen bg-[#030305] flex items-center justify-center text-cyan-500 font-mono">Verifying Neural Link...</div>;
    }

    return (
        <Routes>
            {/* Auth Logic */}
            <Route path="/auth" element={!authStatus.isAuth ? <Auth /> : <Navigate to="/" />} />

            {/* 🌟 NAYA LOGIC: Agar auth hai, toh koi bhi InfoPanel (Setup) par aa sakta hai (Update karne ke liye) */}
            <Route path="/setup" element={
                authStatus.isAuth ? <InfoPanel /> : <Navigate to="/auth" />
            } />

            {/* Dashboard: Sirf tabhi jab Auth ho aur Key bhi ho */}
            <Route path="/sarha/dashboard" element={
                authStatus.isAuth && authStatus.hasKey ? <VoiceAgent /> : <Navigate to="/setup" />
            } />

            {/* Default Path: Smart Redirect */}
            <Route path="/" element={
                authStatus.isAuth ? (
                    authStatus.hasKey ? <Navigate to="/sarha/dashboard" /> : <Navigate to="/setup" />
                ) : <Navigate to="/auth" />
            } />
        </Routes>
    );
};

export default AppRouter;
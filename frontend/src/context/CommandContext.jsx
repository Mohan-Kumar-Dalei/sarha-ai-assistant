// frontend/src/context/CommandContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const CommandContext = createContext();

export const CommandProvider = ({ children }) => {
    const [location, setLocation] = useState("India");
    const [customCommands, setCustomCommands] = useState([
        { trigger: "show my portfolio", action: "OPEN_URL", payload: "https://yourportfolio.com" }
    ]);

    // Auto-detect location using Browser API
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    const city = data.address.city || data.address.town || "Bhubaneswar";
                    setLocation(city);
                } catch (e) { console.error("Location error", e); }
            });
        }
    }, []);

    const addCommand = (newCmd) => setCustomCommands([...customCommands, newCmd]);

    return (
        <CommandContext.Provider value={{ location, setLocation, customCommands, addCommand }}>
            {children}
        </CommandContext.Provider>
    );
};

export const useCommands = () => useContext(CommandContext);
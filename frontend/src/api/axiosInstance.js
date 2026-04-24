import axios from 'axios';

// Backend URL environment variables se aayega
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export default apiClient;
import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const signup = (data: { name: string; email: string; password: string }) =>
    API.post('/auth/signup', data);

export const login = (data: { email: string; password: string }) =>
    API.post('/auth/login', data);

export const getMe = () => API.get('/auth/me');

// Study Plans
export const getStudyPlans = () => API.get('/studyplans');
export const createStudyPlan = (data: object) => API.post('/studyplans', data);
export const updateStudyPlan = (id: string, data: object) => API.put(`/studyplans/${id}`, data);
export const deleteStudyPlan = (id: string) => API.delete(`/studyplans/${id}`);

// Analytics
export const getSummary = () => API.get('/analytics/summary');
export const getAllSessions = () => API.get('/analytics');
export const logSession = (data: object) => API.post('/analytics', data);
export const deleteSession = (id: string) => API.delete(`/analytics/${id}`);
export const getStudyStats = () => API.get('/analytics/summary');
export const getDetailedAnalytics = () => API.get('/analytics/weekly');

// AI Generation (legacy)
export const generateAiPlan = (data: { prompt: string; subject: string; timeframeDays: number }) => API.post('/ai/generate-plan', data);

// AI Coach (used in ProgressCoach page)
export const getCoachAdvice = (stats: any, struggle: string) => API.post('/ai/coach', { stats, struggle });


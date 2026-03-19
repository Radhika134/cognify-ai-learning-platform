const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const chatWithTutor = (messages: ChatMessage[]) => {
  return fetchWithAuth('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages })
  });
};

export const generateQuiz = (topic: string, difficulty: string, count: number) => {
  return fetchWithAuth('/ai/quiz', {
    method: 'POST',
    body: JSON.stringify({ topic, difficulty, count })
  });
};

export const generateStudyPlan = (topic: string, goal: string, days: number, dailyTime: string, level: string) => {
  return fetchWithAuth('/ai/study-plan', {
    method: 'POST',
    body: JSON.stringify({ topic, goal, days, dailyTime, level })
  });
};

export const summarizeNotes = (notes: string, format: 'summary' | 'flashcards' | 'both', subject?: string, difficulty?: string) => {
  return fetchWithAuth('/ai/summarize', {
    method: 'POST',
    body: JSON.stringify({ notes, format, subject, difficulty })
  });
};

export const detectTopic = (notes: string) => {
  return fetchWithAuth('/ai/detect-topic', {
    method: 'POST',
    body: JSON.stringify({ notes })
  });
};

export const explainConcept = (concept: string, level: string) => {
  return fetchWithAuth('/ai/explain', {
    method: 'POST',
    body: JSON.stringify({ concept, level })
  });
};

export const getCoachAdvice = (stats: any, struggle: string) => {
  return fetchWithAuth('/ai/coach', {
    method: 'POST',
    body: JSON.stringify({ stats, struggle })
  });
};

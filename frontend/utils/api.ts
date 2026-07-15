import axios from 'axios';
import { getGlobalToken, setGlobalToken } from '../context/AuthContext';

// Maintain backward compatibility for files importing getAuthToken
export const getAuthToken = (): string | null => {
  const globalToken = getGlobalToken();
  if (globalToken) return globalToken;
  if (typeof window !== 'undefined') return localStorage.getItem('token');
  return null;
};

export const getSocketUrl = (): string => {
  const rawUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000';
  return rawUrl.replace(/\/+$/, '').replace(/\/api$/, '');
};

const ensureApiPath = (baseUrl: string): string => {
  const normalized = baseUrl.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://med-internia-earj.onrender.com/api';

const API_BASE_URL = ensureApiPath(rawBaseUrl);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add interceptor to include JWT token in all requests
api.interceptors.request.use(
  (config) => {
    // Fall back to localStorage if the in-memory global token hasn't
    // been hydrated yet (e.g. this is the very first request after a
    // fresh page load, before AuthContext's mount effect has run).
    const token = getGlobalToken() || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRedirectingToLogin = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl: string = error.config?.url || '';

    const isSessionBootstrapCheck = requestUrl.includes('/auth/validate-token');

    if (
      status === 401 &&
      !isSessionBootstrapCheck &&
      typeof window !== 'undefined'
    ) {
      setGlobalToken(null);

      const alreadyOnLoginPage = window.location.pathname.startsWith('/auth/login');
      if (!isRedirectingToLogin && !alreadyOnLoginPage) {
        isRedirectingToLogin = true;
        const redirectPath = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;
      }
    }

    return Promise.reject(error);
  }
);

// Fetch intern profile
export const getInternProfile = async () => {
  const res = await api.get('/intern/profile');
  return res.data;
};

// Fetch intern credits
export const getInternCredits = async () => {
  const res = await api.get('/intern/credits');
  return res.data.credits;
};

// Fetch all diaries for the intern
export const getDiaries = async () => {
  const res = await api.get('/diaries');
  return res.data;
};

// Create a new diary
export const createDiary = async (title: string) => {
  const res = await api.post('/diaries', { title });
  return res.data;
};

// Add a new entry to a diary
export const addDiaryEntry = async (diaryId: string, entry: Record<string, any>) => {
  const res = await api.post(`/diaries/${diaryId}/entries`, entry);
  return res.data;
};

export default api;
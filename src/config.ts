// Centralized API URL configuration
// Priority:
// 1. Vite env var VITE_API_URL (set during build / dev)
// 2. In production, default to window.location.origin (same origin deployment)
// 3. Fallback to localhost dev backend

export const API_URL: string = (import.meta.env as any).VITE_API_URL ||
  ((import.meta.env.MODE === 'production')
    ? (typeof window !== 'undefined' ? window.location.origin : 'https://shyro.ovh')
    : 'http://localhost:3001');

export default API_URL;

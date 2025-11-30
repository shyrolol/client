// Centralized API URL configuration
// Priority:
// 1. Vite env var VITE_API_URL (set during build / dev)
// 2. In production, default to window.location.origin (same origin deployment)
// 3. Fallback to localhost dev backend

const baseURL: string = (import.meta.env as any).VITE_API_URL || 'https://shyro.ovh';

// API_URL always includes /api prefix for all endpoint calls
export const API_URL: string = `${baseURL}/api`;

// Base origin for Socket.IO connection (no /api prefix)
export const BASE_URL: string = baseURL;

export default API_URL;

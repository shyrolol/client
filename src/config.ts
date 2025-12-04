const baseURL: string = (import.meta.env as any).VITE_API_URL || 'http://localhost:3001';
export const API_URL: string = `${baseURL}/api`;
export const BASE_URL: string = baseURL;

export default API_URL;

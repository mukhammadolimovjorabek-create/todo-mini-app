/**
 * Application Global Configuration
 */
const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://todo-mini-app-cwkd.onrender.com').replace(/\/+$/, '');

export const API_BASE_URL = rawApiUrl;
export const WS_BASE_URL = rawApiUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

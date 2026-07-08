import axios from 'axios';
import { getTenantHeaders, tenantStorageKey } from '@/lib/tenant';
import { safeStorage } from '@/lib/storage';
import { normalizeApiUrl } from '@/api/apiUrl';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const url = typeof config.url === 'string' ? config.url : '';
    config.url = normalizeApiUrl(url, API_URL);

    // Get token directly from storage to avoid circular dependency with authService
    const token = safeStorage.getItem(tenantStorageKey("access_token")) || safeStorage.getItem("access_token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantHeaders = getTenantHeaders();
    Object.assign(config.headers, tenantHeaders);

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., redirect to login or refresh token)
      console.error('Unauthorized access - potential token expiration');
      safeStorage.removeItem(tenantStorageKey("access_token"));
      safeStorage.removeItem(tenantStorageKey("refresh_token"));
      if (window.location.pathname !== '/signin') {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

const ensureApiV1 = (url: string): string => {
  let cleanUrl = url.trim().replace(/\/+$/, '');
  if (cleanUrl.endsWith('/api/v1')) {
    return cleanUrl;
  }
  if (cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/v1`;
  }
  return `${cleanUrl}/api/v1`;
};

const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // 1. If envUrl is explicitly provided and is a remote URL (e.g. Vercel/Render), normalize and use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return ensureApiV1(envUrl);
  }

  // 2. Detect Expo Dev Server host IP for physical devices / Expo Go on LAN
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000/api/v1`;
    }
  }

  // 3. Android emulator fallback (10.0.2.2 connects to host machine's localhost)
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }

  // 4. Default fallback to envUrl or localhost for web/iOS simulator
  return ensureApiV1(envUrl || 'http://localhost:5000');
};

export const api: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor: inject Supabase Auth JWT token dynamically on every request
api.interceptors.request.use(
  async (config) => {
    // If data is FormData, remove default application/json header so browser/Axios sets boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      console.warn('[API Interceptor] Token retrieval failed:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor state for handling concurrent 401 token refreshes
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: 401 INVALID_TOKEN retry and session refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;

    // Check if error is 401 or INVALID_TOKEN and hasn't been retried yet
    if ((status === 401 || code === 'INVALID_TOKEN') && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !data.session) {
          processQueue(refreshError || new Error('Session refresh failed'), null);
          await supabase.auth.signOut();
          const customError = {
            status: 401,
            code: 'INVALID_TOKEN',
            message: 'Session expired. Please sign in again.',
          };
          return Promise.reject(customError);
        }

        const newToken = data.session.access_token;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (err: any) {
        processQueue(err, null);
        await supabase.auth.signOut();
        const customError = {
          status: 401,
          code: 'INVALID_TOKEN',
          message: 'Session expired. Please sign in again.',
        };
        return Promise.reject(customError);
      } finally {
        isRefreshing = false;
      }
    }

    console.log('[RAW_BACKEND_ERROR_RESPONSE]', {
      status: error.response?.status,
      rawData: error.response?.data,
      headers: error.response?.headers,
    });

    const customError = {
      status: error.response?.status || 500,
      code: error.response?.data?.error?.code || (typeof error.response?.data?.error === 'string' ? 'BAD_REQUEST' : 'NETWORK_ERROR'),
      message: (typeof error.response?.data?.error === 'string' ? error.response?.data?.error : error.response?.data?.error?.message) || error.message || 'An unexpected error occurred.',
    };
    return Promise.reject(customError);
  }
);

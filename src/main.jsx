import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import axios from 'axios';
import App from './App.jsx';
import './index.css';

// Ensure httpOnly cookies (refreshToken) are sent with every request automatically.
// This is required for the server to read req.cookies.refreshToken on /refresh-token.
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Only attempt refresh on 401 Unauthorized, and only once per request, and not for refresh-token or login requests
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes('/auth/refresh-token') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Queue requests that come in while a refresh is already in flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // The httpOnly refreshToken cookie is sent automatically by the browser.
        // We do NOT read it from localStorage — it's invisible to JavaScript.
        const res = await axios.post('/api/v1/auth/refresh-token', {}, {
          withCredentials: true,
        });

        if (res.data?.data?.accessToken) {
          const newAccessToken = res.data.data.accessToken;
          // Only the access token lives in localStorage (for Authorization header).
          // The new rotated refresh token is set as an httpOnly cookie by the server.
          localStorage.setItem('accessToken', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          isRefreshing = false;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        const refreshStatus = refreshError?.response?.status;
        // Only log out on genuine 401 (refresh token expired/invalid).
        // 429, 500, or network errors are transient — keep the session alive.
        if (refreshStatus === 401 || !refreshStatus) {
          console.error('Session expired, logging out:', refreshError);
          localStorage.removeItem('accessToken');
          // Note: refreshToken cookie is cleared server-side on logout.
          // We don't need to (and can't) touch it from JavaScript.
          window.location.href = '/login';
        } else {
          console.warn('Token refresh failed temporarily (status ' + refreshStatus + '), will retry on next request.');
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);

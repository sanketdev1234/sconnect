// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App.jsx';
import { UserContextProvider } from './components/usercontext.jsx';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// ── Global Axios Config ───────────────────────────────────────────────────────
// VITE_API_URL is set to "/api" in Vercel env vars → Vercel proxies to Render
// In local dev, VITE_API_URL is not set → falls back to localhost:8080 directly
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ── Global Axios Error Interceptor ────────────────────────────────────────────
// Catches 401 across the whole app — redirects to login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on an auth page
      const authPages = ['/login', '/signup', '/', '/landingpage'];
      if (!authPages.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserContextProvider>
        <App />
      </UserContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);
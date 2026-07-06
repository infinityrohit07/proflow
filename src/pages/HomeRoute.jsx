import { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import axios from 'axios';
import LandingPage from './LandingPage.jsx';

export default function HomeRoute() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'auth' | 'guest'

  useEffect(() => {
    // Quick auth probe: if no access token in localStorage, skip the network call entirely
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setStatus('guest');
      return;
    }

    // We have a token — verify it's still valid
    axios.get('/api/v1/auth/current-user', {
      // Pass token manually so the interceptor logic doesn't interfere
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => setStatus('auth'))
      .catch(() => {
        // Token was invalid/expired — clear it and show landing page
        localStorage.removeItem('accessToken');
        setStatus('guest');
      });
  }, []);

  if (status === 'checking') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#070a13] text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return status === 'auth' ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

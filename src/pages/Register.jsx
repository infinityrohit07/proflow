import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import axios from 'axios';
import { Mail, Lock, User, UserCircle, Sparkles } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Register() {
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/v1/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col md:grid md:grid-cols-2 font-sans relative overflow-hidden">
      {/* Background radial gradient blooms */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Left Column: Potential User Branding/Content */}
      <div className="hidden md:flex flex-col justify-between p-12 lg:p-16 z-10 border-r border-white/5 relative bg-[#090d1a]/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm shadow-indigo-600/30">
            P
          </div>
          <span className="text-white font-bold tracking-tight text-lg">ProFlow Workspace</span>
        </div>

        <div className="my-auto max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Join modern developer teams</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Start building in seconds.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Create an account to centralize your task planning, coordinate columns, configure SMTP alerts, and leverage integrated security benchmarks out of the box.
          </p>
          <div className="flex items-center gap-4 text-slate-500 text-xs font-bold uppercase tracking-wider pt-2">
            <span>Free Tier</span>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/50" />
            <span>Uncapped Projects</span>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/50" />
            <span>Secure Access</span>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} ProFlow Workspace. All rights reserved.
        </div>
      </div>

      {/* Right Column: Register Card */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-16 z-10 overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Brand Banner */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <div className="h-12 w-12 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/30">
              P
            </div>
            <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white">
              ProFlow Workspace
            </h2>
            <p className="mt-1 text-center text-sm text-slate-400">
              Get started with ProFlow Workspace today.
            </p>
          </div>

          <div className="glass-card py-8 px-6 sm:px-10 rounded-2xl border border-white/5 shadow-2xl">
            {/* Register Header (Desktop inside card) */}
            <div className="hidden md:block mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Create your account
              </h2>
              <p className="mt-1.5 text-sm text-slate-400">
                Get started with ProFlow Workspace today.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 text-red-400 p-3.5 rounded-xl text-sm font-semibold border border-red-500/20">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    className="block w-full pl-11 pr-4 py-3 glass-input rounded-xl text-sm focus:outline-none placeholder-slate-650"
                    placeholder="Alex Morgan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserCircle className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="block w-full pl-11 pr-4 py-3 glass-input rounded-xl text-sm focus:outline-none placeholder-slate-650"
                    placeholder="alexmorgan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full pl-11 pr-4 py-3 glass-input rounded-xl text-sm focus:outline-none placeholder-slate-650"
                    placeholder="alex@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full pl-11 pr-4 py-3 glass-input rounded-xl text-sm focus:outline-none placeholder-slate-650"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-2 border border-white/10 active:scale-[0.98] mt-2"
              >
                {loading ? 'Registering...' : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Sign up
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#0d1322] text-slate-400 rounded-full py-0.5 border border-white/5">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-4 mb-6">
              <button
                onClick={() => window.location.href = '/api/v1/auth/google'}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-white/10 rounded-xl shadow-sm text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 transition-all cursor-pointer hover:shadow-indigo-500/5 active:scale-[0.98]"
              >
                <GoogleIcon />
                Sign up with Google
              </button>
            </div>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#0d1322] text-slate-400 rounded-full py-0.5 border border-white/5">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-4">
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-white/5 rounded-xl shadow-sm text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 transition-all"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

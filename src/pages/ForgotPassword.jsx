import { useState } from 'react';
import { Link } from 'react-router';
import axios from 'axios';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await axios.post('/api/v1/auth/forgot-password', { email });
      setMessage(res.data?.message || 'If that account exists, a recovery link has been dispatched.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background radial gradient blooms */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/30">
            P
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-white glow-text-indigo">
          Recover Password
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your email below to receive a password reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="glass-card py-8 px-6 sm:px-10 rounded-2xl border border-white/5 shadow-2xl">
          {message ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-emerald-400 animate-bounce" />
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl text-sm font-semibold border border-emerald-500/20">
                {message}
              </div>
              <p className="text-xs text-slate-400">
                Please check your inbox (and spam folder) for the password recovery link. For local development, the reset link is printed to the server terminal.
              </p>
              <div className="pt-2 border-t border-white/5">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Log In
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 text-red-400 p-3.5 rounded-xl text-sm font-semibold border border-red-500/20">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 glass-input rounded-xl text-sm focus:outline-none placeholder-slate-600"
                    placeholder="alex@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-2 border border-white/10 active:scale-[0.98]"
              >
                {loading ? 'Sending link...' : 'Send Recovery Link'}
              </button>

              <div className="flex justify-center pt-2 border-t border-white/5">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  Back to Log In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User as UserIcon, Briefcase, Mail, ShieldAlert, Sparkles, Sun, Moon, Check, Award, Layout, CheckCircle2, Clock, Activity } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [themePref, setThemePref] = useState('light');
  const [aiTone, setAiTone] = useState('professional');
  const [aiInstructions, setAiInstructions] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, statsRes, activitiesRes] = await Promise.all([
          axios.get('/api/v1/auth/current-user'),
          axios.get('/api/v1/dashboard'),
          axios.get('/api/v1/auth/activities').catch(() => ({ data: { data: [] } }))
        ]);
        const data = userRes.data.data;
        setUser(data);
        setFullname(data.fullname || '');
        setEmail(data.email || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setJobTitle(data.jobTitle || '');
        setThemePref(data.themePreference || 'light');
        setAiTone(data.aiPreference?.tone || 'professional');
        setAiInstructions(data.aiPreference?.instructions || '');
        setStats(statsRes.data.data);
        setActivities(activitiesRes.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: 'Saving changes...', type: 'info' });
    try {
      const formData = new FormData();
      formData.append('fullname', fullname);
      formData.append('email', email);
      formData.append('username', username);
      formData.append('bio', bio);
      formData.append('jobTitle', jobTitle);
      formData.append('themePreference', themePref);
      formData.append('aiTone', aiTone);
      formData.append('aiInstructions', aiInstructions);
      formData.append('removeAvatar', removeAvatar);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await axios.put('/api/v1/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUser(res.data.data);
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      setAvatarFile(null);
      setRemoveAvatar(false);

      // Sync root html theme
      localStorage.setItem('theme', themePref);
      if (themePref === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      setTimeout(() => setProfileMsg({ text: '', type: '' }), 3000);
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.message || 'Update failed', type: 'error' });
    }
  };

  const handleThemeToggleClick = (selected) => {
    setThemePref(selected);
    if (selected === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassMsg({ text: 'Updating password...', type: 'info' });
    try {
      await axios.put('/api/v1/auth/password', { oldPassword, newPassword });
      setPassMsg({ text: 'Password updated successfully', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setPassMsg({ text: '', type: '' }), 3000);
    } catch (err) {
      setPassMsg({ text: err.response?.data?.message || 'Password update failed', type: 'error' });
    }
  };

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Profile Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your identity, visual preference, stats, and personalized AI configurations.</p>
      </div>

      {/* Stats Summary Banner */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Projects</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{stats.totalProjects}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasks Done</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{stats.completedTasks}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Tasks</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{stats.tasksInProgress}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <form onSubmit={handleProfileUpdate} className="lg:col-span-2 space-y-8">
        {/* Personal Details Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Personal Information</h2>
            {profileMsg.text && (
              <span className={`text-xs font-semibold ${
                profileMsg.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'
              }`}>{profileMsg.text}</span>
            )}
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-6">
              {!removeAvatar && (avatarFile || user?.avatar?.url) ? (
                <img src={avatarFile ? URL.createObjectURL(avatarFile) : user.avatar.url} alt="" className="w-20 h-20 rounded-full object-cover border border-slate-200 dark:border-slate-800 shadow-sm" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold border border-slate-200 dark:border-slate-800 shadow-inner">
                  {fullname?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avatar Image</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setAvatarFile(e.target.files[0]);
                        setRemoveAvatar(false);
                      }
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-slate-800 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-slate-800 cursor-pointer"
                  />
                  {(!removeAvatar && (avatarFile || user?.avatar?.url)) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null);
                        setRemoveAvatar(true);
                      }}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Professional Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Short Bio</label>
                <textarea
                  placeholder="Tell your team about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-660 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Theme Preference Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Theme Preference</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <button
                type="button"
                onClick={() => handleThemeToggleClick('light')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  themePref === 'light'
                    ? 'bg-indigo-50/50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
                }`}
              >
                <Sun className="w-5 h-5" />
                Light Theme
                {themePref === 'light' && <Check className="w-4 h-4 ml-auto" />}
              </button>
              <button
                type="button"
                onClick={() => handleThemeToggleClick('dark')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  themePref === 'dark'
                    ? 'bg-indigo-50/50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
                }`}
              >
                <Moon className="w-5 h-5" />
                Dark Theme
                {themePref === 'dark' && <Check className="w-4 h-4 ml-auto" />}
              </button>
            </div>
          </div>
        </div>

        {/* AI Assistant customization */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">AI Assistant Personalization (Gemini)</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-3">AI Response Tone</label>
              <div className="flex flex-wrap gap-3">
                {['professional', 'casual', 'concise'].map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setAiTone(tone)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border capitalize transition-all cursor-pointer ${
                      aiTone === tone
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Custom AI Instructions</label>
              <textarea
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                placeholder="Example: Keep explanations brief, do not list tech names, prepend tasks with an emoji..."
                className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 resize-none"
                rows={3}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">These system instructions will be appended to the AI prompts when compiling notes summaries and generating task checklists.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all text-sm cursor-pointer"
          >
            Save All Settings
          </button>
        </div>
        </form>

        {/* Right Column: Personal Activities and Security */}
        <div className="space-y-8">
          {/* My Activity Log */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">My Activity Log</h2>
            </div>
            <div className="p-5 overflow-y-auto max-h-[350px] custom-scrollbar">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6 font-semibold">No recent actions recorded.</p>
              ) : (
                <div className="relative border-l border-slate-150 dark:border-slate-800 pl-4 ml-2 space-y-5">
                  {activities.map((act) => (
                    <div key={act._id} className="relative group">
                      <span className="absolute -left-[25px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[8px] font-bold">
                        •
                      </span>
                      <div className="text-xs text-slate-650 dark:text-slate-400">
                        {act.description}
                        {act.project && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold block mt-0.5">
                            Project: {act.project.name}
                          </span>
                        )}
                        <span className="block text-[10px] text-slate-450 dark:text-slate-550 mt-0.5">
                          {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Security & Password</h2>
              {passMsg.text && (
                <span className={`text-xs font-semibold ${
                  passMsg.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                }`}>{passMsg.text}</span>
              )}
            </div>
            <div className="p-6">
              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-850 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all text-sm cursor-pointer w-full"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

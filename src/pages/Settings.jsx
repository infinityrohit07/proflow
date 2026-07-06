import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router';
import { 
  User as UserIcon, Mail, Lock, Sparkles, Sun, Moon, Check, Award, Layout, 
  CheckCircle2, Clock, Bell, Bot, ShieldAlert, Monitor, Globe, Settings as SettingsIcon, Camera,
  Github, Linkedin, Twitter, Link as LinkIcon, Smartphone
} from 'lucide-react';

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Profile fields
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Social fields
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');

  // Appearance fields
  const [themePref, setThemePref] = useState('light');
  const [accentColor, setAccentColor] = useState('indigo');
  const [layoutDensity, setLayoutDensity] = useState('comfortable');

  // Security fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });
  const [sessions, setSessions] = useState([]);

  const showProfileMsg = (text, type = 'success') => {
    setProfileMsg({ text, type });
    setTimeout(() => {
      setProfileMsg(prev => prev.text === text ? { text: '', type: '' } : prev);
    }, 4000);
  };

  const showPassMsg = (text, type = 'success') => {
    setPassMsg({ text, type });
    setTimeout(() => {
      setPassMsg(prev => prev.text === text ? { text: '', type: '' } : prev);
    }, 4000);
  };

  useEffect(() => {
    setProfileMsg({ text: '', type: '' });
    setPassMsg({ text: '', type: '' });
  }, [activeTab]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/v1/auth/sessions');
      setSessions(res.data.data || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      const res = await axios.delete(`/api/v1/auth/sessions/${sessionId}`);
      if (res.data?.data?.loggedOut) {
        window.location.href = '/login';
      } else {
        fetchSessions();
      }
    } catch (err) {
      console.error("Error revoking session:", err);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      await axios.delete('/api/v1/auth/sessions/other');
      fetchSessions();
    } catch (err) {
      console.error("Error revoking all other sessions:", err);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Google account?")) return;
    try {
      const res = await axios.post('/api/v1/auth/google/unlink');
      setUser(res.data.data);
      showPassMsg('Google account successfully disconnected', 'success');
    } catch (err) {
      showPassMsg(err.response?.data?.message || 'Failed to disconnect Google account', 'error');
    }
  };

  useEffect(() => {
    const connected = searchParams.get('connected');
    const oauthError = searchParams.get('error');
    if (connected) {
      showPassMsg('Google account linked successfully', 'success');
      setSearchParams({ tab: 'security' });
    } else if (oauthError) {
      showPassMsg(oauthError, 'error');
      setSearchParams({ tab: 'security' });
    }
  }, [searchParams]);

  // AI fields
  const [aiTone, setAiTone] = useState('professional');
  const [aiInstructions, setAiInstructions] = useState('');
  const [autoSummarize, setAutoSummarize] = useState(true);
  const [suggestionLevel, setSuggestionLevel] = useState('medium');

  // Notification fields
  const [taskUpdates, setTaskUpdates] = useState(true);
  const [projectDigest, setProjectDigest] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Tab switching helper
  const setActiveTab = (tabName) => {
    setSearchParams({ tab: tabName });
    setProfileMsg({ text: '', type: '' });
    setPassMsg({ text: '', type: '' });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/v1/auth/current-user');
        const data = res.data.data;
        setUser(data);
        setFullname(data.fullname || '');
        setEmail(data.email || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setJobTitle(data.jobTitle || '');
        setThemePref(data.themePreference || 'light');
        setAccentColor(data.accentColor || 'indigo');
        setLayoutDensity(data.layoutDensity || 'comfortable');
        
        // Social links
        setGithub(data.socialLinks?.github || '');
        setLinkedin(data.socialLinks?.linkedin || '');
        setTwitter(data.socialLinks?.twitter || '');
        setWebsite(data.socialLinks?.website || '');

        // AI Preferences
        setAiTone(data.aiPreference?.tone || 'professional');
        setAiInstructions(data.aiPreference?.instructions || '');
        setAutoSummarize(data.aiPreference?.autoSummarize ?? true);
        setSuggestionLevel(data.aiPreference?.suggestionLevel || 'medium');

        // Notification Preferences
        setTaskUpdates(data.notifications?.taskUpdates ?? true);
        setProjectDigest(data.notifications?.projectDigest ?? true);
        setWeeklyDigest(data.notifications?.weeklyDigest ?? true);

        // Sessions
        await fetchSessions();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      setThemePref(localStorage.getItem('theme') || 'light');
    };
    window.addEventListener('theme-changed-externally', handleThemeChange);
    return () => {
      window.removeEventListener('theme-changed-externally', handleThemeChange);
    };
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });
    
    const formData = new FormData();
    formData.append('fullname', fullname);
    formData.append('email', email);
    formData.append('username', username);
    formData.append('bio', bio);
    formData.append('jobTitle', jobTitle);
    formData.append('socialLinks', JSON.stringify({ github, linkedin, twitter, website }));
    
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const res = await axios.put('/api/v1/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(res.data.data);
      showProfileMsg('Profile details saved successfully!', 'success');
      window.dispatchEvent(new Event('user-settings-updated'));
    } catch (err) {
      showProfileMsg(err.response?.data?.message || 'Update failed', 'error');
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });

    try {
      const res = await axios.put('/api/v1/auth/profile', {
        themePreference: themePref,
        accentColor,
        layoutDensity,
        aiPreference: {
          tone: aiTone,
          instructions: aiInstructions,
          autoSummarize,
          suggestionLevel
        },
        notifications: {
          taskUpdates,
          projectDigest,
          weeklyDigest
        }
      });
      setUser(res.data.data);
      showProfileMsg('Preferences updated successfully!', 'success');
      window.dispatchEvent(new Event('user-settings-updated'));

      // Apply theme class immediately
      if (themePref === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (err) {
      showProfileMsg(err.response?.data?.message || 'Update failed', 'error');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassMsg({ text: '', type: '' });
    try {
      await axios.put('/api/v1/auth/password', { oldPassword, newPassword });
      showPassMsg('Password changed successfully!', 'success');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      showPassMsg(err.response?.data?.message || 'Update failed', 'error');
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm("Are you sure you want to remove your avatar?")) return;
    try {
      const res = await axios.put('/api/v1/auth/profile', { removeAvatar: 'true' });
      setUser(res.data.data);
      setAvatarPreview('');
      setAvatarFile(null);
      showProfileMsg('Avatar removed successfully!', 'success');
      window.dispatchEvent(new Event('user-settings-updated'));
    } catch (err) {
      showProfileMsg(err.response?.data?.message || 'Failed to remove avatar', 'error');
    }
  };

  const accentColors = [
    { name: 'indigo', hex: 'bg-indigo-600 ring-indigo-500', label: 'Indigo' },
    { name: 'violet', hex: 'bg-violet-600 ring-violet-400', label: 'Violet' },
    { name: 'emerald', hex: 'bg-emerald-600 ring-emerald-400', label: 'Emerald' },
    { name: 'rose', hex: 'bg-rose-600 ring-rose-400', label: 'Rose' },
    { name: 'amber', hex: 'bg-amber-600 ring-amber-400', label: 'Amber' }
  ];

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">Loading settings...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Page Header */}
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-indigo-500" />
          Settings Panel
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your visual profile, workspace layouts, notification updates, and personal AI capabilities.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">

        {/* Top Feedback Banner */}
          {profileMsg.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
              profileMsg.type === 'success' 
                ? 'bg-green-50/50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400'
                : 'bg-rose-50/50 border-rose-200 text-rose-750 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-450'
            }`}>
              {profileMsg.text}
            </div>
          )}

          {/* TAB: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">Personal Profile Details</h2>
                </div>
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-850">
                    <div className="relative group">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="h-20 w-20 rounded-full border border-slate-200 dark:border-slate-700 object-cover shadow-sm" />
                      ) : user.avatar?.url ? (
                        <img src={user.avatar.url} alt="Avatar" className="h-20 w-20 rounded-full border border-slate-200 dark:border-slate-700 object-cover shadow-sm" />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-2xl">
                          {fullname.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <label className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700">
                        Choose Photo
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </label>
                      {user.avatar?.url && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900 transition-all cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
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
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        placeholder="e.g. Front-end Engineer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Short Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      rows={3}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-150 dark:border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Username</label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Connections */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">Social Connections</h2>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">GitHub Profile URL</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Github className="h-4 w-4 text-slate-450" />
                        </div>
                        <input
                          type="url"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          placeholder="https://github.com/yourusername"
                          className="w-full border border-slate-350 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">LinkedIn Profile URL</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Linkedin className="h-4 w-4 text-slate-450" />
                        </div>
                        <input
                          type="url"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/in/yourusername"
                          className="w-full border border-slate-350 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Twitter / X URL</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Twitter className="h-4 w-4 text-slate-450" />
                        </div>
                        <input
                          type="url"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          placeholder="https://x.com/yourusername"
                          className="w-full border border-slate-350 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Personal Website</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LinkIcon className="h-4 w-4 text-slate-450" />
                        </div>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://yourwebsite.com"
                          className="w-full border border-slate-350 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all text-sm cursor-pointer"
                >
                  Save Profile Details
                </button>
              </div>
            </form>
          )}

          {/* TAB: APPEARANCE & THEME */}
          {activeTab === 'appearance' && (
            <form onSubmit={handlePreferencesUpdate} className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">Theme & Layout Appearance</h2>
                </div>
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Theme preference */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Color Mode Theme</label>
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                      <button
                        type="button"
                        onClick={() => {
                          setThemePref('light');
                          document.documentElement.classList.remove('dark');
                          localStorage.setItem('theme', 'light');
                          window.dispatchEvent(new Event('theme-changed-externally'));
                        }}
                        className={`flex items-center justify-center gap-2.5 p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                          themePref === 'light'
                            ? 'border-indigo-600 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        <Sun className="w-5 h-5" />
                        Light Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setThemePref('dark');
                          document.documentElement.classList.add('dark');
                          localStorage.setItem('theme', 'dark');
                          window.dispatchEvent(new Event('theme-changed-externally'));
                        }}
                        className={`flex items-center justify-center gap-2.5 p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                          themePref === 'dark'
                            ? 'border-indigo-600 bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        <Moon className="w-5 h-5" />
                        Dark Mode
                      </button>
                    </div>
                  </div>

                  {/* Accent Color picker */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-855">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Primary Accent Theme</label>
                    <div className="flex flex-wrap gap-4">
                      {accentColors.map(color => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => {
                            setAccentColor(color.name);
                            window.dispatchEvent(new CustomEvent('accent-preview-updated', { detail: color.name }));
                          }}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm relative ${color.hex} ${
                            accentColor === color.name ? 'ring-4 scale-105 shadow-md' : 'hover:scale-105'
                          }`}
                          title={color.label}
                        >
                          {accentColor === color.name && <Check className="w-5 h-5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout Density */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-855">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Layout Density</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                      {[
                        { id: 'comfortable', title: 'Comfortable spacing', desc: 'Standard paddings and rows layout' },
                        { id: 'compact', title: 'Compact details', desc: 'Reduced paddings to view more tasks in lists' }
                      ].map(density => (
                        <button
                          key={density.id}
                          type="button"
                          onClick={() => {
                            setLayoutDensity(density.id);
                            window.dispatchEvent(new CustomEvent('density-preview-updated', { detail: density.id }));
                          }}
                          className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all cursor-pointer ${
                            layoutDensity === density.id
                              ? 'border-indigo-600 bg-indigo-50/20 text-slate-900 dark:text-white ring-2 ring-indigo-500/20'
                              : 'border-slate-250 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          <span className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                            {layoutDensity === density.id && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                            {density.title}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">{density.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all text-sm cursor-pointer"
                >
                  Save Appearance Preferences
                </button>
              </div>
            </form>
          )}

          {/* TAB: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password update form */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">Security & Password</h2>
                  {passMsg.text && (
                    <span className={`text-xs font-semibold ${
                      passMsg.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-rose-500'
                    }`}>{passMsg.text}</span>
                  )}
                </div>
                <div className="p-4 sm:p-6">
                  <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all text-sm cursor-pointer"
                      >
                        Change Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Google integration card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">Google Integration</h2>
                </div>
                <div className="p-4 sm:p-6">
                  {user?.googleId ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Connected to Google</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 break-words">Your Google account is linked to ProFlow for instant social sign-in.</p>
                        </div>
                      </div>
                      <button
                        onClick={handleUnlinkGoogle}
                        className="self-end sm:self-auto text-xs text-rose-500 hover:text-rose-600 dark:text-rose-450 font-bold border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Google Account</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 break-words">Link your Google account to enable instant single click sign-in.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.location.href = '/api/v1/auth/google'}
                        className="self-end sm:self-auto text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        Link Account
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Sessions list */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955/40">
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">Active Sessions Logs</h2>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Below is a list of devices and IPs currently logged in. You can revoke session access logs to protect your workspace security.
                  </p>
                  
                  <div className="space-y-3">
                    {sessions.map((sess) => (
                      <div 
                        key={sess._id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border rounded-xl gap-3 transition-all ${
                          sess.isCurrent 
                            ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/30' 
                            : 'border-slate-100 dark:border-slate-850/60 bg-slate-50/20 dark:bg-slate-955/10 opacity-75'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {sess.device.toLowerCase().includes('phone') || sess.device.toLowerCase().includes('android') ? (
                            <Smartphone className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                          ) : sess.device.toLowerCase().includes('desktop') || sess.device.toLowerCase().includes('macbook') || sess.device.toLowerCase().includes('windows') ? (
                            <Monitor className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                          ) : (
                            <Globe className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{sess.device}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 break-words">
                              IP: {sess.ip} • {sess.location} <br className="sm:hidden" />• {sess.isCurrent ? 'Current session' : `Last active ${new Date(sess.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                            </p>
                          </div>
                        </div>
                        <div className="self-end sm:self-auto shrink-0">
                          {sess.isCurrent ? (
                            <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                              Active
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRevokeSession(sess._id)}
                              className="text-[11px] text-rose-500 hover:text-rose-600 dark:text-rose-450 font-bold hover:underline cursor-pointer"
                            >
                              Log out
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {sessions.length === 0 && (
                      <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-4">No active sessions found.</p>
                    )}
                  </div>

                  <div className="pt-3 flex justify-end">
                    {sessions.length > 1 && (
                      <button
                        onClick={handleRevokeAllOtherSessions}
                        className="bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer border border-transparent dark:border-slate-700"
                      >
                        Sign Out of All Other Devices
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI ASSISTANT CUSTOMIZATION */}
          {activeTab === 'ai' && (
            <form onSubmit={handlePreferencesUpdate} className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">Personalized AI preferences (Gemini)</h2>
                </div>
                <div className="p-4 sm:p-6 space-y-6">
                  {/* AI response tone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">AI assistant reply tone</label>
                    <div className="flex flex-wrap gap-2">
                      {['professional', 'casual', 'concise'].map((tone) => (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => setAiTone(tone)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                            aiTone === tone
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI instructions */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Custom AI system instructions</label>
                    <textarea
                      value={aiInstructions}
                      onChange={(e) => setAiInstructions(e.target.value)}
                      placeholder="Example: Keep explanations brief, do not list technical names, prepend checklist tasks with a checklist emoji..."
                      className="w-full border border-slate-350 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      rows={4}
                    />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                      These parameters will be injected to Gemini models when compiling notes summaries, generating project checklists, and rendering reports.
                    </p>
                  </div>

                  {/* Summarize Toggle */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-855 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Auto-Summarize Project Notes</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 break-words">Let Gemini automatically compile executive summaries for all newly created project note boards.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={autoSummarize}
                        onChange={(e) => setAutoSummarize(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* AI Suggestion Level */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-855">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">AI Suggestion Frequency</label>
                    <div className="flex gap-2">
                      {['low', 'medium', 'high'].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSuggestionLevel(level)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border ${
                            suggestionLevel === level
                              ? 'bg-indigo-50/20 border-indigo-600 text-indigo-650 dark:text-indigo-400 font-extrabold ring-1 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all text-sm cursor-pointer"
                >
                  Save AI Preferences
                </button>
              </div>
            </form>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <form onSubmit={handlePreferencesUpdate} className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">System & Update Notifications</h2>
                </div>
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Task updates toggle */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Task updates & assignments</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 break-words">Receive immediate notifications when you are assigned or mentioned in project tasks.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={taskUpdates}
                        onChange={(e) => setTaskUpdates(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Project Activity digest */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-855 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Project logs digest summary</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 break-words">Receive an automated digest of team activity logs for projects you coordinate.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={projectDigest}
                        onChange={(e) => setProjectDigest(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Weekly email analytics digest */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-855 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Weekly team analytics reports</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 break-words">Receive a weekly email report of the leaderboard standings and project status metrics.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={weeklyDigest}
                        onChange={(e) => setWeeklyDigest(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all text-sm cursor-pointer"
                >
                  Save Notification Preferences
                </button>
              </div>
            </form>
          )}
      </div>
    </div>
  );
}

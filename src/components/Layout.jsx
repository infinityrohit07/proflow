import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import { LogOut, Home, FolderKanban, Users, Calendar, Search, Bell, Sun, Moon, Activity, User, Sparkles, Lock, Bot, Menu, X } from 'lucide-react';
import axios from 'axios';
import { useState, useEffect, memo } from 'react';
import { UserContext } from './UserContext.jsx';
import { WorkspaceProvider } from './WorkspaceContext.jsx';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [previewAccent, setPreviewAccent] = useState(null);
  const [previewDensity, setPreviewDensity] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname, location.search]);

  const colorsMap = {
    indigo: { 50: '#e0e7ff', 100: '#c7d2fe', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3' },
    violet: { 50: '#f5f3ff', 100: '#ede9fe', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6' },
    emerald: { 50: '#ecfdf5', 100: '#d1fae5', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46' },
    rose: { 50: '#fff1f2', 100: '#ffe4e6', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239' },
    amber: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e' }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('theme') || 'light');
    };
    window.addEventListener('theme-changed-externally', handleThemeChange);
    return () => {
      window.removeEventListener('theme-changed-externally', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const handleAccentPreview = (e) => {
      setPreviewAccent(e.detail);
    };

    const handleDensityPreview = (e) => {
      setPreviewDensity(e.detail);
    };

    window.addEventListener('accent-preview-updated', handleAccentPreview);
    window.addEventListener('density-preview-updated', handleDensityPreview);
    return () => {
      window.removeEventListener('accent-preview-updated', handleAccentPreview);
      window.removeEventListener('density-preview-updated', handleDensityPreview);
    };
  }, []);

  useEffect(() => {
    const fetchUser = () => {
      axios.get('/api/v1/auth/current-user')
        .then(res => {
          const u = res.data.data;
          setUser(u);
          if (u && u.themePreference) {
            setTheme(u.themePreference);
          }
          setPreviewAccent(null);
          setPreviewDensity(null);
        })
        .catch(err => {
          // Only redirect to login on a real 401 Unauthorized.
          // 429 (rate limit), 500 (server error), network errors, etc.
          // must NOT log the user out — they are still authenticated.
          const status = err?.response?.status;
          if (status === 401) {
            navigate('/login');
          } else {
            console.warn('Could not refresh user profile (status ' + status + '), staying logged in.');
          }
        });
    };

    fetchUser();
    window.addEventListener('user-settings-updated', fetchUser);
    return () => {
      window.removeEventListener('user-settings-updated', fetchUser);
    };
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    // Apply layout density
    const density = previewDensity || user.layoutDensity || 'comfortable';
    if (density === 'compact') {
      document.documentElement.classList.add('density-compact');
      document.documentElement.classList.remove('density-comfortable');
    } else {
      document.documentElement.classList.add('density-comfortable');
      document.documentElement.classList.remove('density-compact');
    }

    // Apply accent color
    const accent = previewAccent || user.accentColor || 'indigo';
    const colors = colorsMap[accent] || colorsMap.indigo;

    let styleEl = document.getElementById('dynamic-accent-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-accent-styles';
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      :root {
        --color-indigo-50: ${colors[50]} !important;
        --color-indigo-100: ${colors[100]} !important;
        --color-indigo-500: ${colors[500]} !important;
        --color-indigo-600: ${colors[600]} !important;
        --color-indigo-650: ${colors[600]} !important;
        --color-indigo-700: ${colors[700]} !important;
        --color-indigo-800: ${colors[800]} !important;
      }
    `;
  }, [user, previewAccent, previewDensity]);

  const fetchUnreadCount = () => {
    axios.get('/api/v1/notifications/unread-count')
      .then(res => {
        setUnreadCount(res.data.data.count);
      })
      .catch(err => console.error("Error fetching unread count:", err));
  };

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    window.addEventListener('notifications-read', fetchUnreadCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-read', fetchUnreadCount);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/auth/logout');
      localStorage.removeItem('accessToken');
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      await axios.put('/api/v1/auth/profile', { themePreference: nextTheme });
      window.dispatchEvent(new Event('user-settings-updated'));
    } catch (err) {
      console.error("Failed to update theme preference in database:", err);
    }
  };

  if (!user) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">Loading...</div>;

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden relative">
      {/* Mobile Sidebar overlay/backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex flex-col shrink-0 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm shadow-indigo-600/30">
              P
            </div>
            <span className="text-slate-950 dark:text-white font-bold tracking-tight text-lg">ProFlow Workspace</span>
          </div>
          {/* Close button for Mobile */}
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-500 font-semibold' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <Home className="w-5 h-5" />
            Dashboard
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-500 font-semibold' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <FolderKanban className="w-5 h-5" />
            Projects
          </NavLink>
          <NavLink
            to="/team"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-500 font-semibold' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <Users className="w-5 h-5" />
            Team Members
          </NavLink>
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-500 font-semibold' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <Calendar className="w-5 h-5" />
            Calendar
          </NavLink>
          
          <NavLink
            to="/activities"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-500 font-semibold' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <Activity className="w-5 h-5" />
            My Activity
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-500 font-semibold' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </NavLink>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 my-4 space-y-1">
            <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Settings</span>
            
            <NavLink
              to="/settings?tab=profile"
              className={() =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  location.search.includes('tab=profile') || (location.pathname.includes('/settings') && !location.search)
                    ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <User className="w-4 h-4" />
              Profile Details
            </NavLink>
            <NavLink
              to="/settings?tab=appearance"
              className={() =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  location.search.includes('tab=appearance')
                    ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <Sparkles className="w-4 h-4" />
              Appearance
            </NavLink>
            <NavLink
              to="/settings?tab=security"
              className={() =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  location.search.includes('tab=security')
                    ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <Lock className="w-4 h-4" />
              Security & Password
            </NavLink>
            <NavLink
              to="/settings?tab=ai"
              className={() =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  location.search.includes('tab=ai')
                    ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <Bot className="w-4 h-4" />
              AI Customization
            </NavLink>
            <NavLink
              to="/settings?tab=notifications"
              className={() =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  location.search.includes('tab=notifications')
                    ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <Bell className="w-4 h-4" />
              Notifications
            </NavLink>
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all rounded-xl text-sm font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger Mobile Toggle Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl sm:w-64 md:w-96 border border-slate-200 dark:border-slate-800">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search tasks or files..."
                className="bg-transparent border-none text-sm focus:ring-0 focus:outline-none w-full text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => navigate('/notifications')}
              className="relative cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 focus:outline-none"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            <div 
              className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-all" 
              onClick={() => navigate('/settings?tab=profile')}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-950 dark:text-white leading-tight">{user.fullname}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">@{user.username}</p>
              </div>
              {user.avatar?.url ? (
                <img src={user.avatar.url} alt={user.username} className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover shadow-sm" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden shadow-inner">
                  {user.fullname.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content — wrapped in UserContext so child pages access user without extra API calls */}
        <div className="p-4 sm:p-8 flex-1 overflow-y-auto flex flex-col relative custom-scrollbar bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <UserContext.Provider value={user}>
            <Outlet />
          </UserContext.Provider>
        </div>
      </main>
    </div>
  );
}

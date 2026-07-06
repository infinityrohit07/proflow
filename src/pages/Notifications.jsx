/**
 * Notifications Dashboard Component
 * 
 * Displays list-based system alerts, updates, and messages for users.
 * Supports marking alerts as read, deletion, routing link redirection, and
 * date-grouped layouts with full size-stability during filter updates.
 */

import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import {
  Bell, CheckCheck, Trash2, ExternalLink, FolderKanban,
  CheckSquare, FileText, Activity, Clock, Inbox
} from 'lucide-react';
import { useWorkspace } from '../components/WorkspaceContext.jsx';

const TYPE_CONFIG = {
  PROJECT_ASSIGNED: {
    icon: FolderKanban,
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    stripe: 'border-l-indigo-500 dark:border-l-indigo-400',
    label: 'Project',
  },
  TASK_ASSIGNED: {
    icon: CheckSquare,
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    stripe: 'border-l-emerald-500 dark:border-l-emerald-400',
    label: 'Task',
  },
  TASK_UPDATED: {
    icon: Activity,
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-450',
    stripe: 'border-l-amber-500 dark:border-l-amber-400',
    label: 'Update',
  },
  NOTE_ADDED: {
    icon: FileText,
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-600 dark:text-sky-400',
    stripe: 'border-l-sky-500 dark:border-l-sky-400',
    label: 'Note',
  },
};

const DEFAULT_TYPE = {
  icon: Bell,
  bg: 'bg-slate-105 dark:bg-slate-850',
  text: 'text-slate-500 dark:text-slate-400',
  stripe: 'border-l-slate-400 dark:border-l-slate-600',
  label: 'Alert',
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const groupByDate = (notifications) => {
  const groups = {};
  notifications.forEach(n => {
    const d = new Date(n.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    let key = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
};

const Notifications = memo(function Notifications() {
  const { cache, getCachedOrFetch, updateCache } = useWorkspace();
  const notifications = cache.notifications || [];
  const loading = !cache.notifications;
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const setNotifications = (newVal) => {
    if (typeof newVal === 'function') {
      updateCache('notifications', newVal(notifications));
    } else {
      updateCache('notifications', newVal);
    }
  };

  const fetchNotifications = async (force = false) => {
    try {
      await getCachedOrFetch('notifications', '/api/v1/notifications', force);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await axios.put('/api/v1/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new Event('notifications-read'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClick = async (n) => {
    if (!n.read) {
      try {
        await axios.put(`/api/v1/notifications/${n._id}/read`);
        window.dispatchEvent(new Event('notifications-read'));
      } catch (err) { console.error(err); }
    }
    if (n.link) navigate(n.link);
    else fetchNotifications();
  };

  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/v1/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      window.dispatchEvent(new Event('notifications-read'));
    } catch (err) { console.error(err); }
  };

  const filtered = notifications.filter(n => filter === 'unread' ? !n.read : true);
  const unreadCount = notifications.filter(n => !n.read).length;
  const groups = groupByDate(filtered);

  const TABS = [
    { id: 'all', label: 'All Alerts', count: notifications.length },
    { id: 'unread', label: 'Unread Only', count: unreadCount },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
              <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Stay updated with your project and task activity.
          </p>
        </div>
      </div>

      {/* Summary Cards Panel */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Alerts</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{loading ? '--' : notifications.length}</p>
          </div>
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
            <Bell className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">Unread</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{loading ? '--' : unreadCount}</p>
          </div>
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 rounded-xl border border-rose-100/50 dark:border-rose-900/30 relative">
            {!loading && unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
            <Inbox className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-slate-50 dark:bg-slate-950/30 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 w-full sm:w-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`w-1/2 sm:w-[130px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                filter === tab.id
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border-slate-200/40 dark:border-slate-700/40'
                  : 'bg-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border-transparent'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                  filter === tab.id
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all border cursor-pointer active:scale-95 self-stretch sm:self-auto ${
            unreadCount > 0
              ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-705 dark:hover:text-indigo-300 border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/40 opacity-100'
              : 'text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed opacity-50'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          Mark all read
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
              <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1">
                <div className="skeleton h-4 w-40 rounded mb-2" />
                <div className="skeleton h-3 w-full rounded mb-1" />
                <div className="skeleton h-3 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-indigo-100/50 dark:border-indigo-900/30">
            <Inbox className="w-10 h-10 text-indigo-550 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">All Caught Up!</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
            {filter === 'unread'
              ? 'No unread notifications right now. Great work!'
              : 'Notifications will appear here as your team collaborates.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([dateLabel, items]) => (
            <div key={dateLabel} className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-full">{items.length} alert{items.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-3">
                {items.map((n, i) => {
                  const cfg = TYPE_CONFIG[n.type] || DEFAULT_TYPE;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n._id}
                      onClick={() => handleClick(n)}
                      className={`group relative flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-2xl border-l-4 transition-all cursor-pointer overflow-hidden ${cfg.stripe} ${
                        n.read
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          : 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100/50 dark:border-indigo-900/30 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20'
                      }`}
                    >
                      {/* Unread indicator dot */}
                      {!n.read && (
                        <span className="absolute top-4 right-4 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                        </span>
                      )}

                      {/* Icon */}
                      <div className={`p-2.5 rounded-xl ${cfg.bg} border border-slate-100/40 dark:border-slate-800 shrink-0 self-start`}>
                        <Icon className={`w-4 h-4 ${cfg.text}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-0 sm:pr-24">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">{n.title}</span>
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border border-slate-100/30 dark:border-slate-800`}>
                            {cfg.label}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">{n.message}</p>
                        
                        {/* Footer Info Row */}
                        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(n.createdAt)}
                          </span>
                          
                          {n.sender && (
                            <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium border-l border-slate-200 dark:border-slate-800 pl-3">
                              {n.sender.avatar?.url ? (
                                <img src={n.sender.avatar.url} alt="" className="w-3.5 h-3.5 rounded-full object-cover border border-white dark:border-slate-800" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[8px] font-extrabold text-indigo-600 dark:text-indigo-400">
                                  {n.sender.fullname?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span>{n.sender.fullname}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions - Desktop absolute right, Mobile inline at bottom */}
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 shrink-0 self-end sm:self-center mt-2 sm:mt-0 sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2">
                        {n.link && (
                          <div className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                        )}
                        <button
                          onClick={(e) => deleteNotification(e, n._id)}
                          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 dark:hover:text-rose-450 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default Notifications;

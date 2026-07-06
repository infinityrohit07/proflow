import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { Activity, Search, Calendar, Folder, CheckCircle, FileText, Plus, Trash2, ArrowRight, Clock, Filter } from 'lucide-react';
import { useWorkspace } from '../components/WorkspaceContext.jsx';

const ACTION_CONFIG = {
  task_create:   { icon: Plus,        bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  task_delete:   { icon: Trash2,      bg: 'bg-rose-50 dark:bg-rose-950/40',    text: 'text-rose-500',    dot: 'bg-rose-500' },
  task_update:   { icon: CheckCircle, bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-500', dot: 'bg-indigo-500' },
  note:          { icon: FileText,    bg: 'bg-amber-50 dark:bg-amber-950/40',   text: 'text-amber-500',  dot: 'bg-amber-500' },
  project:       { icon: Folder,      bg: 'bg-teal-50 dark:bg-teal-950/40',    text: 'text-teal-500',   dot: 'bg-teal-500' },
  default:       { icon: Activity,    bg: 'bg-slate-50 dark:bg-slate-800',      text: 'text-slate-500',  dot: 'bg-slate-400' },
};

const getActionConfig = (action) => {
  const a = action?.toLowerCase() || '';
  if (a.includes('task')) {
    if (a.includes('create')) return ACTION_CONFIG.task_create;
    if (a.includes('delete')) return ACTION_CONFIG.task_delete;
    return ACTION_CONFIG.task_update;
  }
  if (a.includes('note')) return ACTION_CONFIG.note;
  if (a.includes('project')) return ACTION_CONFIG.project;
  return ACTION_CONFIG.default;
};

const groupByDate = (activities) => {
  const groups = {};
  activities.forEach(act => {
    const d = new Date(act.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    const key = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(act);
  });
  return groups;
};

const FILTERS = [
  { id: 'all',      label: 'All Logs' },
  { id: 'tasks',    label: 'Tasks' },
  { id: 'notes',    label: 'Notes' },
  { id: 'projects', label: 'Projects' },
];

const Activities = memo(function Activities() {
  const { cache, getCachedOrFetch } = useWorkspace();
  const activities = cache.activities || [];
  const loading = !cache.activities;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        await getCachedOrFetch('activities', '/api/v1/auth/activities');
      } catch (err) {
        console.error('Failed to load user activities:', err);
      }
    };
    fetchActivities();
  }, []);

  const filtered = activities.filter(act => {
    const matchesSearch =
      act.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.project?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'tasks') return matchesSearch && act.action?.toLowerCase().includes('task');
    if (filterType === 'notes') return matchesSearch && act.action?.toLowerCase().includes('note');
    if (filterType === 'projects') return matchesSearch && act.action?.toLowerCase().includes('project');
    return matchesSearch;
  });

  const groups = groupByDate(filtered);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
              <Activity className="w-6 h-6 text-indigo-500" />
            </div>
            My Activity
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your contributions, updates, and logs across all projects.
          </p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search activities or projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 transition"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 mr-0.5" />
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="skeleton h-9 w-9 rounded-xl shrink-0" />
              <div className="flex-1">
                <div className="skeleton h-4 w-3/4 rounded mb-2" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">No activities found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Activities will appear here as you interact with projects and tasks.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full shadow-sm">
                  <Calendar className="w-3 h-3 text-indigo-500" />
                  <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {dateLabel}
                  </span>
                </div>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 shrink-0">{items.length} event{items.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Timeline */}
              <div className="relative pl-6 ml-3 border-l-2 border-slate-100 dark:border-slate-800 space-y-4">
                {items.map((act, i) => {
                  const cfg = getActionConfig(act.action);
                  const Icon = cfg.icon;
                  return (
                    <div key={act._id} className="relative group">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-3 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${cfg.dot} shadow-sm group-hover:scale-125 transition-transform`} />

                      {/* Card */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl ${cfg.bg} shrink-0`}>
                            <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 justify-between">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                                {act.description}
                              </p>
                              <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap shrink-0">
                                <Clock className="w-3 h-3" />
                                {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {act.project && (
                              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <Folder className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[160px]">
                                    {act.project.name}
                                  </span>
                                </div>
                                <a
                                  href={`/projects/${act.project._id}`}
                                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-colors"
                                >
                                  View <ArrowRight className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
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

export default Activities;

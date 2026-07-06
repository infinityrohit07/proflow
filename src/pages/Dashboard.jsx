import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import CreateProjectModal from '../components/CreateProjectModal.jsx';
import { useUser } from '../components/UserContext.jsx';
import { useWorkspace } from '../components/WorkspaceContext.jsx';
import { Plus, Layers, Target, CheckCircle2, TrendingUp, Folder, ArrowRight, Zap, Clock } from 'lucide-react';

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
    <div className="flex items-center justify-between mb-4">
      <div className="skeleton h-3 w-28 rounded" />
      <div className="skeleton h-8 w-8 rounded-xl" />
    </div>
    <div className="skeleton h-8 w-16 rounded mt-2" />
  </div>
);

const SkeletonProject = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
    <div className="skeleton h-12 w-12 rounded-xl mb-4" />
    <div className="skeleton h-4 w-3/4 rounded mb-2" />
    <div className="skeleton h-3 w-full rounded mb-1" />
    <div className="skeleton h-3 w-2/3 rounded mb-6" />
    <div className="skeleton h-2 w-full rounded-full" />
  </div>
);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const STAT_CARDS = [
  {
    key: 'totalProjects',
    label: 'Total Projects',
    icon: Layers,
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-t-indigo-500',
    badge: null,
  },
  {
    key: 'tasksInProgress',
    label: 'In Progress',
    icon: Target,
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-t-amber-500',
    badge: { label: 'Active', cls: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400' },
  },
  {
    key: 'completedTasks',
    label: 'Completed Tasks',
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-t-emerald-500',
    badge: null,
  },
  {
    key: 'teamVelocity',
    label: 'Team Velocity',
    icon: TrendingUp,
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-t-violet-500',
    badge: { label: 'pts/week', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' },
  },
];

// Memo prevents re-render when Layout's unread-count polling fires (every 15s)
const Dashboard = memo(function Dashboard() {
  const { cache, getCachedOrFetch } = useWorkspace();
  const stats = cache.dashboard;
  const loading = !stats;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Read user from Layout's context — no extra API call needed
  const user = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    getCachedOrFetch('dashboard', '/api/v1/dashboard').catch(err => console.error(err));
  }, []);

  const handleProjectCreated = async () => {
    setIsCreateModalOpen(false);
    try {
      // Force update cache on action
      await getCachedOrFetch('dashboard', '/api/v1/dashboard', true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> {getGreeting()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {user ? `${user.fullname?.split(' ')[0]}'s Dashboard` : 'Dashboard'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {loading
              ? 'Loading your workspace...'
              : `${stats?.tasksInProgress || 0} tasks in progress across ${stats?.totalProjects || 0} projects.`}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto text-sm"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : STAT_CARDS.map((card) => {
              const Icon = card.icon;
              const value = stats?.[card.key] ?? 0;
              return (
                <div
                  key={card.key}
                  className={`bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between card-hover border-t-2 ${card.border}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{card.label}</span>
                    <div className={`p-2 rounded-xl ${card.bg}`}>
                      <Icon className={`w-4 h-4 ${card.text}`} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{value}</span>
                    {card.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badge.cls} mb-0.5 whitespace-nowrap`}>
                        {card.badge.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Active Projects */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          Active Projects
        </h2>
        <button
          onClick={() => navigate('/projects')}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array(3).fill(0).map((_, i) => <SkeletonProject key={i} />)
          : stats?.activeProjects?.map((project) => (
              <div
                key={project._id}
                onClick={() => navigate(`/projects/${project._id}`)}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col cursor-pointer card-hover group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/30 group-hover:scale-110 transition-transform">
                    <Folder className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    project.progress >= 75
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                      : project.progress >= 40
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {project.progress}% done
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-5 line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>
                <div className="mt-auto">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Progress</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full progress-bar-fill"
                      style={{ '--progress-width': `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
        }

        {!loading && (!stats?.activeProjects || stats.activeProjects.length === 0) && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-indigo-400 dark:text-indigo-500" />
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No active projects yet</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 mb-4">Create your first project to get started</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" /> Create Project
            </button>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateProjectModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleProjectCreated}
        />
      )}
    </>
  );
});

export default Dashboard;

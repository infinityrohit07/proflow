import { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { Plus, FolderKanban, Users, Calendar, Search, LayoutGrid, List, Clock } from 'lucide-react';
import { Link } from 'react-router';
import CreateProjectModal from '../components/CreateProjectModal.jsx';
import { useWorkspace } from '../components/WorkspaceContext.jsx';

const PRIORITY_CONFIG = {
  low:      { label: 'Low',      cls: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40', dot: 'bg-emerald-500' },
  medium:   { label: 'Medium',   cls: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/40', dot: 'bg-sky-500' },
  high:     { label: 'High',     cls: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40', dot: 'bg-amber-500' },
  critical: { label: 'Critical', cls: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40', dot: 'bg-rose-500' },
};

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
    <div className="flex items-start justify-between mb-4">
      <div className="skeleton h-12 w-12 rounded-xl" />
      <div className="skeleton h-5 w-16 rounded-full" />
    </div>
    <div className="skeleton h-4 w-3/4 rounded mb-2" />
    <div className="skeleton h-3 w-20 rounded mb-3" />
    <div className="skeleton h-3 w-full rounded mb-1" />
    <div className="skeleton h-3 w-4/5 rounded mb-6" />
    <div className="skeleton h-px w-full rounded mb-3" />
    <div className="flex justify-between">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  </div>
);

const Projects = memo(function Projects() {
  const { cache, getCachedOrFetch } = useWorkspace();
  const projects = cache.projects || [];
  const loading = !cache.projects;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const fetchProjects = async (force = false) => {
    try {
      await getCachedOrFetch('projects', '/api/v1/projects', force);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleProjectCreated = () => {
    setIsModalOpen(false);
    fetchProjects(true); // Force refetch on write
  };

  const filtered = projects.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Your Projects</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {loading ? <span className="skeleton inline-block h-3 w-48 rounded" /> : `${projects.length} project${projects.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Search + View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, description or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : filtered.map((project, i) => {
                const priority = PRIORITY_CONFIG[project.priority] || null;
                return (
                  <Link to={`/projects/${project._id}`} key={project._id} className="block">
                    <div
                      className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full card-hover group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/30 group-hover:scale-110 transition-transform">
                          <FolderKanban className="w-5 h-5" />
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            project.userRole === 'admin'
                              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {project.userRole === 'admin' ? 'Admin' : 'Member'}
                          </span>
                          {priority && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${priority.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                              {priority.label}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {project.name}
                      </h3>

                      {project.category && (
                        <span className="inline-block self-start mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">
                          {project.category}
                        </span>
                      )}

                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 mb-5 flex-1 line-clamp-2">
                        {project.description || 'No description provided.'}
                      </p>

                      <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Team
                        </span>
                        {project.dueDate && (
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(project.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
          }
        </div>
      ) : (
        /* List View */
        <div className="flex flex-col gap-2.5">
          {loading
            ? Array(5).fill(0).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-48 rounded mb-1.5" />
                    <div className="skeleton h-3 w-72 rounded" />
                  </div>
                  <div className="skeleton h-5 w-14 rounded-full shrink-0" />
                </div>
              ))
            : filtered.map((project, i) => {
                const priority = PRIORITY_CONFIG[project.priority] || null;
                return (
                  <Link to={`/projects/${project._id}`} key={project._id} className="block">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl px-4 py-3.5 border border-slate-200 dark:border-slate-800 flex items-center gap-4 card-hover group">
                      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shrink-0 group-hover:scale-105 transition-transform">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {project.name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {priority && (
                          <span className={`hidden sm:flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border items-center gap-1 ${priority.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                            {priority.label}
                          </span>
                        )}
                        {project.dueDate && (
                          <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(project.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
          }
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 mt-4">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-indigo-400 dark:text-indigo-500" />
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">
            {search ? 'No projects match your search' : "You aren't a member of any projects yet"}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 mb-4">
            {search ? 'Try a different search term' : 'Create one to get started'}
          </p>
          {!search && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" /> New Project
            </button>
          )}
        </div>
      )}

      {isModalOpen && (
        <CreateProjectModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleProjectCreated}
        />
      )}
    </>
  );
});

export default Projects;

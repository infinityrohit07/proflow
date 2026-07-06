import React, { useState, useEffect, memo } from 'react';
import { useParams, useNavigate } from 'react-router';
import axios from 'axios';
import { Users, Plus, Shield, User as UserIcon, Trash2, LayoutGrid, FileText, Settings, X, Calendar, Github, Globe, Search, LogOut, Trophy, Activity, Award } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard.jsx';
import ProjectNotes from '../components/ProjectNotes.jsx';
import { useUser } from '../components/UserContext.jsx';
import { useWorkspace } from '../components/WorkspaceContext.jsx';

const ProjectDetails = memo(function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { cache, updateCache } = useWorkspace();
  
  // Get cached project details if they exist
  const cachedData = cache.projectDetails?.[projectId];
  
  const [project, setProject] = useState(cachedData?.project || null);
  const [members, setMembers] = useState(cachedData?.members || []);
  const [projectActivities, setProjectActivities] = useState(cachedData?.projectActivities || []);
  const [loading, setLoading] = useState(!cachedData);
  
  const currentUser = useUser(); // From Layout's UserContext — no extra API call
  const [activeTab, setActiveTab] = useState('board');
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ identifier: '', role: 'member' });
  const [inviteSearch, setInviteSearch] = useState('');
  const [systemUsers, setSystemUsers] = useState([]);
  const [inviteError, setInviteError] = useState('');

  const [editProjectData, setEditProjectData] = useState({
    name: cachedData?.project?.name || '',
    description: cachedData?.project?.description || ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (isInviteModalOpen) {
      axios.get('/api/v1/team/all')
        .then(res => setSystemUsers(res.data.data))
        .catch(err => console.error('Failed to fetch system users', err));
    }
  }, [isInviteModalOpen]);

  const fetchData = async (forceRefetch = false) => {
    // If not forcing refetch and we have cache, skip showing the skeleton loading
    if (cachedData && !forceRefetch) {
      // Fetch in the background to update the cache silently
      Promise.all([
        axios.get(`/api/v1/projects/${projectId}`),
        axios.get(`/api/v1/projects/${projectId}/members`),
        axios.get(`/api/v1/projects/${projectId}/activities`).catch(() => ({ data: { data: [] } }))
      ]).then(([projRes, membersRes, activitiesRes]) => {
        const freshData = {
          project: projRes.data.data,
          members: membersRes.data.data.members,
          projectActivities: activitiesRes.data?.data || []
        };
        updateCache('projectDetails', freshData, projectId);
        setProject(freshData.project);
        setMembers(freshData.members);
        setProjectActivities(freshData.projectActivities);
      }).catch(err => console.error("Background project details refresh failed:", err));
      
      return;
    }

    try {
      const [projRes, membersRes, activitiesRes] = await Promise.all([
        axios.get(`/api/v1/projects/${projectId}`),
        axios.get(`/api/v1/projects/${projectId}/members`),
        axios.get(`/api/v1/projects/${projectId}/activities`).catch(() => ({ data: { data: [] } }))
      ]);
      
      const freshData = {
        project: projRes.data.data,
        members: membersRes.data.data.members,
        projectActivities: activitiesRes.data?.data || []
      };

      updateCache('projectDetails', freshData, projectId);
      
      setProject(freshData.project);
      setEditProjectData({
        name: freshData.project.name,
        description: freshData.project.description || '',
        category: freshData.project.category || 'general',
        priority: freshData.project.priority || 'medium',
        startDate: freshData.project.startDate ? freshData.project.startDate.split('T')[0] : '',
        dueDate: freshData.project.dueDate ? freshData.project.dueDate.split('T')[0] : '',
        githubLink: freshData.project.githubLink || '',
        figmaLink: freshData.project.figmaLink || '',
      });
      setMembers(freshData.members);
      setProjectActivities(freshData.projectActivities);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404 || err.response?.status === 403) {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset page states when switching projectId
    const newCached = cache.projectDetails?.[projectId];
    setProject(newCached?.project || null);
    setMembers(newCached?.members || []);
    setProjectActivities(newCached?.projectActivities || []);
    setLoading(!newCached);
    
    fetchData();
  }, [projectId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    try {
      const payload = {
        role: inviteData.role,
        ...(inviteData.identifier.includes('@') ? { email: inviteData.identifier } : { username: inviteData.identifier })
      };
      await axios.post(`/api/v1/projects/${projectId}/members`, payload);
      setIsInviteModalOpen(false);
      setInviteData({ identifier: '', role: 'member' });
      setInviteSearch('');
      fetchData();
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axios.put(`/api/v1/projects/${projectId}/members/${userId}`, { role: newRole });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId) => {
    const isSelf = userId === currentUser?._id;
    const confirmMsg = isSelf 
      ? "Are you sure you want to leave this project?" 
      : "Are you sure you want to remove this member?";
    if (!window.confirm(confirmMsg)) return;
    try {
      await axios.delete(`/api/v1/projects/${projectId}/members/${userId}`);
      if (isSelf) {
        navigate('/projects');
      } else {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/v1/projects/${projectId}`, editProjectData);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("WARNING: This will permanently delete the project and all its data. Continue?")) return;
    try {
      await axios.delete(`/api/v1/projects/${projectId}`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const filteredMembers = members.filter(member => {
    if (!member.user) return false;
    const q = searchQuery.toLowerCase();
    const nameMatch = member.user.fullname?.toLowerCase().includes(q) ||
                      member.user.username?.toLowerCase().includes(q) ||
                      member.user.email?.toLowerCase().includes(q);
    const roleMatch = roleFilter === 'all' || member.role === roleFilter;
    return nameMatch && roleMatch;
  });

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400">Loading project details...</div>;
  if (!project) return <div className="p-8 text-slate-500 dark:text-slate-400">Project not found.</div>;

  const isAdmin = project.userRole === 'admin';

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 shrink-0">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{project.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isAdmin 
                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-700'
            }`}>
              {isAdmin ? 'Admin' : 'Member'}
            </span>
            {project.category && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                {project.category}
              </span>
            )}
            {project.priority && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                project.priority === 'low' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' :
                project.priority === 'medium' ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/50' :
                project.priority === 'high' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' :
                'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
              }`}>
                {project.priority}
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{project.description || 'No description provided.'}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            {(project.startDate || project.dueDate) && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span>
                  {project.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Start'}
                  {' - '}
                  {project.dueDate ? new Date(project.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'End'}
                </span>
              </div>
            )}
            {project.githubLink && (
              <a 
                href={project.githubLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            )}
            {project.figmaLink && (
              <a 
                href={project.figmaLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Globe className="w-4 h-4" />
                <span>Figma/External</span>
              </a>
            )}
          </div>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl self-start md:self-auto border border-slate-200/50 dark:border-slate-800 overflow-x-auto max-w-full custom-scrollbar">
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'board' 
                ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-250'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Board
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'notes' 
                ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-250'
            }`}
          >
            <FileText className="w-4 h-4" /> Notes
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'team' 
                ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-250'
            }`}
          >
            <Users className="w-4 h-4" /> Team
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-250'
              }`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'board' ? (
          <KanbanBoard projectId={projectId} members={members} currentUser={currentUser} />
        ) : activeTab === 'notes' ? (
          <ProjectNotes projectId={projectId} currentUser={currentUser} isAdmin={isAdmin} />
        ) : activeTab === 'team' ? (
          <div className="overflow-y-auto h-full pb-8 custom-scrollbar space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shrink-0">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-550 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search members by name, email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'admin', 'member'].map(role => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        roleFilter === role
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
                      }`}
                    >
                      {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
                    </button>
                  ))}
                </div>
              </div>
              
              {isAdmin && (
                <button 
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2 cursor-pointer text-sm self-end md:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Invite Member
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Column: Team Directory */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                      <Users className="w-5 h-5 text-slate-450" />
                      Team Directory
                    </h2>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-full">{filteredMembers.length} members</span>
                  </div>
                  
                  {filteredMembers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-semibold text-sm">
                      No team members match your filter criteria.
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-850">
                      {filteredMembers.map(member => {
                        const isSelf = member.user?._id === currentUser?._id;
                        const stats = member.taskStats || { active: 0, completed: 0, score: 0 };
                        
                        const workload = stats.active === 0 
                          ? { text: 'Low Workload', color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' }
                          : stats.active <= 2
                            ? { text: 'Balanced Workload', color: 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30' }
                            : { text: 'Heavy Workload', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30' };

                        return (
                          <li key={member._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                            <div className="flex items-start gap-4">
                              {member.user?.avatar?.url ? (
                                <img src={member.user.avatar.url} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-750 shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-slate-200 dark:border-slate-750 shrink-0 text-base">
                                  {member.user?.fullname?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{member.user?.fullname}</p>
                                  {isSelf && (
                                    <span className="bg-indigo-50 dark:bg-slate-800 text-indigo-650 dark:text-indigo-455 text-[9px] uppercase tracking-wide font-extrabold px-1.5 py-0.5 rounded">You</span>
                                  )}
                                  <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${workload.color}`}>
                                    {workload.text}
                                  </span>
                                </div>
                                
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">@{member.user?.username} • {member.user?.email}</p>
                                
                                {member.user?.jobTitle && (
                                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">{member.user.jobTitle}</p>
                                )}
                                
                                {member.user?.bio && (
                                  <p className="text-xs text-slate-500 dark:text-slate-450 italic mt-1 max-w-md line-clamp-1">{member.user.bio}</p>
                                )}

                                <div className="flex items-center gap-2 text-xs text-slate-450 dark:text-slate-500 mt-2 font-medium">
                                  <span className="font-semibold text-slate-700 dark:text-slate-350">{stats.active}</span> active tasks
                                  <span className="text-slate-350 dark:text-slate-700">•</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-350">{stats.completed}</span> completed
                                  <span className="text-slate-350 dark:text-slate-700">•</span>
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{stats.score || 0} pts</span>
                                  {member.createdAt && (
                                    <>
                                      <span className="text-slate-350 dark:text-slate-700">•</span>
                                      <span className="text-[10px] text-slate-400">Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-end gap-3 self-end sm:self-auto shrink-0">
                              <span className={`flex items-center gap-1 text-xs font-bold ${
                                member.role === 'admin' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {member.role === 'admin' ? <Shield className="w-3.5 h-3.5 text-amber-500"/> : <UserIcon className="w-3.5 h-3.5 text-slate-400"/>}
                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                              </span>
                              
                              {isAdmin ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={member.role}
                                    onChange={(e) => handleUpdateRole(member.user._id, e.target.value)}
                                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 pl-2 pr-8 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 cursor-pointer"
                                  >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <button 
                                    onClick={() => handleRemoveMember(member.user._id)}
                                    className="p-1.5 text-slate-455 hover:text-red-650 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
                                    title={isSelf ? "Leave project" : "Remove member"}
                                  >
                                    {isSelf ? <LogOut className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                  </button>
                                </div>
                              ) : (
                                isSelf && (
                                  <button 
                                    onClick={() => handleRemoveMember(member.user._id)}
                                    className="p-1.5 text-slate-455 hover:text-red-650 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                                    title="Leave project"
                                  >
                                    <LogOut className="w-4 h-4" />
                                    <span>Leave</span>
                                  </button>
                                )
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right Column: Leaderboard and History */}
              <div className="space-y-6">
                {/* 🏆 Leaderboard Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">Leaderboard</h2>
                  </div>
                  <div className="p-5 space-y-4">
                    {[...members]
                      .sort((a, b) => (b.taskStats?.score || 0) - (a.taskStats?.score || 0))
                      .map((member, index) => {
                        const score = member.taskStats?.score || 0;
                        const maxScore = Math.max(...members.map(m => m.taskStats?.score || 0)) || 10;
                        const pct = Math.min(100, Math.round((score / maxScore) * 105));
                        
                        let badge = null;
                        if (index === 0) badge = <span className="text-base" title="1st Place Champion">👑</span>;
                        else if (index === 1) badge = <span className="text-base" title="2nd Place">🥈</span>;
                        else if (index === 2) badge = <span className="text-base" title="3rd Place">🥉</span>;
                        else badge = <span className="text-xs font-bold text-slate-400 dark:text-slate-550 w-5 text-center">#{index + 1}</span>;

                        return (
                          <div key={member._id} className="flex items-center gap-3">
                            <div className="w-7 flex justify-center items-center shrink-0">
                              {badge}
                            </div>
                            
                            {member.user?.avatar?.url ? (
                              <img src={member.user.avatar.url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-105 dark:bg-slate-800 text-slate-600 dark:text-slate-350 flex items-center justify-center font-bold text-xs shrink-0">
                                {member.user?.fullname?.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-850 dark:text-slate-150 mb-1">
                                <span className="truncate">{member.user?.fullname}</span>
                                <span className="text-indigo-600 dark:text-indigo-400 shrink-0">{score} pts</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    index === 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-600' : 'bg-indigo-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* 📜 Project Activity Feed */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">Project Timeline</h2>
                  </div>
                  <div className="p-5 overflow-y-auto max-h-[350px] custom-scrollbar">
                    {projectActivities.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No recent project history.</p>
                    ) : (
                      <div className="relative border-l border-slate-150 dark:border-slate-800 pl-4 ml-2 space-y-5">
                        {projectActivities.map((act) => {
                          let actionColor = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400';
                          if (act.action.includes('note')) actionColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
                          if (act.action.includes('delete')) actionColor = 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400';

                          return (
                            <div key={act._id} className="relative group">
                              <span className="absolute -left-[25px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[8px] font-bold">
                                •
                              </span>
                              <div className="text-xs text-slate-650 dark:text-slate-400">
                                <span className="font-bold text-slate-850 dark:text-slate-150">
                                  {act.user?.fullname || 'System'}
                                </span>{' '}
                                {act.description}
                                <span className="block text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">
                                  {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'settings' && isAdmin ? (
          <div className="overflow-y-auto h-full pb-8 custom-scrollbar">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 p-6 max-w-2xl shadow-sm">
              <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Project Settings</h2>
              <form onSubmit={handleUpdateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Project Name</label>
                  <input
                    type="text"
                    required
                    value={editProjectData.name}
                    onChange={e => setEditProjectData({...editProjectData, name: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={editProjectData.description}
                    onChange={e => setEditProjectData({...editProjectData, description: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 resize-none"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={editProjectData.category}
                      onChange={e => setEditProjectData({...editProjectData, category: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    >
                      <option value="general">General</option>
                      <option value="engineering">Engineering</option>
                      <option value="marketing">Marketing</option>
                      <option value="design">Design</option>
                      <option value="product">Product</option>
                      <option value="sales">Sales</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                    <select
                      value={editProjectData.priority}
                      onChange={e => setEditProjectData({...editProjectData, priority: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                    <input
                      type="date"
                      value={editProjectData.startDate}
                      onChange={e => setEditProjectData({...editProjectData, startDate: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Due Date</label>
                    <input
                      type="date"
                      value={editProjectData.dueDate}
                      onChange={e => setEditProjectData({...editProjectData, dueDate: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">GitHub Repo URL</label>
                    <input
                      type="url"
                      value={editProjectData.githubLink}
                      onChange={e => setEditProjectData({...editProjectData, githubLink: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      placeholder="https://github.com/org/repo"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Figma/External Link</label>
                    <input
                      type="url"
                      value={editProjectData.figmaLink}
                      onChange={e => setEditProjectData({...editProjectData, figmaLink: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      placeholder="https://figma.com/file/..."
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-colors text-sm cursor-pointer">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
            
            <div className="bg-red-50/50 dark:bg-red-950/10 rounded-2xl border border-red-200 dark:border-red-900/30 overflow-hidden mb-8 p-6 max-w-2xl shadow-sm">
              <h3 className="text-base font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
              <p className="text-sm text-red-650 dark:text-red-400/80 mb-4">Once you delete a project, there is no going back. Please be certain.</p>
              <button 
                onClick={handleDeleteProject}
                className="px-5 py-2.5 bg-white hover:bg-red-50 text-red-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl transition-all font-semibold shadow-sm text-sm cursor-pointer"
              >
                Delete Project
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/30">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Invite Member</h2>
              <button 
                type="button" 
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite}>
              <div className="p-6">
                {inviteError && <div className="mb-4 text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-red-100 dark:border-red-900/50">{inviteError}</div>}
                
                <div className="mb-4 relative">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Search Registered Users</label>
                  <input
                    type="text"
                    required
                    value={inviteSearch}
                    onChange={e => {
                      setInviteSearch(e.target.value);
                      setInviteData({...inviteData, identifier: e.target.value});
                    }}
                    className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600"
                    placeholder="Search name, username, or email..."
                  />
                  {inviteSearch.trim() && !inviteSearch.includes('(@') && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 custom-scrollbar">
                      {systemUsers
                        .filter(u => 
                          (u.fullname?.toLowerCase().includes(inviteSearch.toLowerCase()) ||
                           u.username?.toLowerCase().includes(inviteSearch.toLowerCase()) ||
                           u.email?.toLowerCase().includes(inviteSearch.toLowerCase())) &&
                          !members.some(m => m.user?._id === u._id)
                        )
                        .map(u => (
                          <button
                            key={u._id}
                            type="button"
                            onClick={() => {
                              setInviteData({...inviteData, identifier: u.username});
                              setInviteSearch(`${u.fullname} (@${u.username})`);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-900 dark:text-slate-100 text-xs transition-colors flex items-center gap-2.5 cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {u.fullname?.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-bold truncate">{u.fullname}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">@{u.username} • {u.email}</p>
                            </div>
                          </button>
                        ))
                      }
                      {systemUsers.filter(u => 
                        (u.fullname?.toLowerCase().includes(inviteSearch.toLowerCase()) ||
                         u.username?.toLowerCase().includes(inviteSearch.toLowerCase()) ||
                         u.email?.toLowerCase().includes(inviteSearch.toLowerCase())) &&
                        !members.some(m => m.user?._id === u._id)
                      ).length === 0 && (
                        <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                          No users found or all are already members.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Role</label>
                  <select
                    value={inviteData.role}
                    onChange={e => setInviteData({...inviteData, role: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold rounded-xl transition-all cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm cursor-pointer"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProjectDetails;

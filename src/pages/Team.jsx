/**
 * Team Directory Page Component
 * 
 * Renders a list of all team collaborators shared across active projects.
 * Includes search capabilities, project-based filtering, responsive statistics panels,
 * and an interactive modal to display detailed member profile information.
 */

import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router';
import axios from 'axios';
import { Mail, Briefcase, Search, Users, Layers, Globe, X, ExternalLink, ShieldCheck, UserCircle2 } from 'lucide-react';
import { useWorkspace } from '../components/WorkspaceContext.jsx';

const SkeletonMemberCard = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
    <div className="flex items-center gap-3 mb-4">
      <div className="skeleton h-14 w-14 rounded-full shrink-0" />
      <div className="flex-1">
        <div className="skeleton h-4 w-28 rounded mb-1.5" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    </div>
    <div className="skeleton h-3 w-24 rounded mb-1" />
    <div className="skeleton h-3 w-full rounded mb-4" />
    <div className="skeleton h-px w-full rounded mb-3" />
    <div className="skeleton h-3 w-32 rounded mb-4" />
    <div className="skeleton h-8 w-full rounded-xl" />
  </div>
);

const Team = memo(function Team() {
  const { cache, getCachedOrFetch } = useWorkspace();
  const team = cache.team || [];
  const loading = !cache.team;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        await getCachedOrFetch('team', '/api/v1/team');
      } catch (err) {
        console.error(err);
      }
    };
    fetchTeam();
  }, []);

  const allProjects = [];
  const projectIdsSeen = new Set();
  team.forEach(member => {
    if (member.sharedProjects) {
      member.sharedProjects.forEach(proj => {
        if (!projectIdsSeen.has(proj._id)) {
          projectIdsSeen.add(proj._id);
          allProjects.push(proj);
        }
      });
    }
  });

  const filteredTeam = team.filter(member => {
    const q = searchQuery.toLowerCase();
    const nameMatch = member.fullname?.toLowerCase().includes(q) ||
                      member.username?.toLowerCase().includes(q) ||
                      member.email?.toLowerCase().includes(q);
    const projectMatch = selectedProjectFilter === 'all' ||
                         member.sharedProjects?.some(p => p._id === selectedProjectFilter);
    return nameMatch && projectMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Team Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            People you collaborate with across all your projects.
          </p>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4 card-hover">
          <div className="p-2.5 sm:p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Collaborators</p>
            {loading ? (
              <div className="skeleton h-6 sm:h-7 w-8 sm:w-10 rounded mt-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{team.length}</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4 card-hover">
          <div className="p-2.5 sm:p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shared Projects</p>
            {loading ? (
              <div className="skeleton h-6 sm:h-7 w-8 sm:w-10 rounded mt-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{allProjects.length}</p>
            )}
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4 card-hover">
          <div className="p-2.5 sm:p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Workspace Status</p>
            <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Connected
            </p>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, username or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <select
          value={selectedProjectFilter}
          onChange={e => setSelectedProjectFilter(e.target.value)}
          className="border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
        >
          <option value="all">All Projects</option>
          {allProjects.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {Array(8).fill(0).map((_, i) => <SkeletonMemberCard key={i} />)}
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-805 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No team members found</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredTeam.map((member, i) => (
            <div
              key={member._id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col card-hover group"
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-4">
                {member.avatar?.url ? (
                  <img
                    src={member.avatar.url}
                    alt=""
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-md shrink-0 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white flex items-center justify-center text-lg sm:text-xl font-extrabold shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    {member.fullname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">{member.fullname}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">@{member.username}</p>
                </div>
              </div>

              {/* Job + Bio */}
              <div className="mb-4 min-h-[36px]">
                {member.jobTitle ? (
                  <p className="text-xs font-bold text-indigo-650 dark:text-indigo-400">{member.jobTitle}</p>
                ) : (
                  <p className="text-xs text-slate-300 dark:text-slate-600 italic">No role set</p>
                )}
                {member.bio && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1 line-clamp-2 leading-relaxed">{member.bio}</p>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href={`mailto:${member.email}`} className="hover:text-indigo-655 dark:hover:text-indigo-400 transition-colors truncate font-semibold">
                  {member.email}
                </a>
              </div>

              {/* Shared Projects */}
              <div className="mt-auto space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">
                    <Briefcase className="w-3 h-3" /> Projects ({member.sharedProjects?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {member.sharedProjects?.slice(0, 3).map(proj => (
                      <Link
                        key={proj._id}
                        to={`/projects/${proj._id}`}
                        className="px-2 py-0.5 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-lg text-[10px] border border-slate-200 dark:border-slate-700 transition-colors truncate max-w-full font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {proj.name}
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </Link>
                    ))}
                    {member.sharedProjects?.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-bold self-center">
                        +{member.sharedProjects.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMember(member)}
                  className="w-full bg-slate-50 hover:bg-indigo-55 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-650 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-450 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <UserCircle2 className="w-3.5 h-3.5" />
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            {/* Modal Hero */}
            <div className="relative h-24 bg-gradient-to-br from-indigo-500 via-violet-650 to-purple-700 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="absolute top-3 right-3 text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute -bottom-8 left-6">
                {selectedMember.avatar?.url ? (
                  <img
                    src={selectedMember.avatar.url}
                    alt=""
                    className="w-16 h-16 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 text-white flex items-center justify-center text-2xl font-extrabold border-4 border-white dark:border-slate-900 shadow-lg">
                    {selectedMember.fullname.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-12 px-5 sm:px-6 pb-5 sm:pb-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{selectedMember.fullname}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">@{selectedMember.username}</p>
                {selectedMember.jobTitle && (
                  <p className="text-xs font-bold text-indigo-650 dark:text-indigo-455 mt-1">{selectedMember.jobTitle}</p>
                )}
              </div>

              {selectedMember.bio && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-505 mb-2">About</h4>
                  <p className="text-sm text-slate-655 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800 italic leading-relaxed">
                    "{selectedMember.bio}"
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-505 mb-2">Contact</h4>
                <a
                  href={`mailto:${selectedMember.email}`}
                  className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-950 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{selectedMember.email}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />
                </a>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-505 mb-2">Shared Projects & Roles</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {selectedMember.sharedProjects?.map(proj => (
                    <div key={proj._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <Link
                        to={`/projects/${proj._id}`}
                        onClick={() => setSelectedMember(null)}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                      >
                        {proj.name}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        proj.role === 'admin'
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        {proj.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/50 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default Team;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, X, Brain, Sparkles, Pin } from 'lucide-react';

export default function ProjectNotes({ projectId, currentUser, isAdmin }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  
  // Note Form Fields State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [category, setCategory] = useState('general');
  const [color, setColor] = useState('slate');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Search & Category Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');

  const parseMarkdown = (md) => {
    if (!md) return '';
    return md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/^### (.*$)/gim, '<h4 class="text-md font-bold text-slate-900 dark:text-white mt-4 mb-2">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-3">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 class="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-4">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded font-mono text-xs border border-slate-205 dark:border-slate-700/50">$1</code>')
      .replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-700 dark:text-slate-355 my-1">$1</li>')
      .replace(/\n/g, '<br/>');
  };

  const getColorClasses = (color) => {
    switch (color) {
      case 'blue':
        return {
          card: 'border-blue-200 dark:border-blue-900/40 bg-blue-50/5 dark:bg-blue-950/5 hover:border-blue-300 dark:hover:border-blue-800',
          badge: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30',
        };
      case 'emerald':
        return {
          card: 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/5 dark:bg-emerald-950/5 hover:border-emerald-300 dark:hover:border-emerald-800',
          badge: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30',
        };
      case 'amber':
        return {
          card: 'border-amber-200 dark:border-amber-900/40 bg-amber-50/5 dark:bg-amber-950/5 hover:border-amber-300 dark:hover:border-amber-800',
          badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30',
        };
      case 'violet':
        return {
          card: 'border-violet-200 dark:border-violet-900/40 bg-violet-50/5 dark:bg-violet-950/5 hover:border-violet-300 dark:hover:border-violet-800',
          badge: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30',
        };
      case 'slate':
      default:
        return {
          card: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350 dark:hover:border-slate-700',
          badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50',
        };
    }
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'idea': return '💡 Idea';
      case 'meeting': return '📅 Meeting';
      case 'technical': return '⚙️ Technical';
      case 'general':
      default:
        return '📝 General';
    }
  };

  const handleAIGenerateSummary = async () => {
    setIsSummaryModalOpen(true);
    setSummaryLoading(true);
    setSummaryContent('');
    try {
      const res = await axios.post('/api/v1/ai/summarize-notes', { projectId });
      setSummaryContent(res.data.data);
    } catch (err) {
      setSummaryContent('Failed to generate AI summary. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`/api/v1/notes/project/${projectId}`);
      setNotes(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [projectId]);

  const openNewModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setIsPinned(false);
    setCategory('general');
    setColor('slate');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setTitle(note.title || '');
    setContent(note.content);
    setIsPinned(note.isPinned || false);
    setCategory(note.category || 'general');
    setColor(note.color || 'slate');
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError('');

    const payload = {
      title: title.trim() || 'Untitled Note',
      content,
      isPinned,
      category,
      color
    };

    try {
      if (editingNote) {
        const res = await axios.put(`/api/v1/notes/${editingNote._id}`, payload);
        setNotes(notes.map(n => n._id === editingNote._id ? res.data.data : n));
      } else {
        const res = await axios.post(`/api/v1/notes/project/${projectId}`, payload);
        setNotes([res.data.data, ...notes]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async (note) => {
    try {
      const res = await axios.put(`/api/v1/notes/${note._id}`, { isPinned: !note.isPinned });
      setNotes(notes.map(n => n._id === note._id ? res.data.data : n));
    } catch (err) {
      alert('Failed to update pin status');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await axios.delete(`/api/v1/notes/${noteId}`);
      setNotes(notes.filter(n => n._id !== noteId));
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400">Loading notes...</div>;

  // Sorting: Pinned first, then by date descending
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Filtering: activeCategory & searchQuery
  const filteredNotes = sortedNotes.filter(note => {
    if (activeCategory !== 'all' && note.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = note.title?.toLowerCase().includes(q);
      const contentMatch = note.content?.toLowerCase().includes(q);
      const catLabel = getCategoryLabel(note.category).toLowerCase();
      if (!titleMatch && !contentMatch && !catLabel.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="h-full flex flex-col overflow-y-auto pb-8">
      {/* Top Filter & Action Bar */}
      <div className="mb-6 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shrink-0">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-3 w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto justify-end">
            <button 
              onClick={handleAIGenerateSummary}
              disabled={notes.length === 0}
              className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-950 dark:border-slate-800 dark:text-indigo-400 dark:hover:bg-slate-800/80 px-4 py-2 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2 cursor-pointer text-sm"
            >
              <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              AI Summarize Board
            </button>
            <button 
              onClick={openNewModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2 cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Note
            </button>
          </div>
        </div>
        
        {/* Category Pill Filters */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/40">
          {['all', 'general', 'idea', 'meeting', 'technical'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                activeCategory === cat 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
              }`}
            >
              {cat === 'all' ? '🌐 All Notes' : getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 mb-4 font-semibold">
            {notes.length === 0 ? 'No notes yet for this project.' : 'No notes match your filters.'}
          </p>
          {notes.length === 0 && (
            <button 
              onClick={openNewModal}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Create the first note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => {
            const isOwner = note.createdBy?._id === currentUser?._id;
            const canManage = isOwner || isAdmin;
            const colors = getColorClasses(note.color);

            return (
              <div key={note._id} className={`rounded-2xl p-6 shadow-sm border flex flex-col justify-between group hover:shadow-md transition-all relative ${colors.card}`}>
                {/* Pinned Indicator / Toggle Pin */}
                <button
                  onClick={() => canManage && handleTogglePin(note)}
                  disabled={!canManage}
                  className={`absolute top-4 right-4 p-1.5 rounded-lg border transition-all ${
                    note.isPinned 
                      ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/30 dark:border-amber-900/30 dark:text-amber-400 opacity-100'
                      : 'bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 dark:hover:text-slate-200'
                  } ${canManage ? 'cursor-pointer' : 'cursor-default'}`}
                  title={note.isPinned ? 'Unpin Note' : 'Pin Note'}
                >
                  <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
                </button>

                <div className="flex-1">
                  {/* Category Badge & Title */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {getCategoryLabel(note.category)}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2 truncate pr-8">
                    {note.title || 'Untitled Note'}
                  </h4>
                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mt-2 pr-2"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(note.content) }}
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-450 dark:text-slate-500 font-medium">
                    <span className="font-semibold">{note.createdBy?.fullname || 'Unknown'}</span>
                    <span className="mx-1.5">•</span>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(note)}
                        className="p-1.5 text-slate-450 hover:text-slate-650 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-850 transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteNote(note._id)}
                        className="p-1.5 text-slate-450 hover:text-red-650 dark:hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-850 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingNote ? 'Edit Note' : 'Add New Note'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div className="p-6 space-y-4">
                {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-red-100 dark:border-red-900/50">{error}</div>}
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Project Architecture Docs"
                    className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    >
                      <option value="general">📝 General</option>
                      <option value="idea">💡 Idea</option>
                      <option value="meeting">📅 Meeting Docs</option>
                      <option value="technical">⚙️ Technical Spec</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Color Theme</label>
                    <select
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    >
                      <option value="slate">Slate (Default)</option>
                      <option value="blue">Blue highlight</option>
                      <option value="emerald">Emerald highlight</option>
                      <option value="amber">Amber highlight</option>
                      <option value="violet">Violet highlight</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={isPinned}
                    onChange={e => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-800"
                  />
                  <label htmlFor="isPinned" className="text-xs font-semibold text-slate-650 dark:text-slate-400 select-none cursor-pointer">
                    Pin this note to the top
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Content (Markdown supported)</label>
                  <textarea
                    required
                    rows={6}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Type your note contents here. Use **bold** or `code` syntax..."
                    className="w-full border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 resize-none"
                  ></textarea>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold rounded-xl transition-all cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !content.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                >
                  {saving ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[80vh] shadow-xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50/20 dark:bg-slate-950/20 shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                AI Board Summary
              </h2>
              <button 
                onClick={() => setIsSummaryModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {summaryLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Gemini is synthesizing note content...</p>
                </div>
              ) : (
                <div 
                  className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(summaryContent) }}
                />
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

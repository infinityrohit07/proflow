import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Upload, File as FileIcon, Trash2, Plus, Check } from 'lucide-react';

export default function TaskDetailModal({ task, onClose, onSave, members, currentUser }) {
  const isNew = task.isNew;
  
  const currentUserMembership = members?.find(m => m.user._id === currentUser?._id);
  const isAdmin = currentUserMembership?.role === 'admin';
  const taskCreatorId = task.assignedBy?._id || task.assignedBy;
  const canDeleteTask = isAdmin || taskCreatorId === currentUser?._id;

  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [assignedTo, setAssignedTo] = useState(task.assignedTo?._id || '');
  const [status, setStatus] = useState(task.status || 'todo');
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [tags, setTags] = useState(task.tags ? task.tags.join(', ') : '');
  
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState([]);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('status', status);
      if (assignedTo) formData.append('assignedTo', assignedTo);
      if (dueDate) formData.append('dueDate', dueDate);
      formData.append('priority', priority);
      formData.append('tags', tags);
      
      if (attachmentsToRemove.length > 0) {
        formData.append('removeAttachments', JSON.stringify(attachmentsToRemove));
      }

      for (let i = 0; i < filesToUpload.length; i++) {
        formData.append('attachments', filesToUpload[i]);
      }

      if (isNew) {
        await axios.post(`/api/v1/tasks/project/${task.project}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.put(`/api/v1/tasks/${task._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task forever?')) return;
    setSaving(true);
    try {
      await axios.delete(`/api/v1/tasks/${task._id}`);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check sizes and types
    const validFiles = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        alert(`${f.name} exceeds 5MB limit`);
        continue;
      }
      if (!allowedTypes.includes(f.type)) {
        alert(`${f.name} is not a valid file type (Images, PDF, DOCX only)`);
        continue;
      }
      validFiles.push(f);
    }

    if (attachments.length - attachmentsToRemove.length + filesToUpload.length + validFiles.length > 5) {
      alert("Maximum 5 attachments allowed per task.");
      return;
    }
    
    setFilesToUpload([...filesToUpload, ...validFiles]);
  };

  const removeExistingAttachment = (publicId) => {
    setAttachmentsToRemove([...attachmentsToRemove, publicId]);
  };

  const removeFileToUpload = (index) => {
    const newFiles = [...filesToUpload];
    newFiles.splice(index, 1);
    setFilesToUpload(newFiles);
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    if (isNew) {
      alert("Please save the task first before adding subtasks.");
      return;
    }

    try {
      const res = await axios.post(`/api/v1/tasks/${task._id}/subtasks`, { title: newSubtask });
      setSubtasks([...subtasks, res.data.data]);
      setNewSubtask('');
    } catch (err) {
      alert('Failed to add subtask');
    }
  };

  const toggleSubtask = async (st) => {
    try {
      const res = await axios.put(`/api/v1/tasks/subtasks/${st._id}`, { isCompleted: !st.isCompleted });
      setSubtasks(subtasks.map(s => s._id === st._id ? res.data.data : s));
    } catch (err) {
      alert('Failed to update subtask');
    }
  };

  const deleteSubtask = async (stId) => {
    try {
      await axios.delete(`/api/v1/tasks/subtasks/${stId}`);
      setSubtasks(subtasks.filter(s => s._id !== stId));
    } catch (err) {
      alert('Failed to delete subtask');
    }
  };

  const handleAIGenerateChecklist = async () => {
    if (isNew) return;
    setAiGenerating(true);
    setError('');
    try {
      const res = await axios.post('/api/v1/ai/generate-subtasks', { title, description });
      const items = res.data.data;
      const addedSubtasks = [];
      for (const item of items) {
        const subRes = await axios.post(`/api/v1/tasks/${task._id}/subtasks`, { title: item });
        addedSubtasks.push(subRes.data.data);
      }
      setSubtasks([...subtasks, ...addedSubtasks]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate subtasks with AI');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-none">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{isNew ? 'Create Task' : 'Edit Task'}</h2>
          <div className="flex items-center gap-2">
            {!isNew && canDeleteTask && (
              <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {error && <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/50">{error}</div>}
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650"
            />
          </div>

          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Status</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Assignee</label>
              <select 
                value={assignedTo} 
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user._id} value={m.user._id}>{m.user.fullname}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Due Date</label>
              <input 
                type="date" 
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Priority</label>
              <select 
                value={priority} 
                onChange={e => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex-[2]">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tags (comma separated)</label>
              <input 
                type="text" 
                value={tags} 
                onChange={e => setTags(e.target.value)}
                placeholder="e.g. bug, frontend, blockers"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650"
            />
          </div>

          {/* Subtasks Section */}
          {!isNew && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Checklist</label>
                <button
                  type="button"
                  onClick={handleAIGenerateChecklist}
                  disabled={aiGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 text-indigo-750 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                >
                  {aiGenerating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>✨ AI Generate Checklist</span>
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-2 mb-3">
                {subtasks.map(st => (
                  <div key={st._id} className="flex items-center justify-between group p-2 hover:bg-slate-50 dark:hover:bg-slate-950/40 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleSubtask(st)} className={`flex items-center justify-center w-5 h-5 rounded border cursor-pointer transition-colors ${st.isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-800'}`}>
                        {st.isCompleted && <Check className="w-3 h-3" />}
                      </button>
                      <span className={`text-sm ${st.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>{st.title}</span>
                    </div>
                    <button onClick={() => deleteSubtask(st._id)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  placeholder="Add an item..."
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650"
                />
                <button type="submit" className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                  Add
                </button>
              </form>
            </div>
          )}

          {/* Attachments Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Attachments (max 5)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
              {/* Existing Attachments */}
              {attachments.filter(a => !attachmentsToRemove.includes(a.publicId)).map((att) => (
                <div key={att.publicId} className="relative group rounded-xl border border-slate-200 dark:border-slate-850 overflow-hidden bg-slate-50 dark:bg-slate-950 aspect-square">
                  {att.mimetype?.startsWith('image/') ? (
                    <img src={att.url} alt={att.originalName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-2 text-center text-slate-500 dark:text-slate-400">
                      <FileIcon className="w-8 h-8 mb-2" />
                      <span className="text-xs truncate w-full px-1">{att.originalName}</span>
                    </div>
                  )}
                  <a href={att.url} target="_blank" rel="noreferrer" className="absolute inset-0 z-10"></a>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeExistingAttachment(att.publicId); }} 
                    className="absolute top-1.5 right-1.5 z-20 p-1.5 bg-white/90 dark:bg-slate-900/90 text-red-650 rounded-lg opacity-0 group-hover:opacity-100 shadow-sm transition-opacity cursor-pointer border border-transparent dark:border-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* New Files to upload */}
              {filesToUpload.map((f, i) => (
                <div key={i} className="relative group rounded-xl border border-slate-200 dark:border-slate-850 overflow-hidden bg-indigo-50/50 dark:bg-indigo-950/20 aspect-square">
                  {f.type?.startsWith('image/') ? (
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-2 text-center text-indigo-500">
                      <FileIcon className="w-8 h-8 mb-2" />
                      <span className="text-xs truncate w-full px-1">{f.name}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-white/80 dark:bg-slate-905/85 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50">New</span>
                  </div>
                  <button 
                    onClick={() => removeFileToUpload(i)} 
                    className="absolute top-1.5 right-1.5 z-20 p-1.5 bg-white/90 dark:bg-slate-900/90 text-red-650 rounded-lg opacity-0 group-hover:opacity-100 shadow-sm transition-opacity cursor-pointer border border-transparent dark:border-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* Upload Button */}
              {attachments.length - attachmentsToRemove.length + filesToUpload.length < 5 && (
                <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-350 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-950/50 cursor-pointer transition-colors text-slate-500 dark:text-slate-400">
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-xs font-semibold">Upload</span>
                  <input type="file" multiple className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-950/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 font-semibold rounded-xl transition-all cursor-pointer text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || !title}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {saving ? 'Saving...' : 'Save Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

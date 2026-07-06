import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Paperclip, CheckSquare } from 'lucide-react';
import axios from 'axios';
import TaskDetailModal from './TaskDetailModal.jsx';

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
];

export default function KanbanBoard({ projectId, members, currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`/api/v1/tasks/project/${projectId}`);
      setTasks(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistically update
    const newTasks = Array.from(tasks);
    const taskIndex = newTasks.findIndex(t => t._id === draggableId);
    if (taskIndex === -1) return;
    
    newTasks[taskIndex].status = destination.droppableId;
    setTasks(newTasks);

    try {
      await axios.put(`/api/v1/tasks/${draggableId}`, { status: destination.droppableId });
    } catch (err) {
      console.error(err);
      fetchTasks(); // revert on fail
    }
  };

  const openNewTask = (status) => {
    setSelectedTask({ isNew: true, status, project: projectId });
    setIsTaskModalOpen(true);
  };

  const openTask = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30';
      case 'high':
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30';
      case 'medium':
        return 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30';
      case 'low':
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-200 dark:border-slate-750';
    }
  };

  const getDueDateBadge = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    due.setHours(0,0,0,0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let bgClass = 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400';
    
    if (diffDays < 0) {
      label = `Overdue (${Math.abs(diffDays)}d)`;
      bgClass = 'bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 font-semibold';
    } else if (diffDays === 0) {
      label = 'Due Today';
      bgClass = 'bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 font-semibold';
    } else if (diffDays === 1) {
      label = 'Due Tomorrow';
      bgClass = 'bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 text-amber-650 dark:text-amber-400 font-semibold';
    }
    
    return (
      <span className={`text-[10px] py-0.5 px-2 rounded-lg shrink-0 ${bgClass}`}>
        {label}
      </span>
    );
  };

  const renderSubtaskProgressBar = (subtasks) => {
    if (!subtasks || subtasks.length === 0) return null;
    const completed = subtasks.filter(st => st.isCompleted).length;
    const total = subtasks.length;
    const percentage = Math.round((completed / total) * 100);
    
    return (
      <div className="mt-3 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1">
          <span>Checklist Progress</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-200/50 dark:border-slate-800/40">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400">Loading tasks...</div>;

  const filteredTasks = tasks.filter(task => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title?.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTags = task.tags?.some(tag => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    if (assigneeFilter) {
      if (task.assignedTo?._id !== assigneeFilter) return false;
    }
    if (priorityFilter) {
      if (task.priority !== priorityFilter) return false;
    }
    return true;
  });

  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col.id] = filteredTasks.filter(t => t.status === col.id);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full w-full">
      {/* Filters Bar */}
      <div className="mb-6 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-350 font-bold text-sm shrink-0">
          <span>🎯 Filter Tasks:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto md:flex-1 md:max-w-2xl">
          <input
            type="text"
            placeholder="Search tasks or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          
          <select
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Assignees</option>
            {members?.map(m => (
              <option key={m.user._id} value={m.user._id}>
                {m.user.fullname}
              </option>
            ))}
          </select>
          
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar min-h-0">
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map(column => (
            <div key={column.id} className="flex flex-col flex-none w-80 bg-slate-100/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-slate-700 dark:text-slate-350 text-sm">{column.title}</h3>
                <span className="bg-slate-200 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs py-0.5 px-2.5 rounded-full font-semibold">
                  {tasksByColumn[column.id]?.length || 0}
                </span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 space-y-3 overflow-y-auto min-h-[150px] custom-scrollbar transition-colors ${
                      snapshot.isDraggingOver ? 'bg-slate-200/40 dark:bg-slate-950/20' : ''
                    }`}
                  >
                    {tasksByColumn[column.id].map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => openTask(task)}
                            className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-md cursor-pointer transition-all ${
                              snapshot.isDragging ? 'rotate-1 scale-[1.02] shadow-lg border-indigo-500/50 dark:border-indigo-500/50 bg-slate-50 dark:bg-slate-850' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5 shrink-0">
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate flex-1 leading-snug">{task.title}</h4>
                              {task.priority && (
                                <span className={`shrink-0 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${getPriorityBadgeClass(task.priority)}`}>
                                  {task.priority}
                                </span>
                              )}
                            </div>
                            
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2.5 shrink-0">
                                {task.tags.map((tag, idx) => (
                                  <span key={idx} className="bg-slate-100 dark:bg-slate-950 text-slate-550 dark:text-slate-450 text-[9px] font-semibold px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-800/80">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {task.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                            )}

                            {renderSubtaskProgressBar(task.subtasks)}

                            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/40 shrink-0">
                              <div className="flex items-center gap-3">
                                {getDueDateBadge(task.dueDate)}
                                {task.attachments?.length > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] font-semibold" title="Attachments">
                                    <Paperclip className="w-3.5 h-3.5" />
                                    {task.attachments.length}
                                  </span>
                                )}
                              </div>
                              {task.assignedTo && (
                                <img 
                                  src={task.assignedTo.avatar?.url || `https://ui-avatars.com/api/?name=${task.assignedTo.fullname}`} 
                                  className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-850 object-cover shrink-0"
                                  title={`Assigned to ${task.assignedTo.fullname}`}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
                <button
                  onClick={() => openNewTask(column.id)}
                  className="w-full py-2 flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-950 rounded-xl transition-all font-semibold cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-850"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            </div>
          ))}
        </DragDropContext>
      </div>

      {isTaskModalOpen && (
        <TaskDetailModal 
          task={selectedTask} 
          onClose={() => setIsTaskModalOpen(false)} 
          onSave={() => {
            setIsTaskModalOpen(false);
            fetchTasks();
          }}
          members={members}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

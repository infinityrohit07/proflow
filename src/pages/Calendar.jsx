import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import TaskDetailModal from '../components/TaskDetailModal.jsx';
import { useUser } from '../components/UserContext.jsx';
import { useWorkspace } from '../components/WorkspaceContext.jsx';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Calendar = memo(function Calendar() {
  const { cache, getCachedOrFetch } = useWorkspace();
  const tasks = cache.calendar || [];
  const loading = !cache.calendar;
  
  // Navigation states
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  
  // Modal states
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskMembers, setTaskMembers] = useState([]);
  // Get user from Layout's context — no extra API call needed
  const currentUser = useUser();

  const fetchCalendarTasks = async () => {
    try {
      await getCachedOrFetch('calendar', '/api/v1/calendar');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCalendarTasks();
  }, []);

  const handlePrevMonth = () => {
    setSelectedDay(1);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDay(1);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleResetToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDay(today.getDate());
  };

  const handleTaskClick = async (task) => {
    try {
      const res = await axios.get(`/api/v1/projects/${task.project._id}/members`);
      setTaskMembers(res.data.data.members);
      setSelectedTask(task);
      setIsTaskModalOpen(true);
    } catch (err) {
      console.error("Failed to load project members", err);
      setTaskMembers([]);
      setSelectedTask(task);
      setIsTaskModalOpen(true);
    }
  };

  const handleModalSave = () => {
    setIsTaskModalOpen(false);
    fetchCalendarTasks();
  };

  // Calendar calculations
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayIndex = getFirstDayOfMonth(currentMonth, currentYear);

  const calendarCells = [];
  // Pad the start of the grid
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Fill month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400">Loading schedule...</div>;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upcoming Schedule</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Interactive workspace to track task due dates visually.</p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button 
            onClick={handleResetToToday}
            className="px-3.5 py-2 text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <button 
              onClick={handlePrevMonth}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-r border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 min-w-[120px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-l border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Calendar & Mobile Agenda Container */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1">
        {/* Calendar Grid card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
            {WEEKDAYS.map(day => (
              <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 flex-1 grid-rows-6 divide-x divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
            {calendarCells.map((day, idx) => {
              const isToday = day && 
                today.getDate() === day && 
                today.getMonth() === currentMonth && 
                today.getFullYear() === currentYear;

              const isSelected = day && selectedDay === day;

              // Filter tasks due on this date
              const dateTasks = tasks.filter(task => {
                if (!task.dueDate || !day) return false;
                const d = new Date(task.dueDate);
                return d.getDate() === day && 
                  d.getMonth() === currentMonth && 
                  d.getFullYear() === currentYear;
              });

              return (
                <div 
                  key={idx} 
                  onClick={() => day && setSelectedDay(day)}
                  className={`p-1 sm:p-2 flex flex-col min-h-[70px] lg:min-h-[90px] transition-colors relative bg-white dark:bg-slate-900 cursor-pointer ${
                    !day ? 'bg-slate-50/50 dark:bg-slate-950/40' : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/40'
                  } ${isToday ? 'ring-2 ring-indigo-500 ring-inset' : ''} ${isSelected && !isToday ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}
                >
                  {day && (
                    <span className={`text-xs sm:text-sm font-semibold mb-1 self-start rounded-full w-6 h-6 flex items-center justify-center ${
                      isToday ? 'bg-indigo-600 text-white shadow-sm' : isSelected ? 'bg-indigo-100 dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {day}
                    </span>
                  )}
                  
                  {/* Task details - Hidden on small screens, replaced by dot indicators */}
                  <div className="hidden lg:block flex-1 overflow-y-auto space-y-1.5 mt-1 custom-scrollbar">
                    {dateTasks.map(task => {
                      const isDone = task.status === 'done';
                      const isInProgress = task.status === 'in_progress';
                      
                      return (
                        <div 
                          key={task._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                          className={`text-[11px] p-1.5 rounded border shadow-sm cursor-pointer transition-all hover:scale-[1.02] flex flex-col gap-0.5 truncate ${
                            isDone 
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                              : isInProgress
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                : 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                          }`}
                        >
                          <div className="font-semibold truncate leading-tight">{task.title}</div>
                          <div className="opacity-75 text-[9px] truncate">{task.project?.name}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dot indicators for mobile/tablet screens */}
                  {day && dateTasks.length > 0 && (
                    <div className="lg:hidden flex flex-wrap gap-1 mt-auto items-center justify-center">
                      {dateTasks.slice(0, 3).map(task => (
                        <span 
                          key={task._id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                        />
                      ))}
                      {dateTasks.length > 3 && (
                        <span className="text-[7px] text-slate-400 font-bold">+</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Agenda for Mobile & Tablet */}
        <div className="w-full lg:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col shrink-0">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 uppercase tracking-wider flex items-center justify-between">
            <span>Agenda</span>
            <span className="text-xs text-indigo-650 dark:text-indigo-400 lowercase font-normal">
              {MONTHS[currentMonth]} {selectedDay}
            </span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            Tasks due on this day.
          </p>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] lg:max-h-none custom-scrollbar">
            {tasks.filter(task => {
              if (!task.dueDate) return false;
              const d = new Date(task.dueDate);
              return d.getDate() === selectedDay && 
                d.getMonth() === currentMonth && 
                d.getFullYear() === currentYear;
            }).map(task => {
              const isDone = task.status === 'done';
              const isInProgress = task.status === 'in_progress';

              return (
                <div 
                  key={task._id}
                  onClick={() => handleTaskClick(task)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl cursor-pointer transition-all flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white leading-snug line-clamp-2">{task.title}</span>
                    <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                      isDone 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250' 
                        : isInProgress
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-250' 
                          : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-250'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Project: {task.project?.name}</p>
                </div>
              );
            })}

            {tasks.filter(task => {
              if (!task.dueDate) return false;
              const d = new Date(task.dueDate);
              return d.getDate() === selectedDay && 
                d.getMonth() === currentMonth && 
                d.getFullYear() === currentYear;
            }).length === 0 && (
              <div className="py-8 text-center text-slate-400 dark:text-slate-650 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-xs">No tasks due today.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isTaskModalOpen && selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleModalSave}
          members={taskMembers}
          currentUser={currentUser}
        />
      )}
    </>
  );
});

export default Calendar;

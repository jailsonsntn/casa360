
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, RecurrenceType, PriorityLevel } from '../types';
import {
  Plus,
  Calendar as CalIcon,
  Columns,
  List as ListIcon,
  CheckCircle2,
  Circle,
  X,
  Clock,
  Edit2,
  Check,
  BellRing,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CalendarDays,
  Trash2,
  GripVertical,
  Calendar as CalendarIcon,
  Repeat,
  AlertCircle
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface RoutineViewProps {
  tasks: Task[];
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

type MainView = 'kanban' | 'list' | 'calendar';
type CalendarSubView = 'day' | 'week' | 'month';

const RoutineView: React.FC<RoutineViewProps> = ({ tasks, onAdd, onUpdate, onDelete }) => {
  const [view, setView] = useState<MainView>('kanban');
  const [calView, setCalView] = useState<CalendarSubView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form States
  const [title, setTitle] = useState('');
  const [resp, setResp] = useState('');
  const [dueDateOnly, setDueDateOnly] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [hasTimeWindow, setHasTimeWindow] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const weekDays = [
    { label: 'Seg', value: 1 },
    { label: 'Ter', value: 2 },
    { label: 'Qua', value: 3 },
    { label: 'Qui', value: 4 },
    { label: 'Sex', value: 5 },
    { label: 'Sáb', value: 6 },
    { label: 'Dom', value: 0 }
  ];

  const hasScheduleConfigured = !!startTime && !!endTime;
  const missingNotificationSchedule = alarmEnabled && !hasScheduleConfigured;
  const missingTimeWindowValues = hasTimeWindow && !hasScheduleConfigured;
  const invalidTimeWindow = hasTimeWindow && hasScheduleConfigured && endTime <= startTime;
  const missingRecurringDays = isRecurring && recurringDays.length === 0;
  const isSubmitDisabled = !title.trim() || !dueDateOnly || missingNotificationSchedule || missingTimeWindowValues || invalidTimeWindow || missingRecurringDays;

  const getTaskScheduleLabel = (task: Task) => {
    const config = task.alarmConfig;
    if (config?.scheduleType === 'range' && config.startTime && config.endTime) {
      return `${config.startTime} às ${config.endTime}`;
    }
    if (config?.scheduleType === 'single' && config.time) {
      return config.time;
    }
    const due = new Date(task.dueDate);
    if (due.getHours() !== 0 || due.getMinutes() !== 0) {
      return due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'Sem horário';
  };

  const getTaskOccurrenceDateTime = (task: Task, targetDate: Date) => {
    const occurrence = new Date(targetDate);
    const config = task.alarmConfig;
    let time = '';

    if (config?.scheduleType === 'range') time = config.startTime || '';
    else if (config?.scheduleType === 'single') time = config.time || '';

    if (time) {
      const [hour, minute] = time.split(':').map(Number);
      occurrence.setHours(hour || 0, minute || 0, 0, 0);
      return occurrence;
    }

    const due = new Date(task.dueDate);
    occurrence.setHours(due.getHours(), due.getMinutes(), 0, 0);
    return occurrence;
  };

  const taskOccursOnDate = (task: Task, targetDate: Date) => {
    const due = new Date(task.dueDate);
    const dueDay = new Date(due);
    dueDay.setHours(0, 0, 0, 0);
    const selectedDay = new Date(targetDate);
    selectedDay.setHours(0, 0, 0, 0);

    if (task.alarmConfig?.recurring) {
      const days = task.alarmConfig.recurringDays || [];
      return selectedDay >= dueDay && days.includes(targetDate.getDay());
    }

    return due.toDateString() === targetDate.toDateString();
  };

  const toggleRecurringDay = (day: number) => {
    setRecurringDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b));
  };

  useEffect(() => {
    if (editingTask) {
      const alarmConfig = editingTask.alarmConfig;
      const due = new Date(editingTask.dueDate);
      setTitle(editingTask.title || '');
      setResp(editingTask.responsible || '');
      setDueDateOnly(due.toISOString().slice(0, 10));
      setStatus(editingTask.status || 'pending');
      setPriority(editingTask.priority || 'medium');
      setAlarmEnabled(alarmConfig?.enabled || false);
      setIsRecurring(alarmConfig?.recurring || editingTask.recurrence === 'weekly');
      setRecurringDays(alarmConfig?.recurringDays || []);
      const fallbackTime = `${due.getHours().toString().padStart(2, '0')}:${due.getMinutes().toString().padStart(2, '0')}`;
      if (alarmConfig?.scheduleType === 'range' && alarmConfig.startTime && alarmConfig.endTime) {
        setHasTimeWindow(true);
        setStartTime(alarmConfig.startTime);
        setEndTime(alarmConfig.endTime);
      } else if (alarmConfig?.time) {
        setHasTimeWindow(true);
        setStartTime(alarmConfig.time);
        setEndTime(alarmConfig.time);
      } else if (due.getHours() !== 0 || due.getMinutes() !== 0) {
        setHasTimeWindow(true);
        setStartTime(fallbackTime);
        setEndTime(fallbackTime);
      } else {
        setHasTimeWindow(false);
        setStartTime('');
        setEndTime('');
      }
      setIsAdding(true);
    }
  }, [editingTask]);

  const resetForm = () => {
    setTitle(''); setResp(''); setDueDateOnly(new Date().toISOString().slice(0, 10));
    setStatus('pending'); setPriority('medium'); setAlarmEnabled(false);
    setIsRecurring(false); setRecurringDays([]);
    setHasTimeWindow(false); setStartTime(''); setEndTime('');
    setEditingTask(null); setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    const selectedStartTime = hasTimeWindow ? startTime : '00:00';
    const dueDateTime = new Date(`${dueDateOnly}T${selectedStartTime}`);

    const taskAlarmConfig = {
      enabled: alarmEnabled,
      sound: true,
      vibration: true,
      triggered: false,
      scheduleType: hasTimeWindow ? 'range' as const : undefined,
      time: hasTimeWindow ? startTime : undefined,
      startTime: hasTimeWindow ? startTime : undefined,
      endTime: hasTimeWindow ? endTime : undefined,
      recurring: isRecurring,
      recurringDays: isRecurring ? recurringDays : []
    };

    const taskData = {
      title, description: '', responsible: resp || 'Residente',
      dueDate: dueDateTime.toISOString(),
      recurrence: (isRecurring ? 'weekly' : 'none') as RecurrenceType, status, priority,
      alarmConfig: taskAlarmConfig,
      points: priority === 'high' ? 50 : 20
    };
    if (editingTask) onUpdate(editingTask.id, taskData);
    else onAdd(taskData);
    resetForm();
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    onUpdate(task.id, { status: newStatus });
    if (newStatus === 'completed') notificationService.vibrate('short');
  };

  const stages: { id: TaskStatus, label: string, color: string }[] = [
    { id: 'pending', label: 'Pendente', color: 'bg-indigo-400' },
    { id: 'in_progress', label: 'Fazendo', color: 'bg-blue-500' },
    { id: 'completed', label: 'Feito', color: 'bg-emerald-500' }
  ];

  // DRAG AND DROP HANDLERS
  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.currentTarget.classList.add('opacity-40');
  };

  const onDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-40');
  };

  const onDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    onUpdate(taskId, { status: newStatus });
    e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10');
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-indigo-50/50', 'dark:bg-indigo-900/10');
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10');
  };

  // CALENDAR HELPERS
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (calView === 'month') newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    else if (calView === 'week') newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    else newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100">Calendário</h3>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Visualize suas tarefas por data</p>
            </div>
            <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl md:rounded-2xl w-full sm:w-auto">
              {(['day', 'week', 'month'] as CalendarSubView[]).map(v => (
                <button
                  key={v}
                  onClick={() => setCalView(v)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    calView === v
                      ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => navigateDate('prev')}
              className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 min-w-[200px] text-center">
              {currentDate.toLocaleDateString('pt-BR', calView === 'month' ? { month: 'long', year: 'numeric' } : { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={() => navigateDate('next')}
              className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 min-h-[400px] shadow-sm overflow-x-auto">
          {calView === 'month' && (
            <div className="grid grid-cols-7 gap-3 min-w-[500px]">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="text-center text-xs font-bold text-zinc-400 uppercase py-3 tracking-wider">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayDate = new Date(year, month, day);
                const dayTasks = tasks.filter(t => {
                  return taskOccursOnDate(t, dayDate);
                });
                return (
                  <div
                    key={day}
                    onClick={() => { const d = new Date(currentDate); d.setDate(day); setCurrentDate(d); setCalView('day'); }}
                    className="aspect-square border border-zinc-100 dark:border-zinc-800 rounded-2xl p-2 flex flex-col items-center gap-1 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                  >
                    <span className={`text-sm font-medium ${dayTasks.length > 0 ? 'text-indigo-600 font-bold' : 'text-zinc-500'}`}>
                      {day}
                    </span>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {dayTasks.slice(0, 3).map(t => (
                        <div key={t.id} className={`w-1.5 h-1.5 rounded-full ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {calView === 'day' && (
            <div className="space-y-4 max-w-md mx-auto">
              <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest text-center border-b border-zinc-100 dark:border-zinc-800 pb-4">
                Agenda: {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h4>
              {tasks.filter(t => taskOccursOnDate(t, currentDate)).length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <CalendarIcon size={48} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
                  <div className="text-sm font-medium uppercase tracking-wider text-zinc-400">Nada planejado</div>
                  <p className="text-xs text-zinc-400 mt-2">Adicione tarefas para este dia</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.filter(t => taskOccursOnDate(t, currentDate))
                    .sort((a, b) => getTaskOccurrenceDateTime(a, currentDate).getTime() - getTaskOccurrenceDateTime(b, currentDate).getTime())
                    .map(t => (
                      <div
                        key={t.id}
                        onClick={() => setEditingTask(t)}
                        className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl cursor-pointer hover:border-indigo-500 border border-transparent transition-all group"
                      >
                        <div className="text-sm font-bold text-indigo-600 bg-white dark:bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                          {getTaskScheduleLabel(t)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-indigo-600 transition-colors">
                            {t.title}
                          </div>
                          {t.responsible && (
                            <div className="text-xs text-zinc-500 mt-1">👤 {t.responsible}</div>
                          )}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          {calView === 'week' && (
            <div className="flex gap-3 h-full overflow-x-auto no-scrollbar min-w-[800px]">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(currentDate);
                d.setDate(currentDate.getDate() - currentDate.getDay() + i);
                const dayTasks = tasks
                  .filter(t => taskOccursOnDate(t, d))
                  .sort((a, b) => getTaskOccurrenceDateTime(a, d).getTime() - getTaskOccurrenceDateTime(b, d).getTime());
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className={`flex-1 min-w-[140px] rounded-2xl p-3 flex flex-col gap-3 border ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-zinc-50 dark:bg-zinc-800/20 border-zinc-100 dark:border-zinc-800/50'}`}>
                    <div className={`text-center text-xs font-bold uppercase border-b pb-2 ${isToday ? 'border-indigo-200 dark:border-indigo-800 text-indigo-600' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'}`}>
                      {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                      <div className={`text-lg font-bold mt-1 ${isToday ? 'text-indigo-600' : 'text-zinc-600 dark:text-zinc-300'}`}>
                        {d.getDate()}
                      </div>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
                      {dayTasks.length === 0 ? (
                        <div className="text-center py-8 opacity-50">
                          <div className="text-xs text-zinc-400">Sem tarefas</div>
                        </div>
                      ) : (
                        dayTasks.map(t => (
                          <div
                            key={t.id}
                            onClick={() => setEditingTask(t)}
                            className="bg-white dark:bg-zinc-900 p-3 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:border-indigo-500 transition-all cursor-pointer group"
                          >
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors">
                              {t.title}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">
                              {getTaskScheduleLabel(t)}
                            </div>
                            {t.responsible && (
                              <div className="text-xs text-zinc-400 mt-1">👤 {t.responsible}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChecklist = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Todas as Tarefas</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Lista completa das suas atividades</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              Nova Tarefa
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {tasks.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map(task => (
            <div key={task.id} className="px-6 py-5 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleTaskStatus(task)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 border-2 ${
                    task.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-zinc-300 dark:border-zinc-600 text-transparent hover:border-indigo-400'
                  }`}
                >
                  <Check size={14} />
                </button>
                <div onClick={() => toggleTaskStatus(task)} className="cursor-pointer flex-1 py-1">
                  <p className={`text-sm font-semibold transition-all mb-1 ${
                    task.status === 'completed' ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-100'
                  }`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {task.responsible && (
                      <>
                        <span>•</span>
                        <span>👤 {task.responsible}</span>
                      </>
                    )}
                    {task.priority !== 'medium' && (
                      <>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {task.priority === 'high' ? 'Alta' : 'Baixa'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingTask(task)}
                  className="p-2 text-zinc-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => { if (confirm('Excluir esta tarefa?')) onDelete(task.id); }}
                  className="p-2 text-zinc-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="py-24 text-center">
              <div className="text-zinc-400 dark:text-zinc-500 mb-2">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
              </div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Tudo em ordem!</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Sua casa está organizada e todas as tarefas estão concluídas</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-4">
      {/* Header Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Rotinas da Casa</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Gerencie suas tarefas e mantenha tudo organizado</p>
          </div>
          <button
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={18} /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* View Selector */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl md:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-3 md:p-4">
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl md:rounded-2xl w-full md:w-fit">
          <button
            onClick={() => setView('kanban')}
            className={`flex-1 md:flex-initial px-3 md:px-6 py-3 rounded-lg md:rounded-xl transition-all flex items-center justify-center md:gap-2 text-sm font-medium ${
              view === 'kanban'
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
            title="Kanban"
          >
            <Columns size={18} />
            <span className="hidden md:inline">Kanban</span>
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 md:flex-initial px-3 md:px-6 py-3 rounded-lg md:rounded-xl transition-all flex items-center justify-center md:gap-2 text-sm font-medium ${
              view === 'list'
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
            title="Lista"
          >
            <ListIcon size={18} />
            <span className="hidden md:inline">Lista</span>
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex-1 md:flex-initial px-3 md:px-6 py-3 rounded-lg md:rounded-xl transition-all flex items-center justify-center md:gap-2 text-sm font-medium ${
              view === 'calendar'
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
            title="Calendário"
          >
            <CalIcon size={18} />
            <span className="hidden md:inline">Calendário</span>
          </button>
        </div>
      </div>

      {/* Kanban com Drag & Drop */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {stages.map(stage => (
            <div
              key={stage.id}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, stage.id)}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 min-h-[500px] transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">{stage.label}</h3>
                </div>
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-3 py-1 rounded-full text-xs font-semibold">
                  {tasks.filter(t => t.status === stage.id).length}
                </span>
              </div>
              <div className="space-y-4">
                {tasks.filter(t => t.status === stage.id).map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => setEditingTask(task)}
                    className="bg-white dark:bg-zinc-800 p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 cursor-move hover:border-indigo-300 hover:shadow-md transition-all group relative"
                  >
                    <div className="absolute top-4 right-4 text-zinc-300 group-hover:text-zinc-400 transition-colors">
                      <GripVertical size={16} />
                    </div>
                    <h4 className={`font-semibold text-sm leading-tight pr-8 mb-3 ${task.status === 'completed' ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                        <Clock size={12} />
                        <span className="font-medium">{new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400 font-medium">
                        {task.responsible}
                      </div>
                    </div>
                    {task.priority !== 'medium' && (
                      <div className={`mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        {task.priority === 'high' ? 'Alta' : 'Baixa'} prioridade
                      </div>
                    )}
                    {task.alarmConfig?.recurring && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                        <Repeat size={11} /> Recorrente
                      </div>
                    )}
                  </div>
                ))}
                {tasks.filter(t => t.status === stage.id).length === 0 && (
                  <div className="text-center py-12 text-zinc-400 dark:text-zinc-500">
                    <div className="text-sm font-medium mb-2">Nenhuma tarefa</div>
                    <div className="text-xs">Arraste tarefas aqui</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'list' && renderChecklist()}
      {view === 'calendar' && renderCalendar()}

      {/* Formulário Ultra-Slim Modal (Now Theme Aware) */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 shrink-0">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              <button onClick={resetForm} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-white dark:bg-zinc-900">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500">O que precisa ser feito?</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 transition-colors" placeholder="Ex: Lavar louça" required />
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Estado atual</label>
                  <div className="grid grid-cols-3 gap-2">
                    {stages.map(s => (
                      <button key={s.id} type="button" onClick={() => setStatus(s.id)} className={`py-2 rounded-lg text-xs font-medium border transition-all ${status === s.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Prioridade</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as PriorityLevel[]).map(p => (
                      <button key={p} type="button" onClick={() => setPriority(p)} className={`py-2 rounded-lg text-xs font-medium border transition-all ${priority === p ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                        {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-500">
                  <Repeat size={18} className={isRecurring ? 'text-indigo-500' : 'text-zinc-400'} />
                  <span className="text-xs font-medium">Tarefa Recorrente</span>
                </div>
                <button type="button" onClick={() => setIsRecurring(!isRecurring)} className={`w-11 h-6 rounded-full relative transition-all ${isRecurring ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isRecurring ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              {isRecurring && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500">Dias da semana</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {weekDays.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleRecurringDay(day.value)}
                        className={`py-2 rounded-lg text-xs font-medium border transition-all ${recurringDays.includes(day.value) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Data limite (obrigatório)</label>
                  <input type="date" value={dueDateOnly} onChange={e => setDueDateOnly(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-3 outline-none text-xs font-medium text-zinc-900 dark:text-zinc-100" required />
                  <p className="text-[11px] text-zinc-400">Sem horário, a tarefa vale para o dia todo.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Responsável</label>
                  <input type="text" value={resp} onChange={e => setResp(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-3 outline-none text-xs font-medium text-zinc-900 dark:text-zinc-100" placeholder="Quem?" />
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-500">
                  <Clock size={18} className={hasTimeWindow ? 'text-indigo-500' : 'text-zinc-400'} />
                  <span className="text-xs font-medium">Adicionar horário (opcional)</span>
                </div>
                <button type="button" onClick={() => {
                  const next = !hasTimeWindow;
                  setHasTimeWindow(next);
                  if (!next) {
                    setStartTime('');
                    setEndTime('');
                    setAlarmEnabled(false);
                  }
                }} className={`w-11 h-6 rounded-full relative transition-all ${hasTimeWindow ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${hasTimeWindow ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              {hasTimeWindow && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">Início</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-3 outline-none text-xs font-medium text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">Fim</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-3 outline-none text-xs font-medium text-zinc-900 dark:text-zinc-100" />
                  </div>
                </div>
              )}

              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-500">
                  <BellRing size={18} className={alarmEnabled ? 'text-indigo-500' : 'text-zinc-400'} />
                  <span className="text-xs font-medium">Notificar no horário definido</span>
                </div>
                <button type="button" onClick={() => {
                  const next = !alarmEnabled;
                  setAlarmEnabled(next);
                  if (next) setHasTimeWindow(true);
                }} className={`w-11 h-6 rounded-full relative transition-all ${alarmEnabled ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${alarmEnabled ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              {missingNotificationSchedule && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/10 px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-300 text-xs font-medium">
                  <AlertCircle size={14} /> Para notificar, preencha horário de início e fim.
                </div>
              )}

              {!missingNotificationSchedule && missingTimeWindowValues && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/10 px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-300 text-xs font-medium">
                  <AlertCircle size={14} /> Defina horário de início e fim da tarefa.
                </div>
              )}

              {!missingNotificationSchedule && !missingTimeWindowValues && invalidTimeWindow && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/10 px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-300 text-xs font-medium">
                  <AlertCircle size={14} /> O horário de fim deve ser maior que o início.
                </div>
              )}

              {!missingNotificationSchedule && !missingTimeWindowValues && !invalidTimeWindow && missingRecurringDays && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/10 px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-300 text-xs font-medium">
                  <AlertCircle size={14} /> Selecione ao menos um dia da semana.
                </div>
              )}

              {editingTask && (
                <button
                  type="button"
                  onClick={() => { if (confirm('Excluir esta tarefa permanente?')) { onDelete(editingTask.id); resetForm(); } }}
                  className="w-full py-3 text-rose-600 font-medium text-xs bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Excluir Tarefa
                </button>
              )}
            </div>

            <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <button onClick={handleSubmit} disabled={isSubmitDisabled} type="button" className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${isSubmitDisabled ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'}`}>
                <Check size={18} /> {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineView;

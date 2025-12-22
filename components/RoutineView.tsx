
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
  GripVertical
} from 'lucide-react';

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
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [alarmEnabled, setAlarmEnabled] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setResp(editingTask.responsible || '');
      setDate(new Date(editingTask.dueDate).toISOString().slice(0, 16));
      setStatus(editingTask.status || 'pending');
      setPriority(editingTask.priority || 'medium');
      setAlarmEnabled(editingTask.alarmConfig?.enabled || false);
      setIsAdding(true);
    }
  }, [editingTask]);

  const resetForm = () => {
    setTitle(''); setResp(''); setDate(new Date().toISOString().slice(0, 16));
    setStatus('pending'); setPriority('medium'); setAlarmEnabled(false);
    setEditingTask(null); setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const taskData = {
      title, description: '', responsible: resp || 'Residente',
      dueDate: new Date(date).toISOString(),
      recurrence: 'none' as RecurrenceType, status, priority,
      alarmConfig: { enabled: alarmEnabled, sound: true, vibration: true, triggered: false },
      points: priority === 'high' ? 50 : 20
    };
    if (editingTask) onUpdate(editingTask.id, taskData);
    else onAdd(taskData);
    resetForm();
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    onUpdate(task.id, { status: newStatus });
    if (newStatus === 'completed' && 'vibrate' in navigator) navigator.vibrate([10, 50, 10]);
  };

  const stages: {id: TaskStatus, label: string, color: string}[] = [
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
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex gap-1 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            {(['day', 'week', 'month'] as CalendarSubView[]).map(v => (
              <button key={v} onClick={() => setCalView(v)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${calView === v ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-400"><ChevronLeft size={18}/></button>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200 min-w-[140px] text-center">
              {currentDate.toLocaleDateString('pt-BR', calView === 'month' ? { month: 'long', year: 'numeric' } : { day: '2-digit', month: 'short' })}
            </span>
            <button onClick={() => navigateDate('next')} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-400"><ChevronRight size={18}/></button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-6 min-h-[400px] shadow-sm overflow-x-auto">
          {calView === 'month' && (
            <div className="grid grid-cols-7 gap-2 min-w-[500px]">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} className="text-center text-[8px] font-black text-slate-300 uppercase py-2 tracking-widest">{d}</div>)}
              {Array.from({length: firstDay}).map((_, i) => <div key={`empty-${i}`} className="aspect-square"></div>)}
              {Array.from({length: daysInMonth}).map((_, i) => {
                const day = i + 1;
                const dayTasks = tasks.filter(t => {
                  const d = new Date(t.dueDate);
                  return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
                });
                return (
                  <div key={day} onClick={() => { const d = new Date(currentDate); d.setDate(day); setCurrentDate(d); setCalView('day'); }} className="aspect-square border border-slate-50 dark:border-slate-800/40 rounded-xl p-1 flex flex-col items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer group">
                    <span className={`text-[9px] font-bold ${dayTasks.length > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>{day}</span>
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {dayTasks.slice(0, 3).map(t => <div key={t.id} className="w-1 h-1 bg-indigo-500 rounded-full"></div>)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {calView === 'day' && (
            <div className="space-y-4 max-w-md mx-auto">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100 dark:border-slate-800 pb-4">Agenda: {currentDate.toLocaleDateString()}</h4>
               {tasks.filter(t => new Date(t.dueDate).toDateString() === currentDate.toDateString()).length === 0 ? (
                 <div className="text-center py-20 opacity-20 text-[10px] font-black uppercase tracking-widest">Nada planejado</div>
               ) : (
                 tasks.filter(t => new Date(t.dueDate).toDateString() === currentDate.toDateString()).map(t => (
                   <div key={t.id} onClick={() => setEditingTask(t)} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl cursor-pointer hover:border-indigo-500 border border-transparent transition-all">
                      <div className="text-[10px] font-black text-indigo-500">{new Date(t.dueDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex-1 truncate">{t.title}</div>
                   </div>
                 ))
               )}
            </div>
          )}
          {calView === 'week' && (
            <div className="flex gap-2 h-full overflow-x-auto no-scrollbar min-w-[800px]">
              {Array.from({length: 7}).map((_, i) => {
                const d = new Date(currentDate);
                d.setDate(currentDate.getDate() - currentDate.getDay() + i);
                const dayTasks = tasks.filter(t => new Date(t.dueDate).toDateString() === d.toDateString());
                return (
                  <div key={i} className="flex-1 min-w-[120px] bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-2 flex flex-col gap-2 border border-slate-100 dark:border-slate-800/40">
                    <div className="text-center text-[8px] font-black text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 pb-1">{d.toLocaleDateString('pt-BR', {weekday: 'short'})} {d.getDate()}</div>
                    <div className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
                      {dayTasks.map(t => (
                        <div key={t.id} onClick={() => setEditingTask(t)} className="bg-white dark:bg-slate-900 p-2 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-300 shadow-sm hover:border-indigo-500 border border-transparent transition-all cursor-pointer">{t.title}</div>
                      ))}
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
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {tasks.sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map(task => (
          <div key={task.id} className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all">
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => toggleTaskStatus(task)} 
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 border-2 ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-slate-700 text-transparent hover:border-indigo-400'}`}
              >
                <Check size={14} />
              </button>
              <div onClick={() => toggleTaskStatus(task)} className="cursor-pointer flex-1 py-1">
                <p className={`text-xs font-bold transition-all ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{task.title}</p>
                <div className="flex items-center gap-3 mt-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Clock size={10}/> {new Date(task.dueDate).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{task.responsible}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditingTask(task)} className="p-2 text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" title="Editar"><Edit2 size={14}/></button>
              <button onClick={() => { if(confirm('Excluir esta tarefa?')) onDelete(task.id); }} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all" title="Excluir"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <div className="py-24 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">Sua casa está em ordem</div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-4">
      {/* View Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
          <button onClick={() => setView('kanban')} className={`p-2.5 rounded-xl transition-all ${view === 'kanban' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="Kanban">
            <Columns size={18} />
          </button>
          <button onClick={() => setView('list')} className={`p-2.5 rounded-xl transition-all ${view === 'list' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="Checklist">
            <ListIcon size={18} />
          </button>
          <button onClick={() => setView('calendar')} className={`p-2.5 rounded-xl transition-all ${view === 'calendar' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="Calendário">
            <CalIcon size={18} />
          </button>
        </div>
        <button onClick={() => { resetForm(); setIsAdding(true); }} className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all">
          <Plus size={16} /> Nova Tarefa
        </button>
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
              className="flex flex-col gap-4 bg-slate-100/30 dark:bg-slate-900/40 p-5 rounded-[2.5rem] min-h-[450px] transition-colors duration-200 border-2 border-transparent"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stage.label}</h4>
                </div>
                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600">{tasks.filter(t => t.status === stage.id).length}</span>
              </div>
              <div className="space-y-4">
                {tasks.filter(t => t.status === stage.id).map(task => (
                  <div 
                    key={task.id} 
                    draggable 
                    onDragStart={(e) => onDragStart(e, task.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => setEditingTask(task)} 
                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-move hover:border-indigo-500/50 hover:shadow-lg transition-all group relative active:scale-95"
                  >
                    <div className="absolute top-4 right-4 text-slate-200 group-hover:text-slate-300 transition-colors">
                      <GripVertical size={14} />
                    </div>
                    <h5 className={`font-bold text-xs leading-tight pr-4 ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>{task.title}</h5>
                    <div className="flex items-center justify-between mt-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="opacity-70">{task.responsible}</span>
                      <div className="flex items-center gap-1"><Clock size={10} /> {new Date(task.dueDate).toLocaleDateString([], {day:'2-digit', month:'2-digit'})}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'list' && renderChecklist()}
      {view === 'calendar' && renderCalendar()}

      {/* Formulário Ultra-Slim Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[3rem] shadow-2xl border border-white/5 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
            
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
              <h3 className="font-black text-[11px] text-white uppercase tracking-[0.2em]">{editingTask ? 'Editar' : 'Nova'} Tarefa</h3>
              <button onClick={resetForm} className="p-2.5 text-slate-500 hover:text-white transition-colors"><X size={22} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#0f172a]">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição do Afazer</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 outline-none font-bold text-xs text-white focus:border-indigo-500" placeholder="Ex: Lavar louça" required />
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Status Atual</label>
                  <div className="grid grid-cols-3 gap-2">
                    {stages.map(s => (
                      <button key={s.id} type="button" onClick={() => setStatus(s.id)} className={`py-3.5 rounded-xl text-[9px] font-black uppercase border transition-all ${status === s.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
                        {s.label === 'Pendente' ? 'Pendente' : s.label === 'Fazendo' ? 'Fazendo' : 'Feito'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Nível de Urgência</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as PriorityLevel[]).map(p => (
                      <button key={p} type="button" onClick={() => setPriority(p)} className={`py-3.5 rounded-xl text-[9px] font-black uppercase border transition-all ${priority === p ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
                        {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Prazo Final</label>
                  <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-4 outline-none text-[10px] font-black text-white" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Responsável</label>
                  <input type="text" value={resp} onChange={e => setResp(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-4 outline-none text-[10px] font-bold text-white" placeholder="Quem?" />
                </div>
              </div>

              <div className="bg-slate-900/50 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between">
                <div className="flex items-center gap-4 text-slate-300">
                  <BellRing size={18} className={alarmEnabled ? 'text-indigo-400' : 'text-slate-600'} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Ativar Notificação</span>
                </div>
                <button type="button" onClick={() => setAlarmEnabled(!alarmEnabled)} className={`w-12 h-6 rounded-full relative transition-all ${alarmEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${alarmEnabled ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              
              {editingTask && (
                <button 
                  type="button" 
                  onClick={() => { if(confirm('Excluir esta tarefa permanentemente?')) { onDelete(editingTask.id); resetForm(); } }} 
                  className="w-full py-4 text-rose-500 font-black text-[9px] uppercase tracking-widest bg-rose-500/10 rounded-2xl border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Excluir Tarefa
                </button>
              )}
            </div>

            <div className="px-8 py-6 bg-[#0f172a] border-t border-white/10 shrink-0">
              <button onClick={handleSubmit} type="button" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-3">
                <Check size={20} /> {editingTask ? 'Salvar Alterações' : 'Confirmar Tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineView;

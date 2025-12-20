
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
  User, 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Volume2,
  Check,
  GripVertical
} from 'lucide-react';

interface RoutineViewProps {
  tasks: Task[];
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

const RoutineView: React.FC<RoutineViewProps> = ({ tasks, onAdd, onUpdate, onDelete }) => {
  const [view, setView] = useState<'list' | 'kanban' | 'calendar'>('kanban');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const [columnNames] = useState<Record<TaskStatus, string>>({
    pending: 'A Fazer',
    in_progress: 'Fazendo',
    completed: 'Pronto'
  });

  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [resp, setResp] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0] + "T12:00");
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [alarmEnabled, setAlarmEnabled] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDesc(editingTask.description);
      setResp(editingTask.responsible);
      setDate(editingTask.dueDate.slice(0, 16));
      setRecurrence(editingTask.recurrence);
      setStatus(editingTask.status);
      setPriority(editingTask.priority || 'medium');
      setAlarmEnabled(editingTask.alarmConfig?.enabled || false);
      setIsAdding(true);
    }
  }, [editingTask]);

  const resetForm = () => {
    setTitle(''); setDesc(''); setResp('');
    setDate(new Date().toISOString().split('T')[0] + "T12:00");
    setRecurrence('none'); setStatus('pending');
    setPriority('medium'); setAlarmEnabled(false);
    setEditingTask(null); setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = {
      title, description: desc, responsible: resp || 'Residente',
      dueDate: date, recurrence, status, priority,
      alarmConfig: { enabled: alarmEnabled, sound: true, vibration: true, triggered: false },
      points: 20
    };
    if (editingTask) onUpdate(editingTask.id, taskData);
    else onAdd(taskData);
    resetForm();
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('taskId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(colStatus);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('taskId') || draggedTaskId;
    if (id) {
      onUpdate(id, { status: newStatus });
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const stages: {id: TaskStatus, color: string, ring: string}[] = [
    { id: 'pending', color: 'bg-slate-400', ring: 'ring-slate-100' },
    { id: 'in_progress', color: 'bg-indigo-500', ring: 'ring-indigo-100' },
    { id: 'completed', color: 'bg-emerald-500', ring: 'ring-emerald-100' }
  ];

  const renderKanban = () => (
    <div className="relative -mx-4 md:mx-0">
      <div className="flex md:hidden absolute -top-10 right-4 items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest">
        Deslize para navegar <ChevronRight className="w-3 h-3" />
      </div>

      <div className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-6 px-4 pb-12 no-scrollbar">
        {stages.map(stage => (
          <div 
            key={stage.id} 
            className="flex flex-col gap-4 min-w-[88vw] md:min-w-[340px] shrink-0 snap-center"
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className={`flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-3xl border transition-all duration-300 shadow-sm ${dragOverColumn === stage.id ? 'border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/20' : 'border-slate-100 dark:border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${stage.color} ring-4 ${stage.ring} dark:ring-slate-800`}></div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">{columnNames[stage.id]}</h4>
              </div>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
                {tasks.filter(t => t.status === stage.id).length}
              </span>
            </div>

            <div className={`flex-1 space-y-4 rounded-[2.5rem] p-3 min-h-[550px] transition-colors duration-300 ${dragOverColumn === stage.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'bg-slate-100/30 dark:bg-slate-800/20'}`}>
              {tasks.filter(t => t.status === stage.id).map(task => (
                <div 
                  key={task.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => setEditingTask(task)}
                  className={`bg-white dark:bg-slate-900 p-5 rounded-[2.2rem] shadow-sm border border-slate-50 dark:border-slate-800 transition-all hover:border-indigo-200 dark:hover:border-indigo-800 cursor-grab active:cursor-grabbing group active:scale-[0.98] ${task.priority === 'high' ? 'border-l-4 border-l-rose-500' : ''}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 pr-2">{task.title}</h5>
                    <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-200 dark:text-slate-700">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-500 border border-white dark:border-slate-700 shadow-sm">
                          {task.responsible.charAt(0)}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{task.responsible}</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                        {task.alarmConfig?.enabled && <Volume2 className="w-3.5 h-3.5 text-rose-400" />}
                        <div className="flex items-center gap-1 text-[9px] font-black text-slate-300 dark:text-slate-600">
                           <Clock className="w-3 h-3" />
                           {new Date(task.dueDate).toLocaleDateString([], {day: '2-digit', month: '2-digit'})}
                        </div>
                     </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => { setStatus(stage.id); setIsAdding(true); }} 
                className="w-full py-8 rounded-[2.2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all flex items-center justify-center gap-3 group bg-white/40 dark:bg-transparent"
              >
                <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" /> 
                <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Item</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="grid grid-cols-7 border-t border-slate-50 dark:border-slate-800">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="bg-slate-50/10 dark:bg-slate-800/10 border-r border-b border-slate-50 dark:border-slate-800 min-h-[70px] md:min-h-[100px]"></div>;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTasks = tasks.filter(t => t.dueDate.startsWith(dateStr));
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
          
          return (
            <div 
              key={day} 
              onClick={() => { setDate(dateStr + "T12:00"); setIsAdding(true); }}
              className="p-1.5 md:p-2 border-r border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[70px] md:min-h-[100px]"
            >
              <div className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400'}`}>
                {day}
              </div>
              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 2).map(t => (
                  <div key={t.id} className={`text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded-md truncate uppercase tracking-tighter ${t.status === 'completed' ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600' : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400'}`}>
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 2 && <p className="text-[7px] font-black text-slate-300 pl-1">+{dayTasks.length - 2}</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex w-full md:w-auto gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <button onClick={() => setView('list')} className={`flex-1 md:flex-none flex items-center justify-center p-3 rounded-xl transition-all ${view === 'list' ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><ListIcon className="w-5 h-5" /></button>
          <button onClick={() => setView('kanban')} className={`flex-1 md:flex-none flex items-center justify-center p-3 rounded-xl transition-all ${view === 'kanban' ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Columns className="w-5 h-5" /></button>
          <button onClick={() => setView('calendar')} className={`flex-1 md:flex-none flex items-center justify-center p-3 rounded-xl transition-all ${view === 'calendar' ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><CalIcon className="w-5 h-5" /></button>
        </div>
        <button onClick={() => setIsAdding(true)} className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all">
          <Plus className="w-5 h-5" /> Novo Registro
        </button>
      </div>

      <div className="min-h-[500px]">
        {view === 'calendar' && (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
              <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight capitalize">
                {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); }} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); }} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
            {renderMonthView()}
          </div>
        )}

        {view === 'kanban' && renderKanban()}

        {view === 'list' && (
          <div className="space-y-3 max-w-4xl mx-auto">
            {tasks.map(task => (
              <div key={task.id} className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 md:gap-6 group hover:border-indigo-100 dark:hover:border-indigo-800 transition-all">
                <button onClick={() => onUpdate(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' })}>
                  {task.status === 'completed' ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <Circle className="w-8 h-8 text-slate-100 dark:text-slate-800 hover:text-indigo-100" />}
                </button>
                <div className="flex-1 min-w-0" onClick={() => setEditingTask(task)}>
                  <h4 className={`text-sm md:text-base font-black text-slate-800 dark:text-slate-100 truncate ${task.status === 'completed' ? 'line-through opacity-30' : ''}`}>{task.title}</h4>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(task.dueDate).toLocaleDateString()}</span>
                    <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${task.status === 'completed' ? 'text-emerald-500' : 'text-indigo-500'}`}>{columnNames[task.status]}</span>
                  </div>
                </div>
                <div className="flex gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => setEditingTask(task)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                   <button onClick={() => { if(confirm('Excluir esta tarefa?')) onDelete(task.id); }} className="p-2.5 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[110] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[3rem] md:rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden border border-white/20">
             <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
                <div>
                   <h3 className="font-black text-xl md:text-2xl text-slate-800 dark:text-white">{editingTask ? 'Ajustar Afazer' : 'Novo Registro'}</h3>
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Gestão de afazeres domésticos</p>
                </div>
                <button onClick={resetForm} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-md hover:text-rose-500 transition-all"><X className="w-6 h-6 dark:text-slate-400" /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar pb-24 md:pb-10">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título da Tarefa</label>
                   <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 md:p-5 outline-none focus:border-indigo-500 text-base md:text-lg font-black text-slate-800 dark:text-white transition-all" placeholder="Ex: Pintar a sala" required />
                </div>
                
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioridade</label>
                   <div className="grid grid-cols-3 gap-2">
                      {(['low', 'medium', 'high'] as PriorityLevel[]).map(p => (
                         <button key={p} type="button" onClick={() => setPriority(p)} className={`p-4 rounded-2xl text-[9px] md:text-[10px] font-black uppercase border-2 transition-all ${priority === p ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-700'}`}>
                            {p === 'low' ? 'Mínima' : p === 'medium' ? 'Média' : 'Urgente'}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável</label>
                      <input type="text" value={resp} onChange={e => setResp(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 outline-none font-bold dark:text-white" placeholder="Nome" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data e Hora</label>
                      <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 outline-none font-bold dark:text-white" required />
                   </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${alarmEnabled ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-700 shadow-sm'}`}>
                         <Volume2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">Notificar ao Vencer</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">Alerta sonoro e visual</p>
                      </div>
                   </div>
                   <button type="button" onClick={() => setAlarmEnabled(!alarmEnabled)} className={`w-12 h-6 rounded-full transition-all relative ${alarmEnabled ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${alarmEnabled ? 'right-1' : 'left-1'}`}></div>
                   </button>
                </div>

                <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white p-6 md:p-7 rounded-2xl md:rounded-[2.5rem] font-black text-base md:text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4">
                   <Check className="w-6 h-6" /> Confirmar Afazer
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineView;

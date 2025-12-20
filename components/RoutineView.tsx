
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
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Volume2,
  Check,
  GripVertical,
  BellRing
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

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

  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [resp, setResp] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0] + "T12:00");
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [alarmEnabled, setAlarmEnabled] = useState(false);

  // Sistema de monitoramento de alarmes (Simulação de Trigger em tempo real)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.status === 'pending' && task.dueDate) {
          const taskDate = new Date(task.dueDate);
          // Se a tarefa venceu no último minuto e tem alarme ou é prioridade alta
          const isDueNow = Math.abs(now.getTime() - taskDate.getTime()) < 60000;
          
          if (isDueNow && (task.alarmConfig?.enabled || task.priority === 'high')) {
            notificationService.playAlarmSound();
            notificationService.vibrate([300, 100, 300]);
            notificationService.sendLocalNotification(
              `Urgente: ${task.title}`,
              `Tarefa de prioridade ${task.priority === 'high' ? 'ALTA' : 'configurada'} precisa ser feita agora!`
            );
          }
        }
      });
    }, 60000); // Checa a cada minuto
    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setDesc(editingTask.description || '');
      setResp(editingTask.responsible || '');
      setDate(editingTask.dueDate ? editingTask.dueDate.slice(0, 16) : new Date().toISOString().split('T')[0] + "T12:00");
      setRecurrence(editingTask.recurrence || 'none');
      setStatus(editingTask.status || 'pending');
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
      alarmConfig: { 
        enabled: alarmEnabled || priority === 'high', // Alarme automático para alta prioridade
        sound: true, vibration: true, triggered: false 
      },
      points: priority === 'high' ? 50 : 20
    };
    if (editingTask) onUpdate(editingTask.id, taskData);
    else onAdd(taskData);
    resetForm();
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('taskId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('taskId') || draggedTaskId;
    if (id) onUpdate(id, { status: newStatus });
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const stages: {id: TaskStatus, label: string, color: string}[] = [
    { id: 'pending', label: 'A Fazer', color: 'bg-slate-400' },
    { id: 'in_progress', label: 'Fazendo', color: 'bg-indigo-500' },
    { id: 'completed', label: 'Pronto', color: 'bg-emerald-500' }
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header Compacto */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><ListIcon size={18} /></button>
          <button onClick={() => setView('kanban')} className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><Columns size={18} /></button>
          <button onClick={() => setView('calendar')} className={`p-2 rounded-lg transition-all ${view === 'calendar' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><CalIcon size={18} /></button>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all">
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      {/* Kanban Minimalista */}
      {view === 'kanban' && (
        <div className="flex flex-row overflow-x-auto gap-4 pb-6 no-scrollbar">
          {stages.map(stage => (
            <div 
              key={stage.id} 
              className="flex flex-col gap-3 min-w-[280px] flex-1 max-w-sm"
              onDragOver={(e) => { e.preventDefault(); setDragOverColumn(stage.id); }}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${stage.color}`}></div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stage.label}</h4>
                </div>
                <span className="text-[9px] font-bold text-slate-400">{tasks.filter(t => t.status === stage.id).length}</span>
              </div>

              <div className={`flex-1 space-y-3 p-2 rounded-2xl transition-colors min-h-[400px] ${dragOverColumn === stage.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}>
                {tasks.filter(t => t.status === stage.id).map(task => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => setEditingTask(task)}
                    className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-indigo-200 cursor-grab active:cursor-grabbing group transition-all ${task.priority === 'high' ? 'border-l-4 border-l-rose-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-tight">{task.title}</h5>
                      <GripVertical size={14} className="text-slate-300 opacity-0 group-hover:opacity-100" />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center text-[8px] font-black text-slate-500">
                          {task.responsible.charAt(0)}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{task.responsible}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-slate-400">
                        {task.priority === 'high' && <BellRing size={10} className="text-rose-500 animate-pulse" />}
                        <Clock size={10} />
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString([], {day: '2-digit', month: '2-digit'}) : 'S/D'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista e Calendário seguem a mesma lógica de compactação... */}
      {view === 'list' && (
        <div className="space-y-2 max-w-3xl mx-auto">
          {tasks.map(task => (
            <div key={task.id} className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:border-indigo-100 transition-all">
              <button onClick={() => onUpdate(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' })}>
                {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-200" />}
              </button>
              <div className="flex-1 min-w-0" onClick={() => setEditingTask(task)}>
                <h4 className={`text-xs font-bold text-slate-800 dark:text-slate-200 truncate ${task.status === 'completed' ? 'line-through opacity-40' : ''}`}>{task.title}</h4>
                <div className="flex gap-3 mt-0.5">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'S/D'}</span>
                   <span className={`text-[8px] font-black uppercase ${task.priority === 'high' ? 'text-rose-500' : 'text-slate-400'}`}>{task.priority}</span>
                </div>
              </div>
              <div className="flex gap-1">
                 <button onClick={() => { if(confirm('Excluir?')) onDelete(task.id); }} className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro Minimalista */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                <button onClick={resetForm} className="p-1 text-slate-400 hover:text-rose-500 transition-all"><X size={18} /></button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">O que precisa ser feito?</label>
                   <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500 text-sm font-bold dark:text-white" placeholder="Título" required />
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioridade & Urgência</label>
                   <div className="grid grid-cols-3 gap-2">
                      {(['low', 'medium', 'high'] as PriorityLevel[]).map(p => (
                         <button 
                           key={p} 
                           type="button" 
                           onClick={() => setPriority(p)} 
                           className={`py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all ${
                             priority === p 
                             ? (p === 'high' ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20' : 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20') 
                             : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800 dark:border-slate-800'
                           }`}
                         >
                            {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data/Hora</label>
                      <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl p-3 outline-none text-xs font-bold dark:text-white" required />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável</label>
                      <input type="text" value={resp} onChange={e => setResp(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl p-3 outline-none text-xs font-bold dark:text-white" placeholder="Nome" />
                   </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-2">
                      <Volume2 size={14} className={alarmEnabled || priority === 'high' ? 'text-indigo-600' : 'text-slate-300'} />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Ativar Alarme Inteligente</span>
                   </div>
                   <button 
                    type="button" 
                    onClick={() => setAlarmEnabled(!alarmEnabled)} 
                    className={`w-10 h-5 rounded-full transition-all relative ${alarmEnabled || priority === 'high' ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                   >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${alarmEnabled || priority === 'high' ? 'right-0.5' : 'left-0.5'}`}></div>
                   </button>
                </div>

                <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                   <Check size={16} /> {editingTask ? 'Salvar Alterações' : 'Confirmar Tarefa'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineView;

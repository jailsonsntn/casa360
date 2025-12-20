
import React, { useState } from 'react';
import { Task, RecurrenceType } from '../types';
import { Plus, Search, Calendar, User, CheckCircle2, Circle, MoreVertical, X, CheckSquare } from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onToggle: (id: string) => void;
}

const TasksView: React.FC<TasksViewProps> = ({ tasks, onAdd, onToggle }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [search, setSearch] = useState('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [resp, setResp] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  const filteredTasks = tasks.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      title,
      description: desc,
      responsible: resp || 'Residente',
      dueDate: date,
      recurrence,
      status: 'pending',
      priority: 'medium',
      points: 20
    });
    setIsAdding(false);
    setTitle('');
    setDesc('');
    setResp('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in slide-in-from-right duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Gerenciador de Tarefas</h2>
          <p className="text-sm text-slate-500 font-medium">Organize o dia a dia da residência</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Adicionar Tarefa
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center">
          <Search className="w-5 h-5 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar tarefas..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-0 focus:ring-0 outline-none w-full text-sm font-medium"
          />
        </div>
        <div className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl overflow-x-auto">
          {(['pending', 'completed', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-bold rounded-xl capitalize whitespace-nowrap transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              {f === 'pending' ? 'Pendentes' : f === 'completed' ? 'Concluídas' : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map(task => (
          <div 
            key={task.id} 
            className={`bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:border-indigo-100 group ${task.status === 'completed' ? 'opacity-50' : ''}`}
          >
            <button 
              onClick={() => onToggle(task.id)} 
              className="mt-1 shrink-0"
            >
              {task.status === 'completed' ? (
                <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                   <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 hover:border-indigo-300">
                   <Circle className="w-5 h-5 text-slate-300" />
                </div>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-slate-800 truncate ${task.status === 'completed' ? 'line-through' : ''}`}>{task.title}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <User className="w-3 h-3 text-indigo-400" />
                  {task.responsible}
                </div>
              </div>
            </div>
            <button className="text-slate-300 hover:text-slate-500 p-2">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckSquare className="w-10 h-10 opacity-20" />
            </div>
            <p className="font-bold">Nenhuma tarefa por aqui</p>
            <p className="text-xs mt-1">Sua casa está em ordem ou mude o filtro.</p>
          </div>
        )}
      </div>

      {/* Modal is already responsive via Tailwind sm: classes */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-400">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-xl text-slate-800">Novo Afazer</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 bg-white rounded-full shadow-sm hover:bg-rose-50 hover:text-rose-500 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">O que precisa ser feito?</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium" 
                  placeholder="Ex: Manutenção do Ar Condicionado" 
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detalhes adicionais</label>
                <textarea 
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none h-28 resize-none font-medium" 
                  placeholder="Descreva os passos ou observações importantes..."
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quem fará?</label>
                  <input 
                    type="text" 
                    value={resp}
                    onChange={e => setResp(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium" 
                    placeholder="Nome" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Até quando?</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium" 
                    required
                  />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksView;

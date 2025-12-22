
import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import { 
  Pill, 
  Plus, 
  Clock, 
  AlertCircle, 
  X, 
  Trash2, 
  Edit2, 
  Save,
  CheckCircle2
} from 'lucide-react';

interface HealthViewProps {
  medications: Medication[];
  onAdd: (med: Omit<Medication, 'id' | 'isActive'>) => void;
  onUpdate: (id: string, updates: Partial<Medication>) => void;
  onTakeDose: (id: string) => void;
  onDelete: (id: string) => void;
}

const HealthView: React.FC<HealthViewProps> = ({ medications, onAdd, onUpdate, onTakeDose, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  
  const [name, setName] = useState('');
  const [person, setPerson] = useState('');
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('8h/8h');
  const [stock, setStock] = useState('30');

  useEffect(() => {
    if (editingMed) {
      setName(editingMed.name); setPerson(editingMed.person);
      setDose(editingMed.dosage); setFreq(editingMed.frequency);
      setStock(editingMed.stock.toString()); setIsAdding(true);
    }
  }, [editingMed]);

  const resetForm = () => {
    setName(''); setPerson(''); setDose(''); setFreq('8h/8h'); setStock('30');
    setEditingMed(null); setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const medData = {
      name, person, dosage: dose, frequency: freq,
      stock: parseInt(stock) || 0, minStock: 5,
      alarmConfig: { enabled: true }
    };
    if (editingMed) onUpdate(editingMed.id, medData);
    else onAdd(medData);
    resetForm();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Pill size={18} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Saúde</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tratamentos</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-lg">
          <Plus size={14} /> Novo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {medications.map(med => (
          <div key={med.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col hover:border-rose-400 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/20 flex items-center justify-center"><Pill size={14} /></div>
              <div className="flex gap-1">
                <button onClick={() => setEditingMed(med)} className="p-1.5 text-slate-300 hover:text-indigo-600"><Edit2 size={12} /></button>
                <button onClick={() => onDelete(med.id)} className="p-1.5 text-slate-300 hover:text-rose-600"><Trash2 size={12} /></button>
              </div>
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{med.person}</span>
            <h4 className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{med.name}</h4>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400"><Clock size={10} className="text-rose-500"/> {med.frequency}</div>
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400"><AlertCircle size={10} className="text-rose-500"/> {med.dosage}</div>
            </div>
            <button onClick={() => onTakeDose(med.id)} className="mt-5 w-full bg-slate-900 dark:bg-rose-600 text-white py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
              <CheckCircle2 size={14} /> Registrar Dose
            </button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
           <div className="bg-[#0f172a] w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                 <h3 className="font-black text-xs text-white uppercase tracking-widest">{editingMed ? 'Editar' : 'Novo'} Tratamento</h3>
                 <button onClick={resetForm} className="p-2 text-slate-500"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0f172a]">
                <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Medicamento</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 outline-none font-bold text-xs text-white" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Quem toma?</label>
                       <input type="text" value={person} onChange={e => setPerson(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white" required />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Intervalo</label>
                       <select value={freq} onChange={e => setFreq(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none">
                          <option value="4h/4h">4 em 4h</option><option value="6h/6h">6 em 6h</option><option value="8h/8h">8 em 8h</option><option value="12h/12h">12 em 12h</option>
                       </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Dosagem</label>
                    <input type="text" value={dose} onChange={e => setDose(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white" placeholder="Ex: 500mg" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Qtd Inicial</label>
                    <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white" required />
                  </div>
                </div>
              </form>
              <div className="px-6 py-5 bg-[#0f172a] border-t border-white/10 shrink-0">
                <button onClick={handleSubmit} type="button" className="w-full bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                    <Save size={16} /> Salvar Tratamento
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HealthView;

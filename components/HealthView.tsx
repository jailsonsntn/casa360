
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
          <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Pill size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">Saúde</h2>
            <p className="text-xs text-zinc-500 font-medium mt-1">Tratamentos e Medicamentos</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-sm flex items-center gap-2 hover:bg-rose-700 transition-colors active:scale-95">
          <Plus size={16} /> Novo Tratamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {medications.map(med => (
          <div key={med.id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col hover:border-rose-300 dark:hover:border-rose-900 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/20 flex items-center justify-center border border-rose-100 dark:border-rose-900/10">
                <Pill size={18} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingMed(med)} className="p-1.5 text-zinc-400 hover:text-indigo-600 transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => onDelete(med.id)} className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{med.person}</span>
            <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">{med.name}</h4>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <Clock size={14} className="text-rose-500" /> {med.frequency}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <AlertCircle size={14} className="text-rose-500" /> {med.dosage}
              </div>
            </div>
            <button onClick={() => onTakeDose(med.id)} className="mt-5 w-full bg-zinc-900 dark:bg-rose-600 text-white py-3 rounded-xl font-semibold text-xs shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-zinc-800 dark:hover:bg-rose-700">
              <CheckCircle2 size={16} /> Registrar Dose
            </button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 shrink-0">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{editingMed ? 'Editar' : 'Novo'} Tratamento</h3>
              <button onClick={resetForm} className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-zinc-900 custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">Medicamento</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 transition-colors" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 ml-1">Quem toma?</label>
                  <input type="text" value={person} onChange={e => setPerson(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 ml-1">Intervalo</label>
                  <select value={freq} onChange={e => setFreq(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-3 font-medium text-sm text-zinc-900 dark:text-zinc-100 outline-none appearance-none">
                    <option value="4h/4h">4 em 4h</option><option value="6h/6h">6 em 6h</option><option value="8h/8h">8 em 8h</option><option value="12h/12h">12 em 12h</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 ml-1">Dosagem</label>
                  <input type="text" value={dose} onChange={e => setDose(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100" placeholder="Ex: 500mg" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 ml-1">Qtd Inicial</label>
                  <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100" required />
                </div>
              </div>
            </form>
            <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <button onClick={handleSubmit} type="button" className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                <Save size={18} /> Salvar Tratamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthView;

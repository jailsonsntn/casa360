
import React, { useState } from 'react';
import { Medication } from '../types';
import { Pill, Plus, Clock, User, AlertCircle, Check, X, ShieldAlert, Trash2 } from 'lucide-react';

interface HealthViewProps {
  medications: Medication[];
  onAdd: (med: Omit<Medication, 'id' | 'isActive'>) => void;
  onTakeDose: (id: string) => void;
  onDelete: (id: string) => void;
}

const HealthView: React.FC<HealthViewProps> = ({ medications, onAdd, onTakeDose, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [person, setPerson] = useState('');
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('8h/8h');
  const [stock, setStock] = useState('30');
  const [minStock, setMinStock] = useState('5');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      person,
      dosage: dose,
      frequency: freq,
      stock: parseInt(stock),
      minStock: parseInt(minStock)
    });
    
    // Reset Form
    setName(''); setPerson(''); setDose(''); setFreq('8h/8h'); setStock('30'); setMinStock('5');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Saúde & Bem-Estar</h2>
          <p className="text-sm text-slate-500 font-medium">Controle inteligente de medicamentos com alarmes integrados</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-rose-700 shadow-xl shadow-rose-100 transition-all active:scale-95">
          <Plus className="w-5 h-5" /> Adicionar Medicamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medications.map(med => (
          <div key={med.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-rose-200 transition-all relative">
            <button 
              onClick={() => { if(confirm('Remover este medicamento e seus alarmes?')) onDelete(med.id); }}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex justify-between items-start mb-6">
              <div className={`p-5 rounded-[1.5rem] shadow-sm ${med.stock <= med.minStock ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-rose-50 text-rose-500'}`}>
                <Pill className="w-8 h-8" />
              </div>
              <div className="text-right pr-8">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paciente</span>
                <span className="px-3 py-1 bg-slate-50 rounded-full text-xs font-black text-slate-600">{med.person}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-800 group-hover:text-rose-600 transition-colors">{med.name}</h4>
              <div className="flex items-center gap-4 mt-2">
                 <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Clock className="w-3.5 h-3.5" /> {med.frequency}
                 </div>
                 <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <AlertCircle className="w-3.5 h-3.5" /> {med.dosage}
                 </div>
              </div>
              
              <div className="mt-8 p-5 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Estoque Atual</span>
                  <span className={med.stock <= med.minStock ? 'text-rose-600' : 'text-slate-600'}>{med.stock} unidades</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${med.stock <= med.minStock ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(100, (med.stock / (med.minStock * 4)) * 100)}%` }}
                  ></div>
                </div>
                {med.lastTaken && (
                  <p className="text-[9px] font-bold text-slate-300 text-center pt-2">
                    Última dose: {new Date(med.lastTaken).toLocaleString([], {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}
                  </p>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => onTakeDose(med.id)}
              disabled={med.stock === 0}
              className="mt-6 w-full bg-slate-900 text-white p-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 shadow-xl shadow-slate-100 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <Check className="w-5 h-5" /> Registrar Dose & Agendar Próxima
            </button>
          </div>
        ))}

        {medications.length === 0 && (
          <div className="col-span-full py-32 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 text-center">
             <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-10 h-10 text-rose-200" />
             </div>
             <h4 className="text-xl font-black text-slate-800">Cuidado em Dia</h4>
             <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Cadastre medicamentos para receber alarmes inteligentes baseados na frequência de tratamento.</p>
          </div>
        )}
      </div>

      {/* Add Medication Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
                 <div>
                    <h3 className="font-black text-xl text-slate-800">Novo Tratamento</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alarmes serão criados automaticamente</p>
                 </div>
                 <button onClick={() => setIsAdding(false)} className="p-2 bg-white rounded-full shadow-sm hover:text-rose-500"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar">
                 <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome do Medicamento</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-rose-500 font-bold transition-all" placeholder="Ex: Lisinopril" required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Paciente</label>
                           <input type="text" value={person} onChange={e => setPerson(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold" placeholder="Nome" required />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Dose</label>
                           <input type="text" value={dose} onChange={e => setDose(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold" placeholder="Ex: 10mg" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Frequência</label>
                           <select value={freq} onChange={e => setFreq(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold appearance-none">
                              <option value="4h/4h">4 em 4 horas</option>
                              <option value="6h/6h">6 em 6 horas</option>
                              <option value="8h/8h">8 em 8 horas</option>
                              <option value="12h/12h">12 em 12 horas</option>
                              <option value="1 vez ao dia">Diário (24h)</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Estoque Inicial</label>
                           <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold" required />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Aviso de Estoque Baixo (unidades)</label>
                        <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none font-bold" />
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-slate-900 text-white p-6 rounded-[2rem] font-black text-lg hover:bg-slate-800 shadow-2xl shadow-rose-50 transition-all active:scale-95 flex items-center justify-center gap-3">
                    <HeartPulse className="w-6 h-6 text-rose-500" /> Iniciar Tratamento
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

// Internal icon helper
const HeartPulse = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>
);

export default HealthView;

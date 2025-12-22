
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Task, PaymentMethod, TransactionClassification } from '../types';
import { 
  Plus, 
  X, 
  Trash2, 
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  Calculator,
  Save,
  Check,
  AlertTriangle
} from 'lucide-react';

interface FinanceViewProps {
  transactions: Transaction[];
  tasks: Task[];
  onAdd: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'pix', label: 'Pix' },
  { id: 'credit_card', label: 'Crédito' },
  { id: 'debit_card', label: 'Débito' },
  { id: 'cash', label: 'Dinheiro' },
  { id: 'transfer', label: 'Transf.' },
];

const CLASSIFICATIONS: { id: TransactionClassification; label: string }[] = [
  { id: 'fixed', label: 'Fixo' },
  { id: 'variable', label: 'Variável' },
  { id: 'recurring', label: 'Recorrente' },
];

const FinanceView: React.FC<FinanceViewProps> = ({ transactions, tasks, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [classification, setClassification] = useState<TransactionClassification>('fixed');

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const processedData = useMemo(() => {
    const viewDateStart = new Date(selectedYear, selectedMonth, 1);
    const realThisMonth = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const projections: Transaction[] = [];
    const fixedMasters = transactions
      .filter(t => t.classification === 'fixed' || t.classification === 'recurring')
      .reduce((acc, curr) => {
        if (!acc[curr.category] || new Date(curr.date) > new Date(acc[curr.category].date)) {
          acc[curr.category] = curr;
        }
        return acc;
      }, {} as Record<string, Transaction>);

    (Object.values(fixedMasters) as Transaction[]).forEach(master => {
      const masterDate = new Date(master.date);
      const isBefore = new Date(masterDate.getFullYear(), masterDate.getMonth(), 1) < viewDateStart;
      const alreadyHasReal = realThisMonth.some(r => r.category === master.category);
      if (isBefore && !alreadyHasReal) {
        projections.push({
          ...master,
          id: `proj-${master.id}`,
          date: new Date(selectedYear, selectedMonth, masterDate.getDate()).toISOString().split('T')[0],
          isForecast: true
        });
      }
    });

    const allItems = [...realThisMonth, ...projections];
    const q1 = allItems.filter(t => new Date(t.date).getDate() <= 15).sort((a,b) => new Date(a.date).getDate() - new Date(b.date).getDate());
    const q2 = allItems.filter(t => new Date(t.date).getDate() > 15).sort((a,b) => new Date(a.date).getDate() - new Date(b.date).getDate());

    const q1Exp = q1.filter(t => t.type === 'expense').reduce((a, b) => a + b.value, 0);
    const q1Inc = q1.filter(t => t.type === 'income').reduce((a, b) => a + b.value, 0);
    const q2Exp = q2.filter(t => t.type === 'expense').reduce((a, b) => a + b.value, 0);
    const q2Inc = q2.filter(t => t.type === 'income').reduce((a, b) => a + b.value, 0);

    return { q1, q2, q1Exp, q1Inc, q2Exp, q2Inc, total: (q1Inc + q2Inc) - (q1Exp + q2Exp) };
  }, [transactions, selectedMonth, selectedYear]);

  const handleOpenEdit = (t: Transaction) => {
    setEditingItem(t); setType(t.type); setCategory(t.category);
    setValue(t.value.toString()); setDate(t.date);
    setPaymentMethod(t.paymentMethod); setClassification(t.classification);
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type, category, value: parseFloat(value), date,
      recurring: classification === 'recurring' || classification === 'fixed',
      notes: '', paymentMethod, classification
    };
    if (editingItem && !editingItem.isForecast) onUpdate(editingItem.id, data);
    else onAdd(data);
    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false); setEditingItem(null); setCategory(''); setValue('');
    setDate(new Date(selectedYear, selectedMonth, new Date().getDate()).toISOString().split('T')[0]);
  };

  const confirmDelete = () => {
    if (itemToDelete && !itemToDelete.isForecast) {
      onDelete(itemToDelete.id);
      setItemToDelete(null);
      if ('vibrate' in navigator) navigator.vibrate(20);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Calculator size={18} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Finanças</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Fluxo de Caixa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <button onClick={() => selectedMonth === 0 ? (setSelectedYear(y => y-1), setSelectedMonth(11)) : setSelectedMonth(m => m-1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400"><ArrowLeft size={14}/></button>
            <span className="px-2 text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 min-w-[100px] text-center">{monthNames[selectedMonth]} {selectedYear}</span>
            <button onClick={() => selectedMonth === 11 ? (setSelectedYear(y => y+1), setSelectedMonth(0)) : setSelectedMonth(m => m+1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400"><ArrowRight size={14}/></button>
          </div>
          <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all">
            <Plus size={14} /> Novo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[
            { label: '1ª Quinzena', data: processedData.q1, balance: processedData.q1Inc - processedData.q1Exp },
            { label: '2ª Quinzena', data: processedData.q2, balance: processedData.q2Inc - processedData.q2Exp }
          ].map((quinzena, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/20">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">{quinzena.label}</h3>
                <span className={`text-[10px] font-black ${quinzena.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>R$ {quinzena.balance.toLocaleString('pt-BR')}</span>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {quinzena.data.map(t => (
                  <div key={t.id} className="px-6 py-3.5 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{t.category}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Dia {new Date(t.date).getDate()} • {t.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-black mr-2 ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {t.value.toLocaleString('pt-BR')}</p>
                      <button 
                        onClick={() => handleOpenEdit(t)} 
                        className="p-1.5 text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Editar"
                      >
                        <Edit2 size={13}/>
                      </button>
                      {!t.isForecast && (
                        <button 
                          onClick={() => { setItemToDelete(t); if('vibrate' in navigator) navigator.vibrate(10); }} 
                          className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Excluir"
                        >
                          <Trash2 size={13}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {quinzena.data.length === 0 && (
                  <div className="px-6 py-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Nenhum lançamento</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-indigo-700 p-7 rounded-[2.5rem] text-white shadow-xl border border-white/5">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">Resumo Mensal</p>
            <h4 className="text-3xl font-black tracking-tight mb-6">R$ {processedData.total.toLocaleString('pt-BR')}</h4>
            <div className="space-y-3">
               <div className="flex justify-between text-[10px] font-bold">
                 <span className="opacity-60 uppercase">Entradas</span>
                 <span className="text-emerald-400 font-black">+ R$ {(processedData.q1Inc+processedData.q2Inc).toLocaleString('pt-BR')}</span>
               </div>
               <div className="flex justify-between text-[10px] font-bold">
                 <span className="opacity-60 uppercase">Saídas</span>
                 <span className="text-rose-400 font-black">- R$ {(processedData.q1Exp+processedData.q2Exp).toLocaleString('pt-BR')}</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão Customizado */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-[280px] rounded-[2rem] shadow-2xl p-6 text-center space-y-4 border border-slate-100 dark:border-white/5 animate-in zoom-in duration-300">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-xs text-slate-800 dark:text-white uppercase tracking-widest">Excluir?</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                Tem certeza que deseja apagar <span className="text-rose-500">"{itemToDelete.category}"</span>?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => setItemToDelete(null)}
                className="py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-rose-600 text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
              <h3 className="font-black text-xs text-white uppercase tracking-widest">{editingItem ? 'Editar' : 'Novo'} Lançamento</h3>
              <button onClick={resetForm} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0f172a] custom-scrollbar">
              <div className="p-1 bg-slate-900 border border-white/5 rounded-xl flex">
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${type === 'expense' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>Saída</button>
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${type === 'income' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>Entrada</button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-1 tracking-widest">Descrição</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 outline-none font-bold text-xs text-white focus:border-indigo-500" placeholder="Ex: Mercado" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase ml-1 tracking-widest">Valor</label>
                  <input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-black text-white" placeholder="0,00" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase ml-1 tracking-widest">Data</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-[10px] font-black text-white" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-1 tracking-widest">Forma de Pagamento</label>
                <div className="flex flex-wrap gap-1.5">
                   {PAYMENT_METHODS.map(m => (
                     <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id)} className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase border transition-all ${paymentMethod === m.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-900 border-white/10 text-slate-500'}`}>{m.label}</button>
                   ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-1 tracking-widest">Classificação</label>
                <div className="grid grid-cols-3 gap-2">
                   {CLASSIFICATIONS.map(c => (
                     <button key={c.id} type="button" onClick={() => setClassification(c.id)} className={`py-2 rounded-lg text-[8px] font-black uppercase border transition-all ${classification === c.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-900 border-white/10 text-slate-500'}`}>{c.label}</button>
                   ))}
                </div>
              </div>
            </form>

            <div className="px-6 py-5 bg-[#0f172a] border-t border-white/10 shrink-0">
              <button onClick={handleSubmit} type="button" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                 <Check size={18} /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;

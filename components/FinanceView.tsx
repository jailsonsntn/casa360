
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Task, PaymentMethod, TransactionClassification } from '../types';
import { 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet, 
  Banknote, 
  ArrowRightLeft,
  Smartphone,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  Check,
  ChevronDown
} from 'lucide-react';
import { 
  Tooltip, 
  ResponsiveContainer,
  AreaChart, Area, 
  XAxis, YAxis, 
  CartesianGrid
} from 'recharts';

interface FinanceViewProps {
  transactions: Transaction[];
  tasks: Task[];
  onAdd: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'credit_card', label: 'Crédito', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'debit_card', label: 'Débito', icon: <Wallet className="w-4 h-4" /> },
  { id: 'cash', label: 'Dinheiro', icon: <Banknote className="w-4 h-4" /> },
  { id: 'transfer', label: 'Transf.', icon: <ArrowRightLeft className="w-4 h-4" /> },
  { id: 'pix', label: 'Pix', icon: <Smartphone className="w-4 h-4" /> },
];

const CLASSIFICATIONS: { id: TransactionClassification; label: string }[] = [
  { id: 'fixed', label: 'Fixo' },
  { id: 'variable', label: 'Variável' },
  { id: 'recurring', label: 'Recorrente' },
];

const FinanceView: React.FC<FinanceViewProps> = ({ transactions, tasks, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'stats' | 'summary'>('summary');

  // Form State
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [classification, setClassification] = useState<TransactionClassification>('variable');
  const [linkedEvent, setLinkedEvent] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setValue(editingTransaction.value.toString());
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes || '');
      setPaymentMethod(editingTransaction.paymentMethod);
      setClassification(editingTransaction.classification);
      setLinkedEvent(editingTransaction.linkedEventId || '');
      setIsAdding(true);
    }
  }, [editingTransaction]);

  const summary = useMemo(() => transactions.reduce((acc, curr) => {
    if (curr.type === 'expense') acc.expenses += curr.value;
    else acc.income += curr.value;
    return acc;
  }, { expenses: 0, income: 0 }), [transactions]);

  const resetForm = () => {
    setIsAdding(false); 
    setEditingTransaction(null); 
    setCategory(''); 
    setValue(''); 
    setNotes(''); 
    setLinkedEvent(''); 
    setType('expense');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { 
      type, 
      category, 
      value: parseFloat(value), 
      date, 
      recurring: classification === 'recurring', 
      notes, 
      paymentMethod, 
      classification, 
      linkedEventId: linkedEvent || undefined 
    };
    if (editingTransaction) onUpdate(editingTransaction.id, data);
    else onAdd(data);
    resetForm();
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Finanças</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controle patrimonial</p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {['summary', 'list', 'stats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveView(tab as any)}
              className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeView === tab ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              {tab === 'summary' ? 'Dashboard' : tab === 'list' ? 'Extrato' : 'Análise'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-indigo-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Saldo Disponível</span>
            <h3 className="text-3xl font-black tracking-tighter">
              R$ {(summary.income - summary.expenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
               <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
               <p className="font-bold text-xs">R$ {summary.income.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
               <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
               <p className="font-bold text-xs">R$ {summary.expenses.toLocaleString('pt-BR')}</p>
            </div>
            <button onClick={() => setIsAdding(true)} className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center gap-2 ml-2">
              <Plus size={14} /> Lançar Valores
            </button>
          </div>
        </div>
      </div>

      {activeView === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-64 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-400 text-[9px] uppercase tracking-widest">Fluxo de Caixa</h3>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={[{m:'S1',v:2000,e:1500},{m:'S2',v:2500,e:2200},{m:'S3',v:3000,e:2400},{m:'S4',v:summary.income,e:summary.expenses}]}>
                      <defs><linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="m" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Area type="monotone" dataKey="v" stroke="#6366f1" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} />
                      <Area type="monotone" dataKey="e" stroke="#ef4444" fill="transparent" strokeWidth={3} />
                   </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                 <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <TrendingUp size={16} />
                 </div>
                 <div className="mt-4">
                    <p className="text-xl font-black text-slate-800 dark:text-white">R$ {summary.income.toLocaleString('pt-BR')}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Entradas</p>
                 </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                 <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/30 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <TrendingDown size={16} />
                 </div>
                 <div className="mt-4">
                    <p className="text-xl font-black text-slate-800 dark:text-white">R$ {summary.expenses.toLocaleString('pt-BR')}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Saídas</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* FORMULÁRIO LANÇAR VALORES - REDESIGN PARA SEGUIR A IMAGEM */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            
            {/* Header com Ícone e Subtítulo */}
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${type === 'expense' ? 'bg-rose-600' : 'bg-emerald-600'} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200 dark:shadow-none`}>
                  {type === 'expense' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                </div>
                <div>
                   <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight">Lançar Valores</h3>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Controle financeiro da casa</p>
                </div>
              </div>
              <button 
                onClick={resetForm} 
                className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-90"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {/* Toggle Estilo Pílula (Segmented Control) */}
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center">
                <button 
                  type="button" 
                  onClick={() => setType('expense')} 
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-300 ${
                    type === 'expense' 
                    ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-md' 
                    : 'text-slate-400 hover:text-slate-500'
                  }`}
                >
                  Saída
                </button>
                <button 
                  type="button" 
                  onClick={() => setType('income')} 
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-300 ${
                    type === 'income' 
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-md' 
                    : 'text-slate-400 hover:text-slate-500'
                  }`}
                >
                  Entrada
                </button>
              </div>

              {/* Grid de Campos - Estilo Minimalista */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                  <input 
                    type="text" 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 text-slate-800 dark:text-white focus:border-indigo-500 outline-none font-bold text-xs" 
                    placeholder="Ex: Mercado" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={value} 
                    onChange={e => setValue(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 text-slate-800 dark:text-white focus:border-indigo-500 outline-none font-black text-sm" 
                    placeholder="0,00" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pagamento</label>
                  <div className="relative">
                    <select 
                      value={paymentMethod} 
                      onChange={e => setPaymentMethod(e.target.value as any)} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 text-slate-800 dark:text-white focus:border-indigo-500 outline-none font-bold text-xs appearance-none"
                    >
                      {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Classificação</label>
                  <div className="relative">
                    <select 
                      value={classification} 
                      onChange={e => setClassification(e.target.value as any)} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 text-slate-800 dark:text-white focus:border-indigo-500 outline-none font-bold text-xs appearance-none"
                    >
                      {CLASSIFICATIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                   <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 text-slate-800 dark:text-white outline-none focus:border-indigo-500 font-bold text-xs" 
                    required 
                   />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vincular Evento</label>
                  <div className="relative">
                    <select 
                      value={linkedEvent} 
                      onChange={e => setLinkedEvent(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 text-slate-800 dark:text-white focus:border-indigo-500 outline-none font-bold text-xs appearance-none"
                    >
                       <option value="">Opcional</option>
                       {tasks.slice(0, 10).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Botão Principal Estilo Pílula */}
              <button 
                type="submit" 
                className={`w-full py-5 rounded-full font-black text-sm text-white shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 mt-4 ${
                  type === 'expense' 
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'
                }`}
              >
                <Check className="w-5 h-5" /> Confirmar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;


import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Task, PaymentMethod, TransactionClassification } from '../types';
import { 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  List, 
  Calendar, 
  CreditCard, 
  Wallet, 
  Banknote, 
  ArrowRightLeft,
  Smartphone,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Edit2,
  Activity,
  Layers,
  AlertTriangle,
  Check
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';

interface FinanceViewProps {
  transactions: Transaction[];
  tasks: Task[];
  onAdd: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f472b6', '#34d399'];

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
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
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

  const categoriesData = useMemo(() => {
    const data = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc: any[], curr) => {
        const existing = acc.find(a => a.name === curr.category);
        if (existing) existing.value += curr.value;
        else acc.push({ name: curr.category, value: curr.value });
        return acc;
      }, []);
    return data.sort((a, b) => b.value - a.value);
  }, [transactions]);

  const resetForm = () => {
    setIsAdding(false); setEditingTransaction(null); setCategory(''); setValue(''); setNotes(''); setLinkedEvent(''); setType('expense');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { type, category, value: parseFloat(value), date, recurring: classification === 'recurring', notes, paymentMethod, classification, linkedEventId: linkedEvent || undefined };
    if (editingTransaction) onUpdate(editingTransaction.id, data);
    else onAdd(data);
    resetForm();
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right duration-500 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Finanças</h2>
          <p className="text-sm text-slate-500 font-medium">Controle patrimonial completo</p>
        </div>
        <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl md:w-auto w-full">
          {['summary', 'list', 'stats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveView(tab as any)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeView === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              {tab === 'summary' ? 'Dashboard' : tab === 'list' ? 'Extrato' : 'Análise'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-full">Saldo Acumulado</span>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
                R$ {(summary.income - summary.expenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-emerald-50 text-emerald-600 p-5 rounded-3xl border border-emerald-100 flex items-center gap-3">
               <TrendingUp className="w-5 h-5" />
               <p className="font-black text-sm">R$ {summary.income.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-rose-50 text-rose-600 p-5 rounded-3xl border border-rose-100 flex items-center gap-3">
               <TrendingDown className="w-5 h-5" />
               <p className="font-black text-sm">R$ {summary.expenses.toLocaleString('pt-BR')}</p>
            </div>
            <button onClick={() => setIsAdding(true)} className="bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3">
              <Plus className="w-4 h-4" /> Novo Lançamento
            </button>
          </div>
        </div>
      </div>

      {activeView === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-80 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Fluxo Mensal</h3>
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
                      <Area type="monotone" dataKey="v" stroke="#6366f1" fillOpacity={1} fill="url(#colorInc)" strokeWidth={4} />
                      <Area type="monotone" dataKey="e" stroke="#ef4444" fill="transparent" strokeWidth={4} />
                   </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-6">
              <div className="bg-indigo-600 p-10 rounded-[3rem] text-white flex flex-col justify-between group">
                 <Calendar className="w-10 h-10 mb-6 opacity-30" />
                 <div>
                    <p className="text-3xl font-black">R$ {transactions.filter(t => t.classification !== 'variable' && t.type === 'expense').reduce((a, b) => a + b.value, 0).toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Custos Fixos</p>
                 </div>
              </div>
              <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between group">
                 <Tag className="w-10 h-10 mb-6 opacity-30" />
                 <div>
                    <p className="text-3xl font-black">R$ {transactions.filter(t => t.classification === 'variable' && t.type === 'expense').reduce((a, b) => a + b.value, 0).toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Estilo de Vida</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Modern Compact Finance Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl animate-in zoom-in duration-300 overflow-hidden border border-white/20">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${type === 'expense' ? 'bg-rose-600' : 'bg-emerald-600'} rounded-2xl flex items-center justify-center text-white shadow-xl`}>
                  {type === 'expense' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                </div>
                <div>
                   <h3 className="font-black text-2xl text-slate-800">{editingTransaction ? 'Editar Registro' : 'Lançar Valores'}</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Controle Financeiro da Casa</p>
                </div>
              </div>
              <button onClick={resetForm} className="p-3 bg-white rounded-full shadow-md hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[2.5rem]">
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-3xl transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm border border-rose-50' : 'text-slate-400'}`}>Saída</button>
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-3xl transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-50' : 'text-slate-400'}`}>Entrada</button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descrição</label>
                  <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-800 focus:border-indigo-500 outline-none font-bold" placeholder="Ex: Mercado" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Valor (R$)</label>
                  <input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-800 focus:border-indigo-500 outline-none font-black text-lg" placeholder="0,00" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pagamento</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-800 focus:border-indigo-500 outline-none font-bold cursor-pointer">
                    {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Classificação</label>
                  <select value={classification} onChange={e => setClassification(e.target.value as any)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-800 focus:border-indigo-500 outline-none font-bold cursor-pointer">
                    {CLASSIFICATIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data</label>
                   <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-800 outline-none focus:border-indigo-500 font-bold" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Vincular Evento</label>
                  <select value={linkedEvent} onChange={e => setLinkedEvent(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-800 focus:border-indigo-500 outline-none font-bold text-xs">
                     <option value="">Opcional</option>
                     {tasks.slice(0, 5).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className={`w-full text-white py-6 rounded-[2.5rem] font-black text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${type === 'expense' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}>
                <Check className="w-6 h-6" /> Confirmar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;

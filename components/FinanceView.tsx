import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, Task, PaymentMethod, TransactionClassification, CreditCard } from '../types';
import {
  Plus,
  X,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  TrendingUp,
  CreditCard as CreditCardIcon,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface FinanceViewProps {
  transactions: Transaction[];
  tasks: Task[];
  creditCards: CreditCard[];
  onAdd: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  onUpdateSeries: (seriesId: string, updates: Partial<Transaction>) => void;
  onDeleteSeries: (seriesId: string) => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'pix', label: 'Pix' },
  { id: 'credit_card', label: 'Credito' },
  { id: 'debit_card', label: 'Debito' },
  { id: 'cash', label: 'Dinheiro' },
  { id: 'transfer', label: 'Transf.' },
];

const CLASSIFICATIONS: { id: TransactionClassification; label: string }[] = [
  { id: 'fixed', label: 'Fixo' },
  { id: 'variable', label: 'Variavel' },
  { id: 'recurring', label: 'Recorrente' },
];

const MONTHS = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  tasks,
  creditCards,
  onAdd,
  onUpdate,
  onDelete,
  onUpdateSeries,
  onDeleteSeries,
}) => {
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
  const [selectedCreditCardId, setSelectedCreditCardId] = useState<string>('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(1);
  const [applyToSeries, setApplyToSeries] = useState(true);
  const [deleteSeriesMode, setDeleteSeriesMode] = useState(true);

  const isCardPaymentMethod = (method: PaymentMethod) => method === 'credit_card' || method === 'debit_card';

  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const monthIncome = useMemo(
    () => monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0),
    [monthTransactions]
  );

  const monthExpense = useMemo(
    () => monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.value, 0),
    [monthTransactions]
  );

  const monthCardExpense = useMemo(
    () => monthTransactions
      .filter(t => t.type === 'expense' && t.paymentMethod === 'credit_card')
      .reduce((sum, t) => sum + t.value, 0),
    [monthTransactions]
  );

  const monthBalance = monthIncome - monthExpense;

  const totalBalance = useMemo(
    () => transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.value : -t.value), 0),
    [transactions]
  );

  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, idx) => {
      const offset = 5 - idx;
      const dateRef = new Date(selectedYear, selectedMonth - offset, 1);
      const m = dateRef.getMonth();
      const y = dateRef.getFullYear();

      const monthTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === m && d.getFullYear() === y;
      });

      const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.value, 0);
      const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.value, 0);
      const card = monthTx
        .filter(t => t.type === 'expense' && t.paymentMethod === 'credit_card')
        .reduce((s, t) => s + t.value, 0);

      return {
        name: MONTHS[m].substring(0, 3),
        Receitas: income,
        Despesas: expense,
        Cartoes: card,
      };
    });
  }, [transactions, selectedMonth, selectedYear]);

  const pieData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const key = t.category || 'Outros';
        byCategory[key] = (byCategory[key] || 0) + t.value;
      });

    const palette = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#f43f5e', '#06b6d4'];
    return Object.entries(byCategory)
      .map(([name, val], idx) => ({ name, value: val, color: palette[idx % palette.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [monthTransactions]);

  const recentTransactions = useMemo(
    () => [...monthTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12),
    [monthTransactions]
  );

  const handleOpenEdit = (tx: Transaction) => {
    setEditingItem(tx);
    setType(tx.type);
    setCategory(tx.category);
    setValue(tx.value.toString());
    setDate(tx.date);
    setPaymentMethod(tx.paymentMethod);
    setClassification(tx.classification);
    setSelectedCreditCardId(tx.creditCardId || '');
    setIsInstallment(tx.isInstallment || false);
    setInstallmentCount(tx.installmentCount || 1);
    setApplyToSeries(true);
    setDeleteSeriesMode(true);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingItem(null);
    setCategory('');
    setValue('');
    setDate(new Date(selectedYear, selectedMonth, new Date().getDate()).toISOString().split('T')[0]);
    setPaymentMethod('pix');
    setClassification('fixed');
    setSelectedCreditCardId('');
    setIsInstallment(false);
    setInstallmentCount(1);
    setApplyToSeries(true);
    setDeleteSeriesMode(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !value) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    if (paymentMethod === 'credit_card' && !selectedCreditCardId) return;

    const seriesId = (isInstallment && installmentCount > 1)
      ? (editingItem?.originalTransactionId || crypto.randomUUID())
      : undefined;

    const createTransaction = (installNum?: number) => {
      const effectiveClassification: TransactionClassification = isCardPaymentMethod(paymentMethod) ? 'variable' : classification;
      const transactionValue = isInstallment ? numValue / installmentCount : numValue;
      return {
        type,
        category,
        value: transactionValue,
        date,
        recurring: effectiveClassification === 'recurring' || effectiveClassification === 'fixed',
        notes: '',
        paymentMethod,
        classification: effectiveClassification,
        creditCardId: paymentMethod === 'credit_card' ? selectedCreditCardId : undefined,
        isInstallment: isInstallment && installmentCount > 1,
        installmentCount: isInstallment && installmentCount > 1 ? installmentCount : undefined,
        installmentNumber: installNum,
        originalTransactionId: isInstallment && installmentCount > 1 ? seriesId : undefined,
      };
    };

    if (editingItem) {
      const updates = createTransaction(editingItem.installmentNumber);

      if (
        editingItem.isInstallment &&
        editingItem.originalTransactionId &&
        applyToSeries
      ) {
        onUpdateSeries(editingItem.originalTransactionId, updates);
      } else {
        onUpdate(editingItem.id, updates);
      }

      resetForm();
      return;
    }

    if (isInstallment && installmentCount > 1 && paymentMethod === 'credit_card') {
      const card = creditCards.find(c => c.id === selectedCreditCardId);
      if (!card) return;

      const purchaseDate = new Date(date);
      const purchaseDay = purchaseDate.getDate();
      let firstInstallmentMonth = purchaseDate.getMonth();
      let firstInstallmentYear = purchaseDate.getFullYear();

      if (purchaseDay > card.closingDay) {
        firstInstallmentMonth += 1;
        if (firstInstallmentMonth > 11) {
          firstInstallmentMonth = 0;
          firstInstallmentYear += 1;
        }
      }

      const firstInstallmentDate = new Date(firstInstallmentYear, firstInstallmentMonth, 1).toISOString().split('T')[0];
      const firstData = { ...createTransaction(1), date: firstInstallmentDate };

      onAdd(firstData);

      for (let i = 2; i <= installmentCount; i++) {
        let installMonth = firstInstallmentMonth + (i - 1);
        let installYear = firstInstallmentYear;
        if (installMonth > 11) {
          installYear += Math.floor(installMonth / 12);
          installMonth = installMonth % 12;
        }
        const installmentDate = new Date(installYear, installMonth, 1).toISOString().split('T')[0];
        onAdd({ ...createTransaction(i), date: installmentDate });
      }
    } else {
      onAdd(createTransaction());
    }

    resetForm();
  };

  const navigateMonth = (dir: -1 | 1) => {
    if (dir === -1) {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(y => y - 1);
      } else {
        setSelectedMonth(m => m - 1);
      }
      return;
    }
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Visao geral das suas financas</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900/70 border border-slate-700 rounded-xl px-2 py-1">
            <button onClick={() => navigateMonth(-1)} className="p-2 text-slate-400 hover:text-slate-200">
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 text-sm font-semibold text-slate-100 min-w-[130px] text-center">
              {MONTHS[selectedMonth]} {selectedYear}
            </span>
            <button onClick={() => navigateMonth(1)} className="p-2 text-slate-400 hover:text-slate-200">
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400"
          >
            <Plus size={14} className="inline mr-1" /> Nova Transacao
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-indigo-500/35 bg-slate-950/70 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Saldo Total</p>
            <Wallet size={16} className="text-indigo-400" />
          </div>
          <p className={`text-4xl font-bold ${totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            R$ {Math.abs(totalBalance).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-slate-500 mt-2">Considera todo o historico</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/70 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Receitas</p>
            <ArrowUpCircle size={16} className="text-emerald-400" />
          </div>
          <p className="text-4xl font-bold text-emerald-400">R$ {monthIncome.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-slate-500 mt-2">{MONTHS[selectedMonth]} {selectedYear}</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-slate-950/70 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Despesas</p>
            <ArrowDownCircle size={16} className="text-rose-400" />
          </div>
          <p className="text-4xl font-bold text-rose-400">R$ {monthExpense.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-slate-500 mt-2">Manual: R$ {(monthExpense - monthCardExpense).toLocaleString('pt-BR')}  Cartao: R$ {monthCardExpense.toLocaleString('pt-BR')}</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-slate-950/70 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Saldo do Mes</p>
            <TrendingUp size={16} className="text-amber-400" />
          </div>
          <p className={`text-4xl font-bold ${monthBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            R$ {Math.abs(monthBalance).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-slate-500 mt-2">{MONTHS[selectedMonth]} {selectedYear}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Evolucao dos ultimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="name" stroke="#7b839e" />
              <YAxis stroke="#7b839e" />
              <Tooltip contentStyle={{ background: '#0f1426', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 8 }} />
              <Legend />
              <Area type="monotone" dataKey="Receitas" stroke="#22c55e" fill="url(#inc)" strokeWidth={2} />
              <Area type="monotone" dataKey="Despesas" stroke="#f43f5e" fill="url(#exp)" strokeWidth={2} />
              <Area type="monotone" dataKey="Cartoes" stroke="#6366f1" fill="url(#card)" strokeWidth={1.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Gastos por categoria</h3>
          {pieData.length === 0 ? (
            <div className="h-[250px] grid place-items-center text-slate-500 text-sm">Sem despesas neste mes</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={42} outerRadius={66} paddingAngle={2}>
                    {pieData.map((e, i) => (
                      <Cell key={`${e.name}-${i}`} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f1426', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                      {item.name}
                    </div>
                    <span className="text-slate-200 font-semibold">R$ {item.value.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-950/70 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Lancamentos recentes</h3>
          <span className="text-xs text-slate-500">{recentTransactions.length} item(ns)</span>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-14 text-center text-slate-500 text-sm">Nenhuma transacao neste mes</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-900/60 transition-colors group">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{tx.category}</p>
                  <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString('pt-BR')}  {tx.paymentMethod}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '-'} R$ {tx.value.toLocaleString('pt-BR')}
                  </p>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(tx)} className="p-1.5 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setItemToDelete(tx)} className="p-1.5 rounded text-slate-400 hover:text-rose-300 hover:bg-slate-800">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-slate-950 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center space-y-6 border border-slate-700">
            <div className="w-12 h-12 bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-100">Excluir lancamento?</h4>
              <p className="text-sm text-slate-400">{itemToDelete.category} - R$ {itemToDelete.value.toLocaleString('pt-BR')}</p>
              {itemToDelete.isInstallment && itemToDelete.originalTransactionId && (
                <label className="flex items-center justify-center gap-2 text-xs text-slate-300 mt-2">
                  <input
                    type="checkbox"
                    checked={deleteSeriesMode}
                    onChange={(e) => setDeleteSeriesMode(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  Excluir todas as parcelas da serie
                </label>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="py-2 rounded-lg text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (itemToDelete.isInstallment && itemToDelete.originalTransactionId && deleteSeriesMode) {
                    onDeleteSeries(itemToDelete.originalTransactionId);
                  } else {
                    onDelete(itemToDelete.id);
                  }
                  setItemToDelete(null);
                }}
                className="py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-2">
          <div className="bg-slate-950 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[95vh] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-100">{editingItem ? 'Editar' : 'Nova'} Transacao</h3>
              <button onClick={resetForm} className="p-1 text-slate-400 hover:text-slate-200 transition-colors rounded hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="p-0.5 bg-slate-900 rounded-lg flex gap-0.5">
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${type === 'expense' ? 'bg-slate-700 text-rose-300 shadow-sm' : 'text-slate-500'}`}>
                  Saida
                </button>
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${type === 'income' ? 'bg-slate-700 text-emerald-300 shadow-sm' : 'text-slate-500'}`}>
                  Entrada
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Descricao</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-slate-100 focus:border-indigo-500" placeholder="Ex: Mercado" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Valor</label>
                  <input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-slate-100 focus:border-indigo-500" placeholder="0,00" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Data</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-slate-100 focus:border-indigo-500" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Forma de Pagamento</label>
                <div className="grid grid-cols-3 gap-1">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id} type="button" onClick={() => { setPaymentMethod(m.id); setSelectedCreditCardId(''); }} className={`py-2 rounded-lg text-xs font-medium border transition-all ${paymentMethod === m.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-400'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'credit_card' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Cartao de Credito</label>
                    <select value={selectedCreditCardId} onChange={e => setSelectedCreditCardId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-slate-100 focus:border-indigo-500" required={paymentMethod === 'credit_card'}>
                      <option value="">Selecione um cartao</option>
                      {creditCards.filter(card => card.isActive).map(card => (
                        <option key={card.id} value={card.id}>{card.name} - {card.owner}</option>
                      ))}
                    </select>
                  </div>

                  {selectedCreditCardId && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">Tipo</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => { setIsInstallment(false); setInstallmentCount(1); }} className={`py-2.5 rounded-lg text-xs font-medium border transition-all ${!isInstallment ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                          A Vista
                        </button>
                        <button type="button" onClick={() => setIsInstallment(true)} className={`py-2.5 rounded-lg text-xs font-medium border transition-all ${isInstallment ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                          Parcelado
                        </button>
                      </div>

                      {isInstallment && (
                        <div className="space-y-1 pt-1">
                          <label className="text-xs font-medium text-slate-300">Parcelas</label>
                          <select value={installmentCount} onChange={e => setInstallmentCount(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-slate-100 focus:border-indigo-500">
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                              <option key={n} value={n}>{n}x</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Classificacao</label>
                <div className={`grid grid-cols-3 gap-1 ${isCardPaymentMethod(paymentMethod) ? 'opacity-50' : ''}`}>
                  {CLASSIFICATIONS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClassification(c.id)}
                      disabled={isCardPaymentMethod(paymentMethod)}
                      className={`py-2 rounded-lg text-xs font-medium border transition-all ${classification === c.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-400'} ${isCardPaymentMethod(paymentMethod) ? 'cursor-not-allowed hover:border-slate-700' : ''}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {editingItem?.isInstallment && editingItem.originalTransactionId && (
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={applyToSeries}
                    onChange={(e) => setApplyToSeries(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  Aplicar edicao em todas as parcelas da serie
                </label>
              )}
            </form>

            <div className="px-4 py-3 bg-slate-950 border-t border-slate-800">
              <button onClick={handleSubmit} type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-1 transition-all active:scale-95">
                <Check size={16} />
                {editingItem ? 'Salvar' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;

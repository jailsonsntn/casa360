
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Task, PaymentMethod, TransactionClassification, CreditCard } from '../types';
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
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FinanceViewProps {
  transactions: Transaction[];
  tasks: Task[];
  creditCards: CreditCard[];
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const FinanceView: React.FC<FinanceViewProps> = ({ transactions, tasks, creditCards, onAdd, onUpdate, onDelete }) => {
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

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  // Calcular análise de múltiplos meses
  const monthsAnalysis = useMemo(() => {
    const months = [];
    
    for (let i = 0; i < 6; i++) {
      const month = (selectedMonth + i) % 12;
      const year = selectedYear + Math.floor((selectedMonth + i) / 12);
      
      const monthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
      });

      // Previsões para meses fixos/recorrentes
      const projections: Transaction[] = [];
      const fixedMasters = transactions
        .filter(t => (t.classification === 'fixed' || t.classification === 'recurring') && !t.isForecast)
        .reduce((acc, curr) => {
          if (!acc[curr.category] || new Date(curr.date) > new Date(acc[curr.category].date)) {
            acc[curr.category] = curr;
          }
          return acc;
        }, {} as Record<string, Transaction>);

      Object.values(fixedMasters).forEach(master => {
        const masterDate = new Date(master.date);
        const isBefore = new Date(masterDate.getFullYear(), masterDate.getMonth(), 1) < new Date(year, month, 1);
        const alreadyHasReal = monthTransactions.some(r => r.category === master.category);
        if (isBefore && !alreadyHasReal) {
          projections.push({
            ...master,
            id: `proj-${master.id}`,
            date: new Date(year, month, masterDate.getDate()).toISOString().split('T')[0],
            isForecast: true
          });
        }
      });

      const allItems = [...monthTransactions, ...projections];
      const income = allItems.filter(t => t.type === 'income').reduce((a, b) => a + b.value, 0);
      const expense = allItems.filter(t => t.type === 'expense').reduce((a, b) => a + b.value, 0);

      // Análise por categoria
      const byCategory = allItems.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = { income: 0, expense: 0 };
        if (t.type === 'income') acc[t.category].income += t.value;
        else acc[t.category].expense += t.value;
        return acc;
      }, {} as Record<string, { income: number; expense: number }>);

      months.push({
        month,
        year,
        monthName: monthNames[month],
        fullDate: `${monthNames[month]} ${year}`,
        income,
        expense,
        balance: income - expense,
        transactions: allItems,
        byCategory,
        hasForecasts: projections.length > 0
      });
    }

    return months;
  }, [transactions, selectedMonth, selectedYear, monthNames]);

  const currentMonth = monthsAnalysis[0];
  const nextMonths = monthsAnalysis.slice(1);

  // Dados para gráfico de linha (últimos 6 meses)
  const chartData = monthsAnalysis.map(m => ({
    name: m.monthName.substring(0, 3),
    income: m.income,
    expense: m.expense,
    balance: m.balance
  }));

  // Categorias globais
  const allCategories = useMemo(() => {
    const cats: Record<string, { income: number; expense: number; count: number }> = {};
    
    monthsAnalysis.forEach(m => {
      Object.entries(m.byCategory).forEach(([cat, values]: [string, { income: number; expense: number }]) => {
        if (!cats[cat]) cats[cat] = { income: 0, expense: 0, count: 0 };
        cats[cat].income += values.income;
        cats[cat].expense += values.expense;
        cats[cat].count += 1;
      });
    });

    return Object.entries(cats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => (b.expense + b.income) - (a.expense + a.income));
  }, [monthsAnalysis]);

  const handleOpenEdit = (t: Transaction) => {
    setEditingItem(t); setType(t.type); setCategory(t.category);
    setValue(t.value.toString()); setDate(t.date);
    setPaymentMethod(t.paymentMethod); setClassification(t.classification);
    setSelectedCreditCardId(t.creditCardId || '');
    setIsInstallment(t.isInstallment || false);
    setInstallmentCount(t.installmentCount || 1);
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!category.trim() || !value) {
        alert('Preencha categoria e valor');
        return;
      }

      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        alert('Valor deve ser maior que 0');
        return;
      }
      
      if (paymentMethod === 'credit_card' && !selectedCreditCardId) {
        alert('Selecione um cartão de crédito');
        return;
      }

      const createTransaction = (installNum?: number) => {
        const transactionValue = isInstallment ? numValue / installmentCount : numValue;
        return {
          type, category, value: transactionValue, date,
          recurring: (classification === 'recurring' || classification === 'fixed'),
          notes: '', paymentMethod, classification,
          creditCardId: paymentMethod === 'credit_card' ? selectedCreditCardId : undefined,
          isInstallment: isInstallment && installmentCount > 1,
          installmentCount: isInstallment && installmentCount > 1 ? installmentCount : undefined,
          installmentNumber: installNum
        };
      };

      if (isInstallment && installmentCount > 1 && paymentMethod === 'credit_card') {
        const card = creditCards.find(c => c.id === selectedCreditCardId);
        if (!card) {
          alert('Selecione um cartão válido');
          return;
        }

        const purchaseDate = new Date(date);
        const closingDay = card.closingDay;
        const purchaseDay = purchaseDate.getDate();

        let firstInstallmentMonth = purchaseDate.getMonth();
        let firstInstallmentYear = purchaseDate.getFullYear();
        
        if (purchaseDay > closingDay) {
          firstInstallmentMonth += 1;
          if (firstInstallmentMonth > 11) {
            firstInstallmentMonth = 0;
            firstInstallmentYear += 1;
          }
        }

        const firstInstallmentDate = new Date(firstInstallmentYear, firstInstallmentMonth, 1).toISOString().split('T')[0];
        const firstData = { ...createTransaction(1), date: firstInstallmentDate };
        
        if (editingItem && !editingItem.isForecast) {
          onUpdate(editingItem.id, firstData);
        } else {
          onAdd(firstData);
        }

        for (let i = 2; i <= installmentCount; i++) {
          let installMonth = firstInstallmentMonth + (i - 1);
          let installYear = firstInstallmentYear;
          
          if (installMonth > 11) {
            installYear += Math.floor(installMonth / 12);
            installMonth = installMonth % 12;
          }
          
          const installmentDate = new Date(installYear, installMonth, 1).toISOString().split('T')[0];
          const installmentData = { ...createTransaction(i), date: installmentDate };
          onAdd(installmentData);
        }
      } else {
        const data = createTransaction();
        if (editingItem && !editingItem.isForecast) {
          onUpdate(editingItem.id, data);
        } else {
          onAdd(data);
        }
      }

      resetForm();
    } catch (err) {
      console.error("Erro ao salvar transação:", err);
      alert("Erro ao salvar transação");
    }
  };

  const resetForm = () => {
    setIsAdding(false); setEditingItem(null); setCategory(''); setValue('');
    setDate(new Date(selectedYear, selectedMonth, new Date().getDate()).toISOString().split('T')[0]);
    setPaymentMethod('pix'); setClassification('fixed'); setSelectedCreditCardId('');
    setIsInstallment(false); setInstallmentCount(1);
  };

  const confirmDelete = () => {
    if (itemToDelete && !itemToDelete.isForecast) {
      onDelete(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-4">
      {/* Header com navegação */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Finanças</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Análise mensal e previsões</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
              <button
                onClick={() => selectedMonth === 0 ? (setSelectedYear(y => y - 1), setSelectedMonth(11)) : setSelectedMonth(m => m - 1)}
                className="p-3 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-500 transition-all"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="px-4 text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-[140px] text-center">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={() => selectedMonth === 11 ? (setSelectedYear(y => y + 1), setSelectedMonth(0)) : setSelectedMonth(m => m + 1)}
                className="p-3 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-500 transition-all"
              >
                <ArrowRight size={16} />
              </button>
            </div>
            <button
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              Novo
            </button>
          </div>
        </div>
      </div>

      {/* Mês Atual - Destaque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Cards de resumo mensal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <ArrowUpRight className="text-emerald-600" size={20} />
                </div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Entradas</p>
              </div>
              <p className="text-2xl font-bold text-emerald-600">R$ {currentMonth.income.toLocaleString('pt-BR')}</p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 p-6 rounded-2xl border border-rose-100 dark:border-rose-800/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                  <ArrowDownLeft className="text-rose-600" size={20} />
                </div>
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Saídas</p>
              </div>
              <p className="text-2xl font-bold text-rose-600">R$ {currentMonth.expense.toLocaleString('pt-BR')}</p>
            </div>

            <div className={`bg-gradient-to-br ${currentMonth.balance >= 0 ? 'from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20' : 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20'} p-6 rounded-2xl border ${currentMonth.balance >= 0 ? 'border-indigo-100 dark:border-indigo-800/30' : 'border-amber-100 dark:border-amber-800/30'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 ${currentMonth.balance >= 0 ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-amber-100 dark:bg-amber-900/30'} rounded-lg flex items-center justify-center`}>
                  <Calculator className={currentMonth.balance >= 0 ? 'text-indigo-600' : 'text-amber-600'} size={20} />
                </div>
                <p className={`text-xs font-medium uppercase tracking-wider ${currentMonth.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {currentMonth.balance >= 0 ? 'Superávit' : 'Déficit'}
                </p>
              </div>
              <p className={`text-2xl font-bold ${currentMonth.balance >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                R$ {Math.abs(currentMonth.balance).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Gráfico de tendência */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <BarChart3 size={16} /> Tendência (6 meses)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Entradas" />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Saídas" />
                <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Saldo" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Transações do mês */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Lançamentos - {currentMonth.monthName}
                {currentMonth.hasForecasts && <span className="text-xs text-indigo-600 ml-2">(com previsões)</span>}
              </h3>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-96 overflow-y-auto">
              {currentMonth.transactions.length > 0 ? (
                currentMonth.transactions.map(t => (
                  <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group transition-all">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                        {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.category}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Dia {new Date(t.date).getDate()} • {t.paymentMethod} {t.isForecast && '• Previsto'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.value.toLocaleString('pt-BR')}
                      </p>
                      {!t.isForecast && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEdit(t)} className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setItemToDelete(t)} className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                  Nenhum lançamento neste mês
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Próximos meses */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 px-2">Próximos Meses</h3>
          {nextMonths.map((m, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer"
              onClick={() => { setSelectedMonth(m.month); setSelectedYear(m.year); }}>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">{m.monthName}</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Entradas</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">R$ {(m.income / 1000).toFixed(1)}k</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Saídas</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">R$ {(m.expense / 1000).toFixed(1)}k</span>
                </div>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <span className={`text-xs font-bold ${m.balance >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>Saldo</span>
                  <span className={`text-xs font-bold ${m.balance >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                    {m.balance >= 0 ? '+' : ''} R$ {(m.balance / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de Categorias */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Análise por Categoria (6 meses)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase">Categoria</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase">Entradas</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase">Saídas</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase">Saldo</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase">Média/Mês</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {allCategories.map((cat, idx) => {
                const balance = cat.income - cat.expense;
                const avgPerMonth = balance / cat.count;
                return (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">{cat.name}</td>
                    <td className="px-6 py-3 text-sm text-right text-emerald-600 dark:text-emerald-400 font-semibold">R$ {cat.income.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-3 text-sm text-right text-rose-600 dark:text-rose-400 font-semibold">R$ {cat.expense.toLocaleString('pt-BR')}</td>
                    <td className={`px-6 py-3 text-sm text-right font-semibold ${balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      R$ {balance.toLocaleString('pt-BR')}
                    </td>
                    <td className={`px-6 py-3 text-sm text-right font-semibold ${avgPerMonth >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      R$ {avgPerMonth.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Transação */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center space-y-6 border border-zinc-200 dark:border-zinc-800">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Excluir lançamento?</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                "{itemToDelete.category}" - R$ {itemToDelete.value.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="py-2 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
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
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[95vh] overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{editingItem ? 'Editar' : 'Novo'} Lançamento</h3>
              <button onClick={resetForm} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex gap-0.5">
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${type === 'expense' ? 'bg-white dark:bg-zinc-700 text-rose-600 shadow-sm' : 'text-zinc-500'}`}>
                  Saída
                </button>
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${type === 'income' ? 'bg-white dark:bg-zinc-700 text-emerald-600 shadow-sm' : 'text-zinc-500'}`}>
                  Entrada
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-zinc-900 dark:text-zinc-100 focus:border-indigo-500" placeholder="Ex: Mercado..." required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Valor</label>
                  <input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-zinc-900 dark:text-zinc-100 focus:border-indigo-500" placeholder="0,00" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Data</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-zinc-900 dark:text-zinc-100 focus:border-indigo-500" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Forma de Pagamento</label>
                <div className="grid grid-cols-3 gap-1">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id} type="button" onClick={() => { setPaymentMethod(m.id); setSelectedCreditCardId(''); }} className={`py-2 rounded-lg text-xs font-medium border transition-all ${paymentMethod === m.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-indigo-400'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'credit_card' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Cartão de Crédito</label>
                    <select value={selectedCreditCardId} onChange={e => setSelectedCreditCardId(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-zinc-900 dark:text-zinc-100 focus:border-indigo-500" required={paymentMethod === 'credit_card'}>
                      <option value="">Selecione um cartão</option>
                      {creditCards.filter(card => card.isActive).map(card => (
                        <option key={card.id} value={card.id}>{card.name} - {card.owner}</option>
                      ))}
                    </select>
                  </div>

                  {selectedCreditCardId && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => { setIsInstallment(false); setInstallmentCount(1); }} className={`py-2.5 rounded-lg text-xs font-medium border transition-all ${!isInstallment ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                          À Vista
                        </button>
                        <button type="button" onClick={() => setIsInstallment(true)} className={`py-2.5 rounded-lg text-xs font-medium border transition-all ${isInstallment ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                          Parcelado
                        </button>
                      </div>

                      {isInstallment && (
                        <div className="space-y-1 pt-1">
                          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Parcelas</label>
                          <select value={installmentCount} onChange={e => setInstallmentCount(parseInt(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-zinc-900 dark:text-zinc-100 focus:border-indigo-500">
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
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Classificação</label>
                <div className="grid grid-cols-3 gap-1">
                  {CLASSIFICATIONS.map(c => (
                    <button key={c.id} type="button" onClick={() => setClassification(c.id)} className={`py-2 rounded-lg text-xs font-medium border transition-all ${classification === c.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-indigo-400'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
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


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
    const q1 = allItems.filter(t => new Date(t.date).getDate() <= 15).sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate());
    const q2 = allItems.filter(t => new Date(t.date).getDate() > 15).sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate());

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
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">Finanças</h2>
            <p className="text-xs text-zinc-500 font-medium mt-1">Gestão Financeira</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <button onClick={() => selectedMonth === 0 ? (setSelectedYear(y => y - 1), setSelectedMonth(11)) : setSelectedMonth(m => m - 1)} className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-zinc-400"><ArrowLeft size={14} /></button>
            <span className="px-2 text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 min-w-[100px] text-center">{monthNames[selectedMonth]} {selectedYear}</span>
            <button onClick={() => selectedMonth === 11 ? (setSelectedYear(y => y + 1), setSelectedMonth(0)) : setSelectedMonth(m => m + 1)} className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-zinc-400"><ArrowRight size={14} /></button>
          </div>
          <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-sm flex items-center gap-2 active:scale-95 transition-all hover:bg-indigo-700">
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[
            { label: '1ª Quinzena', data: processedData.q1, balance: processedData.q1Inc - processedData.q1Exp },
            { label: '2ª Quinzena', data: processedData.q2, balance: processedData.q2Inc - processedData.q2Exp }
          ].map((quinzena, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{quinzena.label}</h3>
                <span className={`text-sm font-bold ${quinzena.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {quinzena.balance.toLocaleString('pt-BR')}</span>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {quinzena.data.map(t => (
                  <div key={t.id} className="px-6 py-4 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                        {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{t.category}</p>
                        <p className="text-xs text-zinc-500">Dia {new Date(t.date).getDate()} • {t.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {t.value.toLocaleString('pt-BR')}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        {!t.isForecast && (
                          <button
                            onClick={() => { setItemToDelete(t); if ('vibrate' in navigator) navigator.vibrate(10); }}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {quinzena.data.length === 0 && (
                  <div className="px-6 py-8 text-center text-zinc-400 text-xs font-medium uppercase tracking-wider">Nenhum lançamento</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 dark:bg-indigo-900 p-6 rounded-3xl text-white shadow-xl">
            <p className="text-xs font-medium text-white/60 mb-1 uppercase tracking-wider">Resumo Mensal</p>
            <h4 className="text-4xl font-bold tracking-tight mb-8">R$ {processedData.total.toLocaleString('pt-BR')}</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Entradas</span>
                <span className="text-emerald-400 font-bold text-lg">+ R$ {(processedData.q1Inc + processedData.q2Inc).toLocaleString('pt-BR')}</span>
              </div>
              <div className="w-full h-px bg-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Saídas</span>
                <span className="text-rose-400 font-bold text-lg">- R$ {(processedData.q1Exp + processedData.q2Exp).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação Simplificado */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-[280px] rounded-2xl shadow-2xl p-6 text-center space-y-4 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Excluir lançamento?</h4>
              <p className="text-xs text-zinc-500 font-medium">
                Você vai apagar <span className="text-zinc-900 dark:text-zinc-100 font-bold">"{itemToDelete.category}"</span>.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="py-2.5 rounded-xl text-xs font-semibold bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 shrink-0">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{editingItem ? 'Editar' : 'Novo'} Lançamento</h3>
              <button onClick={resetForm} className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-zinc-900 custom-scrollbar">
              <div className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex">
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${type === 'expense' ? 'bg-white dark:bg-zinc-700 text-rose-600 shadow-sm' : 'text-zinc-500'}`}>Saída</button>
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${type === 'income' ? 'bg-white dark:bg-zinc-700 text-emerald-600 shadow-sm' : 'text-zinc-500'}`}>Entrada</button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">Descrição</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500" placeholder="Ex: Mercado" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 ml-1">Valor</label>
                  <input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100" placeholder="0,00" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 ml-1">Data</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">Forma de Pagamento</label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id)} className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${paymentMethod === m.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>{m.label}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">Classificação</label>
                <div className="grid grid-cols-3 gap-2">
                  {CLASSIFICATIONS.map(c => (
                    <button key={c.id} type="button" onClick={() => setClassification(c.id)} className={`py-2 rounded-lg text-xs font-medium border transition-all ${classification === c.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>{c.label}</button>
                  ))}
                </div>
              </div>
            </form>

            <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <button onClick={handleSubmit} type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                <Check size={18} /> Confirmar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;

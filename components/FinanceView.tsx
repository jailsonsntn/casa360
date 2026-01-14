
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
  AlertTriangle
} from 'lucide-react';

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
    setSelectedCreditCardId(t.creditCardId || '');
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type, category, value: parseFloat(value), date,
      recurring: classification === 'recurring' || classification === 'fixed',
      notes: '', paymentMethod, classification,
      creditCardId: paymentMethod === 'credit_card' ? selectedCreditCardId : undefined
    };
    if (editingItem && !editingItem.isForecast) onUpdate(editingItem.id, data);
    else onAdd(data);
    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false); setEditingItem(null); setCategory(''); setValue('');
    setDate(new Date(selectedYear, selectedMonth, new Date().getDate()).toISOString().split('T')[0]);
    setPaymentMethod('pix'); setClassification('fixed'); setSelectedCreditCardId('');
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
      {/* Header Modernizado */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Finanças</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Controle suas finanças pessoais</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
              <button
                onClick={() => selectedMonth === 0 ? (setSelectedYear(y => y - 1), setSelectedMonth(11)) : setSelectedMonth(m => m - 1)}
                className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="px-4 text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-[140px] text-center">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={() => selectedMonth === 11 ? (setSelectedYear(y => y + 1), setSelectedMonth(0)) : setSelectedMonth(m => m + 1)}
                className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all"
              >
                <ArrowRight size={16} />
              </button>
            </div>
            <button
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              Novo Lançamento
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[
            { label: '1ª Quinzena', data: processedData.q1, balance: processedData.q1Inc - processedData.q1Exp },
            { label: '2ª Quinzena', data: processedData.q2, balance: processedData.q2Inc - processedData.q2Exp }
          ].map((quinzena, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{quinzena.label}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Lançamentos do período</p>
                </div>
                <div className={`text-lg font-bold ${quinzena.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  R$ {quinzena.balance.toLocaleString('pt-BR')}
                </div>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {quinzena.data.map(t => (
                  <div key={t.id} className="px-6 py-5 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                        {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{t.category}</p>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          <span>Dia {new Date(t.date).getDate()}</span>
                          <span>•</span>
                          <span>{t.paymentMethod}</span>
                          {t.isForecast && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 font-medium">Previsto</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.value.toLocaleString('pt-BR')}
                      </p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-2 text-zinc-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        {!t.isForecast && (
                          <button
                            onClick={() => { setItemToDelete(t); if ('vibrate' in navigator) navigator.vibrate(10); }}
                            className="p-2 text-zinc-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {quinzena.data.length === 0 && (
                  <div className="py-16 text-center">
                    <div className="text-zinc-400 dark:text-zinc-500 mb-2">
                      <Calculator size={32} className="mx-auto mb-3 opacity-50" />
                    </div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Nenhum lançamento</div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Adicione transações para este período</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-medium text-white/70 uppercase tracking-wider">Resumo Mensal</p>
                <h4 className="text-3xl font-bold tracking-tight">R$ {processedData.total.toLocaleString('pt-BR')}</h4>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Calculator size={24} className="text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white/70">Entradas</span>
                <span className="text-emerald-300 font-bold text-lg">+ R$ {(processedData.q1Inc + processedData.q2Inc).toLocaleString('pt-BR')}</span>
              </div>
              <div className="w-full h-px bg-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white/70">Saídas</span>
                <span className="text-rose-300 font-bold text-lg">- R$ {(processedData.q1Exp + processedData.q2Exp).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação Modernizado */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-6 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Excluir lançamento?</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Você vai apagar <span className="text-zinc-900 dark:text-zinc-100 font-semibold">"{itemToDelete.category}"</span> no valor de R$ {itemToDelete.value.toLocaleString('pt-BR')}.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="py-3 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="py-3 rounded-xl text-sm font-medium bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{editingItem ? 'Editar' : 'Novo'} Lançamento</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Adicione uma transação financeira</p>
              </div>
              <button onClick={resetForm} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-zinc-900 custom-scrollbar">
              <div className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
                    type === 'expense'
                      ? 'bg-white dark:bg-zinc-700 text-rose-600 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <ArrowDownLeft size={16} />
                  Saída
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
                    type === 'income'
                      ? 'bg-white dark:bg-zinc-700 text-emerald-600 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <ArrowUpRight size={16} />
                  Entrada
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 transition-colors"
                  placeholder="Ex: Mercado, Salário, Conta de luz..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 transition-colors"
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Forma de Pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { setPaymentMethod(m.id); setSelectedCreditCardId(''); }}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                        paymentMethod === m.id
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-indigo-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'credit_card' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cartão de Crédito</label>
                  <select
                    value={selectedCreditCardId}
                    onChange={e => setSelectedCreditCardId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 transition-colors"
                    required={paymentMethod === 'credit_card'}
                  >
                    <option value="">Selecione um cartão</option>
                    {creditCards.filter(card => card.isActive).map(card => (
                      <option key={card.id} value={card.id}>
                        {card.name} - {card.owner} (****{card.lastFourDigits})
                      </option>
                    ))}
                  </select>
                  {creditCards.filter(card => card.isActive).length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Nenhum cartão cadastrado. Adicione cartões nas configurações.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Classificação</label>
                <div className="grid grid-cols-3 gap-2">
                  {CLASSIFICATIONS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClassification(c.id)}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                        classification === c.id
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-indigo-400'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="px-6 py-5 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={handleSubmit}
                type="button"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Check size={18} />
                {editingItem ? 'Salvar Alterações' : 'Confirmar Lançamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;

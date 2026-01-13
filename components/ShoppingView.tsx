
import React, { useState } from 'react';
import { ShoppingItem } from '../types';
import {
  Plus,
  Trash2,
  Check,
  Package,
  X,
  ShoppingCart,
  Hammer,
  Pill as PillIcon,
  Search,
  FolderOpen
} from 'lucide-react';

interface ShoppingViewProps {
  items: ShoppingItem[];
  onUpdate: (items: ShoppingItem[]) => void;
}

const ShoppingView: React.FC<ShoppingViewProps> = ({ items, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [listName, setListName] = useState('');
  const [cat, setCat] = useState<ShoppingItem['category']>('market');
  const [search, setSearch] = useState('');

  const categories = {
    market: { label: 'Mercado', color: 'bg-emerald-50 text-emerald-600', icon: <ShoppingCart size={14} /> },
    pharmacy: { label: 'Farmácia', color: 'bg-rose-50 text-rose-600', icon: <PillIcon size={14} /> },
    maintenance: { label: 'Reparos', color: 'bg-amber-50 text-amber-600', icon: <Hammer size={14} /> },
    other: { label: 'Outros', color: 'bg-slate-50 text-slate-600', icon: <Package size={14} /> }
  };

  const addItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substr(2, 9),
      name, category: cat, listName: listName.trim() || undefined,
      quantity: 1, unit: 'un', isPurchased: false, autoRefill: false
    };
    onUpdate([newItem, ...items]);
    setName(''); setListName(''); setIsAdding(false);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const groupedPending = filteredItems.filter(i => !i.isPurchased).reduce((groups, item) => {
    const groupName = item.listName || 'Itens Soltos';
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(item);
    return groups;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">Compras</h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">Lista de Abastecimento</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors active:scale-95">
          <Plus size={16} /> Novo Item
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm focus-within:border-indigo-500 transition-all">
        <Search size={16} className="text-zinc-400" />
        <input type="text" placeholder="Buscar item..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-0 outline-none text-sm font-medium w-full text-zinc-800 dark:text-zinc-100 placeholder-zinc-400" />
      </div>

      <div className="space-y-8">
        {Object.keys(groupedPending).map((listTitle) => (
          <div key={listTitle} className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2 ml-2">
              <FolderOpen size={14} /> {listTitle}
            </h3>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {groupedPending[listTitle].map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all">
                  <div className="flex items-center gap-4">
                    <button onClick={() => onUpdate(items.map(i => i.id === item.id ? { ...i, isPurchased: true } : i))} className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 transition-all">
                      <Check size={16} className="opacity-0 group-hover:opacity-100" />
                    </button>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{item.name}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 inline-block ${categories[item.category].color.replace('bg-', 'bg-opacity-10 bg-')}`}>
                        {categories[item.category].label}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => onUpdate(items.filter(i => i.id !== item.id))} className="p-2 text-zinc-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 shrink-0">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Novo Item</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={addItem} className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-zinc-900 custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">O que comprar?</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 transition-colors" placeholder="Ex: Café" autoFocus required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">Lista / Grupo</label>
                <input type="text" value={listName} onChange={e => setListName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none text-sm font-medium text-zinc-900 dark:text-zinc-100" placeholder="Opcional" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 ml-1">Categoria</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(categories) as Array<keyof typeof categories>).map((key) => (
                    <button key={key} type="button" onClick={() => setCat(key as any)} className={`p-3 rounded-xl text-xs font-medium uppercase border transition-all flex items-center gap-2 ${cat === key ? `border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400` : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100'}`}>
                      {categories[key].icon} {categories[key].label}
                    </button>
                  ))}
                </div>
              </div>
            </form>
            <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <button onClick={addItem} type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                <Plus size={18} /> Adicionar Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingView;

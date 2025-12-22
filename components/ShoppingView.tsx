
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
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Compras</h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Abastecimento</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2">
          <Plus size={14} /> Novo Item
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm focus-within:border-indigo-500 transition-all">
        <Search size={16} className="text-slate-300" />
        <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-0 outline-none text-xs font-bold w-full dark:text-white" />
      </div>

      <div className="space-y-8">
        {Object.keys(groupedPending).map((listTitle) => (
          <div key={listTitle} className="space-y-3">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-2">
               <FolderOpen size={12} /> {listTitle}
            </h3>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
              {groupedPending[listTitle].map((item) => (
                <div key={item.id} className="px-6 py-3.5 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-3">
                    <button onClick={() => onUpdate(items.map(i => i.id === item.id ? { ...i, isPurchased: true } : i))} className="w-8 h-8 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:border-emerald-300">
                      <Check size={14} className="opacity-0 group-hover:opacity-100 text-emerald-500" />
                    </button>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-[11px] leading-none">{item.name}</p>
                      <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-1.5 inline-block ${categories[item.category].color}`}>
                        {categories[item.category].label}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => onUpdate(items.filter(i => i.id !== item.id))} className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
           <div className="bg-[#0f172a] w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                 <h3 className="font-black text-xs text-white uppercase tracking-widest">Novo Item</h3>
                 <button onClick={() => setIsAdding(false)} className="p-2 text-slate-500"><X size={20} /></button>
              </div>
              <form onSubmit={addItem} className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0f172a]">
                 <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-500 uppercase ml-1">O que comprar?</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 outline-none font-bold text-xs text-white focus:border-indigo-500" placeholder="Ex: Café" autoFocus required />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Lista / Grupo</label>
                    <input type="text" value={listName} onChange={e => setListName(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white" placeholder="Opcional" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Categoria</label>
                    <div className="grid grid-cols-2 gap-2">
                       {(Object.keys(categories) as Array<keyof typeof categories>).map((key) => (
                         <button key={key} type="button" onClick={() => setCat(key as any)} className={`p-2.5 rounded-xl text-[8px] font-black uppercase border transition-all flex items-center gap-2 ${cat === key ? `border-indigo-600 bg-indigo-600/10 text-indigo-400` : 'border-white/5 bg-slate-900 text-slate-500'}`}>
                            {categories[key].icon} {categories[key].label}
                         </button>
                       ))}
                    </div>
                 </div>
              </form>
              <div className="px-6 py-5 bg-[#0f172a] border-t border-white/10 shrink-0">
                <button onClick={addItem} type="button" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                   <Plus size={16} /> Adicionar Item
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingView;


import React, { useState, useMemo } from 'react';
import { ShoppingItem } from '../types';
import { 
  ShoppingBasket, 
  Plus, 
  Trash2, 
  Check, 
  Package, 
  X, 
  ShoppingCart, 
  Hammer, 
  Pill as PillIcon, 
  LayoutGrid, 
  Search,
  FolderOpen,
  Edit2,
  CheckCheck,
  AlertTriangle,
  Save,
  ChevronRight
} from 'lucide-react';

interface ShoppingViewProps {
  items: ShoppingItem[];
  onUpdate: (items: ShoppingItem[]) => void;
}

type FilterType = 'all' | ShoppingItem['category'];

const ShoppingView: React.FC<ShoppingViewProps> = ({ items, onUpdate }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [listName, setListName] = useState('');
  const [cat, setCat] = useState<ShoppingItem['category']>('market');
  const [search, setSearch] = useState('');
  
  const [editingListName, setEditingListName] = useState<string | null>(null);
  const [newListNameValue, setNewListNameValue] = useState('');
  const [itemToDelete, setItemToDelete] = useState<ShoppingItem | null>(null);

  const categories = {
    market: { label: 'Supermercado', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <ShoppingCart className="w-4 h-4" /> },
    pharmacy: { label: 'Farmácia', color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', icon: <PillIcon className="w-4 h-4" /> },
    maintenance: { label: 'Obras & Reparos', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', icon: <Hammer className="w-4 h-4" /> },
    other: { label: 'Outros', color: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: <Package className="w-4 h-4" /> }
  };

  const addItem = (e?: React.FormEvent, customName?: string, customCat?: ShoppingItem['category'], customList?: string) => {
    if (e) e.preventDefault();
    const finalName = customName || name;
    const finalCat = customCat || cat;
    const finalList = customList || listName;
    
    if (!finalName.trim()) return;

    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: finalName, 
      category: finalCat,
      listName: finalList.trim() || undefined,
      quantity: 1, 
      unit: 'un', 
      isPurchased: false, 
      autoRefill: false
    };
    onUpdate([newItem, ...items]);
    setName('');
    setListName('');
    setIsAdding(false);
  };

  const togglePurchased = (id: string) => {
    onUpdate(items.map(i => i.id === id ? { ...i, isPurchased: !i.isPurchased } : i));
  };

  const completeList = (listKey: string) => {
    onUpdate(items.map(i => {
      const itemGroupKey = i.listName || 'Itens Soltos';
      if (itemGroupKey === listKey && (activeFilter === 'all' || i.category === activeFilter)) {
        return { ...i, isPurchased: true };
      }
      return i;
    }));
  };

  const renameList = (oldName: string) => {
    if (!newListNameValue.trim()) {
      setEditingListName(null);
      return;
    }
    
    onUpdate(items.map(i => {
      const itemGroupKey = i.listName || 'Itens Soltos';
      if (itemGroupKey === oldName) {
        return { ...i, listName: newListNameValue.trim() };
      }
      return i;
    }));
    setEditingListName(null);
  };

  const confirmRemoveItem = () => {
    if (!itemToDelete) return;
    onUpdate(items.filter(i => i.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.category === activeFilter;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingItems = filteredItems.filter(i => !i.isPurchased);

  const groupedPending = useMemo(() => {
    return pendingItems.reduce((groups, item) => {
      const groupName = item.listName || 'Itens Soltos';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(item);
      return groups;
    }, {} as Record<string, ShoppingItem[]>);
  }, [pendingItems]);

  const existingListsInCategory = useMemo(() => {
    const lists = new Set<string>();
    items.forEach(item => {
      if (item.category === cat && item.listName) lists.add(item.listName);
    });
    return Array.from(lists);
  }, [items, cat]);

  const shortcuts = [
    { id: 'all', label: 'Tudo', icon: <LayoutGrid className="w-4 h-4" />, color: 'indigo' },
    { id: 'market', label: 'Mercado', icon: <ShoppingCart className="w-4 h-4" />, color: 'emerald' },
    { id: 'maintenance', label: 'Obras', icon: <Hammer className="w-4 h-4" />, color: 'amber' },
    { id: 'pharmacy', label: 'Farmácia', icon: <PillIcon className="w-4 h-4" />, color: 'rose' },
  ];

  const handleOpenAdd = () => {
    if (activeFilter !== 'all') setCat(activeFilter as ShoppingItem['category']);
    setIsAdding(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20 px-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Compras & Estoque</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gestão inteligente por listas e projetos</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="w-full md:w-auto bg-slate-900 dark:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Novo Item
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 flex items-center gap-4 shadow-sm group focus-within:border-indigo-500 transition-all">
          <Search className="w-5 h-5 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-500" />
          <input 
            type="text" 
            placeholder="Buscar em todas as listas..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-0 outline-none text-sm font-bold w-full dark:text-white"
          />
        </div>

        <div className="relative -mx-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2">
            {shortcuts.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveFilter(s.id as FilterType)}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border-2 active:scale-95 ${
                  activeFilter === s.id 
                  ? `bg-slate-900 dark:bg-indigo-600 border-slate-900 dark:border-indigo-600 text-white shadow-lg` 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
          <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-slate-50 dark:from-slate-950 pointer-events-none md:hidden"></div>
        </div>
      </div>

      <div className="space-y-10">
        {(Object.entries(groupedPending) as [string, ShoppingItem[]][]).map(([listTitle, groupItems]) => (
          <div key={listTitle} className="space-y-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shadow-sm border border-indigo-100/50 dark:border-indigo-800/30">
                  <FolderOpen className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1">
                  {editingListName === listTitle ? (
                    <div className="flex items-center gap-2">
                      <input 
                        autoFocus
                        type="text"
                        value={newListNameValue}
                        onChange={(e) => setNewListNameValue(e.target.value)}
                        className="bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-lg px-2 py-1 text-sm font-black text-slate-800 dark:text-white outline-none"
                      />
                      <button onClick={() => renameList(listTitle)} className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm"><Save className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-widest">{listTitle}</h3>
                      {listTitle !== 'Itens Soltos' && (
                        <button 
                          onClick={() => { setEditingListName(listTitle); setNewListNameValue(listTitle); }}
                          className="p-1 text-slate-300 hover:text-indigo-600 transition-colors md:opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{groupItems.length} {groupItems.length === 1 ? 'item' : 'itens'} pendentes</p>
                </div>
              </div>
              <button 
                onClick={() => completeList(listTitle)}
                className="p-2 md:px-3 md:py-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-colors active:scale-95"
              >
                <CheckCheck className="w-5 h-5 md:hidden" />
                <span className="hidden md:inline">Marcar Tudo</span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
              {groupItems.map((item) => (
                <div key={item.id} className="p-5 md:p-6 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                    <button 
                      onClick={() => togglePurchased(item.id)} 
                      className="w-10 h-10 md:w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-emerald-200 active:scale-90"
                    >
                      <Check className="w-5 h-5 md:w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                    </button>
                    <div className="min-w-0 truncate">
                      <p className="font-black text-slate-800 dark:text-slate-100 text-base md:text-lg leading-tight truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${categories[item.category].color}`}>
                          {categories[item.category].label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setItemToDelete(item)} 
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-300 hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4 md:w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {pendingItems.length === 0 && (
          <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBasket className="w-10 h-10 text-slate-200 dark:text-slate-700" />
            </div>
            <h4 className="text-xl font-black text-slate-800 dark:text-white">Tudo abastecido!</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-2">Nenhum item pendente no filtro atual.</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[110] flex items-end md:items-center justify-center p-0 md:p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[3rem] md:rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden border border-white/20">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
                 <div>
                    <h3 className="font-black text-2xl text-slate-800 dark:text-white">Novo Item</h3>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Organize seu abastecimento</p>
                 </div>
                 <button onClick={() => setIsAdding(false)} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-md hover:text-rose-500 transition-all"><X className="w-6 h-6 dark:text-slate-400" /></button>
              </div>
              <form onSubmit={(e) => addItem(e)} className="p-8 md:p-10 space-y-6 pb-24 md:pb-10 max-h-[80vh] overflow-y-auto">
                 <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 ml-1">O que você precisa?</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 md:p-5 outline-none focus:border-indigo-500 text-base md:text-lg font-black text-slate-800 dark:text-white transition-all" 
                      placeholder="Ex: Cimento, Leite..." 
                      autoFocus required 
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 ml-1">Lista / Projeto</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={listName} 
                        onChange={e => setListName(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-indigo-500 font-bold dark:text-white" 
                        placeholder="Ex: Banheiro, João, Mensal" 
                      />
                      {existingListsInCategory.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {existingListsInCategory.slice(0, 3).map(l => (
                            <button key={l} type="button" onClick={() => setListName(l)} className="text-[8px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-500 transition-colors">
                              + {l}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                    <div className="grid grid-cols-2 gap-2">
                       {Object.entries(categories).map(([key, data]) => (
                         <button 
                          key={key} 
                          type="button" 
                          onClick={() => setCat(key as any)} 
                          className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex flex-col items-center gap-2 ${
                            cat === key 
                            ? `border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-lg` 
                            : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                          }`}
                         >
                            {data.icon} {data.label}
                         </button>
                       ))}
                    </div>
                 </div>

                 <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-6 rounded-2xl md:rounded-[2rem] font-black text-lg hover:bg-slate-800 dark:hover:bg-indigo-500 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4">
                   <Plus className="w-6 h-6" /> Adicionar à Lista
                 </button>
              </form>
           </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-200 border border-white/20">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                 <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white text-center mb-2">Excluir?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
                Remover <span className="font-black text-slate-800 dark:text-white">"{itemToDelete.name}"</span>?
              </p>
              <div className="flex gap-4">
                 <button onClick={() => setItemToDelete(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest">Cancelar</button>
                 <button onClick={confirmRemoveItem} className="flex-1 py-4 bg-rose-600 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl active:scale-95">Excluir</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingView;

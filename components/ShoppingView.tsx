import React, { useState } from 'react';
import { Plus, Search, CheckCircle2, Circle, Trash2, ShoppingCart, Package, Home, Utensils, Car, Heart, Zap, MoreHorizontal } from 'lucide-react';
import { ShoppingItem } from '../types';

interface ShoppingViewProps {
  items: ShoppingItem[];
  onUpdate: (items: ShoppingItem[]) => Promise<void>;
}

const categories = [
  { id: 'market', name: 'Mercado', icon: Utensils, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'pharmacy', name: 'Farmácia', icon: Heart, color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: 'maintenance', name: 'Manutenção', icon: Zap, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'other', name: 'Outros', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const ShoppingView: React.FC<ShoppingViewProps> = ({ items, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'market' | 'pharmacy' | 'maintenance' | 'other'>('market');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('un');

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: parseInt(newItemQuantity) || 1,
      unit: newItemUnit,
      isPurchased: false,
      autoRefill: false,
    };

    await onUpdate([...items, newItem]);
    setNewItemName('');
    setNewItemCategory('market');
    setNewItemQuantity('1');
    setNewItemUnit('un');
    setIsAdding(false);
  };

  const toggleItem = async (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, isPurchased: !item.isPurchased } : item
    );
    await onUpdate(updatedItems);
  };

  const deleteItem = async (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    await onUpdate(updatedItems);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedItems = categories.map(category => ({
    ...category,
    items: filteredItems.filter(item => item.category === category.id)
  })).filter(group => group.items.length > 0);

  const pendingItems = filteredItems.filter(item => !item.isPurchased);
  const completedItems = filteredItems.filter(item => item.isPurchased);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Lista de Compras</h1>
              <p className="text-gray-600 dark:text-zinc-400">
                {pendingItems.length} itens pendentes • {completedItems.length} comprados
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2 transition-all active:scale-95 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
              >
                {showCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                {showCompleted ? 'Ocultar Comprados' : 'Mostrar Comprados'}
              </button>
              <button
                onClick={() => setIsAdding(true)}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors active:scale-95"
              >
                <Plus size={16} /> Novo Item
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-6 py-4 mb-8 flex items-center gap-3 shadow-sm focus-within:border-indigo-500 transition-all">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar itens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-400"
          />
        </div>

        {/* Items List */}
        <div className="space-y-8">
          {groupedItems.map(category => (
            <div key={category.id} className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <category.icon size={20} className="text-gray-600 dark:text-zinc-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg mt-1 inline-block border bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700">
                    {category.items.length} itens
                  </span>
                </div>
              </div>

              {/* Pending Items */}
              {category.items.filter(item => !item.isPurchased).length > 0 && (
                <div>
                  {category.items.filter(item => !item.isPurchased).map(item => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between group hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-all border-b border-gray-100 dark:border-zinc-800 last:border-b-0">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-zinc-600 flex items-center justify-center hover:border-indigo-500 transition-colors"
                        >
                          {item.isPurchased && <CheckCircle2 size={14} className="text-indigo-600" />}
                        </button>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-zinc-400">Quantidade: {item.quantity} {item.unit}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Items */}
              {showCompleted && category.items.filter(item => item.isPurchased).length > 0 && (
                <>
                  <div className="px-6 py-3 bg-gray-25 dark:bg-zinc-850 border-t border-gray-100 dark:border-zinc-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Comprados</p>
                  </div>
                  {category.items.filter(item => item.isPurchased).map(item => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between group hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-all opacity-60 border-b border-gray-100 dark:border-zinc-800 last:border-b-0">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center"
                        >
                          <CheckCircle2 size={14} className="text-green-600" />
                        </button>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white line-through">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-zinc-400">Quantidade: {item.quantity} {item.unit}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <ShoppingCart size={64} className="mx-auto text-gray-300 dark:text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Nenhum item encontrado' : 'Sua lista está vazia'}
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 mb-6">
              {searchTerm ? 'Tente uma busca diferente' : 'Adicione seu primeiro item para começar'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsAdding(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto hover:bg-indigo-700 transition-colors"
              >
                <Plus size={20} /> Adicionar Primeiro Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Item</h2>
            </div>

            <form onSubmit={addItem} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Nome do Item *
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Ex: Arroz, Leite, Pão..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
                  Categoria
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setNewItemCategory(category.id as 'market' | 'pharmacy' | 'maintenance' | 'other')}
                      className={`p-4 rounded-xl text-sm font-medium uppercase border transition-all flex items-center gap-2 ${
                        newItemCategory === category.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                          : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <category.icon size={16} />
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                    Unidade
                  </label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="un, kg, L..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-xl font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingView;

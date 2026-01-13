
import React, { useState, useEffect } from 'react';
import { HomeState } from '../types';
import {
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  HeartPulse,
  ShoppingBag,
  ArrowRight,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  MapPin,
  AlertCircle,
  ExternalLink,
  Wallet
} from 'lucide-react';
import { getWeatherInfo, WeatherData } from '../services/geminiService';

interface DashboardProps {
  state: HomeState;
  onAction: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onAction }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      if (state.profile.address.city && state.profile.address.state) {
        setLoadingWeather(true);
        const data = await getWeatherInfo(state.profile.address.city, state.profile.address.state);
        if (data) setWeather(data);
        setLoadingWeather(false);
      }
    };
    fetchWeather();
  }, [state.profile.address.city, state.profile.address.state]);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 12) return 'Bom dia';
    if (hours >= 12 && hours < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-8 h-8 text-amber-400" />;
      case 'cloudy': return <Cloud className="w-8 h-8 text-slate-400" />;
      case 'rainy': return <CloudRain className="w-8 h-8 text-indigo-400" />;
      case 'storm': return <CloudLightning className="w-8 h-8 text-purple-400" />;
      case 'snow': return <Snowflake className="w-8 h-8 text-sky-300" />;
      default: return <Sun className="w-8 h-8 text-amber-400" />;
    }
  };

  const getWeatherBg = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20';
      case 'cloudy': return 'bg-slate-50/50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800';
      case 'rainy': return 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/20';
      default: return 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800';
    }
  };

  const pendingTasks = state.tasks.filter(t => t.status === 'pending');
  const expenses = state.finance.filter(f => f.type === 'expense').reduce((acc, curr) => acc + curr.value, 0);
  const income = state.finance.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.value, 0);
  const balance = income - expenses;

  const lowStockMeds = state.medications.filter(m => m.stock <= m.minStock);
  const pendingShopping = state.shoppingList.filter(s => !s.isPurchased);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {getGreeting()}, {state.profile.fullName?.split(' ')[0]}
        </h2>

        {/* Weather Compacto: Clean Bordered Pill */}
        {weather && (
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
            {getWeatherIcon(weather.condition)}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{weather.temp}</span>
            <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
            <span>{weather.description}</span>
          </div>
        )}
      </header>

      {/* Grid Panorama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SALDO GERAL - Minimalist Finance Card */}
        <section className="col-span-1 md:col-span-2 relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1">Fluxo de Caixa</p>
              <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <span className="text-xs text-zinc-400">Entradas</span>
              <p className="text-sm font-semibold text-emerald-600">+ {income.toLocaleString('pt-BR')}</p>
            </div>
            <div className="w-px bg-zinc-100 dark:bg-zinc-800"></div>
            <div className="flex-1">
              <span className="text-xs text-zinc-400">Saídas</span>
              <p className="text-sm font-semibold text-rose-600">- {expenses.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </section>

        {/* PENDING TASKS - White Card */}
        <div
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer hover:border-zinc-300 transition-colors"
          onClick={onAction}
        >
          <div className="flex justify-between items-start mb-4">
            <Clock size={20} className="text-zinc-400" />
            <ChevronRight size={16} className="text-zinc-300" />
          </div>
          <div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{pendingTasks.length}</p>
            <p className="text-xs text-zinc-500 font-medium">Pendentes</p>
          </div>
        </div>

        {/* COMPLETED TASKS - White Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <CheckCircle size={20} className="text-zinc-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{state.tasks.length - pendingTasks.length}</p>
            <p className="text-xs text-zinc-500 font-medium">Concluídas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* HEALTH WIDGET */}
        <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Saúde</h3>
            <HeartPulse size={16} className="text-zinc-400" />
          </div>
          {lowStockMeds.length > 0 ? (
            <div className="py-2 px-3 bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-300 text-sm rounded-md border border-rose-100 dark:border-rose-800/20 flex items-center justify-between">
              <span>Comprar: <span className="font-semibold">{lowStockMeds[0].name}</span></span>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Tudo sob controle.</p>
          )}
        </section>

        {/* SHOPPING WIDGET */}
        <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Lista de Compras</h3>
            <ShoppingBag size={16} className="text-zinc-400" />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{pendingShopping.length}</p>
              <p className="text-xs text-zinc-500">Itens faltantes</p>
            </div>
            <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800"></div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{new Set(state.shoppingList.map(s => s.listName)).size}</p>
              <p className="text-xs text-zinc-500">Listas ativas</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

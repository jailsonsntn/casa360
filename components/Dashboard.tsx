
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {getGreeting()}, {state.profile.fullName?.split(' ')[0] || 'Usuário'}
          </h2>
          <p className="text-xs text-slate-400 font-medium">Panorama da <span className="font-bold text-slate-600 dark:text-slate-300">{state.profile.houseName || 'residência'}</span></p>
        </div>

        {/* Weather Compacto */}
        <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${weather ? getWeatherBg(weather.condition) : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
          {weather ? (
            <>
              {getWeatherIcon(weather.condition)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{weather.temp}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{weather.description}</span>
                </div>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5 line-clamp-1">{weather.advice}</p>
                {weather.sources && weather.sources.length > 0 && (
                  <div className="flex gap-2 mt-1">
                    {weather.sources.map((s, idx) => (
                      <a 
                        key={idx} 
                        href={s.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[7px] text-indigo-500 hover:underline flex items-center gap-0.5"
                      >
                        <ExternalLink size={8} /> Fonte
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-slate-300">
               <MapPin size={18} />
               <p className="text-[9px] font-black uppercase tracking-widest">Endereço pendente</p>
            </div>
          )}
        </div>
      </header>

      {/* Grid Panorama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD SALDO GERAL - DESIGN MELHORADO */}
        <section className="col-span-1 md:col-span-2 relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-slate-950 dark:to-indigo-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/20 group">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/15 transition-colors"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">Saldo Geral</p>
                <div className="flex items-baseline gap-2">
                   <span className="text-lg font-black text-white/50">R$</span>
                   <h3 className="text-4xl font-black tracking-tighter">
                     {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                   </h3>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                <Wallet size={20} className="text-indigo-100" />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 hover:bg-white/15 transition-colors">
                <TrendingUp size={12} className="text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  + R$ {income.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 hover:bg-white/15 transition-colors">
                <TrendingDown size={12} className="text-rose-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  - R$ {expenses.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* OUTROS CARDS */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between group cursor-pointer hover:border-indigo-200 transition-all hover:shadow-lg" onClick={onAction}>
          <div className="flex justify-between items-start">
             <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center">
                <Clock size={20} />
             </div>
             <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-4">
             <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{pendingTasks.length}</p>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Afazeres Pendentes</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center">
             <CheckCircle size={20} />
          </div>
          <div className="mt-4">
             <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{state.tasks.length - pendingTasks.length}</p>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Concluídos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Saúde</h3>
              <HeartPulse size={16} className="text-rose-500" />
           </div>
           {lowStockMeds.length > 0 ? (
             <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center justify-between">
                <p className="text-[10px] font-bold text-rose-600">Comprar: {lowStockMeds[0].name}</p>
                <ArrowRight size={14} className="text-rose-400" />
             </div>
           ) : (
             <p className="text-[10px] text-slate-300 font-bold text-center py-4 uppercase tracking-widest">Sem alertas de saúde.</p>
           )}
        </section>

        <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Abastecimento</h3>
              <ShoppingBag size={16} className="text-emerald-500" />
           </div>
           <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                 <p className="text-lg font-black text-slate-800 dark:text-white leading-none">{pendingShopping.length}</p>
                 <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Faltando</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                 <p className="text-lg font-black text-slate-800 dark:text-white leading-none">{new Set(state.shoppingList.map(s => s.listName)).size}</p>
                 <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Listas</p>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

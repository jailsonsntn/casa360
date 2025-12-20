
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
  AlertCircle
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
      case 'sunny': return <Sun className="w-10 h-10 text-amber-400" />;
      case 'cloudy': return <Cloud className="w-10 h-10 text-slate-400" />;
      case 'rainy': return <CloudRain className="w-10 h-10 text-indigo-400" />;
      case 'storm': return <CloudLightning className="w-10 h-10 text-purple-400" />;
      case 'snow': return <Snowflake className="w-10 h-10 text-sky-300" />;
      default: return <Sun className="w-10 h-10 text-amber-400" />;
    }
  };

  const getWeatherBg = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800';
      case 'cloudy': return 'bg-slate-50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-700';
      case 'rainy': return 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800';
      case 'storm': return 'bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800';
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Olá, {state.profile.fullName?.split(' ')[0] || 'Usuário'}! <span className="text-indigo-600 dark:text-indigo-400">{getGreeting()}</span>.
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Aqui está o panorama atual da sua <span className="text-slate-900 dark:text-white font-bold">{state.profile.houseName || 'residência'}</span>.</p>
        </div>

        {/* Weather Widget */}
        <div className={`min-w-[280px] p-5 rounded-[2.5rem] border shadow-sm flex items-center gap-5 transition-all duration-500 ${weather ? getWeatherBg(weather.condition) : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
          {loadingWeather ? (
            <div className="flex items-center gap-4 animate-pulse">
               <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
               <div className="space-y-2">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
               </div>
            </div>
          ) : weather ? (
            <>
              <div className="animate-float">
                {getWeatherIcon(weather.condition)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{weather.temp}</span>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{weather.description}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{weather.advice}</p>
                <div className="flex items-center gap-1 mt-1 text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tighter">
                  <MapPin className="w-2 h-2" /> {state.profile.address.city}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4 text-slate-400">
               <MapPin className="w-8 h-8 opacity-20" />
               <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Complete seu endereço<br/><span className="text-indigo-500">para ver o clima</span></p>
            </div>
          )}
        </div>
      </header>

      {/* Main Grid Panorama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Finance Snapshot */}
        <section className="col-span-1 md:col-span-2 bg-indigo-600 dark:bg-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200">Saldo da Casa</p>
                <TrendingUp className="w-5 h-5 text-indigo-300" />
              </div>
              <h3 className="text-4xl font-black tracking-tighter">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-[10px] font-black uppercase">Entradas: R$ {income.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                <span className="text-[10px] font-black uppercase">Saídas: R$ {expenses.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Routine Widget */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer" onClick={onAction}>
          <div className="flex justify-between items-start">
             <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-sm">
                <Clock className="w-6 h-6" />
             </div>
             <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
             <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{pendingTasks.length}</p>
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Tarefas Pendentes</p>
          </div>
        </div>

        {/* Finished Tasks Widget */}
        <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
             <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
             <p className="text-3xl font-black">{state.tasks.length - pendingTasks.length}</p>
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Concluídas</p>
          </div>
        </div>
      </div>

      {/* Secondary Panorama Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Health Panorama */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-xl flex items-center justify-center">
                    <HeartPulse className="w-5 h-5" />
                 </div>
                 <h3 className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-widest">Saúde & Bem Estar</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{state.medications.length} Medicamentos</span>
           </div>
           
           <div className="space-y-4">
              {lowStockMeds.length > 0 ? (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center justify-between animate-pulse">
                   <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-300">Estoque baixo: {lowStockMeds[0].name}</p>
                   </div>
                   <ArrowRight className="w-4 h-4 text-rose-400" />
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                   <p className="text-xs font-bold text-slate-400">Tudo em ordem com seus tratamentos.</p>
                </div>
              )}
           </div>
        </section>

        {/* Shopping Panorama */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                 </div>
                 <h3 className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-widest">Abastecimento</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{pendingShopping.length} itens faltantes</span>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] text-center">
                 <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{pendingShopping.length}</p>
                 <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mt-1">Pendente</p>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] text-center">
                 <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{new Set(state.shoppingList.map(s => s.listName)).size}</p>
                 <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mt-1">Listas</p>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

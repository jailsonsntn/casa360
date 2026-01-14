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
  Wallet,
  Calendar,
  Target,
  Activity,
  PieChart,
  BarChart3,
  Pill,
  DollarSign,
  CheckCircle2,
  Circle,
  Zap
} from 'lucide-react';
import { getWeatherInfo, WeatherData } from '../services/geminiService';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

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

  // Cálculos aprimorados para métricas
  const pendingTasks = state.tasks.filter(t => t.status === 'pending');
  const completedTasks = state.tasks.filter(t => t.status === 'completed');
  const inProgressTasks = state.tasks.filter(t => t.status === 'in_progress');

  const expenses = state.finance.filter(f => f.type === 'expense').reduce((acc, curr) => acc + curr.value, 0);
  const income = state.finance.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.value, 0);
  const balance = income - expenses;

  // Próximas tarefas do dia
  const todayTasks = state.tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  });

  // Medicamentos para hoje
  const todayMeds = state.medications.filter(med => {
    const lastTaken = med.lastTaken ? new Date(med.lastTaken) : null;
    const now = new Date();
    const hoursSinceLast = lastTaken ? (now.getTime() - lastTaken.getTime()) / (1000 * 60 * 60) : 24;

    // Verificar se precisa tomar baseado na frequência
    if (med.frequency === 'daily' && hoursSinceLast >= 24) return true;
    if (med.frequency === 'twice_daily' && hoursSinceLast >= 12) return true;
    if (med.frequency === 'weekly' && hoursSinceLast >= 168) return true;

    return false;
  });

  const lowStockMeds = state.medications.filter(m => m.stock <= m.minStock);
  const pendingShopping = state.shoppingList.filter(s => !s.isPurchased);

  // Dados para gráficos
  const expenseCategories = state.finance
    .filter(f => f.type === 'expense')
    .reduce((acc, curr) => {
      const category = curr.classification || 'Outros';
      acc[category] = (acc[category] || 0) + curr.value;
      return acc;
    }, {} as Record<string, number>);

  const expenseChartData = Object.entries(expenseCategories).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / expenses) * 100).toFixed(1)
  }));

  const taskChartData = [
    { name: 'Pendentes', value: pendingTasks.length, color: '#f59e0b' },
    { name: 'Em Andamento', value: inProgressTasks.length, color: '#3b82f6' },
    { name: 'Concluídas', value: completedTasks.length, color: '#10b981' }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header aprimorado */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            {getGreeting()}, {state.profile.fullName?.split(' ')[0]}
          </h2>
          <p className="text-slate-600 dark:text-zinc-400 mt-1">
            Aqui está o resumo do seu dia
          </p>
        </div>

        {/* Weather aprimorado */}
        {weather && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm transition-all hover:shadow-md ${getWeatherBg(weather.condition)}`}>
            {getWeatherIcon(weather.condition)}
            <div>
              <div className="font-semibold text-slate-900 dark:text-zinc-100">{weather.temp}</div>
              <div className="text-sm text-slate-600 dark:text-zinc-400">{weather.description}</div>
            </div>
          </div>
        )}
      </header>

      {/* Grid principal com métricas visuais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Saldo financeiro com tendência */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-8 h-8 text-emerald-600" />
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              balance >= 0
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {balance >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {balance >= 0 ? 'Positivo' : 'Negativo'}
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-slate-600 dark:text-zinc-400">Saldo atual</p>
          </div>
        </div>

        {/* Tarefas com indicadores */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-blue-600" />
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{state.tasks.length}</p>
              <p className="text-xs text-slate-600 dark:text-zinc-400">Total</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-zinc-400">Pendentes</span>
              <span className="font-medium text-amber-600">{pendingTasks.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-zinc-400">Em andamento</span>
              <span className="font-medium text-blue-600">{inProgressTasks.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-zinc-400">Concluídas</span>
              <span className="font-medium text-emerald-600">{completedTasks.length}</span>
            </div>
          </div>
        </div>

        {/* Saúde com indicadores */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <HeartPulse className="w-8 h-8 text-red-600" />
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{todayMeds.length}</p>
              <p className="text-xs text-slate-600 dark:text-zinc-400">Para hoje</p>
            </div>
          </div>
          <div className="space-y-2">
            {todayMeds.length > 0 ? (
              <div className="flex items-center gap-2 text-sm">
                <Pill className="w-4 h-4 text-red-500" />
                <span className="text-slate-600 dark:text-zinc-400">
                  {todayMeds[0].name}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-600 dark:text-zinc-400">Tudo em dia</span>
              </div>
            )}
            {lowStockMeds.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-slate-600 dark:text-zinc-400">
                  {lowStockMeds.length} em falta
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Compras com progresso */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <ShoppingBag className="w-8 h-8 text-purple-600" />
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{pendingShopping.length}</p>
              <p className="text-xs text-slate-600 dark:text-zinc-400">Pendentes</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-zinc-400">Comprados</span>
              <span className="font-medium text-emerald-600">
                {state.shoppingList.length - pendingShopping.length}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${state.shoppingList.length > 0 ? ((state.shoppingList.length - pendingShopping.length) / state.shoppingList.length) * 100 : 0}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de atividades do dia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas atividades */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-slate-600 dark:text-zinc-400" />
            <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Hoje</h3>
          </div>
          <div className="space-y-4">
            {/* Tarefas de hoje */}
            {todayTasks.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Tarefas ({todayTasks.length})
                </h4>
                <div className="space-y-2">
                  {todayTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-zinc-800">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : task.status === 'in_progress' ? (
                        <Activity className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400" />
                      )}
                      <span className={`text-sm ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900 dark:text-zinc-100'}`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-slate-600 dark:text-zinc-400">Nenhuma tarefa para hoje</p>
              </div>
            )}

            {/* Medicamentos de hoje */}
            {todayMeds.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  Medicamentos ({todayMeds.length})
                </h4>
                <div className="space-y-2">
                  {todayMeds.slice(0, 2).map(med => (
                    <div key={med.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <Pill className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-slate-900 dark:text-zinc-100">{med.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumo financeiro detalhado */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-zinc-800 dark:to-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-700">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-slate-600 dark:text-zinc-400" />
            <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Resumo Financeiro</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-zinc-100">Receitas</p>
                  <p className="text-sm text-slate-600 dark:text-zinc-400">Entradas do mês</p>
                </div>
              </div>
              <p className="text-xl font-bold text-emerald-600">
                +R$ {income.toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-zinc-100">Despesas</p>
                  <p className="text-sm text-slate-600 dark:text-zinc-400">Saídas do mês</p>
                </div>
              </div>
              <p className="text-xl font-bold text-red-600">
                -R$ {expenses.toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-zinc-100">Saldo</p>
                  <p className="text-sm text-slate-600 dark:text-zinc-400">Resultado final</p>
                </div>
              </div>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {balance >= 0 ? '+' : ''}R$ {Math.abs(balance).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de gráficos e análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de distribuição de gastos */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-5 h-5 text-slate-600 dark:text-zinc-400" />
            <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Gastos por Categoria</h3>
          </div>
          {expenses > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={expenseChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500 dark:text-zinc-400">
              <div className="text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sem gastos registrados</p>
              </div>
            </div>
          )}
          {expenses > 0 && (
            <div className="mt-4 space-y-2">
              {expenseChartData.slice(0, 4).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-slate-600 dark:text-zinc-400">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-zinc-100">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráfico de status das tarefas */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-slate-600 dark:text-zinc-400" />
            <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Status das Tarefas</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={taskChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                stroke="#64748b"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {taskChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

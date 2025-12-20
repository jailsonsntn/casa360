
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  History, 
  Plus, 
  Settings,
  HeartPulse,
  ShoppingCart,
  Calendar,
  AlertTriangle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { Task, Transaction, HomeState, Medication, UserProfile, AuthState } from './types';
import Dashboard from './components/Dashboard';
import RoutineView from './components/RoutineView';
import FinanceView from './components/FinanceView';
import TimelineView from './components/TimelineView';
import SettingsView from './components/SettingsView';
import HealthView from './components/HealthView';
import ShoppingView from './components/ShoppingView';
import AuthView from './components/AuthView';
import { notificationService } from './services/notificationService';
import { supabase } from './services/supabaseClient';

const INITIAL_PROFILE: UserProfile = {
  fullName: 'Usuário Casa360',
  birthDate: '',
  phone: '',
  email: '',
  address: { street: '', number: '', city: '', state: '', zip: '' },
  houseName: 'Minha Casa'
};

const INITIAL_AUTH: AuthState = {
  isLoggedIn: false,
  userEmail: null,
  lastLogin: null
};

const INITIAL_STATE: HomeState = {
  auth: INITIAL_AUTH,
  profile: INITIAL_PROFILE,
  tasks: [],
  finance: [],
  medications: [],
  shoppingList: [],
  reminders: [],
  timeline: [],
  userPoints: 0,
  theme: 'light'
};

type TabId = 'dashboard' | 'routine' | 'finance' | 'health' | 'shopping' | 'timeline' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [state, setState] = useState<HomeState>(INITIAL_STATE);
  
  const [activeAlarm, setActiveAlarm] = useState<Task | null>(null);

  // Monitorar Autenticação do Supabase
  useEffect(() => {
    // 1. Checar sessão atual ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthChange(session);
      }
      setLoadingSession(false);
    });

    // 2. Escutar mudanças (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = async (session: any) => {
    if (session) {
      // Carregar perfil do banco
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setState(prev => ({
        ...prev,
        auth: {
          isLoggedIn: true,
          userEmail: session.user.email,
          lastLogin: new Date().toISOString()
        },
        profile: profileData ? {
          fullName: profileData.full_name || '',
          email: profileData.email || '',
          birthDate: profileData.birth_date || '',
          phone: profileData.phone || '',
          houseName: profileData.house_name || 'Minha Casa',
          profileImage: profileData.profile_image,
          address: {
            street: profileData.address_street || '',
            number: profileData.address_number || '',
            city: profileData.address_city || '',
            state: profileData.address_state || '',
            zip: profileData.address_zip || '',
          }
        } : prev.profile,
        theme: profileData?.theme || prev.theme
      }));
    } else {
      setState(INITIAL_STATE);
    }
  };

  // Sincronização do Dark Mode
  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  // Checagem de Alarmes (Local)
  useEffect(() => {
    if (!state.auth.isLoggedIn) return;

    const checkAlarms = setInterval(() => {
      const now = new Date();
      const triggeringTask = state.tasks.find(task => {
        if (task.status === 'completed' || !task.alarmConfig?.enabled || task.alarmConfig?.triggered) return false;
        const taskTime = new Date(task.dueDate);
        return taskTime <= now;
      });

      if (triggeringTask) {
        setActiveAlarm(triggeringTask);
        if (triggeringTask.alarmConfig?.sound) notificationService.playAlarmSound();
        if (triggeringTask.alarmConfig?.vibration) notificationService.vibrate([500, 200, 500]);
        notificationService.sendLocalNotification("Alerta: " + triggeringTask.title, triggeringTask.description);
        
        updateTask(triggeringTask.id, { 
          alarmConfig: { ...triggeringTask.alarmConfig!, triggered: true } 
        });
      }
    }, 15000);

    return () => clearInterval(checkAlarms);
  }, [state.tasks, state.auth.isLoggedIn]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setState(INITIAL_STATE);
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = { ...task, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const deleteTask = (id: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  };

  const addMedication = (medData: Omit<Medication, 'id' | 'isActive'>) => {
    const newMed: Medication = { ...medData, id: Math.random().toString(36).substr(2, 9), isActive: true };
    setState(prev => ({ ...prev, medications: [newMed, ...prev.medications] }));
  };

  const deleteMedication = (id: string) => {
    setState(prev => ({
      ...prev,
      medications: prev.medications.filter(m => m.id !== id),
      tasks: prev.tasks.filter(t => t.medicationId !== id)
    }));
  };

  const addTransaction = (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = { ...t, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, finance: [newTransaction, ...prev.finance] }));
  };

  const navigateTo = (tab: TabId) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'routine', label: 'Rotina', icon: <Calendar className="w-5 h-5" /> },
    { id: 'finance', label: 'Finanças', icon: <Wallet className="w-5 h-5" /> },
    { id: 'health', label: 'Saúde', icon: <HeartPulse className="w-5 h-5" /> },
    { id: 'shopping', label: 'Compras', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'timeline', label: 'Histórico', icon: <History className="w-5 h-5" /> },
    { id: 'settings', label: 'Perfil', icon: <Settings className="w-5 h-5" /> },
  ];

  const bottomNavItems = navItems.slice(0, 5);

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!state.auth.isLoggedIn) {
    return <AuthView onLogin={() => {}} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden transition-colors duration-300">
      {/* PC Sidebar */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full z-20 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 truncate"><Sparkles className="w-6 h-6 shrink-0" /> {state.profile.houseName || 'Casa360'}</h1>}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400">
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id as TabId)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === item.id 
                ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 shadow-sm border border-indigo-100 dark:border-indigo-800' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              {item.icon}
              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all font-bold ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
             <LogOut className="w-5 h-5" />
             {!isSidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        {/* Modern Mobile/Desktop Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl md:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
            <div className="sm:hidden font-black text-indigo-600 dark:text-indigo-400 text-sm flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Casa360
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">{state.profile.fullName.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{state.profile.houseName}</p>
             </div>
             <button 
                onClick={() => navigateTo('settings')}
                className="w-9 h-9 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xs border-2 border-white dark:border-slate-800 shadow-lg overflow-hidden active:scale-90 transition-transform"
             >
                {state.profile.profileImage ? (
                  <img src={state.profile.profileImage} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  state.profile.fullName.charAt(0) || 'U'
                )}
             </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-full w-full mb-24 md:mb-0">
          {activeTab === 'dashboard' && <Dashboard state={state} onAction={() => navigateTo('routine')} />}
          {activeTab === 'routine' && <RoutineView tasks={state.tasks} onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask} />}
          {activeTab === 'finance' && <FinanceView transactions={state.finance} tasks={state.tasks} onAdd={addTransaction} onUpdate={() => {}} onDelete={() => {}} />}
          {activeTab === 'health' && <HealthView medications={state.medications} onAdd={addMedication} onTakeDose={() => {}} onDelete={deleteMedication} />}
          {activeTab === 'shopping' && <ShoppingView items={state.shoppingList} onUpdate={(i) => setState(p => ({...p, shoppingList: i}))} />}
          {activeTab === 'timeline' && <TimelineView events={state.timeline} />}
          {activeTab === 'settings' && <SettingsView state={state} onUpdate={(newState) => setState(newState)} onLogout={handleLogout} />}
        </main>
      </div>

      {/* NEW Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[90] bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 shadow-2xl rounded-[2.5rem] p-2 flex items-center justify-between transition-all">
        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id as TabId)}
            className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
              activeTab === item.id 
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' 
              : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {item.icon}
            {activeTab === item.id && (
              <span className="absolute -bottom-1 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
            )}
          </button>
        ))}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl text-slate-400 dark:text-slate-500`}
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </nav>

      {/* Mobile Drawer (Side Menu for secondary items) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col rounded-r-[2.5rem]">
             <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2 font-black text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" /> Casa360
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>
             <nav className="p-6 space-y-2 flex-1 overflow-y-auto no-scrollbar">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Menu Principal</p>
                {navItems.map(item => (
                   <button 
                    key={item.id} 
                    onClick={() => navigateTo(item.id as TabId)} 
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${
                      activeTab === item.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                   >
                      {item.icon} {item.label}
                   </button>
                ))}
             </nav>
             <div className="p-6 border-t dark:border-slate-800 space-y-4">
               <button 
                onClick={handleLogout} 
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-rose-500 font-black text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-rose-100 dark:border-rose-900/30 shadow-sm"
               >
                  <LogOut className="w-5 h-5" /> Sair da Conta
               </button>
               <p className="text-center text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Versão 2.1 • Personal Project</p>
             </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default App;

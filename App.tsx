
import React, { useState, useEffect, useCallback } from 'react';
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
import { Task, Transaction, HomeState, Medication, UserProfile, AuthState, ShoppingItem } from './types';
import Dashboard from './components/Dashboard';
import RoutineView from './components/RoutineView';
import FinanceView from './components/FinanceView';
import TimelineView from './components/TimelineView';
import SettingsView from './components/SettingsView';
import HealthView from './components/HealthView';
import ShoppingView from './components/ShoppingView';
import AuthView from './components/AuthView';
import { supabase } from './services/supabaseClient';

const INITIAL_PROFILE: UserProfile = {
  fullName: 'Usuário Casa360',
  birthDate: '',
  phone: '',
  email: '',
  address: { street: '', number: '', city: '', state: '', zip: '' },
  houseName: 'Minha Casa'
};

const INITIAL_STATE: HomeState = {
  auth: { isLoggedIn: false, userEmail: null, lastLogin: null },
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

  const fetchUserData = useCallback(async (userId: string, email: string) => {
    try {
      // Usamos consultas individuais com tratamento de erro para evitar que uma tabela faltante trave o app
      const [pRes, tRes, fRes, mRes, sRes] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('finance').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('medications').select('*').eq('user_id', userId),
        supabase.from('shopping_items').select('*').eq('user_id', userId)
      ]);

      const profileData = pRes.status === 'fulfilled' ? pRes.value.data : null;
      const tasks = tRes.status === 'fulfilled' ? tRes.value.data : [];
      const finance = fRes.status === 'fulfilled' ? fRes.value.data : [];
      const meds = mRes.status === 'fulfilled' ? mRes.value.data : [];
      const shopping = sRes.status === 'fulfilled' ? sRes.value.data : [];
      
      setState(prev => ({
        ...prev,
        auth: { 
          isLoggedIn: true, 
          userEmail: email, 
          lastLogin: new Date().toISOString() 
        },
        profile: profileData ? {
          fullName: profileData.full_name || '',
          email: profileData.email || email,
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
        } : { ...INITIAL_PROFILE, email: email },
        tasks: tasks || [],
        finance: finance || [],
        medications: meds || [],
        shoppingList: shopping || [],
        theme: profileData?.theme || prev.theme
      }));
    } catch (err) {
      console.error("Erro crítico ao sincronizar dados:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            await fetchUserData(session.user.id, session.user.email!);
          }
        }
      } catch (err) {
        console.error("Erro na inicialização:", err);
      } finally {
        if (mounted) setLoadingSession(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          await fetchUserData(session.user.id, session.user.email!);
          setLoadingSession(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setState(INITIAL_STATE);
        setLoadingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  useEffect(() => {
    if (state.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state.theme]);

  // --- CRUD PERSISTENTE ---

  const updateProfile = async (newProfile: UserProfile) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      full_name: newProfile.fullName,
      birth_date: newProfile.birthDate || null,
      phone: newProfile.phone,
      email: newProfile.email,
      house_name: newProfile.houseName,
      profile_image: newProfile.profileImage,
      address_street: newProfile.address.street,
      address_number: newProfile.address.number,
      address_city: newProfile.address.city,
      address_state: newProfile.address.state,
      address_zip: newProfile.address.zip,
      theme: state.theme
    });
    if (!error) setState(prev => ({ ...prev, profile: newProfile }));
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase.from('tasks').insert([{
      user_id: session.user.id,
      title: task.title,
      description: task.description,
      responsible: task.responsible,
      due_date: task.dueDate,
      recurrence: task.recurrence,
      status: task.status,
      priority: task.priority,
      points: task.points,
      alarm_config: task.alarmConfig
    }]).select().single();
    if (data) setState(prev => ({ ...prev, tasks: [data, ...prev.tasks] }));
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const dbUpdates: any = { ...updates };
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
    if (updates.alarmConfig) dbUpdates.alarm_config = updates.alarmConfig;
    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
    if (!error) setState(p => ({ ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase.from('finance').insert([{
      user_id: session.user.id,
      type: t.type, category: t.category, value: t.value, date: t.date,
      recurring: t.recurring, notes: t.notes, payment_method: t.paymentMethod,
      classification: t.classification
    }]).select().single();
    if (data) setState(p => ({ ...p, finance: [data, ...p.finance] }));
  };

  const updateShopping = async (items: ShoppingItem[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Atualiza localmente imediatamente para UI fluida
    setState(p => ({ ...p, shoppingList: items }));

    // Sincroniza com o banco o item mais recente (se for novo)
    const lastItem = items[0]; 
    if (lastItem && typeof lastItem.id === 'string' && lastItem.id.length < 15) { // ID gerado pelo cliente
      const { data, error } = await supabase.from('shopping_items').insert([{
        user_id: session.user.id,
        name: lastItem.name, 
        category: lastItem.category, 
        list_name: lastItem.listName, 
        is_purchased: lastItem.isPurchased
      }]).select().single();
      
      if (data) {
        setState(p => ({
          ...p,
          shoppingList: p.shoppingList.map(i => i.id === lastItem.id ? data : i)
        }));
      }
    } else {
      // Para itens existentes, atualiza o status de compra
      for (const item of items) {
        if (item.id.length > 15) { // ID uuid do supabase
          await supabase.from('shopping_items').update({ 
            is_purchased: item.isPurchased,
            list_name: item.listName 
          }).eq('id', item.id);
        }
      }
    }
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

  if (loadingSession) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 z-[200]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-100 dark:border-slate-800 rounded-full animate-pulse"></div>
          <Loader2 className="w-20 h-20 text-indigo-600 dark:text-indigo-400 animate-spin absolute top-0 left-0" />
        </div>
        <div className="text-center">
          <p className="text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.4em] animate-pulse">Sincronizando Residência</p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">Casa360 Cloud Sync</p>
        </div>
      </div>
    );
  }

  if (!state.auth.isLoggedIn) return <AuthView onLogin={() => {}} />;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
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
            >
              {item.icon}
              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => supabase.auth.signOut()} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all font-bold ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
             <LogOut className="w-5 h-5" />
             {!isSidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl md:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">{state.profile.fullName.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{state.profile.houseName}</p>
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
          {activeTab === 'routine' && <RoutineView tasks={state.tasks} onAdd={addTask} onUpdate={updateTask} onDelete={() => {}} />}
          {activeTab === 'finance' && <FinanceView transactions={state.finance} tasks={state.tasks} onAdd={addTransaction} onUpdate={() => {}} onDelete={() => {}} />}
          {activeTab === 'health' && <HealthView medications={state.medications} onAdd={() => {}} onTakeDose={() => {}} onDelete={() => {}} />}
          {activeTab === 'shopping' && <ShoppingView items={state.shoppingList} onUpdate={updateShopping} />}
          {activeTab === 'timeline' && <TimelineView events={state.timeline} />}
          {activeTab === 'settings' && <SettingsView state={state} onUpdate={(ns) => updateProfile(ns.profile)} onLogout={() => supabase.auth.signOut()} />}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[90] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2.5rem] p-2 flex items-center justify-between">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id as TabId)}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
              activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'
            }`}
          >
            {item.icon}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;

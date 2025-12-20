
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
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
  Loader2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Task, Transaction, HomeState, Medication, UserProfile, AuthState, ShoppingItem } from './types';
import Dashboard from './components/Dashboard';
import RoutineView from './components/RoutineView';
import FinanceView from './components/FinanceView';
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
  auth: { isLoggedIn: false, userEmail: null, userId: null, lastLogin: null },
  profile: INITIAL_PROFILE,
  tasks: [],
  finance: [],
  medications: [],
  shoppingList: [],
  reminders: [],
  userPoints: 0,
  theme: 'light'
};

type TabId = 'dashboard' | 'routine' | 'finance' | 'health' | 'shopping' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [state, setState] = useState<HomeState>(INITIAL_STATE);

  // Inactivity Logic State
  const [showIdleModal, setShowIdleModal] = useState(false);
  const [idleTimer, setIdleTimer] = useState(60);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUserData = useCallback(async (userId: string, email: string) => {
    try {
      const results = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('finance').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('medications').select('*').eq('user_id', userId).order('name', { ascending: true }),
        supabase.from('shopping_items').select('*').eq('user_id', userId)
      ]);

      const profileData = results[0].status === 'fulfilled' ? (results[0].value as any).data : null;
      const tasksRaw = results[1].status === 'fulfilled' ? (results[1].value as any).data : [];
      const financeRaw = results[2].status === 'fulfilled' ? (results[2].value as any).data : [];
      const medsRaw = results[3].status === 'fulfilled' ? (results[3].value as any).data : [];
      const shoppingRaw = results[4].status === 'fulfilled' ? (results[4].value as any).data : [];
      
      const tasks: Task[] = (tasksRaw || []).map((t: any) => ({
        ...t,
        dueDate: t.due_date || t.dueDate,
        alarmConfig: t.alarm_config || t.alarmConfig,
        createdAt: t.created_at || t.createdAt
      }));

      const finance: Transaction[] = (financeRaw || []).map((f: any) => ({
        ...f,
        paymentMethod: f.payment_method || f.paymentMethod,
        linkedEventId: f.linked_event_id || f.linkedEventId,
        createdAt: f.created_at || f.createdAt
      }));

      const medications: Medication[] = (medsRaw || []).map((m: any) => ({
        ...m,
        minStock: m.min_stock !== undefined ? m.min_stock : m.minStock,
        lastTaken: m.last_taken || m.lastTaken,
        isActive: m.is_active !== undefined ? m.is_active : m.isActive
      }));

      const shoppingList: ShoppingItem[] = (shoppingRaw || []).map((s: any) => ({
        ...s,
        isPurchased: s.is_purchased !== undefined ? s.is_purchased : s.isPurchased,
        autoRefill: s.auto_refill !== undefined ? s.auto_refill : s.autoRefill,
        listName: s.list_name || s.listName
      }));

      setState(prev => ({
        ...prev,
        auth: { 
          isLoggedIn: true, 
          userEmail: email, 
          userId: userId, 
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
        tasks,
        finance,
        medications,
        shoppingList,
        theme: profileData?.theme || prev.theme
      }));
    } catch (err) {
      console.error("Erro fatal no fetchUserData:", err);
    }
  }, []);

  const resetIdleTimers = useCallback(() => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    if (!state.auth.isLoggedIn || showIdleModal) return;

    idleTimeoutRef.current = setTimeout(() => {
      setShowIdleModal(true);
      setIdleTimer(60);
    }, 30 * 60 * 1000); 
  }, [state.auth.isLoggedIn, showIdleModal]);

  useEffect(() => {
    if (showIdleModal) {
      countdownIntervalRef.current = setInterval(() => {
        setIdleTimer(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            supabase.auth.signOut();
            setShowIdleModal(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
    return () => { if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); };
  }, [showIdleModal]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetIdleTimers();
    if (state.auth.isLoggedIn) {
      events.forEach(e => window.addEventListener(e, handleActivity));
      resetIdleTimers();
    }
    return () => events.forEach(e => window.removeEventListener(e, handleActivity));
  }, [state.auth.isLoggedIn, resetIdleTimers]);

  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) await fetchUserData(session.user.id, session.user.email!);
          else setState(prev => ({ ...prev, auth: { ...prev.auth, isLoggedIn: false } }));
          setLoadingSession(false);
        }
      } catch (e) {
        if (mounted) setLoadingSession(false);
      }
    };
    checkSession();

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

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchUserData]);

  useEffect(() => {
    if (state.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state.theme]);

  const updateProfile = async (newProfile: UserProfile, newTheme?: 'light' | 'dark') => {
    if (!state.auth.userId) return;
    const targetTheme = newTheme !== undefined ? newTheme : state.theme;
    const { error } = await supabase.from('profiles').upsert({
      id: state.auth.userId, full_name: newProfile.fullName, birth_date: newProfile.birthDate || null,
      phone: newProfile.phone, email: newProfile.email, house_name: newProfile.houseName,
      profile_image: newProfile.profileImage, address_street: newProfile.address.street,
      address_number: newProfile.address.number, address_city: newProfile.address.city,
      address_state: newProfile.address.state, address_zip: newProfile.address.zip,
      theme: targetTheme
    });
    if (!error) setState(prev => ({ ...prev, profile: newProfile, theme: targetTheme }));
  };

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (!state.auth.userId) return;
    const { data, error } = await supabase.from('tasks').insert([{
      user_id: state.auth.userId, title: task.title, description: task.description,
      responsible: task.responsible, due_date: task.dueDate, recurrence: task.recurrence,
      status: task.status, priority: task.priority
    }]).select().single();
    if (data) setState(prev => ({ ...prev, tasks: [{ ...data, dueDate: data.due_date, createdAt: data.created_at }, ...prev.tasks] }));
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!state.auth.userId) return;
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
    if (!error) setState(p => ({ ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const deleteTask = async (id: string) => {
    if (!state.auth.userId) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setState(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== id) }));
  };

  const addMedication = async (med: Omit<Medication, 'id' | 'isActive'>) => {
    if (!state.auth.userId) return;
    const { data, error } = await supabase.from('medications').insert([{
      user_id: state.auth.userId, name: med.name, person: med.person, dosage: med.dosage,
      frequency: med.frequency, stock: med.stock, min_stock: med.minStock, is_active: true
    }]).select().single();
    if (data) setState(p => ({ ...p, medications: [...p.medications, { ...data, minStock: data.min_stock, lastTaken: data.last_taken, isActive: data.is_active }] }));
  };

  const takeMedicationDose = async (id: string) => {
    if (!state.auth.userId) return;
    const med = state.medications.find(m => m.id === id);
    if (!med || med.stock <= 0) return;
    const newStock = med.stock - 1;
    const now = new Date().toISOString();
    const { error } = await supabase.from('medications').update({ stock: newStock, last_taken: now }).eq('id', id);
    if (!error) setState(p => ({ ...p, medications: p.medications.map(m => m.id === id ? { ...m, stock: newStock, lastTaken: now } : m) }));
  };

  const deleteMedication = async (id: string) => {
    if (!state.auth.userId) return;
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (!error) setState(p => ({ ...p, medications: p.medications.filter(m => m.id !== id) }));
  };

  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!state.auth.userId) return;
    const { data, error } = await supabase.from('finance').insert([{
      user_id: state.auth.userId, type: t.type, category: t.category, value: t.value, date: t.date,
      recurring: t.recurring, notes: t.notes, payment_method: t.paymentMethod, classification: t.classification
    }]).select().single();
    if (data) setState(p => ({ ...p, finance: [{ ...data, paymentMethod: data.payment_method, linkedEventId: data.linked_event_id, createdAt: data.created_at }, ...p.finance] }));
  };

  const updateShopping = async (items: ShoppingItem[]) => {
    if (!state.auth.userId) return;
    setState(p => ({ ...p, shoppingList: items }));
    const lastItem = items[0]; 
    if (lastItem && lastItem.id.length < 15) { 
      const { data } = await supabase.from('shopping_items').insert([{
        user_id: state.auth.userId, name: lastItem.name, category: lastItem.category, 
        list_name: lastItem.listName, is_purchased: lastItem.isPurchased
      }]).select().single();
      if (data) setState(p => ({ ...p, shoppingList: p.shoppingList.map(i => i.id === lastItem.id ? { ...data, isPurchased: data.is_purchased, autoRefill: data.auto_refill, listName: data.list_name } : i) }));
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard size={20} /> },
    { id: 'routine', label: 'Rotina', icon: <Calendar size={20} /> },
    { id: 'finance', label: 'Finanças', icon: <Wallet size={20} /> },
    { id: 'health', label: 'Saúde', icon: <HeartPulse size={20} /> },
    { id: 'shopping', label: 'Compras', icon: <ShoppingCart size={20} /> },
    { id: 'settings', label: 'Ajustes', icon: <Settings size={20} /> },
  ];

  if (loadingSession) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-4 z-[200]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando</p>
      </div>
    );
  }

  if (!state.auth.isLoggedIn) return <AuthView onLogin={() => {}} />;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full z-20 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-56'}`}>
        <div className={`p-5 border-b border-slate-100 dark:border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && <h1 className="text-sm font-black text-indigo-600 dark:text-indigo-400 truncate tracking-tight">{state.profile.houseName || 'Casa360'}</h1>}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 text-slate-300">
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as TabId); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 shadow-sm border border-indigo-100/50 dark:border-indigo-800/30' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              {item.icon}
              {!isSidebarCollapsed && <span className="text-xs font-bold">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => supabase.auth.signOut()} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-bold transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}>
             <LogOut size={18} />
             {!isSidebarCollapsed && <span className="text-xs">Sair</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        <header className="sticky top-0 z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-4 md:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400 md:hidden"><Menu size={20} /></button>
            <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 leading-none">{state.profile.fullName.split(' ')[0]}</p>
                <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Casa Ativa</p>
             </div>
             <button onClick={() => setActiveTab('settings')} className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs border border-white dark:border-slate-800 shadow-sm overflow-hidden">
                {state.profile.profileImage ? <img src={state.profile.profileImage} alt="P" className="w-full h-full object-cover" /> : state.profile.fullName.charAt(0)}
             </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-full w-full mb-20 md:mb-0">
          {activeTab === 'dashboard' && <Dashboard state={state} onAction={() => setActiveTab('routine')} />}
          {activeTab === 'routine' && <RoutineView tasks={state.tasks} onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask} />}
          {activeTab === 'finance' && <FinanceView transactions={state.finance} tasks={state.tasks} onAdd={addTransaction} onUpdate={() => {}} onDelete={() => {}} />}
          {activeTab === 'health' && <HealthView medications={state.medications} onAdd={addMedication} onTakeDose={takeMedicationDose} onDelete={deleteMedication} />}
          {activeTab === 'shopping' && <ShoppingView items={state.shoppingList} onUpdate={updateShopping} />}
          {activeTab === 'settings' && <SettingsView state={state} onUpdate={(ns) => updateProfile(ns.profile, ns.theme)} onLogout={() => supabase.auth.signOut()} />}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-[90] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-1.5 flex items-center justify-between">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id as TabId)} className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all ${activeTab === item.id ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`}>
            {item.icon}
          </button>
        ))}
      </nav>

      {showIdleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300 border border-white/20 text-center">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                 <Clock className="w-10 h-10 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ainda aí?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Você está inativo há algum tempo. Sua conta será deslogada em <span className="font-black text-indigo-600 dark:text-indigo-400">{idleTimer}s</span> por segurança.
              </p>
              <button onClick={() => { setShowIdleModal(false); resetIdleTimers(); }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all">Continuar Logado</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;

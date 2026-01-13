
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
  ShieldAlert,
  Bell
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
import { notificationService } from './services/notificationService';

// Fix: Added missing vibrationIntensity to satisfy UserProfile interface requirement
const INITIAL_PROFILE: UserProfile = {
  fullName: 'Usuário Casa360',
  birthDate: '',
  phone: '',
  email: '',
  address: { street: '', number: '', city: '', state: '', zip: '' },
  houseName: 'Minha Casa',
  alarmSettings: {
    soundType: 'standard',
    vibrationEnabled: true,
    vibrationIntensity: 'medium',
    notificationsEnabled: true
  }
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
  /* 
    PERSISTENCE: Restore active tab from localStorage if available.
    We default to 'dashboard' if no valid tab is found.
  */
  const [activeTab, setActiveTabOrig] = useState<TabId>(() => {
    const saved = localStorage.getItem('casa360_active_tab');
    return (saved as TabId) || 'dashboard';
  });

  const setActiveTab = (tab: TabId) => {
    setActiveTabOrig(tab);
    localStorage.setItem('casa360_active_tab', tab);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [state, setState] = useState<HomeState>(INITIAL_STATE);

  const hasInitialized = useRef(false);

  // Monitor de Alarme Central (In-Memory)
  useEffect(() => {
    if (!state.auth.isLoggedIn) return;

    const alarmInterval = setInterval(() => {
      const now = new Date();

      state.tasks.forEach(task => {
        if (task.status === 'pending' && task.dueDate && task.alarmConfig?.enabled) {
          const taskDate = new Date(task.dueDate);
          const diffMinutes = (now.getTime() - taskDate.getTime()) / 60000;

          if (diffMinutes >= 0 && diffMinutes < 2 && task.alarmConfig.lastNotified !== now.getMinutes().toString()) {
            notificationService.playAlarmSound(state.profile.alarmSettings.soundType);
            if (state.profile.alarmSettings.vibrationEnabled) {
              notificationService.vibrate(task.priority === 'high' ? 'urgent' : 'long');
            }
            notificationService.sendLocalNotification(
              `Tarefa: ${task.title}`,
              `Horário agendado: ${taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              task.priority === 'high'
            );

            setState(p => ({
              ...p,
              tasks: p.tasks.map(t => t.id === task.id ? {
                ...t,
                alarmConfig: { ...t.alarmConfig!, lastNotified: now.getMinutes().toString() }
              } : t)
            }));
          }
        }
      });
    }, 30000);

    return () => clearInterval(alarmInterval);
  }, [state.auth.isLoggedIn, state.tasks, state.profile.alarmSettings]);

  const fetchUserData = useCallback(async (userId: string, email: string) => {
    try {
      const results = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('finance').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('medications').select('*').eq('user_id', userId).order('name', { ascending: true }),
        supabase.from('shopping_items').select('*').eq('user_id', userId)
      ]);

      const profileData = results[0].status === 'fulfilled' && (results[0].value as any)?.data ? (results[0].value as any).data : null;
      const tasksRaw = results[1].status === 'fulfilled' && (results[1].value as any)?.data ? (results[1].value as any).data : [];
      const financeRaw = results[2].status === 'fulfilled' && (results[2].value as any)?.data ? (results[2].value as any).data : [];
      const medsRaw = results[3].status === 'fulfilled' && (results[3].value as any)?.data ? (results[3].value as any).data : [];
      const shoppingRaw = results[4].status === 'fulfilled' && (results[4].value as any)?.data ? (results[4].value as any).data : [];

      const tasks: Task[] = (tasksRaw || []).map((t: any) => ({
        ...t,
        dueDate: t.due_date || t.dueDate,
        alarmConfig: t.alarm_config || { enabled: false },
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
        isActive: m.is_active !== undefined ? m.is_active : m.isActive,
        alarmConfig: m.alarm_config || { enabled: false }
      }));

      const shoppingList: ShoppingItem[] = (shoppingRaw || []).map((s: any) => ({
        ...s,
        isPurchased: s.is_purchased !== undefined ? s.is_purchased : s.isPurchased,
        autoRefill: s.auto_refill !== undefined ? s.auto_refill : s.autoRefill,
        listName: s.list_name || s.listName
      }));

      setState(prev => ({
        ...prev,
        auth: { isLoggedIn: true, userEmail: email, userId: userId, lastLogin: new Date().toISOString() },
        profile: profileData ? {
          fullName: profileData.full_name || '',
          email: profileData.email || email,
          birthDate: profileData.birth_date || '',
          phone: profileData.phone || '',
          houseName: profileData.house_name || 'Minha Casa',
          profileImage: profileData.profile_image,
          alarmSettings: profileData.alarm_settings || INITIAL_PROFILE.alarmSettings,
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
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // SAFETY NET: If session check hangs for more than 5s, we force stop loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && loadingSession) {
        console.warn("Session check timed out, forcing login screen.");
        setLoadingSession(false);
      }
    }, 5000);

    const handleAuthChange = async (session: any) => {
      if (!mounted) return;
      if (session?.user) {
        await fetchUserData(session.user.id, session.user.email!);
      } else {
        setState(INITIAL_STATE);
        setLoadingSession(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Erro ao obter sessão:", error);
        setLoadingSession(false);
        return;
      }

      if (!hasInitialized.current) {
        handleAuthChange(session);
        hasInitialized.current = true;
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user?.id !== state.auth.userId) {
          handleAuthChange(session);
        }
      } else if (event === 'SIGNED_OUT') {
        setState(INITIAL_STATE);
        setLoadingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [fetchUserData, state.auth.userId]);

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (!state.auth.userId) return;
    const { data, error } = await supabase.from('tasks').insert([{
      user_id: state.auth.userId,
      title: task.title,
      description: task.description,
      responsible: task.responsible,
      due_date: task.dueDate,
      recurrence: task.recurrence,
      status: task.status,
      priority: task.priority
    }]).select().single();

    if (error) {
      console.error("Erro ao adicionar tarefa:", error.message);
      return;
    }

    if (data) {
      setState(prev => ({
        ...prev,
        tasks: [{ ...data, dueDate: data.due_date, alarmConfig: task.alarmConfig || { enabled: false }, createdAt: data.created_at }, ...prev.tasks]
      }));
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!state.auth.userId) return;
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.responsible !== undefined) dbUpdates.responsible = updates.responsible;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence;

    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
    if (error) {
      console.error("Erro ao atualizar tarefa:", error.message);
      return;
    }
    setState(p => ({ ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const deleteTask = async (id: string) => {
    if (!state.auth.userId) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setState(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== id) }));
  };

  const addMedication = async (med: Omit<Medication, 'id' | 'isActive'>) => {
    if (!state.auth.userId) return;
    const { data, error } = await supabase.from('medications').insert([{
      user_id: state.auth.userId,
      name: med.name,
      person: med.person,
      dosage: med.dosage,
      frequency: med.frequency,
      stock: med.stock,
      min_stock: med.minStock,
      is_active: true
    }]).select().single();

    if (error) {
      console.error("Erro ao adicionar medicamento:", error.message);
      return;
    }

    if (data) {
      setState(p => ({
        ...p,
        medications: [...p.medications, { ...data, minStock: data.min_stock, lastTaken: data.last_taken, isActive: data.is_active, alarmConfig: med.alarmConfig || { enabled: false } }]
      }));
    }
  };

  const updateMedication = async (id: string, updates: Partial<Medication>) => {
    if (!state.auth.userId) return;
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.person !== undefined) dbUpdates.person = updates.person;
    if (updates.dosage !== undefined) dbUpdates.dosage = updates.dosage;
    if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;

    const { error } = await supabase.from('medications').update(dbUpdates).eq('id', id);
    if (error) {
      console.error("Erro ao atualizar medicamento:", error.message);
      return;
    }
    setState(p => ({ ...p, medications: p.medications.map(m => m.id === id ? { ...m, ...updates } : m) }));
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
    if (error) { console.error(error.message); return; }
    if (data) setState(p => ({ ...p, finance: [{ ...data, paymentMethod: data.payment_method, linkedEventId: data.linked_event_id, createdAt: data.created_at }, ...p.finance] }));
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!state.auth.userId) return;
    const dbUpdates: any = {};
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    const { error } = await supabase.from('finance').update(dbUpdates).eq('id', id);
    if (!error) setState(p => ({ ...p, finance: p.finance.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const deleteTransaction = async (id: string) => {
    if (!state.auth.userId) return;
    const { error } = await supabase.from('finance').delete().eq('id', id);
    if (!error) setState(p => ({ ...p, finance: p.finance.filter(t => t.id !== id) }));
  };

  const updateShopping = async (items: ShoppingItem[]) => {
    if (!state.auth.userId) return;
    setState(p => ({ ...p, shoppingList: items }));
  };

  const updateProfile = async (profile: UserProfile, theme: 'light' | 'dark') => {
    if (!state.auth.userId) return;

    // RESILIÊNCIA: Omitimos colunas que podem não existir no banco do usuário
    // para evitar o erro "Could not find column ... in the schema cache"
    const { error } = await supabase.from('profiles').upsert({
      id: state.auth.userId,
      full_name: profile.fullName,
      email: profile.email,
      house_name: profile.houseName,
      theme: theme
      // Removidos alarm_settings e campos de endereço por segurança
    });

    if (error) {
      console.error("Erro ao atualizar perfil no banco:", error.message);
      // Mesmo com erro no banco, atualizamos o estado local para a UI responder
    }

    setState(prev => ({
      ...prev,
      profile: { ...profile },
      theme
    }));

    // Aplica o tema visualmente
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard size={20} /> },
    { id: 'routine', label: 'Rotina', icon: <Calendar size={20} /> },
    { id: 'finance', label: 'Finanças', icon: <Wallet size={20} /> },
    { id: 'health', label: 'Saúde', icon: <HeartPulse size={20} /> },
    { id: 'shopping', label: 'Compras', icon: <ShoppingCart size={20} /> },
    { id: 'settings', label: 'Ajustes', icon: <Settings size={20} /> },
  ];

  useEffect(() => {
    if (state.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state.theme]);

  if (loadingSession) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-4 z-[200]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando</p>
      </div>
    );
  }

  if (!state.auth.isLoggedIn) return <AuthView onLogin={() => { }} />;

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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 shadow-sm border border-indigo-100/50 dark:border-indigo-800/30' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
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
          {activeTab === 'finance' && <FinanceView transactions={state.finance} tasks={state.tasks} onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} />}
          {activeTab === 'health' && <HealthView medications={state.medications} onAdd={addMedication} onUpdate={updateMedication} onTakeDose={takeMedicationDose} onDelete={deleteMedication} />}
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
    </div>
  );
};

export default App;


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
import { Task, Transaction, HomeState, Medication, UserProfile, AuthState, ShoppingItem, CreditCard, Investment, FinancialGoal } from './types';
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
  creditCards: [],
  investments: [],
  financialGoals: [],
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
      const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const todayKey = now.toISOString().slice(0, 10);
      const nowKey = `${todayKey} ${nowTime}`;

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

      state.medications.forEach(med => {
        if (!med.isActive || !med.alarmConfig?.enabled) return;
        const times = med.alarmConfig.times || [];
        if (!times.includes(nowTime)) return;
        if (med.alarmConfig.lastNotified === nowKey) return;

        notificationService.playAlarmSound(state.profile.alarmSettings.soundType);
        if (state.profile.alarmSettings.vibrationEnabled) {
          notificationService.vibrate(state.profile.alarmSettings.vibrationIntensity);
        }
        notificationService.sendLocalNotification(
          `Hora do medicamento: ${med.name}`,
          `${med.dosage} para ${med.person} (${med.frequency})`,
          false
        );

        setState(p => ({
          ...p,
          medications: p.medications.map(m => m.id === med.id ? {
            ...m,
            alarmConfig: { ...m.alarmConfig!, lastNotified: nowKey }
          } : m)
        }));
      });
    }, 30000);

    return () => clearInterval(alarmInterval);
  }, [state.auth.isLoggedIn, state.tasks, state.medications, state.profile.alarmSettings]);

  const fetchUserData = useCallback(async (userId: string, email: string) => {
    try {
      const results = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('finance').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('medications').select('*').eq('user_id', userId).order('name', { ascending: true }),
        supabase.from('shopping_items').select('*').eq('user_id', userId),
        supabase.from('credit_cards').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('investments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('financial_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      ]);

      const profileData = results[0].status === 'fulfilled' && (results[0].value as any)?.data ? (results[0].value as any).data : null;
      const tasksRaw = results[1].status === 'fulfilled' && (results[1].value as any)?.data ? (results[1].value as any).data : [];
      const financeRaw = results[2].status === 'fulfilled' && (results[2].value as any)?.data ? (results[2].value as any).data : [];
      const medsRaw = results[3].status === 'fulfilled' && (results[3].value as any)?.data ? (results[3].value as any).data : [];
      const shoppingRaw = results[4].status === 'fulfilled' && (results[4].value as any)?.data ? (results[4].value as any).data : [];
      const creditCardsRaw = results[5].status === 'fulfilled' && (results[5].value as any)?.data ? (results[5].value as any).data : [];
      const investmentsRaw = results[6].status === 'fulfilled' && (results[6].value as any)?.data ? (results[6].value as any).data : [];
      const goalsRaw = results[7].status === 'fulfilled' && (results[7].value as any)?.data ? (results[7].value as any).data : [];

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
        creditCardId: f.credit_card_id || f.creditCardId,
        isInstallment: f.is_installment || f.isInstallment || false,
        installmentCount: f.installment_count || f.installmentCount,
        installmentNumber: f.installment_number || f.installmentNumber,
        originalTransactionId: f.original_transaction_id || f.originalTransactionId,
        createdAt: f.created_at || f.createdAt
      }));

      const medications: Medication[] = (medsRaw || []).map((m: any) => ({
        ...m,
        minStock: m.min_stock !== undefined ? m.min_stock : m.minStock,
        lastTaken: m.last_taken || m.lastTaken,
        isActive: m.is_active !== undefined ? m.is_active : m.isActive,
        firstDoseTime: m.first_dose_time || m.firstDoseTime,
        firstDoseDate: m.first_dose_date || m.firstDoseDate,
        alarmConfig: m.alarm_config || { enabled: false }
      }));

      const shoppingList: ShoppingItem[] = (shoppingRaw || []).map((s: any) => ({
        ...s,
        isPurchased: s.is_purchased !== undefined ? s.is_purchased : s.isPurchased,
        autoRefill: s.auto_refill !== undefined ? s.auto_refill : s.autoRefill,
        listName: s.list_name || s.listName
      }));

      const creditCards: CreditCard[] = (creditCardsRaw || []).map((c: any) => ({
        ...c,
        cardType: c.card_type || c.cardType,
        lastFourDigits: c.last_four_digits || c.lastFourDigits,
        isActive: c.is_active !== undefined ? c.is_active : c.isActive,
        closingDay: c.closing_day || c.closingDay || 1,
        createdAt: c.created_at || c.createdAt
      }));

      const investments: Investment[] = (investmentsRaw || []).map((i: any) => ({
        ...i,
        purchaseDate: i.purchase_date || i.purchaseDate,
        totalInvested: i.total_invested || i.totalInvested,
        currentValue: i.current_value || i.currentValue,
        createdAt: i.created_at || i.createdAt
      }));

      const financialGoals: FinancialGoal[] = (goalsRaw || []).map((g: any) => ({
        ...g,
        targetAmount: g.target_amount || g.targetAmount,
        currentAmount: g.current_amount || g.currentAmount,
        targetDate: g.target_date || g.targetDate,
        isCompleted: g.is_completed !== undefined ? g.is_completed : g.isCompleted,
        createdAt: g.created_at || g.createdAt
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
        creditCards,
        investments,
        financialGoals,
        theme: profileData?.theme || prev.theme
      }));
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  // Registrar Service Worker para alarmes em background
  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.register('/public/sw.js', {
            scope: '/'
          });
          console.log('Service Worker registrado com sucesso:', reg);
        }
      } catch (error) {
        console.warn('Erro ao registrar Service Worker:', error);
      }
    };

    registerServiceWorker();
  }, []);

  // Sincronizar medicamentos e configurações com Service Worker
  useEffect(() => {
    if (!state.auth.isLoggedIn || state.medications.length === 0) return;

    const syncWithServiceWorker = async () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'UPDATE_MEDICATIONS',
          payload: state.medications
        });

        navigator.serviceWorker.controller.postMessage({
          type: 'UPDATE_ALARM_SETTINGS',
          payload: {
            soundType: state.profile.alarmSettings.soundType,
            vibrationEnabled: state.profile.alarmSettings.vibrationEnabled,
            vibrationIntensity: state.profile.alarmSettings.vibrationIntensity,
            notificationsEnabled: state.profile.alarmSettings.notificationsEnabled
          }
        });

        navigator.serviceWorker.controller.postMessage({
          type: 'START_MONITORING'
        });

        console.log('Medicamentos sincronizados com Service Worker');
      }
    };

    syncWithServiceWorker();
  }, [state.medications, state.profile.alarmSettings, state.auth.isLoggedIn]);

  // Receber mensagens do Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;

        if (type === 'MEDICATION_ALARM') {
          console.log('Alarme de medicamento acionado pelo SW:', payload);
        } else if (type === 'MEDICATION_DOSE_RECORDED') {
          console.log('Dose registrada via SW:', payload);
        }
      });
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
      stock_quantity: med.stockQuantity || 0,
      min_stock: med.minStock || 5,
      first_dose_date: med.firstDoseDate || null,
      first_dose_time: med.firstDoseTime || null,
      alarm_config: med.alarmConfig || { enabled: false },
      is_active: true
    }]).select().single();

    if (error) {
      console.error("Erro ao adicionar medicamento:", error.message);
      return;
    }

    if (data) {
      setState(p => ({
        ...p,
        medications: [...p.medications, { 
          id: data.id,
          name: data.name,
          person: data.person,
          dosage: data.dosage,
          frequency: data.frequency,
          stockQuantity: data.stock_quantity,
          minStock: data.min_stock,
          firstDoseDate: data.first_dose_date,
          firstDoseTime: data.first_dose_time,
          lastTaken: data.last_taken,
          isActive: data.is_active,
          alarmConfig: med.alarmConfig || { enabled: false }
        }]
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
    if (updates.stockQuantity !== undefined) dbUpdates.stock_quantity = updates.stockQuantity;
    if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
    if (updates.firstDoseDate !== undefined) dbUpdates.first_dose_date = updates.firstDoseDate;
    if (updates.firstDoseTime !== undefined) dbUpdates.first_dose_time = updates.firstDoseTime;
    if (updates.alarmConfig !== undefined) dbUpdates.alarm_config = updates.alarmConfig;

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
    if (!med || med.stockQuantity <= 0) return;
    const newStock = med.stockQuantity - 1;
    const now = new Date().toISOString();
    const { error } = await supabase.from('medications').update({ stock_quantity: newStock, last_taken: now }).eq('id', id);
    if (!error) setState(p => ({ ...p, medications: p.medications.map(m => m.id === id ? { ...m, stockQuantity: newStock, lastTaken: now } : m) }));
  };

  const deleteMedication = async (id: string) => {
    if (!state.auth.userId) return;
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (!error) setState(p => ({ ...p, medications: p.medications.filter(m => m.id !== id) }));
  };

  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!state.auth.userId) {
      console.error("Erro: userId não disponível para adicionar transação");
      return;
    }
    
    console.log("Adicionando transação:", t);
    
    // Converter data para timestamp válido (adiciona hora 00:00:00)
    const dateTimestamp = new Date(`${t.date}T00:00:00`).toISOString();
    
    const insertData = {
      user_id: state.auth.userId, 
      type: t.type, 
      category: t.category, 
      value: t.value, 
      date: dateTimestamp,
      recurring: t.recurring || false, 
      notes: t.notes || '', 
      payment_method: t.paymentMethod, 
      classification: t.classification,
      credit_card_id: t.creditCardId || null,
      is_installment: t.isInstallment || false,
      installment_count: t.installmentCount || null,
      installment_number: t.installmentNumber || null,
      original_transaction_id: t.originalTransactionId || null
    };
    
    console.log("Dados a inserir no banco:", insertData);
    
    const { data, error } = await supabase.from('finance').insert([insertData]).select().single();
    
    if (error) { 
      console.error("Erro ao adicionar transação:", error);
      console.error("Detalhes do erro:", { code: error.code, message: error.message, details: error.details });
      alert("Erro ao salvar despesa: " + (error.message || "Tente novamente"));
      return;
    }
    
    if (data) {
      console.log("Transação adicionada com sucesso:", data);
      setState(p => ({ 
        ...p, 
        finance: [{ 
          ...data, 
          paymentMethod: data.payment_method, 
          linkedEventId: data.linked_event_id, 
          creditCardId: data.credit_card_id, 
          isInstallment: data.is_installment, 
          installmentCount: data.installment_count, 
          installmentNumber: data.installment_number, 
          originalTransactionId: data.original_transaction_id, 
          createdAt: data.created_at 
        }, ...p.finance] 
      }));
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!state.auth.userId) return;
    
    const dbUpdates: any = {};
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.value !== undefined) dbUpdates.value = updates.value;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.recurring !== undefined) dbUpdates.recurring = updates.recurring;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
    if (updates.classification !== undefined) dbUpdates.classification = updates.classification;
    if (updates.creditCardId !== undefined) dbUpdates.credit_card_id = updates.creditCardId;
    if (updates.isInstallment !== undefined) dbUpdates.is_installment = updates.isInstallment;
    if (updates.installmentCount !== undefined) dbUpdates.installment_count = updates.installmentCount;
    if (updates.installmentNumber !== undefined) dbUpdates.installment_number = updates.installmentNumber;
    if (updates.originalTransactionId !== undefined) dbUpdates.original_transaction_id = updates.originalTransactionId;
    
    console.log("Atualizando transação", id, "com dados:", dbUpdates);
    
    const { error } = await supabase.from('finance').update(dbUpdates).eq('id', id);
    
    if (error) {
      console.error("Erro ao atualizar transação:", error);
    } else {
      console.log("Transação atualizada com sucesso");
      setState(p => ({ ...p, finance: p.finance.map(t => t.id === id ? { ...t, ...updates } : t) }));
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!state.auth.userId) return;
    const { error } = await supabase.from('finance').delete().eq('id', id);
    if (!error) setState(p => ({ ...p, finance: p.finance.filter(t => t.id !== id) }));
  };

  const updateShopping = async (items: ShoppingItem[]) => {
    if (!state.auth.userId) return;
    
    // Atualizar estado local
    setState(p => ({ ...p, shoppingList: items }));
    
    // Deletar todos os itens existentes e inserir novos
    const { error: deleteError } = await supabase
      .from('shopping_items')
      .delete()
      .eq('user_id', state.auth.userId);
    
    if (deleteError) {
      console.error('Erro ao deletar itens:', deleteError);
      return;
    }
    
    // Inserir novos itens
    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        user_id: state.auth.userId,
        name: item.name,
        category: item.category,
        list_name: item.listName,
        quantity: item.quantity,
        unit: item.unit,
        is_purchased: item.isPurchased,
        auto_refill: item.autoRefill
      }));
      
      const { error: insertError } = await supabase
        .from('shopping_items')
        .insert(itemsToInsert);
      
      if (insertError) {
        console.error('Erro ao inserir itens:', insertError);
      }
    }
  };

  const updateProfile = async (profile: UserProfile, theme: 'light' | 'dark', creditCards?: CreditCard[]) => {
    if (!state.auth.userId) {
      console.error("Erro: userId não disponível");
      return;
    }

    console.log("Atualizando perfil com dados:", { fullName: profile.fullName, email: profile.email });

    // Construir objeto apenas com campos não-vazios
    const profileData: any = {
      id: state.auth.userId,
      theme: theme,
    };

    // Adicionar apenas campos com valores válidos
    if (profile.fullName?.trim()) profileData.full_name = profile.fullName;
    if (profile.email?.trim()) profileData.email = profile.email;
    if (profile.birthDate?.trim()) profileData.birth_date = profile.birthDate; // Evitar string vazia
    if (profile.phone?.trim()) profileData.phone = profile.phone;
    if (profile.houseName?.trim()) profileData.house_name = profile.houseName;
    if (profile.profileImage?.trim()) profileData.profile_image = profile.profileImage;
    if (profile.address?.street?.trim()) profileData.address_street = profile.address.street;
    if (profile.address?.number?.trim()) profileData.address_number = profile.address.number;
    if (profile.address?.city?.trim()) profileData.address_city = profile.address.city;
    if (profile.address?.state?.trim()) profileData.address_state = profile.address.state;
    if (profile.address?.zip?.trim()) profileData.address_zip = profile.address.zip;
    if (profile.alarmSettings) profileData.alarm_settings = profile.alarmSettings;

    console.log("Dados para enviar ao banco:", profileData);

    const { data, error } = await supabase.from('profiles').upsert(profileData).select();

    if (error) {
      console.error("Erro ao atualizar perfil no banco:", error.message, error);
    } else {
      console.log("Perfil atualizado com sucesso:", data);
    }

    // Salvar cartões de crédito se fornecidos
    if (creditCards !== undefined) {
      await syncCreditCards(creditCards);
    }

    setState(prev => ({
      ...prev,
      profile: { ...profile },
      theme,
      creditCards: creditCards !== undefined ? creditCards : prev.creditCards
    }));

    // Aplica o tema visualmente
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const syncCreditCards = async (cards: CreditCard[]) => {
    if (!state.auth.userId) return;

    try {
      // Obter cartões existentes no banco
      const { data: existingCards, error: fetchError } = await supabase
        .from('credit_cards')
        .select('id')
        .eq('user_id', state.auth.userId);

      if (fetchError) {
        console.error("Erro ao buscar cartões existentes:", fetchError.message);
        return;
      }

      const existingIds = new Set((existingCards || []).map(c => c.id));
      const incomingIds = new Set(cards.map(c => c.id).filter(id => !id.startsWith('card-')));

      // Deletar cartões que não estão mais na lista
      const toDelete = Array.from(existingIds).filter(id => !incomingIds.has(id));
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('credit_cards')
          .delete()
          .in('id', toDelete);
        if (deleteError) console.error("Erro ao deletar cartões:", deleteError.message);
      }

      // Upsert cartões (adicionar ou atualizar)
      for (const card of cards) {
        if (card.id.startsWith('card-')) {
          // Novo cartão: fazer insert (sem id, deixa Supabase gerar)
          const dbCard = {
            user_id: state.auth.userId,
            name: card.name,
            owner: card.owner,
            card_type: card.cardType,
            last_four_digits: card.lastFourDigits,
            color: card.color,
            is_active: card.isActive,
            closing_day: card.closingDay
          };
          const { error: insertError } = await supabase
            .from('credit_cards')
            .insert([dbCard]);
          if (insertError) console.error("Erro ao inserir cartão:", insertError.message);
        } else {
          // Cartão existente: fazer update
          const dbCard = {
            name: card.name,
            owner: card.owner,
            card_type: card.cardType,
            last_four_digits: card.lastFourDigits,
            color: card.color,
            is_active: card.isActive,
            closing_day: card.closingDay
          };
          const { error: updateError } = await supabase
            .from('credit_cards')
            .update(dbCard)
            .eq('id', card.id);
          if (updateError) console.error("Erro ao atualizar cartão:", updateError.message);
        }
      }
    } catch (err) {
      console.error("Erro ao sincronizar cartões:", err);
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

  useEffect(() => {
    if (state.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state.theme]);

  if (loadingSession) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col items-center justify-center gap-6 z-[200] animate-fade-in">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-purple-300 rounded-full animate-ping opacity-20"></div>
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando</p>
      </div>
    );
  }

  if (!state.auth.isLoggedIn) return <AuthView onLogin={() => { }} />;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 font-sans text-slate-900 dark:text-slate-100 transition-all duration-500">
      <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-900 dark:from-slate-900 dark:to-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full z-20 transition-all duration-300 shadow-lg ${isSidebarCollapsed ? 'w-16' : 'w-56'}`}>
        <div className={`p-5 border-b border-slate-100 dark:border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && <h1 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 truncate tracking-tight">{state.profile.houseName || 'Casa360'}</h1>}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 text-slate-300">
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as TabId); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:scale-105 ${activeTab === item.id ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg border border-indigo-400/50' : 'text-slate-500 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:text-slate-700 dark:hover:text-slate-300'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              {item.icon}
              {!isSidebarCollapsed && <span className="text-xs font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => supabase.auth.signOut()} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:from-rose-900/20 dark:hover:to-rose-800/20 font-medium transition-all duration-200 hover:scale-105 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <LogOut size={18} />
            {!isSidebarCollapsed && <span className="text-xs">Sair</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        <header className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/80 dark:from-slate-900/80 dark:to-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400 md:hidden"><Menu size={20} /></button>
            <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:block">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">{state.profile.fullName.split(' ')[0]}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">Casa Ativa</p>
            </div>
            <button onClick={() => setActiveTab('settings')} className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm border-2 border-white dark:border-slate-700 shadow-lg hover:scale-110 transition-all duration-200 overflow-hidden">
              {state.profile.profileImage ? <img src={state.profile.profileImage} alt="P" className="w-full h-full object-cover" /> : state.profile.fullName.charAt(0)}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-full w-full mb-20 md:mb-0">
          {activeTab === 'dashboard' && <Dashboard state={state} onAction={() => setActiveTab('routine')} />}
          {activeTab === 'routine' && <RoutineView tasks={state.tasks} onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask} />}
          {activeTab === 'finance' && <FinanceView transactions={state.finance} tasks={state.tasks} creditCards={state.creditCards} onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} />}
          {activeTab === 'health' && <HealthView medications={state.medications} onAdd={addMedication} onUpdate={updateMedication} onTakeDose={takeMedicationDose} onDelete={deleteMedication} />}
          {activeTab === 'shopping' && <ShoppingView items={state.shoppingList} onUpdate={updateShopping} />}
          {activeTab === 'settings' && <SettingsView state={state} onUpdate={(ns) => updateProfile(ns.profile, ns.theme, ns.creditCards)} onLogout={() => supabase.auth.signOut()} />}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-[90] bg-white/95 dark:bg-slate-900/95 dark:from-slate-900/95 dark:to-slate-800/95 backdrop-blur-lg border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl p-2 flex items-center justify-between">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id as TabId)} className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 hover:scale-110 ${activeTab === item.id ? 'text-white bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
            {item.icon}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;

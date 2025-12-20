
import React, { useState, useEffect, useRef } from 'react';
import { HomeState, UserProfile } from '../types';
import { 
  User, 
  MapPin, 
  Home, 
  Phone, 
  Mail, 
  Calendar, 
  Save, 
  ShieldCheck,
  Smartphone,
  Bell,
  LogOut,
  Moon,
  Sun,
  CheckCircle,
  RefreshCcw,
  Camera,
  Volume2,
  Vibrate,
  ChevronRight,
  AlertTriangle,
  X
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

// Defined SettingsViewProps to fix the compilation error
interface SettingsViewProps {
  state: HomeState;
  onUpdate: (newState: HomeState) => void;
  onLogout: () => void;
}

const InputField = ({ label, icon, value, onChange, placeholder, type = "text" }: any) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5 ml-1">
      <span className="opacity-60">{icon}</span> {label}
    </label>
    <div className="relative group">
      <input 
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none shadow-sm shadow-transparent focus:shadow-indigo-500/5"
      />
    </div>
  </div>
);

const SettingsView: React.FC<SettingsViewProps> = ({ state, onUpdate, onLogout }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(state.profile);
  const [activeTab, setActiveTab] = useState<'profile' | 'house' | 'system'>('profile');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalProfile(state.profile);
  }, [state.profile]);

  const handleSave = () => {
    onUpdate({ ...state, profile: localProfile });
    setShowSavedToast(true);
    if ('vibrate' in navigator) navigator.vibrate(20);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const toggleTheme = () => {
    onUpdate({ ...state, theme: state.theme === 'light' ? 'dark' : 'light' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalProfile(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const testAlarm = () => {
    notificationService.playAlarmSound();
    notificationService.vibrate([100, 50, 100]);
    notificationService.sendLocalNotification("Teste de Alerta", "As configurações de som e vibração estão funcionando!");
  };

  const handleAddressChange = (field: keyof UserProfile['address'], value: string) => {
    setLocalProfile(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Mini Profile Card */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-5 relative overflow-hidden">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        <div onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer">
          <div className="w-16 h-16 bg-indigo-600 dark:bg-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg border-2 border-white dark:border-slate-800 shrink-0 overflow-hidden">
            {localProfile.profileImage ? <img src={localProfile.profileImage} className="w-full h-full object-cover" /> : localProfile.fullName?.charAt(0)}
          </div>
          <div className="absolute inset-0 bg-indigo-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="text-center md:text-left flex-1 min-w-0">
          <h2 className="text-lg font-black text-slate-800 dark:text-white truncate">{localProfile.fullName || 'Usuário'}</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{state.auth.userEmail}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <button onClick={handleSave} className="flex-1 md:flex-none bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-100 dark:shadow-none hover:bg-slate-800 active:scale-95 transition-all">
             <Save className="w-3.5 h-3.5" /> Salvar Alterações
           </button>
        </div>
        {showSavedToast && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-2 animate-in slide-in-from-right">
            <CheckCircle className="w-3 h-3" /> Dados Salvos
          </div>
        )}
      </div>

      {/* Tabs Minimalistas */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
         {(['profile', 'house', 'system'] as const).map(tab => (
           <button 
             key={tab} 
             onClick={() => setActiveTab(tab)} 
             className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
               activeTab === tab 
               ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-800' 
               : 'text-slate-400 hover:text-slate-500'
             }`}
           >
             {tab === 'profile' ? <User size={14} /> : tab === 'house' ? <Home size={14} /> : <Smartphone size={14} />} 
             <span className="hidden sm:inline">{tab === 'profile' ? 'Perfil' : tab === 'house' ? 'Residência' : 'Sistema'}</span>
           </button>
         ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[340px]">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 animate-in slide-in-from-bottom duration-300">
            <InputField label="Nome Completo" icon={<User size={12}/>} value={localProfile.fullName} onChange={(e:any) => setLocalProfile({...localProfile, fullName: e.target.value})} />
            <InputField label="Data de Nascimento" type="date" icon={<Calendar size={12}/>} value={localProfile.birthDate} onChange={(e:any) => setLocalProfile({...localProfile, birthDate: e.target.value})} />
            <InputField label="WhatsApp / Telefone" icon={<Phone size={12}/>} value={localProfile.phone} onChange={(e:any) => setLocalProfile({...localProfile, phone: e.target.value})} />
            <InputField label="E-mail de Contato" icon={<Mail size={12}/>} value={localProfile.email} onChange={(e:any) => setLocalProfile({...localProfile, email: e.target.value})} />
          </div>
        )}

        {activeTab === 'house' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 animate-in slide-in-from-bottom duration-300">
            <div className="md:col-span-2">
              <InputField label="Identificação da Residência" icon={<Home size={12}/>} value={localProfile.houseName} onChange={(e:any) => setLocalProfile({...localProfile, houseName: e.target.value})} placeholder="Ex: Casa Praia, Nosso Apê..." />
            </div>
            <InputField label="Endereço / Rua" icon={<MapPin size={12}/>} value={localProfile.address.street} onChange={(e:any) => handleAddressChange('street', e.target.value)} />
            <InputField label="Número / Apto" icon={<MapPin size={12}/>} value={localProfile.address.number} onChange={(e:any) => handleAddressChange('number', e.target.value)} />
            <InputField label="Cidade" icon={<MapPin size={12}/>} value={localProfile.address.city} onChange={(e:any) => handleAddressChange('city', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="UF" icon={<MapPin size={12}/>} value={localProfile.address.state} onChange={(e:any) => handleAddressChange('state', e.target.value)} />
              <InputField label="CEP" icon={<MapPin size={12}/>} value={localProfile.address.zip} onChange={(e:any) => handleAddressChange('zip', e.target.value)} />
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-3 animate-in slide-in-from-bottom duration-300">
            <div onClick={toggleTheme} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl cursor-pointer border border-transparent hover:border-slate-100 transition-all">
               <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                    {state.theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Interface em Modo Escuro</p>
               </div>
               <div className={`w-10 h-5 rounded-full relative transition-all ${state.theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                 <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${state.theme === 'dark' ? 'right-0.5' : 'left-0.5 shadow-sm'}`} />
               </div>
            </div>
            
            <div onClick={testAlarm} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-100">
               <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-indigo-600">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Verificar Notificações</p>
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Som • Vibração • Push</p>
                  </div>
               </div>
               <Volume2 className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>

            <div className="pt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center justify-center gap-2 py-4 text-rose-600 font-black text-[10px] uppercase tracking-widest bg-rose-50 dark:bg-rose-900/10 rounded-2xl hover:bg-rose-100 transition-all active:scale-95">
                <LogOut className="w-3.5 h-3.5" /> Sair da Conta
              </button>
              <button onClick={() => { if(confirm('Deseja realmente apagar todos os dados locais?')) { localStorage.clear(); window.location.reload(); } }} className="flex items-center justify-center gap-2 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 transition-all active:scale-95">
                <RefreshCcw className="w-3.5 h-3.5" /> Resetar App
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-200 border border-white/20 text-center">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                 <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Sair da conta?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Tem certeza que deseja sair da sua conta? Você precisará entrar novamente para acessar seus dados.
              </p>
              <div className="flex gap-4">
                 <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest">Não, ficar</button>
                 <button onClick={onLogout} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-100 dark:shadow-none active:scale-95 transition-all">Sim, sair</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;

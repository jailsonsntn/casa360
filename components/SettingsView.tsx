
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
  Vibrate
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface SettingsViewProps {
  state: HomeState;
  onUpdate: (newState: HomeState) => void;
  onLogout: () => void;
}

const InputField = ({ label, icon, value, onChange, placeholder, type = "text" }: any) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
      {icon} {label}
    </label>
    <input 
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
    />
  </div>
);

const SettingsView: React.FC<SettingsViewProps> = ({ state, onUpdate, onLogout }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(state.profile);
  const [activeTab, setActiveTab] = useState<'profile' | 'house' | 'system'>('profile');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalProfile(state.profile);
  }, [state.profile]);

  const handleSave = () => {
    onUpdate({ ...state, profile: localProfile });
    setShowSavedToast(true);
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
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        <div onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer">
          <div className="w-20 h-20 bg-indigo-600 dark:bg-indigo-500 rounded-[1.8rem] flex items-center justify-center text-white text-2xl font-black shadow-lg border-4 border-indigo-50 dark:border-slate-800 shrink-0 overflow-hidden">
            {localProfile.profileImage ? <img src={localProfile.profileImage} className="w-full h-full object-cover" /> : localProfile.fullName?.charAt(0)}
          </div>
          <div className="absolute inset-0 bg-indigo-900/40 rounded-[1.8rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera className="w-6 h-6 text-white" /></div>
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">{localProfile.fullName || 'Usuário'}</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Conta: <span className="text-indigo-600 dark:text-indigo-400 font-black">{state.auth.userEmail}</span></p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleSave} className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs flex items-center gap-3 shadow-xl active:scale-95"><Save className="w-4 h-4" /> Salvar</button>
        </div>
        {showSavedToast && <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 animate-in slide-in-from-right"><CheckCircle className="w-4 h-4" /> Atualizado</div>}
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
         {(['profile', 'house', 'system'] as const).map(tab => (
           <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>
             {tab === 'profile' ? <User className="w-4 h-4" /> : tab === 'house' ? <Home className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />} {tab === 'profile' ? 'Perfil' : tab === 'house' ? 'Residência' : 'Sistema'}
           </button>
         ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm min-h-[300px]">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-bottom">
            <InputField label="Nome Completo" icon={<User className="w-3 h-3"/>} value={localProfile.fullName} onChange={(e:any) => setLocalProfile({...localProfile, fullName: e.target.value})} />
            <InputField label="Nascimento" type="date" icon={<Calendar className="w-3 h-3"/>} value={localProfile.birthDate} onChange={(e:any) => setLocalProfile({...localProfile, birthDate: e.target.value})} />
            <InputField label="Telefone" icon={<Phone className="w-3 h-3"/>} value={localProfile.phone} onChange={(e:any) => setLocalProfile({...localProfile, phone: e.target.value})} />
            <InputField label="E-mail Pessoal" icon={<Mail className="w-3 h-3"/>} value={localProfile.email} onChange={(e:any) => setLocalProfile({...localProfile, email: e.target.value})} />
          </div>
        )}

        {activeTab === 'house' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-bottom">
            <div className="md:col-span-2">
              <InputField label="Nome da Casa / Residência" icon={<Home className="w-3 h-3"/>} value={localProfile.houseName} onChange={(e:any) => setLocalProfile({...localProfile, houseName: e.target.value})} placeholder="Ex: Nosso Apartamento" />
            </div>
            <InputField label="Rua / Logradouro" icon={<MapPin className="w-3 h-3"/>} value={localProfile.address.street} onChange={(e:any) => handleAddressChange('street', e.target.value)} />
            <InputField label="Número" icon={<MapPin className="w-3 h-3"/>} value={localProfile.address.number} onChange={(e:any) => handleAddressChange('number', e.target.value)} />
            <InputField label="Cidade" icon={<MapPin className="w-3 h-3"/>} value={localProfile.address.city} onChange={(e:any) => handleAddressChange('city', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Estado (UF)" icon={<MapPin className="w-3 h-3"/>} value={localProfile.address.state} onChange={(e:any) => handleAddressChange('state', e.target.value)} />
              <InputField label="CEP" icon={<MapPin className="w-3 h-3"/>} value={localProfile.address.zip} onChange={(e:any) => handleAddressChange('zip', e.target.value)} />
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-4 animate-in slide-in-from-bottom">
            <div onClick={toggleTheme} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl cursor-pointer">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm">{state.theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-indigo-600" />}</div>
                  <p className="text-sm font-black text-slate-800 dark:text-white">Modo Escuro</p>
               </div>
               <div className={`w-12 h-6 rounded-full relative transition-all ${state.theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.theme === 'dark' ? 'right-1' : 'left-1'}`} /></div>
            </div>
            
            <div onClick={testAlarm} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-indigo-600"><Bell className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-white">Testar Notificações</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Som + Vibração + Push</p>
                  </div>
               </div>
               <Volume2 className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>

            <div className="pt-6 grid grid-cols-2 gap-4">
              <button onClick={onLogout} className="flex items-center justify-center gap-3 p-5 text-rose-600 font-black text-xs uppercase bg-rose-50 dark:bg-rose-900/20 rounded-2xl hover:bg-rose-100 transition-colors">
                <LogOut className="w-4 h-4" /> Sair da Conta
              </button>
              <button onClick={() => { if(confirm('Deseja realmente apagar todos os dados e reiniciar o app?')) { localStorage.clear(); window.location.reload(); } }} className="flex items-center justify-center gap-3 p-5 text-slate-600 font-black text-xs uppercase bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-colors">
                <RefreshCcw className="w-4 h-4" /> Resetar App
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;

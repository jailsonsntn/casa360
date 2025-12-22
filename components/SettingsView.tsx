
import React, { useState, useEffect, useRef } from 'react';
import { HomeState, UserProfile, AlarmSoundType, VibrationIntensity } from '../types';
import { 
  User, 
  MapPin, 
  Home, 
  Phone, 
  Mail, 
  Calendar, 
  Save, 
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
  AlertTriangle,
  X,
  BellRing,
  Info,
  Waves,
  Music
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface SettingsViewProps {
  state: HomeState;
  onUpdate: (newState: HomeState) => void;
  onLogout: () => void;
}

const InputField = ({ label, icon, value, onChange, placeholder, type = "text" }: any) => (
  <div className="space-y-1">
    <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 ml-1">
      {icon} {label}
    </label>
    <input 
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white focus:border-indigo-500 transition-all outline-none"
    />
  </div>
);

const SettingsView: React.FC<SettingsViewProps> = ({ state, onUpdate, onLogout }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(state.profile);
  const [activeTab, setActiveTab] = useState<'data' | 'alarms' | 'system'>('data');
  const [showSavedToast, setShowSavedToast] = useState(false);
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

  const handleAlarmChange = (field: keyof UserProfile['alarmSettings'], value: any) => {
    setLocalProfile(prev => ({ ...prev, alarmSettings: { ...prev.alarmSettings, [field]: value } }));
    
    // Feedback imediato para testes de som/vibração
    if (field === 'soundType') notificationService.playAlarmSound(value);
    if (field === 'vibrationIntensity') notificationService.vibrate(value);
  };

  const handleAddressChange = (field: keyof UserProfile['address'], value: string) => {
    setLocalProfile(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header Profile */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
        <div onClick={() => fileInputRef.current?.click()} className="relative cursor-pointer group">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white text-2xl font-black shadow-lg overflow-hidden shrink-0 border-4 border-white dark:border-slate-800">
            {localProfile.profileImage ? <img src={localProfile.profileImage} className="w-full h-full object-cover" /> : localProfile.fullName?.charAt(0)}
          </div>
          <div className="absolute inset-0 bg-indigo-900/40 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><Camera size={16} className="text-white" /></div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = () => setLocalProfile(p => ({...p, profileImage: r.result as string})); r.readAsDataURL(f); } }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-slate-800 dark:text-white truncate leading-none">{localProfile.fullName || 'Usuário'}</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-1.5"><Mail size={12} className="text-indigo-500" /> {state.auth.userEmail}</p>
        </div>
        <button onClick={handleSave} className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] flex items-center gap-2 active:scale-95 transition-all shadow-xl shadow-indigo-500/10">
          <Save size={14} /> Salvar
        </button>
      </div>

      <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
         {(['data', 'alarms', 'system'] as const).map(tab => (
           <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-800' : 'text-slate-400'}`}>
             <span>{tab === 'data' ? 'Meus Dados' : tab === 'alarms' ? 'Alarmes' : 'Sistema'}</span>
           </button>
         ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm min-h-[450px]">
        {activeTab === 'data' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-500"><User size={18} /></div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Perfil Identitário</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="Nome Completo" icon={<User size={10}/>} value={localProfile.fullName} onChange={(e:any) => setLocalProfile({...localProfile, fullName: e.target.value})} />
                <InputField label="Nascimento" type="date" icon={<Calendar size={10}/>} value={localProfile.birthDate} onChange={(e:any) => setLocalProfile({...localProfile, birthDate: e.target.value})} />
                <InputField label="WhatsApp" icon={<Phone size={10}/>} value={localProfile.phone} onChange={(e:any) => setLocalProfile({...localProfile, phone: e.target.value})} />
                <InputField label="E-mail" icon={<Mail size={10}/>} value={localProfile.email} onChange={(e:any) => setLocalProfile({...localProfile, email: e.target.value})} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-500"><Home size={18} /></div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Localização e Sede</h4>
              </div>
              <div className="space-y-5">
                <InputField label="Apelido da Casa" icon={<Home size={10}/>} value={localProfile.houseName} onChange={(e:any) => setLocalProfile({...localProfile, houseName: e.target.value})} placeholder="Ex: Loft Design" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-1"><InputField label="Rua / Logradouro" icon={<MapPin size={10}/>} value={localProfile.address.street} onChange={(e:any) => handleAddressChange('street', e.target.value)} /></div>
                  <div className="md:col-span-1"><InputField label="Número" value={localProfile.address.number} onChange={(e:any) => handleAddressChange('number', e.target.value)} /></div>
                  <InputField label="Cidade" value={localProfile.address.city} onChange={(e:any) => handleAddressChange('city', e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="UF" value={localProfile.address.state} onChange={(e:any) => handleAddressChange('state', e.target.value)} />
                    <InputField label="CEP" value={localProfile.address.zip} onChange={(e:any) => handleAddressChange('zip', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alarms' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Music size={14} className="text-indigo-500" /> Melodia do Alarme</h4>
              <div className="grid grid-cols-3 gap-3">
                {(['gentle', 'standard', 'urgent'] as AlarmSoundType[]).map(type => (
                  <button key={type} onClick={() => handleAlarmChange('soundType', type)} className={`py-5 rounded-2xl border-2 transition-all text-[9px] font-black uppercase flex flex-col items-center gap-3 ${localProfile.alarmSettings.soundType === type ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 shadow-lg shadow-indigo-500/10' : 'border-slate-50 dark:border-slate-800 text-slate-400 hover:border-indigo-200'}`}>
                    <div className="flex gap-0.5 items-end h-4">
                      <div className={`w-1 rounded-full ${type === 'gentle' ? 'h-2 bg-indigo-300' : type === 'standard' ? 'h-3 bg-indigo-500' : 'h-4 bg-rose-500'} animate-pulse`}></div>
                      <div className={`w-1 rounded-full ${type === 'gentle' ? 'h-3 bg-indigo-300' : type === 'standard' ? 'h-4 bg-indigo-500' : 'h-3 bg-rose-500'} animate-pulse delay-75`}></div>
                      <div className={`w-1 rounded-full ${type === 'gentle' ? 'h-2 bg-indigo-300' : type === 'standard' ? 'h-3 bg-indigo-500' : 'h-4 bg-rose-500'} animate-pulse delay-150`}></div>
                    </div>
                    {type === 'gentle' ? 'Cristal' : type === 'standard' ? 'Digital' : 'Sirene'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Waves size={14} className="text-indigo-500" /> Resposta Hática (Intensidade)</h4>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as VibrationIntensity[]).map(intensity => (
                  <button key={intensity} onClick={() => handleAlarmChange('vibrationIntensity', intensity)} className={`py-5 rounded-2xl border-2 transition-all text-[9px] font-black uppercase flex flex-col items-center gap-3 ${localProfile.alarmSettings.vibrationIntensity === intensity ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 shadow-lg shadow-indigo-500/10' : 'border-slate-50 dark:border-slate-800 text-slate-400 hover:border-indigo-200'}`}>
                    <Vibrate size={16} className={intensity === 'high' ? 'text-rose-500' : 'text-indigo-400'} />
                    {intensity === 'low' ? 'Suave' : intensity === 'medium' ? 'Médio' : 'Forte'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-500"><Smartphone size={20} /></div>
                 <div>
                    <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200 tracking-widest block">Vibração Ativa</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Alertas no Bolso</span>
                 </div>
               </div>
               <button onClick={() => handleAlarmChange('vibrationEnabled', !localProfile.alarmSettings.vibrationEnabled)} className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${localProfile.alarmSettings.vibrationEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                 <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${localProfile.alarmSettings.vibrationEnabled ? 'right-1' : 'left-1'}`} />
               </button>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
            <div onClick={toggleTheme} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 cursor-pointer group">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
                   {state.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                 </div>
                 <div>
                   <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200 tracking-widest block">Modo Noturno</span>
                   <span className="text-[9px] font-bold text-slate-400 uppercase">Interface Sombria</span>
                 </div>
               </div>
               <div className={`w-14 h-7 rounded-full relative transition-all ${state.theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                 <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${state.theme === 'dark' ? 'right-1' : 'left-1 shadow-sm'}`} />
               </div>
            </div>
            <button onClick={onLogout} className="w-full py-5 text-rose-600 font-black text-[10px] uppercase tracking-[0.25em] bg-rose-50 dark:bg-rose-900/10 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-rose-100 dark:border-rose-900/30">
               <LogOut size={18} /> Encerrar Sessão
            </button>
          </div>
        )}
      </div>
      {showSavedToast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-indigo-600 text-white px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl animate-in fade-in slide-in-from-bottom border border-white/10 z-[200]">Configurações Sincronizadas</div>}
    </div>
  );
};

export default SettingsView;

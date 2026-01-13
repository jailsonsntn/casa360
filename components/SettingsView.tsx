
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
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-zinc-500 ml-1 flex items-center gap-1.5">
      {icon} {label}
    </label>
    <input
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 transition-all outline-none"
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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10 px-4">
      {/* Header Profile */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-5">
        <div onClick={() => fileInputRef.current?.click()} className="relative cursor-pointer group">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-sm overflow-hidden shrink-0 border-2 border-indigo-100 dark:border-indigo-900/30">
            {localProfile.profileImage ? <img src={localProfile.profileImage} className="w-full h-full object-cover" /> : localProfile.fullName?.charAt(0)}
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]"><Camera size={20} className="text-white" /></div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setLocalProfile(p => ({ ...p, profileImage: r.result as string })); r.readAsDataURL(f); } }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">{localProfile.fullName || 'Usuário'}</h2>
          <p className="text-xs text-zinc-500 font-medium mt-1 flex items-center gap-1.5"><Mail size={14} className="text-indigo-500" /> {state.auth.userEmail}</p>
        </div>
        <button onClick={handleSave} className="bg-zinc-900 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shadow-sm hover:bg-zinc-800 dark:hover:bg-indigo-700">
          <Save size={16} /> Salvar
        </button>
      </div>

      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
        {(['data', 'alarms', 'system'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${activeTab === tab ? 'bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm border border-zinc-200 dark:border-zinc-800' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
            <span>{tab === 'data' ? 'Meus Dados' : tab === 'alarms' ? 'Alarmes' : 'Sistema'}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[450px]">
        {activeTab === 'data' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400"><User size={18} /></div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Perfil Identitário</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="Nome Completo" icon={<User size={12} />} value={localProfile.fullName} onChange={(e: any) => setLocalProfile({ ...localProfile, fullName: e.target.value })} />
                <InputField label="Nascimento" type="date" icon={<Calendar size={12} />} value={localProfile.birthDate} onChange={(e: any) => setLocalProfile({ ...localProfile, birthDate: e.target.value })} />
                <InputField label="WhatsApp" icon={<Phone size={12} />} value={localProfile.phone} onChange={(e: any) => setLocalProfile({ ...localProfile, phone: e.target.value })} />
                <InputField label="E-mail" icon={<Mail size={12} />} value={localProfile.email} onChange={(e: any) => setLocalProfile({ ...localProfile, email: e.target.value })} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400"><Home size={18} /></div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Localização e Sede</h4>
              </div>
              <div className="space-y-5">
                <InputField label="Apelido da Casa" icon={<Home size={12} />} value={localProfile.houseName} onChange={(e: any) => setLocalProfile({ ...localProfile, houseName: e.target.value })} placeholder="Ex: Loft Design" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-1"><InputField label="Rua / Logradouro" icon={<MapPin size={12} />} value={localProfile.address.street} onChange={(e: any) => handleAddressChange('street', e.target.value)} /></div>
                  <div className="md:col-span-1"><InputField label="Número" value={localProfile.address.number} onChange={(e: any) => handleAddressChange('number', e.target.value)} /></div>
                  <InputField label="Cidade" value={localProfile.address.city} onChange={(e: any) => handleAddressChange('city', e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="UF" value={localProfile.address.state} onChange={(e: any) => handleAddressChange('state', e.target.value)} />
                    <InputField label="CEP" value={localProfile.address.zip} onChange={(e: any) => handleAddressChange('zip', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alarms' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2"><Music size={14} className="text-indigo-500" /> Melodia do Alarme</h4>
              <div className="grid grid-cols-3 gap-3">
                {(['gentle', 'standard', 'urgent'] as AlarmSoundType[]).map(type => (
                  <button key={type} onClick={() => handleAlarmChange('soundType', type)} className={`py-4 rounded-xl border transition-all text-xs font-semibold uppercase flex flex-col items-center gap-3 ${localProfile.alarmSettings.soundType === type ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-indigo-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2"><Waves size={14} className="text-indigo-500" /> Resposta Hática (Intensidade)</h4>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as VibrationIntensity[]).map(intensity => (
                  <button key={intensity} onClick={() => handleAlarmChange('vibrationIntensity', intensity)} className={`py-4 rounded-xl border transition-all text-xs font-semibold uppercase flex flex-col items-center gap-3 ${localProfile.alarmSettings.vibrationIntensity === intensity ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-indigo-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                    <Vibrate size={18} className={intensity === 'high' ? 'text-rose-500' : 'text-indigo-400'} />
                    {intensity === 'low' ? 'Suave' : intensity === 'medium' ? 'Médio' : 'Forte'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400"><Smartphone size={20} /></div>
                <div>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">Vibração Ativa</span>
                  <span className="text-xs font-medium text-zinc-500">Alertas táteis no dispositivo</span>
                </div>
              </div>
              <button onClick={() => handleAlarmChange('vibrationEnabled', !localProfile.alarmSettings.vibrationEnabled)} className={`w-12 h-6 rounded-full relative transition-all shadow-inner ${localProfile.alarmSettings.vibrationEnabled ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${localProfile.alarmSettings.vibrationEnabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
            <div onClick={toggleTheme} className="flex items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer group hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white dark:bg-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-300 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {state.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">Modo Noturno</span>
                  <span className="text-xs font-medium text-zinc-500">Alternar tema da interface</span>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-all ${state.theme === 'dark' ? 'bg-indigo-600' : 'bg-zinc-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${state.theme === 'dark' ? 'right-1' : 'left-1'}`} />
              </div>
            </div>
            <button onClick={onLogout} className="w-full py-4 text-rose-600 font-bold text-xs uppercase tracking-widest bg-rose-50 dark:bg-rose-900/10 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/20">
              <LogOut size={16} /> Encerrar Sessão
            </button>
          </div>
        )}
      </div>
      {showSavedToast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl animate-in fade-in slide-in-from-bottom border border-white/10 z-[200]">Configurações Salvas</div>}
    </div>
  );
};

export default SettingsView;

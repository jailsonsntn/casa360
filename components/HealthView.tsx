import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import {
  Pill,
  Plus,
  Clock,
  AlertCircle,
  X,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  Bell,
  BellOff
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface HealthViewProps {
  medications: Medication[];
  onAdd: (med: Omit<Medication, 'id' | 'isActive'>) => void;
  onUpdate: (id: string, updates: Partial<Medication>) => void;
  onTakeDose: (id: string) => void;
  onDelete: (id: string) => void;
}

const HealthView: React.FC<HealthViewProps> = ({ medications, onAdd, onUpdate, onTakeDose, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  const [name, setName] = useState('');
  const [person, setPerson] = useState('');
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('8h/8h');
  const [stock, setStock] = useState('30');
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [alarmTimes, setAlarmTimes] = useState<string[]>([]);

  // Função para calcular horários dos alarmes baseado na frequência
  const calculateAlarmTimes = (frequency: string) => {
    const times: string[] = [];
    const now = new Date();
    const startHour = 8; // Começar às 8:00

    if (frequency === '4h/4h') {
      // 6 doses por dia (cada 4 horas)
      for (let i = 0; i < 6; i++) {
        const hour = (startHour + (i * 4)) % 24;
        times.push(`${hour.toString().padStart(2, '0')}:00`);
      }
    } else if (frequency === '6h/6h') {
      // 4 doses por dia (cada 6 horas)
      for (let i = 0; i < 4; i++) {
        const hour = (startHour + (i * 6)) % 24;
        times.push(`${hour.toString().padStart(2, '0')}:00`);
      }
    } else if (frequency === '8h/8h') {
      // 3 doses por dia (cada 8 horas)
      for (let i = 0; i < 3; i++) {
        const hour = (startHour + (i * 8)) % 24;
        times.push(`${hour.toString().padStart(2, '0')}:00`);
      }
    } else if (frequency === '12h/12h') {
      // 2 doses por dia (cada 12 horas)
      times.push('08:00');
      times.push('20:00');
    }

    return times;
  };

  // Atualizar horários quando frequência muda
  useEffect(() => {
    const times = calculateAlarmTimes(freq);
    setAlarmTimes(times);
  }, [freq]);

  useEffect(() => {
    if (editingMed) {
      setName(editingMed.name); setPerson(editingMed.person);
      setDose(editingMed.dosage); setFreq(editingMed.frequency);
      setStock(editingMed.stock.toString()); setIsAdding(true);
    }
  }, [editingMed]);

  useEffect(() => {
    // Request notification permission on component mount
    notificationService.requestPermission().then(granted => {
      setNotificationEnabled(granted);
    });
  }, []);

  const resetForm = () => {
    setName(''); setPerson(''); setDose(''); setFreq('8h/8h'); setStock('30');
    setEditingMed(null); setIsAdding(false); setAlarmTimes([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const medData = {
      name, person, dosage: dose, frequency: freq,
      stock: parseInt(stock) || 0, minStock: 5,
      alarmConfig: {
        enabled: true,
        times: alarmTimes,
        nextDose: alarmTimes.length > 0 ? alarmTimes[0] : undefined
      }
    };
    if (editingMed) onUpdate(editingMed.id, medData);
    else onAdd(medData);
    resetForm();
  };

  const handleTakeDose = (med: Medication) => {
    onTakeDose(med.id);
    // Send notification reminder
    if (notificationEnabled) {
      notificationService.sendLocalNotification(
        `Dose registrada: ${med.name}`,
        `${med.dosage} para ${med.person} - Próxima dose em ${med.frequency}`,
        false
      );
    }
  };

  const toggleNotifications = async () => {
    if (!notificationEnabled) {
      const granted = await notificationService.requestPermission();
      setNotificationEnabled(granted);
    } else {
      setNotificationEnabled(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-zinc-800 p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Pill size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">Saúde</h1>
                <p className="text-sm text-gray-600 dark:text-zinc-400 font-medium mt-1">Gerencie tratamentos e medicamentos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleNotifications}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2 transition-all active:scale-95 ${
                  notificationEnabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-300 dark:hover:bg-zinc-700'
                }`}
              >
                {notificationEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                {notificationEnabled ? 'Notificações Ativas' : 'Ativar Notificações'}
              </button>
              <button
                onClick={() => { resetForm(); setIsAdding(true); }}
                className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2 hover:bg-rose-700 transition-colors active:scale-95"
              >
                <Plus size={16} /> Novo Tratamento
              </button>
            </div>
          </div>
        </div>

        {/* Medications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map(med => (
            <div key={med.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-200 group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center border border-rose-100 dark:border-rose-900/30">
                  <Pill size={20} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingMed(med)}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(med.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{med.person}</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-1">{med.name}</h3>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                    <Clock size={16} className="text-rose-500" />
                    <span>{med.frequency}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                    <AlertCircle size={16} className="text-rose-500" />
                    <span>{med.dosage}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleTakeDose(med)}
                    className="w-full bg-gray-900 dark:bg-rose-600 text-white py-3 rounded-xl font-semibold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-gray-800 dark:hover:bg-rose-700"
                  >
                    <CheckCircle2 size={16} /> Registrar Dose
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {medications.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-zinc-800 p-12 text-center">
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Pill size={32} className="text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">Nenhum tratamento cadastrado</h3>
            <p className="text-gray-600 dark:text-zinc-400 mb-6">Adicione seus primeiros medicamentos para começar a gerenciar sua saúde.</p>
            <button
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2 hover:bg-rose-700 transition-colors active:scale-95"
            >
              <Plus size={16} /> Adicionar Tratamento
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 shrink-0">
                <h3 className="font-semibold text-base text-gray-900 dark:text-zinc-100">
                  {editingMed ? 'Editar' : 'Novo'} Tratamento
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-zinc-900">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Medicamento</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-gray-900 dark:text-zinc-100 focus:border-rose-500 transition-colors"
                    placeholder="Nome do medicamento"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Quem toma?</label>
                    <input
                      type="text"
                      value={person}
                      onChange={e => setPerson(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-gray-900 dark:text-zinc-100 focus:border-rose-500 transition-colors"
                      placeholder="Nome da pessoa"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Intervalo</label>
                    <select
                      value={freq}
                      onChange={e => setFreq(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-medium text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-rose-500 transition-colors"
                    >
                      <option value="4h/4h">4 em 4h</option>
                      <option value="6h/6h">6 em 6h</option>
                      <option value="8h/8h">8 em 8h</option>
                      <option value="12h/12h">12 em 12h</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Dosagem</label>
                    <input
                      type="text"
                      value={dose}
                      onChange={e => setDose(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-gray-900 dark:text-zinc-100 focus:border-rose-500 transition-colors"
                      placeholder="Ex: 500mg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Quantidade Inicial</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={e => setStock(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none font-medium text-sm text-gray-900 dark:text-zinc-100 focus:border-rose-500 transition-colors"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {/* Horários dos Alarmes */}
                {alarmTimes.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Horários dos Alarmes</label>
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4">
                      <div className="flex flex-wrap gap-2">
                        {alarmTimes.map((time, index) => (
                          <div key={index} className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-lg text-sm font-medium">
                            {time}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">
                        {alarmTimes.length} alarme(s) por dia serão configurados automaticamente
                      </p>
                    </div>
                  </div>
                )}
              </form>

              <div className="px-6 py-5 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 shrink-0">
                <button
                  onClick={handleSubmit}
                  type="button"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Save size={18} /> Salvar Tratamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthView;

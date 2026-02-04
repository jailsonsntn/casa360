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
  const [firstDoseDate, setFirstDoseDate] = useState('');
  const [firstDoseTime, setFirstDoseTime] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [alarmTimes, setAlarmTimes] = useState<string[]>([]);

  // Função para calcular horários dos alarmes baseado na frequência
  const calculateAlarmTimes = (frequency: string, startTime?: string) => {
    const times: string[] = [];
    
    // Usar firstDoseTime se disponível, senão usar 08:00 como padrão
    let startHour = 8;
    let startMinute = 0;
    
    if (startTime) {
      const [h, m] = startTime.split(':').map(Number);
      startHour = h;
      startMinute = m;
    }

    if (frequency === '4h/4h') {
      // 6 doses por dia (cada 4 horas)
      for (let i = 0; i < 6; i++) {
        const totalMinutes = (startHour * 60 + startMinute + (i * 4 * 60));
        const hour = Math.floor(totalMinutes / 60) % 24;
        const minute = totalMinutes % 60;
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    } else if (frequency === '6h/6h') {
      // 4 doses por dia (cada 6 horas)
      for (let i = 0; i < 4; i++) {
        const totalMinutes = (startHour * 60 + startMinute + (i * 6 * 60));
        const hour = Math.floor(totalMinutes / 60) % 24;
        const minute = totalMinutes % 60;
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    } else if (frequency === '8h/8h') {
      // 3 doses por dia (cada 8 horas)
      for (let i = 0; i < 3; i++) {
        const totalMinutes = (startHour * 60 + startMinute + (i * 8 * 60));
        const hour = Math.floor(totalMinutes / 60) % 24;
        const minute = totalMinutes % 60;
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    } else if (frequency === '12h/12h') {
      // 2 doses por dia (cada 12 horas)
      for (let i = 0; i < 2; i++) {
        const totalMinutes = (startHour * 60 + startMinute + (i * 12 * 60));
        const hour = Math.floor(totalMinutes / 60) % 24;
        const minute = totalMinutes % 60;
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    } else if (frequency === '24h/24h') {
      // 1 dose por dia (cada 24 horas)
      times.push(`${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`);
    }

    return times;
  };

  // Atualizar horários quando frequência ou firstDoseTime muda
  useEffect(() => {
    const times = calculateAlarmTimes(freq, firstDoseTime);
    setAlarmTimes(times);
  }, [freq, firstDoseTime]);

  useEffect(() => {
    if (editingMed) {
      setName(editingMed.name); setPerson(editingMed.person);
      setDose(editingMed.dosage); setFreq(editingMed.frequency);
      setStock(editingMed.stockQuantity?.toString() || '30'); 
      setFirstDoseDate(editingMed.firstDoseDate || '');
      setFirstDoseTime(editingMed.firstDoseTime || '');
      setIsAdding(true);
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
    setFirstDoseDate(''); setFirstDoseTime('');
    setEditingMed(null); setIsAdding(false); setAlarmTimes([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const medData = {
      name, person, dosage: dose, frequency: freq,
      stockQuantity: parseInt(stock) || 0, minStock: 5,
      firstDoseDate, firstDoseTime,
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
                className={`px-3 py-2 rounded-lg font-medium text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95 ${
                  notificationEnabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-300 dark:hover:bg-zinc-700'
                }`}
              >
                {notificationEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                {notificationEnabled ? 'Ativas' : 'Ativar'}
              </button>
              <button
                onClick={() => { resetForm(); setIsAdding(true); }}
                className="bg-rose-600 text-white px-4 py-2 rounded-lg font-medium text-xs shadow-sm flex items-center gap-1.5 hover:bg-rose-700 transition-colors active:scale-95"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>
          </div>
        </div>

        {/* Medications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications.map(med => (
            <div key={med.id} className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-200 group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center border border-rose-100 dark:border-rose-900/30">
                  <Pill size={16} />
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingMed(med)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => onDelete(med.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{med.person}</span>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 mt-0.5">{med.name}</h3>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400">
                    <Clock size={12} className="text-rose-500" />
                    <span>{med.frequency}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400">
                    <AlertCircle size={12} className="text-rose-500" />
                    <span>{med.dosage}</span>
                  </div>
                </div>

                {/* Histórico de doses - últimas 5 */}
                {med.doseHistory && med.doseHistory.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                    <div className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      Últimas doses
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {med.doseHistory.slice(0, 5).map((dose, idx) => (
                        <div
                          key={dose.id}
                          className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded border border-green-200 dark:border-green-800 flex items-center gap-1"
                          title={new Date(dose.takenAt).toLocaleString('pt-BR')}
                        >
                          <CheckCircle2 size={10} className="text-green-600 dark:text-green-500" />
                          {new Date(dose.takenAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ))}
                    </div>
                    {med.doseHistory.length > 5 && (
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                        +{med.doseHistory.length - 5} doses registradas
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-1 pt-1">
                  <button
                    onClick={() => handleTakeDose(med)}
                    className="w-full bg-gray-900 dark:bg-rose-600 text-white py-1.5 rounded text-xs font-medium shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all hover:bg-gray-800 dark:hover:bg-rose-700"
                  >
                    <CheckCircle2 size={12} /> Registrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {medications.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Pill size={24} className="text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-1">Nenhum tratamento cadastrado</h3>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mb-4">Adicione seus primeiros medicamentos para gerenciar sua saúde.</p>
            <button
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="bg-rose-600 text-white px-3 py-1.5 rounded text-xs font-medium shadow-sm flex items-center gap-1 hover:bg-rose-700 transition-colors active:scale-95 mx-auto"
            >
              <Plus size={12} /> Adicionar
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-2">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 shrink-0">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-zinc-100">
                  {editingMed ? 'Editar' : 'Novo'} Medicamento
                </h3>
                <button
                  onClick={resetForm}
                  className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-zinc-900">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">Medicamento</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-gray-900 dark:text-zinc-100 focus:border-rose-500 transition-colors"
                    placeholder="Nome do medicamento"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">Quem toma?</label>
                    <input
                      type="text"
                      value={person}
                      onChange={e => setPerson(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-gray-900 dark:text-zinc-100 focus:border-rose-500 transition-colors"
                      placeholder="Nome"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">Intervalo</label>
                    <select
                      value={freq}
                      onChange={e => setFreq(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 font-medium text-xs text-gray-900 dark:text-zinc-100 outline-none focus:border-rose-500 transition-colors"
                    >
                      <option value="4h/4h">4h</option>
                      <option value="6h/6h">6h</option>
                      <option value="8h/8h">8h</option>
                      <option value="12h/12h">12h</option>
                      <option value="24h/24h">24h (1x ao dia)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">Dosagem</label>
                    <input
                      type="text"
                      value={dose}
                      onChange={e => setDose(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-gray-900 dark:text-zinc-100 focus:border-rose-500 transition-colors"
                      placeholder="500mg"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">Qtd Inicial</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={e => setStock(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-gray-900 dark:text-zinc-100 focus:border-rose-500 transition-colors"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">Primeira Dose - Data</label>
                    <input
                      type="date"
                      value={firstDoseDate}
                      onChange={e => setFirstDoseDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-gray-900 dark:text-zinc-100 focus:border-rose-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">Primeira Dose - Hora</label>
                    <input
                      type="time"
                      value={firstDoseTime}
                      onChange={e => setFirstDoseTime(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-medium text-xs text-gray-900 dark:text-zinc-100 focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Horários dos Alarmes */}
                {alarmTimes.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">Horários dos Alarmes</label>
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-2">
                      <div className="flex flex-wrap gap-1">
                        {alarmTimes.map((time, index) => (
                          <div key={index} className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded text-xs font-medium">
                            {time}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                        {alarmTimes.length} alarme(s)/dia
                      </p>
                    </div>
                  </div>
                )}
              </form>

              <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 shrink-0">
                <button
                  onClick={handleSubmit}
                  type="button"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg font-medium text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Save size={14} /> Salvar
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

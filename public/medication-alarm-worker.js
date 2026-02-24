// Service Worker para monitorar alarmes de medicamentos mesmo com app fechado
const MEDICATION_STORE = 'casa360_medications';
const ALARM_STATE_STORE = 'casa360_alarm_state';
const ALARM_CHECK_INTERVAL = 60000; // Verificar a cada minuto

let alarmCheckInterval = null;

// Inicializar o worker quando ativado
self.addEventListener('activate', (event) => {
  console.log('[Medication Alarm SW] Ativado');
  event.waitUntil(self.clients.claim());
  startAlarmMonitor();
});

// Inicializar quando o worker é instalado
self.addEventListener('install', (event) => {
  console.log('[Medication Alarm SW] Instalado');
  self.skipWaiting();
});

// Receber mensagens do cliente
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  if (type === 'UPDATE_MEDICATIONS') {
    console.log('[Medication Alarm SW] Atualizando medicamentos:', payload);
    updateMedicationsInStorage(payload);
  } else if (type === 'UPDATE_ALARM_SETTINGS') {
    console.log('[Medication Alarm SW] Atualizando configurações:', payload);
    updateAlarmSettings(payload);
  } else if (type === 'START_MONITORING') {
    console.log('[Medication Alarm SW] Iniciando monitoramento');
    startAlarmMonitor();
  } else if (type === 'STOP_MONITORING') {
    console.log('[Medication Alarm SW] Parando monitoramento');
    stopAlarmMonitor();
  }
});

/**
 * Armazena medicamentos no IndexedDB para persistência
 */
async function updateMedicationsInStorage(medications) {
  try {
    const db = await openDatabase();
    const tx = db.transaction([MEDICATION_STORE], 'readwrite');
    const store = tx.objectStore(MEDICATION_STORE);

    // Limpar dados antigos
    await store.clear();

    // Inserir novos dados
    for (const med of medications) {
      await store.add({
        id: med.id,
        name: med.name,
        person: med.person,
        dosage: med.dosage,
        frequency: med.frequency,
        isActive: med.isActive,
        alarmConfig: med.alarmConfig || {}
      });
    }

    console.log('[Medication Alarm SW] Medicamentos armazenados com sucesso');
  } catch (error) {
    console.error('[Medication Alarm SW] Erro ao armazenar medicamentos:', error);
  }
}

/**
 * Armazena configurações de alarme
 */
async function updateAlarmSettings(settings) {
  try {
    const db = await openDatabase();
    const tx = db.transaction([ALARM_STATE_STORE], 'readwrite');
    const store = tx.objectStore(ALARM_STATE_STORE);

    await store.clear();
    await store.add({
      id: 'settings',
      ...settings
    });

    console.log('[Medication Alarm SW] Configurações de alarme armazenadas');
  } catch (error) {
    console.error('[Medication Alarm SW] Erro ao armazenar configurações:', error);
  }
}

/**
 * Abre/cria a base de dados IndexedDB
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('Casa360DB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(MEDICATION_STORE)) {
        db.createObjectStore(MEDICATION_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(ALARM_STATE_STORE)) {
        db.createObjectStore(ALARM_STATE_STORE, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Recupera medicamentos do armazenamento
 */
async function getMedicationsFromStorage() {
  try {
    const db = await openDatabase();
    const tx = db.transaction([MEDICATION_STORE], 'readonly');
    const store = tx.objectStore(MEDICATION_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Medication Alarm SW] Erro ao recuperar medicamentos:', error);
    return [];
  }
}

/**
 * Recupera configurações de alarme
 */
async function getAlarmSettings() {
  try {
    const db = await openDatabase();
    const tx = db.transaction([ALARM_STATE_STORE], 'readonly');
    const store = tx.objectStore(ALARM_STATE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.get('settings');
      request.onsuccess = () => resolve(request.result || {});
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Medication Alarm SW] Erro ao recuperar configurações:', error);
    return {};
  }
}

/**
 * Inicia monitoramento de alarmes
 */
function startAlarmMonitor() {
  if (alarmCheckInterval) return; // Já está rodando

  checkAndTriggerAlarms(); // Verificar imediatamente

  alarmCheckInterval = setInterval(checkAndTriggerAlarms, ALARM_CHECK_INTERVAL);
  console.log('[Medication Alarm SW] Monitoramento iniciado');
}

/**
 * Para o monitoramento de alarmes
 */
function stopAlarmMonitor() {
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval);
    alarmCheckInterval = null;
    console.log('[Medication Alarm SW] Monitoramento parado');
  }
}

/**
 * Verifica e dispara alarmes
 */
async function checkAndTriggerAlarms() {
  try {
    const medications = await getMedicationsFromStorage();
    const settings = await getAlarmSettings();

    if (!settings.soundType) {
      console.log('[Medication Alarm SW] Configurações não disponíveis ainda');
      return;
    }

    if (settings.notificationsEnabled === false) {
      return;
    }

    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      return;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const todayKey = now.toISOString().slice(0, 10);
    const alarmKey = `${todayKey} ${currentTime}`;

    for (const med of medications) {
      // Validações
      if (!med.isActive || !med.alarmConfig?.enabled) continue;
      if (!med.alarmConfig?.times || med.alarmConfig.times.length === 0) continue;
      if (!med.alarmConfig.times.includes(currentTime)) continue;

      // Evitar disparar múltiplas vezes no mesmo minuto
      if (med.alarmConfig.lastNotified === alarmKey) continue;

      console.log(`[Medication Alarm SW] Disparando alarme para: ${med.name}`);

      // Atualizar lastNotified
      await updateMedicationAlarmState(med.id, alarmKey);

      // Enviar notificação
      await self.registration.showNotification(`💊 Hora do medicamento: ${med.name}`, {
        body: `${med.dosage} para ${med.person} (${med.frequency})`,
        icon: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
        tag: `med-${med.id}`,
        requireInteraction: true,
        vibrate: settings.vibrationEnabled ? [500, 100, 500] : undefined,
        actions: [
          { action: 'take', title: 'Registrar dose' },
          { action: 'dismiss', title: 'Descartar' }
        ]
      });

      // Notificar todos os clientes abertos
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'MEDICATION_ALARM',
            payload: {
              medicationId: med.id,
              medicationName: med.name,
              time: currentTime
            }
          });
        });
      });
    }
  } catch (error) {
    console.error('[Medication Alarm SW] Erro ao verificar alarmes:', error);
  }
}

/**
 * Atualiza o estado do alarme de um medicamento
 */
async function updateMedicationAlarmState(medId, alarmKey) {
  try {
    const db = await openDatabase();
    const tx = db.transaction([MEDICATION_STORE], 'readwrite');
    const store = tx.objectStore(MEDICATION_STORE);

    const request = store.get(medId);
    request.onsuccess = () => {
      const med = request.result;
      if (med) {
        med.alarmConfig.lastNotified = alarmKey;
        store.put(med);
      }
    };
  } catch (error) {
    console.error('[Medication Alarm SW] Erro ao atualizar estado:', error);
  }
}

/**
 * Lidar com cliques em notificações
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'take') {
    // Notificar cliente para registrar dose
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'MEDICATION_DOSE_RECORDED',
          payload: event.notification.tag
        });
      });
    });
  }

  // Focar na janela ou abrir
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

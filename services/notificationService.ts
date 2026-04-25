
import { AlarmSoundType, VibrationIntensity } from '../types';
import { LocalNotifications } from '@capacitor/local-notifications';

type NotificationPermissionState = NotificationPermission | 'unsupported';

interface PlatformInfo {
  isBrowser: boolean;
  isSecureContext: boolean;
  isNativeLike: boolean;
  supportsNotificationApi: boolean;
  supportsServiceWorker: boolean;
  supportsVibration: boolean;
  supportsAudioContext: boolean;
}

const NATIVE_PERMISSION_CACHE_KEY = 'casa360_native_notification_permission';

const readNativePermissionCache = (): NotificationPermission => {
  if (typeof window === 'undefined') return 'default';
  const cached = localStorage.getItem(NATIVE_PERMISSION_CACHE_KEY);
  if (cached === 'granted' || cached === 'denied' || cached === 'default') return cached;
  return 'default';
};

const writeNativePermissionCache = (status: NotificationPermission) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NATIVE_PERMISSION_CACHE_KEY, status);
};

const normalizeNativeDisplayPermission = (display?: string): NotificationPermission => {
  if (display === 'granted') return 'granted';
  if (display === 'denied') return 'denied';
  return 'default';
};

const getPlatformInfo = (): PlatformInfo => {
  const hasWindow = typeof window !== 'undefined';
  const nativeLike = hasWindow && !!((window as any).Capacitor?.isNativePlatform?.() || (window as any).cordova);
  return {
    isBrowser: hasWindow,
    isSecureContext: hasWindow ? window.isSecureContext : false,
    isNativeLike: nativeLike,
    supportsNotificationApi: hasWindow && 'Notification' in window,
    supportsServiceWorker: hasWindow && 'serviceWorker' in navigator,
    supportsVibration: hasWindow && 'vibrate' in navigator,
    supportsAudioContext: hasWindow && !!(window.AudioContext || (window as any).webkitAudioContext)
  };
};

const getPermissionStatus = (): NotificationPermissionState => {
  const platform = getPlatformInfo();
  // No nativo, usamos cache local. O valor real e sincronizado por
  // requestPermission/ensureNotificationPermission via plugin nativo.
  if (platform.isNativeLike) return readNativePermissionCache();
  if (!platform.supportsNotificationApi) return 'unsupported';
  return Notification.permission;
};

export const notificationService = {
  getPlatformInfo,
  getPermissionStatus,

  requestPermission: async () => {
    const platform = getPlatformInfo();
    if (platform.isNativeLike) {
      try {
        const current = await LocalNotifications.checkPermissions();
        const currentStatus = normalizeNativeDisplayPermission(current.display);
        writeNativePermissionCache(currentStatus);
        if (currentStatus === 'granted') return true;

        const requested = await LocalNotifications.requestPermissions();
        const requestedStatus = normalizeNativeDisplayPermission(requested.display);
        writeNativePermissionCache(requestedStatus);
        return requestedStatus === 'granted';
      } catch (e) {
        console.warn('Falha ao solicitar permissao nativa de notificacao:', e);
        return false;
      }
    }
    if (!platform.supportsNotificationApi || !platform.isBrowser) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  ensureNotificationPermission: async () => {
    const platform = getPlatformInfo();
    if (platform.isNativeLike) {
      try {
        const current = await LocalNotifications.checkPermissions();
        const currentStatus = normalizeNativeDisplayPermission(current.display);
        writeNativePermissionCache(currentStatus);

        if (currentStatus === 'granted') return true;
        if (currentStatus === 'denied') return false;
        return notificationService.requestPermission();
      } catch (e) {
        console.warn('Falha ao verificar permissao nativa de notificacao:', e);
        return false;
      }
    }

    const status = getPermissionStatus();
    if (status === 'granted') return true;
    if (status === 'denied' || status === 'unsupported') return false;
    return notificationService.requestPermission();
  },

  sendLocalNotification: (title: string, body: string, urgent: boolean = false) => {
    const platform = getPlatformInfo();

    // No Android nativo, dispara notificacao local via plugin Capacitor.
    if (platform.isNativeLike) {
      void LocalNotifications.schedule({
        notifications: [{
          id: Date.now() % 2147483000,
          title,
          body,
          schedule: { at: new Date(Date.now() + 200) }
        }]
      });
      return true;
    }
    if (!platform.supportsNotificationApi || Notification.permission !== 'granted') return false;
    try {
      const n = new Notification(title, {
        body: body,
        icon: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
        tag: urgent ? 'urgent-alarm' : 'standard-reminder',
        renotify: urgent,
        requireInteraction: urgent,
        vibrate: urgent ? [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 500] : [200, 100, 200]
      } as any);
      
      n.onclick = () => {
        window.focus();
        n.close();
      };
      return true;
    } catch (e) {
      console.warn("Push notification failed, falling back to basic alert.");
      return false;
    }
  },

  canUseBackgroundNotifications: () => {
    const platform = getPlatformInfo();
    return platform.supportsServiceWorker && platform.supportsNotificationApi;
  },

  playAlarmSound: (type: AlarmSoundType = 'standard') => {
    const platform = getPlatformInfo();
    if (!platform.supportsAudioContext) return false;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'gentle') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now);
        oscillator.frequency.linearRampToValueAtTime(659.25, now + 1.5);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, now + 2);
        oscillator.start(now);
        oscillator.stop(now + 2);
      } else if (type === 'urgent') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(880, now);
        for (let i = 0; i < 5; i++) {
          oscillator.frequency.exponentialRampToValueAtTime(440, now + i * 0.4 + 0.2);
          oscillator.frequency.exponentialRampToValueAtTime(880, now + i * 0.4 + 0.4);
        }
        gainNode.gain.setValueAtTime(0.4, now);
        oscillator.start(now);
        oscillator.stop(now + 2);
      } else {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(554.37, now);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        oscillator.start(now);
        oscillator.stop(now + 1.5);
      }
      return true;
    } catch (e) {
      console.error("Audio Context Error", e);
      return false;
    }
  },

  vibrate: (type: 'short' | 'long' | 'urgent' | VibrationIntensity = 'short') => {
    const platform = getPlatformInfo();
    if (!platform.supportsVibration) return false;
    const patterns: Record<string, number[]> = {
      short: [100],
      long: [500, 200, 500],
      urgent: [500, 100, 500, 100, 500],
      low: [50],
      medium: [200, 100, 200],
      high: [400, 100, 400, 100, 400]
    };
    navigator.vibrate(patterns[type] || patterns.short);
    return true;
  },

  triggerAlarmFeedback: (params: {
    title: string;
    body: string;
    urgent?: boolean;
    soundEnabled?: boolean;
    soundType?: AlarmSoundType;
    vibrationEnabled?: boolean;
    vibrationType?: 'short' | 'long' | 'urgent' | VibrationIntensity;
    notificationsEnabled?: boolean;
  }) => {
    const {
      title,
      body,
      urgent = false,
      soundEnabled = true,
      soundType = 'standard',
      vibrationEnabled = true,
      vibrationType = 'short',
      notificationsEnabled = true
    } = params;

    if (soundEnabled) notificationService.playAlarmSound(soundType);
    if (vibrationEnabled) notificationService.vibrate(vibrationType);
    if (notificationsEnabled && getPermissionStatus() === 'granted') {
      try {
        notificationService.sendLocalNotification(title, body, urgent);
      } catch (e) {
        console.warn('Falha ao enviar notificação local', e);
      }
    }
  }
};

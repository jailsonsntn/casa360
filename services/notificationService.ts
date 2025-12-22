
import { AlarmSoundType, VibrationIntensity } from '../types';

export const notificationService = {
  requestPermission: async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  sendLocalNotification: (title: string, body: string, urgent: boolean = false) => {
    if (Notification.permission === 'granted') {
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
      } catch (e) {
        console.warn("Push notification failed, falling back to basic alert.");
      }
    }
  },

  playAlarmSound: (type: AlarmSoundType = 'standard') => {
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
    } catch (e) {
      console.error("Audio Context Error", e);
    }
  },

  vibrate: (type: 'short' | 'long' | 'urgent' | VibrationIntensity = 'short') => {
    if ('vibrate' in navigator) {
      const patterns: Record<string, number[]> = {
        short: [100],
        long: [500, 200, 500],
        urgent: [500, 100, 500, 100, 500],
        low: [50],
        medium: [200, 100, 200],
        high: [400, 100, 400, 100, 400]
      };
      navigator.vibrate(patterns[type] || patterns.short);
    }
  }
};

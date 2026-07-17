import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Network } from '@capacitor/network';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';

export const initializeApp = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await SplashScreen.hide();
      
      // Set status bar to dark mode or light mode depending on theme
      // For now we can set it to a default
      await StatusBar.setStyle({ style: Style.Default });
      
      // Handle back button on Android
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
      
    } catch (error) {
      console.error('Error initializing native plugins', error);
    }
  }
};

export const vibrate = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Ignore
    }
  }
};

export const shareAppContent = async (title: string, text: string, url: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share with buddies',
      });
      return true;
    } else if (navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error sharing', e);
    return false;
  }
};

export const getNetworkStatus = async () => {
  if (Capacitor.isNativePlatform()) {
    return await Network.getStatus();
  }
  return { connected: navigator.onLine, connectionType: 'unknown' };
};

export const addNetworkListener = (callback: (status: { connected: boolean }) => void) => {
  if (Capacitor.isNativePlatform()) {
    return Network.addListener('networkStatusChange', callback);
  } else {
    const handleOnline = () => callback({ connected: true });
    const handleOffline = () => callback({ connected: false });
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return {
      remove: async () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }
};

export const takePicture = async () => {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt
    });
    return image.dataUrl;
  } catch (e) {
    console.error("Camera error", e);
    return null;
  }
};

export const setLocalPreference = async (key: string, value: string) => {
  await Preferences.set({ key, value });
};

export const getLocalPreference = async (key: string) => {
  const { value } = await Preferences.get({ key });
  return value;
};

import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation } from '@capacitor/geolocation';

export const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted' && permission.location !== 'limited') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted' && requested.location !== 'limited') {
          return null;
        }
      }
      const position = await Geolocation.getCurrentPosition();
      return { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch (e) {
      console.error('Error getting native location', e);
      return null;
    }
  }
  if (!navigator.geolocation) {
    return null;
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(null)
    );
  });
};

export const checkNotificationPermission = async (): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display as 'granted' | 'denied' | 'prompt';
    } catch (e) {
      console.error('Error checking notification permission', e);
      return 'unsupported';
    }
  }
  if ('Notification' in window) {
    return Notification.permission as 'granted' | 'denied' | 'prompt';
  }
  return 'unsupported';
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (e) {
      console.error('Error requesting notification permission', e);
      return false;
    }
  }
  if ('Notification' in window && Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const scheduleLocalNotification = async (title: string, body: string, id: number = 1, extraDelaySecs: number = 5) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id,
              schedule: { at: new Date(Date.now() + 1000 * extraDelaySecs) },
              sound: undefined,
              attachments: undefined,
              actionTypeId: "",
              extra: null
            }
          ]
        });
      }
    } catch (e) {
      console.error('Error scheduling notification', e);
    }
  }
};

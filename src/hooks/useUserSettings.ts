import { useState, useEffect } from 'react';

export interface UserSettings {
  theme: 'dark' | 'light' | 'auto';
  accentColor: string;
  fontFamily: string;
  borderRadius: 'rounded' | 'sharp' | 'pill';
  fontSize: number;
  compactMode: boolean;
  showTimestamps: boolean;
  allowDMs: boolean;
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
  desktopNotifications: boolean;
  soundNotifications: boolean;
  mentionNotifications: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accentColor: '#5865F2',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: 'rounded',
  fontSize: 14,
  compactMode: false,
  showTimestamps: true,
  allowDMs: true,
  allowFriendRequests: true,
  showOnlineStatus: true,
  desktopNotifications: true,
  soundNotifications: true,
  mentionNotifications: true,
};

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('userSettings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.style.setProperty('--accent', settings.accentColor);
    document.documentElement.style.setProperty('--font-primary', settings.fontFamily);
    document.body.style.fontFamily = settings.fontFamily;

    let radius = '4px';
    if (settings.borderRadius === 'sharp') radius = '0px';
    if (settings.borderRadius === 'pill') radius = '12px';
    document.documentElement.style.setProperty('--border-radius', radius);
    document.documentElement.style.fontSize = `${settings.fontSize}px`;

    if (settings.compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }, [settings]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    resetSettings,
  };
};

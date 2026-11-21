import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'pt-BR' | 'en' | 'es';
export type Preferences = {
  theme: 'system' | 'light' | 'dark';
  language: Language;
  textSize: 'default' | 'large';
  compactFeed: boolean;
  showFeedback: boolean;
  reduceMotion: boolean;
  defaultFeed: 'group' | 'mine';
};

export const defaultPreferences: Preferences = {
  theme: 'system', language: 'pt-BR', textSize: 'default',
  compactFeed: false, showFeedback: true, reduceMotion: false, defaultFeed: 'group',
};
const storageKey = '@prato-a-prato/preferences/v1';

// Read only known, valid fields. Stored data can be old, incomplete or modified.
export function validatePreferences(value: unknown): Preferences {
  const result = { ...defaultPreferences };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  const fields = value as Record<string, unknown>;
  if (fields.theme === 'system' || fields.theme === 'light' || fields.theme === 'dark') result.theme = fields.theme;
  if (fields.textSize === 'default' || fields.textSize === 'large') result.textSize = fields.textSize;
  if (fields.defaultFeed === 'group' || fields.defaultFeed === 'mine') result.defaultFeed = fields.defaultFeed;
  for (const key of ['compactFeed', 'showFeedback', 'reduceMotion'] as const) {
    const candidate = fields[key];
    if (typeof candidate === 'boolean') result[key] = candidate;
  }
  return result;
}

type PreferencesContextValue = {
  preferences: Preferences;
  ready: boolean;
  saving: boolean;
  storageError: 'load' | 'save' | null;
  colorScheme: 'light' | 'dark';
  updatePreferences: (patch: Partial<Preferences>) => void;
  resetPreferences: () => void;
  retrySave: () => void;
};
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const [preferences, setPreferences] = useState<Preferences>({ ...defaultPreferences });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState<'load' | 'save' | null>(null);
  const current = useRef(preferences);
  const mounted = useRef(true);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const lastWrite = useRef(0);

  useEffect(() => {
    mounted.current = true;
    AsyncStorage.getItem(storageKey).then(raw => {
      const loaded = raw ? validatePreferences(JSON.parse(raw)) : { ...defaultPreferences };
      if (!mounted.current) return;
      current.current = loaded;
      setPreferences(loaded);
    }).catch(() => {
      if (mounted.current) setStorageError('load');
    }).finally(() => {
      if (mounted.current) setReady(true);
    });
    return () => { mounted.current = false; };
  }, []);

  const persist = useCallback((next: Preferences) => {
    const revision = ++lastWrite.current;
    setSaving(true);
    setStorageError(null);
    // Serialize writes so a slower old write cannot overwrite a newer choice.
    writeQueue.current = writeQueue.current.catch(() => {}).then(async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
        if (mounted.current && revision === lastWrite.current) setStorageError(null);
      } catch {
        if (mounted.current && revision === lastWrite.current) setStorageError('save');
      } finally {
        if (mounted.current && revision === lastWrite.current) setSaving(false);
      }
    });
  }, []);

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    const next = validatePreferences({ ...current.current, ...patch });
    current.current = next;
    setPreferences(next);
    persist(next);
  }, [persist]);
  const resetPreferences = useCallback(() => updatePreferences({ ...defaultPreferences }), [updatePreferences]);
  const retrySave = useCallback(() => persist(current.current), [persist]);
  const colorScheme = preferences.theme === 'system' ? (systemTheme === 'dark' ? 'dark' : 'light') : preferences.theme;

  return <PreferencesContext.Provider value={{ preferences, ready, saving, storageError, colorScheme, updatePreferences, resetPreferences, retrySave }}>
    {children}
  </PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider');
  return context;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type ViewMode = 'seller' | 'buyer';

interface ViewModeContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => Promise<void>;
  loading: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

const VIEW_MODE_STORAGE_KEY = '@hometown_marketplace_view_mode';

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>('seller');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMode();
  }, []);

  const loadMode = async () => {
    try {
      const stored = await AsyncStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (stored === 'buyer' || stored === 'seller') {
        setModeState(stored);
      } else {
        // Default to 'seller' mode if no stored preference
        // This ensures sellers start in seller mode by default
        setModeState('seller');
        // Save the default so it persists
        await AsyncStorage.setItem(VIEW_MODE_STORAGE_KEY, 'seller');
      }
    } catch (error) {
      console.error('Error loading view mode:', error);
      // On error, default to seller mode
      setModeState('seller');
    } finally {
      setLoading(false);
    }
  };

  const setMode = async (newMode: ViewMode) => {
    try {
      await AsyncStorage.setItem(VIEW_MODE_STORAGE_KEY, newMode);
      setModeState(newMode);
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  };

  const value: ViewModeContextType = {
    mode,
    setMode,
    loading,
  };

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}


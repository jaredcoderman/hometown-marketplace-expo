import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AdminViewMode = 'user' | 'admin';

interface AdminViewContextType {
  mode: AdminViewMode;
  setMode: (newMode: AdminViewMode) => Promise<void>;
  loading: boolean;
}

const AdminViewContext = createContext<AdminViewContextType | undefined>(undefined);

const ADMIN_VIEW_STORAGE_KEY = '@hometown_marketplace_admin_view_mode';

export function AdminViewProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AdminViewMode>('user'); // Default to user mode
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminViewMode();
  }, []);

  const loadAdminViewMode = async () => {
    try {
      const storedMode = await AsyncStorage.getItem(ADMIN_VIEW_STORAGE_KEY);
      if (storedMode === 'admin' || storedMode === 'user') {
        setModeState(storedMode);
      }
    } catch (error) {
      console.error('Error loading admin view mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const setMode = async (newMode: AdminViewMode) => {
    try {
      setModeState(newMode);
      await AsyncStorage.setItem(ADMIN_VIEW_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Error saving admin view mode:', error);
    }
  };

  const value: AdminViewContextType = {
    mode,
    setMode,
    loading,
  };

  return <AdminViewContext.Provider value={value}>{children}</AdminViewContext.Provider>;
}

export function useAdminView() {
  const context = useContext(AdminViewContext);
  if (context === undefined) {
    throw new Error('useAdminView must be used within an AdminViewProvider');
  }
  return context;
}


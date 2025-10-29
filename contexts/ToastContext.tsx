import Colors from '@/constants/Colors';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

type ToastType = 'info' | 'success' | 'error';

interface ToastContextValue {
  show: (message: string, type?: ToastType, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<ToastType>('info');
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const show = useCallback((msg: string, t: ToastType = 'info', durationMs: number = 3000) => {
    setMessage(msg);
    setType(t);
    // Animate in
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    // Animate out after delay
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 200, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMessage(null));
    }, durationMs);

    return () => clearTimeout(timeout);
  }, [opacity, translateY]);

  const value = useMemo(() => ({ show }), [show]);

  const backgroundColor = type === 'success' ? '#2e7d32' : type === 'error' ? '#c62828' : Colors.primary;

  return (
    <ToastContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {message && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.toast,
              {
                backgroundColor,
                transform: [{ translateY }],
                opacity,
              },
            ]}
          >
            <Text style={styles.text}>{message}</Text>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: Platform.select({ ios: 60, android: 24, default: 16 }),
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});



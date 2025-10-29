import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'react-native';
import 'react-native-reanimated';

import Colors from '@/constants/Colors';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { ToastProvider } from '@/contexts/ToastContext';

// Custom autumn theme
const AutumnTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.card,
    text: Colors.text,
    border: Colors.border,
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <ThemeProvider value={AutumnTheme}>
          <ToastProvider>
          <Stack
            screenOptions={{
              headerShown: true,
              headerTitleAlign: 'center',
              headerTitle: () => (
                <Image
                  source={require('@/assets/images/hometown-logo.png')}
                  style={{ height: 36, width: 36, resizeMode: 'contain' }}
                />
              ),
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(buyer)" />
            <Stack.Screen name="(seller)" />
          </Stack>
          <StatusBar style="dark" />
          </ToastProvider>
        </ThemeProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

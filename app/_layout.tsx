import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import Colors from '@/constants/Colors';

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
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(buyer)" />
            <Stack.Screen name="(seller)" />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Platform, TouchableOpacity } from 'react-native';
import 'react-native-reanimated';

import { BugReportModal } from '@/components/ui/bug-report-modal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { AdminViewProvider, useAdminView } from '@/contexts/AdminViewContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text } from 'react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Inject Ionicons font CSS for web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Check if font CSS is already injected
  if (!document.getElementById('ionicons-font')) {
    const style = document.createElement('style');
    style.id = 'ionicons-font';
    // Use CDN as reliable source for static exports
    style.textContent = `
      @font-face {
        font-family: 'Ionicons';
        src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.0.3/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }
}

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

function AdminToggleButton() {
  const { user } = useAuth();
  const { mode, setMode } = useAdminView();
  
  // Only show for admin users
  if (!user?.isAdmin) return null;

  const handleToggle = async () => {
    const newMode = mode === 'admin' ? 'user' : 'admin';
    await setMode(newMode);
    
    if (newMode === 'admin') {
      router.replace('/(admin)/dashboard');
    } else {
      // Navigate back to appropriate dashboard based on user type
      if (user.userType === 'seller') {
        router.replace('/(seller)/dashboard');
      } else {
        router.replace('/(buyer)/dashboard');
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={{
        marginLeft: 16,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: mode === 'admin' ? Colors.primary : Colors.backgroundSecondary,
        borderRadius: 8,
        paddingHorizontal: 12,
      }}
    >
      <Ionicons 
        name={mode === 'admin' ? 'shield' : 'shield-outline'} 
        size={18} 
        color={mode === 'admin' ? '#FFF' : Colors.textSecondary}
        style={{ marginRight: 6 }}
      />
      <Text style={{
        fontSize: 12,
        fontWeight: '600',
        color: mode === 'admin' ? '#FFF' : Colors.textSecondary,
      }}>
        {mode === 'admin' ? 'Admin' : 'User'}
      </Text>
    </TouchableOpacity>
  );
}

function BugReportButton() {
  const [modalVisible, setModalVisible] = useState(false);
  
  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          marginRight: 16,
          padding: 4,
        }}
      >
        <Ionicons name="chatbox-ellipses-outline" size={24} color={Colors.text} />
      </TouchableOpacity>
      <BugReportModal visible={modalVisible} onClose={() => {
        setModalVisible(false);
      }} />
    </>
  );
}

function RootLayoutContent() {
  const [fontsLoaded] = useFonts(
    Platform.OS !== 'web'
      ? {
          Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
        }
      : {}
  );

  useEffect(() => {
    if (fontsLoaded || Platform.OS === 'web') {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (Platform.OS !== 'web' && !fontsLoaded) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <LocationProvider>
      <AdminViewProvider>
        <ViewModeProvider>
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
                headerLeft: () => <AdminToggleButton />,
                headerRight: () => <BugReportButton />,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(buyer)" />
              <Stack.Screen name="(seller)" />
              <Stack.Screen name="(admin)" />
            </Stack>
            <StatusBar style="dark" />
          </ToastProvider>
        </ThemeProvider>
      </ViewModeProvider>
      </AdminViewProvider>
    </LocationProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

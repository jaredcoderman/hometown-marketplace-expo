import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Redirect } from 'expo-router';
import { View } from 'react-native';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { location, loading: locationLoading } = useLocation();
  const { mode, loading: modeLoading } = useViewMode();

  // Show loading while checking auth state or location
  if (authLoading || locationLoading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingSpinner fullScreen message="Loading..." />
      </View>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Logged in but no location set - redirect to onboarding
  if (!location) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  // For sellers, wait for view mode to load, then check where to redirect
  if (user.userType === 'seller') {
    if (modeLoading) {
      return (
        <View style={{ flex: 1 }}>
          <LoadingSpinner fullScreen message="Loading..." />
        </View>
      );
    }
    if (mode === 'buyer') {
      return <Redirect href="/(buyer)/dashboard" />;
    } else {
      return <Redirect href="/(seller)/dashboard" />;
    }
  }

  // Buyers always go to buyer dashboard (don't need to wait for view mode)
  return <Redirect href="/(buyer)/dashboard" />;
}


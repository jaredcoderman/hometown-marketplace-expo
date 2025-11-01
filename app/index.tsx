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

  // Show loading while checking auth state, location, or view mode
  if (authLoading || locationLoading || modeLoading) {
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

  // For sellers, check view mode to determine where to redirect
  if (user.userType === 'seller') {
    if (mode === 'buyer') {
      return <Redirect href="/(buyer)/dashboard" />;
    } else {
      return <Redirect href="/(seller)/dashboard" />;
    }
  }

  // Buyers always go to buyer dashboard
  return <Redirect href="/(buyer)/dashboard" />;
}


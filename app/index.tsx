import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { Redirect } from 'expo-router';
import { View } from 'react-native';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { location, loading: locationLoading } = useLocation();

  // Show loading while checking auth state
  if (authLoading) {
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

  // Logged in with location - redirect based on user type
  if (user.userType === 'buyer') {
    return <Redirect href="/(buyer)/dashboard" />;
  } else {
    return <Redirect href="/(seller)/dashboard" />;
  }
}


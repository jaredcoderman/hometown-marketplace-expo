import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function OnboardingScreen() {
  const { getCurrentLocation, location, loading, error } = useLocation();
  const { user } = useAuth();
  const [requesting, setRequesting] = useState(false);

  const handleGetLocation = async () => {
    setRequesting(true);
    try {
      await getCurrentLocation();
    } catch (error: any) {
      Alert.alert('Location Error', error.message || 'Failed to get location');
    } finally {
      setRequesting(false);
    }
  };

  const handleContinue = () => {
    if (!location) {
      Alert.alert('Location Required', 'Please set your location to continue');
      return;
    }

    // Navigate based on user type
    if (user?.userType === 'buyer') {
      router.replace('/(buyer)/dashboard');
    } else {
      router.replace('/(seller)/dashboard');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Setting up your location..." />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📍</Text>
        <Text style={styles.title}>Set Your Location</Text>
        <Text style={styles.description}>
          To help you find local sellers and products in your area, we need to know your location.
        </Text>

        {location ? (
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Current Location:</Text>
            <Text style={styles.locationText}>
              {location.city}, {location.state}
            </Text>
            <Text style={styles.locationSubtext}>
              {location.address || 'Location set'}
            </Text>
          </View>
        ) : (
          <View style={styles.noLocation}>
            <Text style={styles.noLocationText}>
              No location set
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <View style={styles.buttons}>
          <Button
            title={location ? 'Update Location' : 'Get My Location'}
            onPress={handleGetLocation}
            loading={requesting}
            style={styles.button}
          />

          {location && (
            <Button
              title="Continue"
              onPress={handleContinue}
              variant="primary"
              style={styles.button}
            />
          )}
        </View>

        <Text style={styles.note}>
          💡 You can change your location later in settings
        </Text>
      </View>
    </ScrollView>
  );
}

import Colors from '@/constants/Colors';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  locationInfo: {
    width: '100%',
    padding: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  locationSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  noLocation: {
    width: '100%',
    padding: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  noLocationText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  errorContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
  },
  note: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 24,
    textAlign: 'center',
  },
});


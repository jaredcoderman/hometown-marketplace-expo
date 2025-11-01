import { Button } from '@/components/ui/button';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFound() {
  const { user } = useAuth();

  const handleGoHome = () => {
    if (!user) {
      router.replace('/(auth)/login');
    } else if (user.userType === 'seller') {
      router.replace('/(seller)/dashboard');
    } else {
      router.replace('/(buyer)/dashboard');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={Colors.primary} />
        </View>
        <Text style={styles.title}>404</Text>
        <Text style={styles.subtitle}>Page Not Found</Text>
        <Text style={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Button
          title={user ? "Go to Dashboard" : "Go to Sign In"}
          onPress={handleGoHome}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.8,
  },
  title: {
    fontSize: 72,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    minWidth: 200,
  },
});


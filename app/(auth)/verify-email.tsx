import { Button } from '@/components/ui/button';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function VerifyEmailScreen() {
  const { firebaseUser, resendVerificationEmail, refreshFirebaseUser, logout } = useAuth();
  const { show } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      await resendVerificationEmail();
      show('Verification email sent! Check your inbox.', 'success');
    } catch (error: any) {
      show('Failed to send email. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={80} color={Colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Verify Your Email</Text>

          {/* Message */}
          <Text style={styles.message}>
            We've sent a verification email to:
          </Text>
          <Text style={styles.email}>
            {firebaseUser?.email}
          </Text>

          <Text style={styles.instructions}>
            Please check your inbox and click the verification link to activate your account.
          </Text>

          {/* Resend Button */}
          <View style={styles.buttonContainer}>
            <Button
              onPress={handleResendEmail}
              loading={loading}
              style={styles.resendButton}
            >
              Resend Verification Email
            </Button>
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={24} color="#666" />
            <Text style={styles.infoText}>
              Make sure to check your spam folder if you don't see the email.
            </Text>
          </View>

          {/* Already verified? */}
          <View style={styles.checkContainer}>
            <Button
              onPress={async () => {
                setChecking(true);
                try {
                  await refreshFirebaseUser();
                  // onAuthStateChanged will update the firebaseUser state, 
                  // which will trigger the redirect in index.tsx if verified
                  router.replace('/');
                } catch (error) {
                  show('Failed to check verification status', 'error');
                } finally {
                  setChecking(false);
                }
              }}
              loading={checking}
              variant="outline"
              style={styles.checkButton}
            >
              Already Verified? Check Again
            </Button>
          </View>

          {/* Logout option */}
          <View style={styles.logoutContainer}>
            <Button
              onPress={handleLogout}
              variant="ghost"
              style={styles.logoutButton}
            >
              Use Different Email
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFDFB',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  resendButton: {
    width: '100%',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
  },
  checkContainer: {
    width: '100%',
    marginBottom: 16,
  },
  checkButton: {
    width: '100%',
  },
  logoutContainer: {
    width: '100%',
  },
  logoutButton: {
    width: '100%',
  },
});


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function LoginScreen() {
  const { login, user, loading: authLoading } = useAuth();
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Redirect when user becomes available after login
  useEffect(() => {
    if (loginSuccess && user && !authLoading) {
      // Small delay to ensure all state is updated
      const timer = setTimeout(() => {
        router.replace('/');
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, user, authLoading]);

  const handleLogin = async () => {
    // Reset errors
    setErrors({});

    // Basic validation
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = 'Email is required';
      
    }
    if (!password) {
      newErrors.password = 'Password is required';
      
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      // Set flag to trigger redirect via useEffect when user state updates
      setLoginSuccess(true);
    } catch (error: any) {
      setLoginSuccess(false);
      let msg = 'Login failed. Please check your email and password.';
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
        msg = 'Incorrect email or password.';
      } else if (error?.code === 'auth/user-not-found') {
        msg = 'No account found for that email.';
      } else if (error?.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Try again later.';
      }
      show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Don't show login form if already logged in
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Sign in to continue to Hometown Marketplace
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/(auth)/signup" style={styles.signupLink}>
              <Text style={styles.signupLinkText}>Sign Up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: 16,
  },
  signupLinkText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Colors from '@/constants/Colors';

export default function LoginScreen() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      console.log('User already logged in, redirecting to dashboard');
      const targetRoute = user.userType === 'buyer' ? '/(buyer)/dashboard' : '/(seller)/dashboard';
      router.replace(targetRoute);
    }
  }, [user, authLoading, router]);

  const handleLogin = async () => {
    console.log('=== LOGIN BUTTON CLICKED ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    console.log('Loading state:', loading);
    console.log('Auth loading state:', authLoading);
    
    // Reset errors
    setErrors({});

    // Basic validation
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = 'Email is required';
      console.log('Email is empty!');
    }
    if (!password) {
      newErrors.password = 'Password is required';
      console.log('Password is empty!');
    }

    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }

    console.log('Validation passed, setting loading to true');
    setLoading(true);
    console.log('Calling login function with email:', email);
    try {
      const result = await login({ email, password });
      console.log('Login function completed successfully!', result);
      // Navigation is handled by the index screen based on user type
    } catch (error: any) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      window.alert('Login Failed: ' + (error.message || 'Please check your email and password'));
    } finally {
      console.log('Setting loading to false');
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


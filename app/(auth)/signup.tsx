import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { UserType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function SignupScreen() {
  const { signup, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { show } = useToast();
  
  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const targetRoute = user.userType === 'buyer' ? '/(buyer)/dashboard' : '/(seller)/dashboard';
      router.replace(targetRoute);
    }
  }, [user, authLoading, router]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('buyer');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emailRegex = /^(?:[a-zA-Z0-9_'^&\-]+(?:\.[a-zA-Z0-9_'^&\-]+)*)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

  const setFieldError = (field: string, message?: string) => {
    setErrors((prev) => {
      const next = { ...prev } as Record<string, string>;
      if (message) next[field] = message; else delete next[field];
      return next;
    });
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(email.trim())) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Use at least 8 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    // Validate all fields before attempting signup
    if (!validateAll()) return;

    setLoading(true);
    try {
      await signup({ name, email, password, userType });
      // Navigation is handled by the index screen
    } catch (error: any) {
      let msg = 'Signup failed. Please try again.';
      if (error?.code === 'auth/email-already-in-use') msg = 'That email is already in use.';
      else if (error?.code === 'auth/invalid-email') msg = 'Enter a valid email address.';
      else if (error?.code === 'auth/weak-password') msg = 'Password is too weak.';
      show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Don't show signup form if already logged in
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Hometown Marketplace today
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={(v) => {
              setName(v);
              setFieldError('name', v.trim() ? undefined : 'Name is required');
            }}
            placeholder="John Doe"
            error={errors.name}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (!v.trim()) setFieldError('email', 'Email is required');
              else if (!emailRegex.test(v.trim())) setFieldError('email', 'Enter a valid email');
              else setFieldError('email', undefined);
            }}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (!v) setFieldError('password', 'Password is required');
              else if (v.length < 8) setFieldError('password', 'Use at least 8 characters');
              else setFieldError('password', undefined);
              // keep confirm error up to date
              if (confirmPassword && v !== confirmPassword) setFieldError('confirmPassword', "Passwords don't match");
              else if (confirmPassword) setFieldError('confirmPassword', undefined);
            }}
            placeholder="At least 8 characters"
            secureTextEntry
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              if (!v) setFieldError('confirmPassword', 'Please confirm your password');
              else if (v !== password) setFieldError('confirmPassword', "Passwords don't match");
              else setFieldError('confirmPassword', undefined);
            }}
            placeholder="Re-enter your password"
            secureTextEntry
            error={errors.confirmPassword}
          />

          <View style={styles.userTypeContainer}>
            <Text style={styles.userTypeLabel}>I want to:</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'buyer' && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType('buyer')}
              >
                <View style={styles.userTypeContent}>
                  <Ionicons name={userType === 'buyer' ? 'cart' : 'cart-outline'} size={18} color={userType === 'buyer' ? Colors.primary : Colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      userType === 'buyer' && styles.userTypeButtonTextActive,
                    ]}
                  >
                    Buy
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'seller' && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType('seller')}
              >
                <View style={styles.userTypeContent}>
                  <Ionicons name={userType === 'seller' ? 'storefront' : 'storefront-outline'} size={18} color={userType === 'seller' ? Colors.primary : Colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      userType === 'seller' && styles.userTypeButtonTextActive,
                    ]}
                  >
                    Sell
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            style={styles.signupButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Sign In</Text>
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
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
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
  userTypeContainer: {
    marginBottom: 24,
  },
  userTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    color: Colors.text,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.card,
  },
  userTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  userTypeButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userTypeButtonTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  signupButton: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 16,
  },
  loginLinkText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});


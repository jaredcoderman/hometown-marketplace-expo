import { auth } from '@/config/firebase';
import { createUser, getUser } from '@/services/user.service';
import { LoginData, SignupData, User } from '@/types';
import {
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signup: (data: SignupData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('=== Setting up auth state listener ===');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed. Firebase user:', firebaseUser?.email || 'null');
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          console.log('Fetching user data for:', firebaseUser.uid);
          const userData = await getUser(firebaseUser.uid);
          console.log('User data retrieved:', {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            userType: userData.userType
          });
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        console.log('No firebase user, clearing state');
        setUser(null);
      }
      
      console.log('Setting loading to false');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (data: SignupData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Create user document in Firestore
      const newUser: Omit<User, 'id'> = {
        email: data.email,
        name: data.name,
        userType: data.userType,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await createUser(userCredential.user.uid, newUser);
      
      // Fetch the created user
      const userData = await getUser(userCredential.user.uid);
      setUser(userData);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const login = async (data: LoginData) => {
    console.log('=== AuthContext login function called ===');
    console.log('Attempting to sign in with email:', data.email);
    try {
      const result = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log('signInWithEmailAndPassword successful!', result.user.email);
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      console.error('=== Login error in AuthContext ===');
      console.error('Error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(error.message || 'Failed to login');
    }
  };

  const logout = async () => {
    console.log('=== Logout function called in AuthContext ===');
    try {
      console.log('Calling firebaseSignOut...');
      await firebaseSignOut(auth);
      console.log('firebaseSignOut successful');
      setUser(null);
      setFirebaseUser(null);
      console.log('User state cleared');
    } catch (error: any) {
      console.error('=== Logout error ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      throw new Error(error.message || 'Failed to logout');
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      try {
        const userData = await getUser(firebaseUser.uid);
        setUser(userData);
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signup,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


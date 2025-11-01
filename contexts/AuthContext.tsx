import { useLocation } from '@/contexts/LocationContext';
import { createUser, getUser } from '@/services/user.service';
import { LoginData, SignupData, User } from '@/types';
import { prefetchBuyerHomeAssets } from '@/utils/prefetch';
import type { Auth as FirebaseAuthType } from 'firebase/auth';
import {
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut, getAuth, onAuthStateChanged,
    sendEmailVerification,
    signInWithEmailAndPassword,
    reload
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
  resendVerificationEmail: () => Promise<void>;
  refreshFirebaseUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authInstance = getAuth() as FirebaseAuthType;
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Access location (if available) for targeted prefetching
  // Note: guards against use outside provider tree via optional usage
  let locationCtx: ReturnType<typeof useLocation> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    locationCtx = useLocation();
  } catch {}

  useEffect(() => {
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
      // Clear any pending retry when auth state changes
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
      }
      
      setLoading(true);
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          let userData = await getUser(firebaseUser.uid);
          
          setUser(userData);
          // Warm up buyer assets once we have the user
          if (userData.userType === 'buyer') {
            const loc = locationCtx?.location ?? undefined;
            const radius = locationCtx?.radiusMiles;
            prefetchBuyerHomeAssets({ location: loc, radiusMiles: radius });
          }
          setLoading(false);
        } catch (error) {
          // Only auto-create a user profile if we're CERTAIN the document doesn't exist
          // getUser() throws "User not found" when the document doesn't exist
          // Any other error (network, permission, etc.) means we should retry, not create
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Only auto-create if the error is exactly "User not found"
          if (errorMessage === 'User not found') {
            // Auto-create a minimal user profile if missing (e.g., user pre-existed before rules)
            try {
              const inferredName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User');
              const newUser: Omit<User, 'id'> = {
                email: firebaseUser.email || '',
                name: inferredName,
                userType: 'buyer',
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              await createUser(firebaseUser.uid, newUser);
              const created = await getUser(firebaseUser.uid);
              setUser(created);
              setLoading(false);
            } catch (e) {
              console.error('Failed to auto-create user:', e);
              setUser(null);
              setLoading(false);
            }
          } else {
            // Network, permission, or other error - retry once after a short delay
            // This handles temporary connection issues on page refresh
            console.error('Error fetching user (will retry once):', error);
              retryTimeoutId = setTimeout(async () => {
              // Verify firebaseUser hasn't changed
              if (firebaseUser.uid === authInstance.currentUser?.uid) {
                try {
                  const userData = await getUser(firebaseUser.uid);
                  setUser(userData);
                  if (userData.userType === 'buyer') {
                    const loc = locationCtx?.location ?? undefined;
                    const radius = locationCtx?.radiusMiles;
                    prefetchBuyerHomeAssets({ location: loc, radiusMiles: radius });
                  }
                  setLoading(false);
                } catch (retryError) {
                  // If retry also fails, check if it's truly not found
                  const retryErrorMsg = retryError instanceof Error ? retryError.message : String(retryError);
                  if (retryErrorMsg === 'User not found') {
                    // Only now create a buyer account after confirming it's truly not found
                    try {
                      const inferredName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User');
                      const newUser: Omit<User, 'id'> = {
                        email: firebaseUser.email || '',
                        name: inferredName,
                        userType: 'buyer',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      };
                      await createUser(firebaseUser.uid, newUser);
                      const created = await getUser(firebaseUser.uid);
                      setUser(created);
                      setLoading(false);
                    } catch (createError) {
                      console.error('Failed to auto-create user after retry:', createError);
                      setUser(null);
                      setLoading(false);
                    }
                  } else {
                    // Still a network/permission error after retry - give up
                    console.error('Error fetching user after retry (giving up):', retryError);
                    setUser(null);
                    setLoading(false);
                  }
                }
              }
            }, 500);
          }
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
    };
  }, []);

  const signup = async (data: SignupData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        authInstance,
        data.email,
        data.password
      );

      // Send email verification
      await sendEmailVerification(userCredential.user);

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
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const login = async (data: LoginData) => {
    try {
      await signInWithEmailAndPassword(authInstance, data.email, data.password);
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || 'Failed to login');
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(authInstance);
      setUser(null);
      setFirebaseUser(null);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to logout');
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      try {
        const userData = await getUser(firebaseUser.uid);
        setUser(userData);
      } catch (error) {
        // ignore
      }
    }
  };

  const resendVerificationEmail = async () => {
    if (firebaseUser) {
      try {
        await sendEmailVerification(firebaseUser);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to send verification email');
      }
    }
  };

  const refreshFirebaseUser = async () => {
    if (firebaseUser) {
      try {
        await reload(firebaseUser);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to refresh user');
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
    resendVerificationEmail,
    refreshFirebaseUser,
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


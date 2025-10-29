import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCE68zAhF40Rc-8DrIxCL_BH94ElzHlYWw",
  authDomain: "hometown-marketplace.firebaseapp.com",
  projectId: "hometown-marketplace",
  storageBucket: "hometown-marketplace.firebasestorage.app",
  messagingSenderId: "989322007553",
  appId: "1:989322007553:web:e43b3f832c293c21575c00",
  measurementId: "G-KPWXCXK0MH"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };


import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User, Location } from '@/types';

const USERS_COLLECTION = 'users';

export async function getUser(userId: string): Promise<User> {
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const data = userDoc.data();
  return {
    id: userDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as User;
}

export async function createUser(
  userId: string,
  userData: Omit<User, 'id'>
): Promise<void> {
  await setDoc(doc(db, USERS_COLLECTION, userId), {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserLocation(
  userId: string,
  location: Location
): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    location,
    updatedAt: serverTimestamp(),
  });
}


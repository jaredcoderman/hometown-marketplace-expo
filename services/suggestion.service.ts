import { db } from '@/config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const SUGGESTIONS_COLLECTION = 'suggestions';

export interface Suggestion {
  id?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  title: string;
  description: string;
  status: 'open' | 'under-review' | 'implemented' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export async function submitSuggestion(suggestionData: Omit<Suggestion, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
  const docRef = await addDoc(collection(db, SUGGESTIONS_COLLECTION), {
    ...suggestionData,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}


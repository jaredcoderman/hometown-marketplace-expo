import { db } from '@/config/firebase';
import { BugReport, Suggestion } from '@/types';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const BUGS_COLLECTION = 'bugs';
const SUGGESTIONS_COLLECTION = 'suggestions';

function docToBugReport(doc: any): BugReport {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    userEmail: data.userEmail,
    userName: data.userName,
    title: data.title,
    description: data.description,
    status: data.status || 'open',
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

function docToSuggestion(doc: any): Suggestion {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    userEmail: data.userEmail,
    userName: data.userName,
    title: data.title,
    description: data.description,
    status: data.status || 'open',
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

export async function getAllBugs(): Promise<BugReport[]> {
  const q = query(collection(db, BUGS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToBugReport);
}

export async function getAllSuggestions(): Promise<Suggestion[]> {
  const q = query(collection(db, SUGGESTIONS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToSuggestion);
}


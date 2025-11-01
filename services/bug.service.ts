import { db } from '@/config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const BUGS_COLLECTION = 'bugs';

export interface BugReport {
  id?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export async function submitBugReport(bugData: Omit<BugReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
  const docRef = await addDoc(collection(db, BUGS_COLLECTION), {
    ...bugData,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}


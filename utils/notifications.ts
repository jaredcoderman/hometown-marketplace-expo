import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_NOTIFICATIONS_KEY = '@hometown_marketplace_pending_notifications';

// Get the set of request IDs that have status changes the user hasn't seen
export async function getPendingNotificationIds(userId: string): Promise<Set<string>> {
  try {
    const key = `${PENDING_NOTIFICATIONS_KEY}_${userId}`;
    const data = await AsyncStorage.getItem(key);
    if (data) {
      const ids = JSON.parse(data) as string[];
      return new Set(ids);
    }
    return new Set();
  } catch (error) {
    console.error('Error loading pending notifications:', error);
    return new Set();
  }
}

// Add a request ID to pending notifications (when status changes from pending to approved/rejected)
export async function addPendingNotification(userId: string, requestId: string): Promise<void> {
  try {
    const key = `${PENDING_NOTIFICATIONS_KEY}_${userId}`;
    const pending = await getPendingNotificationIds(userId);
    pending.add(requestId);
    await AsyncStorage.setItem(key, JSON.stringify(Array.from(pending)));
  } catch (error) {
    console.error('Error adding pending notification:', error);
  }
}

// Clear all pending notifications (when user views the requests tab)
export async function clearPendingNotifications(userId: string): Promise<void> {
  try {
    const key = `${PENDING_NOTIFICATIONS_KEY}_${userId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing pending notifications:', error);
  }
}


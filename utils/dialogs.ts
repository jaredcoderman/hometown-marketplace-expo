import { Alert, Platform } from 'react-native';

export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    if (title && message) {
      window.alert(`${title}: ${message}`);
    } else {
      window.alert(title || message || '');
    }
    return;
  }
  Alert.alert(title, message);
}

export function confirmAsync(message: string, title: string = 'Confirm'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', onPress: () => resolve(true) },
    ]);
  });
}



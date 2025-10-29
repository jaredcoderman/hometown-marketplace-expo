import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';
import * as ImagePicker from 'expo-image-picker';

export async function uploadImage(
  uri: string,
  path: string
): Promise<string> {
  try {
    // Fetch the image data
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a reference to the storage location
    const storageRef = ref(storage, path);

    // Upload the file
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

export async function uploadProductImages(
  productId: string,
  imageUris: string[]
): Promise<string[]> {
  const uploadPromises = imageUris.map((uri, index) => {
    const path = `products/${productId}/${Date.now()}_${index}`;
    return uploadImage(uri, path);
  });

  return Promise.all(uploadPromises);
}

export async function uploadUserAvatar(
  userId: string,
  imageUri: string
): Promise<string> {
  const path = `users/${userId}/avatar_${Date.now()}`;
  return uploadImage(imageUri, path);
}

export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
}

export async function pickImage(): Promise<string | null> {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      throw new Error('Permission to access media library is required');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
}

export async function pickMultipleImages(): Promise<string[]> {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      throw new Error('Permission to access media library is required');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      return result.assets.map((asset) => asset.uri);
    }

    return [];
  } catch (error) {
    console.error('Error picking images:', error);
    throw error;
  }
}


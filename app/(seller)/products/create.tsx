import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { createProduct } from '@/services/product.service';
import { getSellerByUserId } from '@/services/seller.service';
import { pickMultipleImages, uploadProductImages } from '@/services/storage.service';
import { confirmAsync, showAlert } from '@/utils/dialogs';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CreateProductScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePickImages = async () => {
    try {
      const uris = await pickMultipleImages();
      setImageUris([...imageUris, ...uris]);
    } catch (error: any) {
      showAlert('Failed to pick images', error.message || 'Unknown error');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUris(imageUris.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Product name is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (!category.trim()) newErrors.category = 'Category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    if (!user) return;

    setLoading(true);
    try {
      // Get seller info
      const seller = await getSellerByUserId(user.id);
      if (!seller) {
        showAlert('Profile Required', 'Seller profile not found. Please complete your profile first.');
        router.push('/(seller)/profile');
        return;
      }

      // Create product ID first
      const tempProductId = `temp_${Date.now()}`;

      // Upload images if any
      let imageUrls: string[] = [];
      if (imageUris.length > 0) {
        imageUrls = await uploadProductImages(tempProductId, imageUris);
      }

      // Create product
      const productId = await createProduct({
        sellerId: seller.id,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category.trim(),
        images: imageUrls,
        inStock: true,
        quantity: quantity ? parseInt(quantity) : undefined,
      });

      
      // Clear all fields
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setQuantity('');
      setImageUris([]);
      setErrors({});
      
      // Show success message and ask what to do next
      const viewProduct = await confirmAsync('Product created successfully! Would you like to view it now?');
      
      if (viewProduct) {
        router.push(`/(seller)/products/${productId}`);
      }
      // Otherwise stay on the page with cleared fields to create another product
    } catch (error: any) {
      console.error('Error creating product:', error);
      showAlert('Failed to create product', error.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Product',
          headerShown: true,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Input
              label="Product Name *"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Handmade Ceramic Mug"
              error={errors.name}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your product..."
                multiline
                numberOfLines={4}
                style={styles.textArea}
                error={errors.description}
              />
            </View>

            <Input
              label="Price (USD) *"
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.price}
            />

            <Input
              label="Category *"
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., Pottery, Jewelry, Art"
              error={errors.category}
            />

            <Input
              label="Quantity (Optional)"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Available quantity"
              keyboardType="number-pad"
            />

            {/* Images Section */}
            <View style={styles.imageSection}>
              <Text style={styles.label}>Product Images</Text>
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={handlePickImages}
              >
                <Ionicons name="image-outline" size={32} color={Colors.textSecondary} style={{ marginBottom: 8 }} />
                <Text style={styles.imagePickerText}>Add Images</Text>
              </TouchableOpacity>

              {imageUris.length > 0 && (
                <View style={styles.imageGrid}>
                  {imageUris.map((uri, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image source={{ uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage(index)}
                      >
                        <Text style={styles.removeImageText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <Button
              title="Create Product"
              onPress={handleCreate}
              loading={loading}
              style={styles.createButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageSection: {
    marginBottom: 24,
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  imagePickerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePickerText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  imageItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    marginTop: 8,
  },
});


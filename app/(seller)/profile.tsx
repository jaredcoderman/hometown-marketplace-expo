import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { createSeller, getSellerByUserId, updateSeller } from '@/services/seller.service';
import { Seller } from '@/types';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Colors from '@/constants/Colors';

export default function SellerProfileScreen() {
  const { user, logout } = useAuth();
  const { location } = useLocation();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSellerProfile();
  }, [user]);

  const loadSellerProfile = async () => {
    if (!user) return;

    try {
      const sellerData = await getSellerByUserId(user.id);
      if (sellerData) {
        setSeller(sellerData);
        setBusinessName(sellerData.businessName);
        setDescription(sellerData.description);
        setCategories(sellerData.categories?.join(', ') || '');
      }
    } catch (error) {
      console.error('Error loading seller profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!businessName.trim()) newErrors.businessName = 'Business name is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    if (!categories.trim()) newErrors.categories = 'At least one category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!user || !location) {
      window.alert('User or location information missing');
      return;
    }

    setSaving(true);
    try {
      const categoryArray = categories
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      if (seller) {
        // Update existing seller
        await updateSeller(seller.id, {
          businessName: businessName.trim(),
          description: description.trim(),
          categories: categoryArray,
          location,
        });
        window.alert('Profile updated successfully!');
      } else {
        // Create new seller
        await createSeller(user.id, {
          userId: user.id,
          businessName: businessName.trim(),
          description: description.trim(),
          categories: categoryArray,
          location,
        });
        window.alert('Seller profile created successfully!');
        router.replace('/(seller)/dashboard');
      }

      await loadSellerProfile();
    } catch (error: any) {
      console.error('Error saving seller profile:', error);
      window.alert('Error: ' + (error.message || 'Failed to save profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    console.log('Logout button clicked');
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      try {
        console.log('Calling logout function...');
        await logout();
        console.log('Logout successful, redirecting...');
        router.replace('/(auth)/login');
      } catch (error: any) {
        console.error('Logout error:', error);
        window.alert('Failed to logout: ' + (error.message || 'Unknown error'));
      }
    } else {
      console.log('Logout cancelled');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading profile..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {businessName.charAt(0).toUpperCase() || user?.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🏪 Seller</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>
            {seller ? 'Edit Seller Profile' : 'Create Seller Profile'}
          </Text>

          <Input
            label="Business Name *"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Your business name"
            error={errors.businessName}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Tell buyers about your products and business..."
              multiline
              numberOfLines={4}
              style={styles.textArea}
              error={errors.description}
            />
          </View>

          <Input
            label="Categories *"
            value={categories}
            onChangeText={setCategories}
            placeholder="e.g., Pottery, Jewelry, Art (comma separated)"
            error={errors.categories}
          />

          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>📍 Your Location:</Text>
            <Text style={styles.locationText}>
              {location ? `${location.city}, ${location.state}` : 'Not set'}
            </Text>
          </View>

          <Button
            title={seller ? 'Update Profile' : 'Create Profile'}
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />

          <View style={styles.section}>
            <Button title="Logout" onPress={handleLogout} variant="danger" />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: Colors.card,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
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
  locationInfo: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  locationLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  saveButton: {
    marginBottom: 24,
  },
  section: {
    marginTop: 24,
  },
});


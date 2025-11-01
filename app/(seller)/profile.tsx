import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/contexts/ToastContext';
import { createSeller, getSellerByUserId, updateSeller } from '@/services/seller.service';
import { pickImage, uploadUserAvatar } from '@/services/storage.service';
import { Seller } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  const [venmo, setVenmo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { show } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);

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
        setVenmo(sellerData.venmo || '');
        setAvatarUrl(sellerData.avatar || null);
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
      show('User or location information missing', 'error');
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
        const updateData: any = {
          businessName: businessName.trim(),
          description: description.trim(),
          categories: categoryArray,
          location,
        };
        if (avatarUrl) {
          updateData.avatar = avatarUrl;
        }
        if (venmo.trim()) {
          updateData.venmo = venmo.trim().replace(/^@/, ''); // Remove leading @ if present
        } else {
          updateData.venmo = null; // Clear venmo if empty
        }
        await updateSeller(seller.id, updateData);
        show('Profile updated successfully!', 'success');
      } else {
        // Create new seller
        const sellerData: any = {
          userId: user.id,
          businessName: businessName.trim(),
          description: description.trim(),
          categories: categoryArray,
          location,
        };
        if (avatarUrl) {
          sellerData.avatar = avatarUrl;
        }
        if (venmo.trim()) {
          sellerData.venmo = venmo.trim().replace(/^@/, ''); // Remove leading @ if present
        }
        await createSeller(user.id, sellerData);
        show('Seller profile created successfully!', 'success');
        router.replace('/(seller)/dashboard');
      }

      await loadSellerProfile();
    } catch (error: any) {
      console.error('Error saving seller profile:', error);
      show('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setConfirmLogoutVisible(true);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading profile..." />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/(seller)/dashboard')}
              style={{ marginLeft: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
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
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>
                  {businessName.charAt(0).toUpperCase() || user?.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Button
              title={uploadingAvatar ? 'Uploading...' : 'Change Photo'}
              onPress={async () => {
                try {
                  setUploadingAvatar(true);
                  const uri = await pickImage();
                  if (!uri || !user) { setUploadingAvatar(false); return; }
                  const url = await uploadUserAvatar(user.id, uri);
                  setAvatarUrl(url);
                  show('Profile photo updated', 'success');
                } catch (e: any) {
                  show('Failed to update photo', 'error');
                } finally {
                  setUploadingAvatar(false);
                }
              }}
              variant="outline"
              size="small"
              style={styles.changePhotoBtn}
            />
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <Ionicons name="storefront-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>Seller</Text>
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

          <Input
            label="Venmo (Optional)"
            value={venmo}
            onChangeText={(text) => setVenmo(text.replace(/^@/, ''))}
            placeholder="Your Venmo username"
          />

          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>📍 Your Location:</Text>
            <Text style={styles.locationText}>
              {location ? `${location.city}, ${location.state}` : 'Not set'}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <Button
              title={seller ? 'Update Profile' : 'Create Profile'}
              onPress={handleSave}
              loading={saving}
              style={{ flex: 1 }}
            />
            <Button title="Logout" onPress={handleLogout} variant="danger" style={{ flex: 1, marginLeft: 8 }} />
          </View>
        </View>
      </ScrollView>
      <ConfirmModal
        visible={confirmLogoutVisible}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onCancel={() => setConfirmLogoutVisible(false)}
        onConfirm={async () => {
          setConfirmLogoutVisible(false);
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch (error: any) {
            show('Failed to logout', 'error');
          }
        }}
      />
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
    flexGrow: 1,
  },
  header: {
    backgroundColor: Colors.card,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.avatarRing,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  changePhotoBtn: {
    marginTop: 4,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '600',
  },
  avatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
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
  badgeRow: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  section: {
    marginTop: 24,
  },
});


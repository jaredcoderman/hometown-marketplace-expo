import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { router } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '@/constants/Colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { location, getCurrentLocation } = useLocation();

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

  const handleUpdateLocation = async () => {
    try {
      await getCurrentLocation();
      window.alert('Location updated successfully');
    } catch (error: any) {
      window.alert('Failed to update location: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>👤 Buyer</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.card}>
          {location ? (
            <>
              <Text style={styles.cardText}>
                📍 {location.city}, {location.state}
              </Text>
              <Text style={styles.cardSubtext}>{location.address}</Text>
            </>
          ) : (
            <Text style={styles.cardText}>No location set</Text>
          )}
          <Button
            title="Update Location"
            onPress={handleUpdateLocation}
            variant="outline"
            size="small"
            style={styles.cardButton}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Preferences</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  cardButton: {
    marginTop: 8,
  },
  menuItem: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  menuItemArrow: {
    fontSize: 24,
    color: Colors.disabled,
  },
});


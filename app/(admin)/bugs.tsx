import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getAllBugs } from '@/services/admin.service';
import { BugReport } from '@/types';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

export default function AdminBugsScreen() {
  const { user } = useAuth();
  const { show } = useToast();
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) {
      router.replace('/(buyer)/dashboard');
      return;
    }
    loadBugs();
  }, [user]);

  const loadBugs = async () => {
    try {
      const data = await getAllBugs();
      setBugs(data);
    } catch (error: any) {
      console.error('Error loading bugs:', error);
      show('Failed to load bug reports', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBugs();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return Colors.warning;
      case 'investigating': return Colors.primary;
      case 'resolved': return Colors.success;
      case 'closed': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'open': return '#FFF9E6';
      case 'investigating': return '#E3F2FD';
      case 'resolved': return '#E8F5E9';
      case 'closed': return '#F5F5F5';
      default: return '#F5F5F5';
    }
  };

  const renderBug = ({ item }: { item: BugReport }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBackground(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.description}>{item.description}</Text>
      
      <View style={styles.meta}>
        {item.userName && (
          <Text style={styles.metaText}>From: {item.userName}</Text>
        )}
        {item.userEmail && (
          <Text style={styles.metaText}>Email: {item.userEmail}</Text>
        )}
        <Text style={styles.date}>{item.createdAt.toLocaleDateString()}</Text>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading bug reports..." />;
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <View style={styles.container}>
      {bugs.length === 0 ? (
        <EmptyState title="No Bug Reports" description="No bug reports have been submitted yet." />
      ) : (
        <FlatList
          data={bugs}
          renderItem={renderBug}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  meta: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});


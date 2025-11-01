import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getAllSuggestions } from '@/services/admin.service';
import { Suggestion } from '@/types';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

export default function AdminSuggestionsScreen() {
  const { user } = useAuth();
  const { show } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) {
      router.replace('/(buyer)/dashboard');
      return;
    }
    loadSuggestions();
  }, [user]);

  const loadSuggestions = async () => {
    try {
      const data = await getAllSuggestions();
      setSuggestions(data);
    } catch (error: any) {
      console.error('Error loading suggestions:', error);
      show('Failed to load suggestions', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSuggestions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return Colors.warning;
      case 'under-review': return Colors.primary;
      case 'implemented': return Colors.success;
      case 'closed': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'open': return '#FFF9E6';
      case 'under-review': return '#E3F2FD';
      case 'implemented': return '#E8F5E9';
      case 'closed': return '#F5F5F5';
      default: return '#F5F5F5';
    }
  };

  const renderSuggestion = ({ item }: { item: Suggestion }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBackground(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('-', ' ').toUpperCase()}
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
    return <LoadingSpinner fullScreen message="Loading suggestions..." />;
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <View style={styles.container}>
      {suggestions.length === 0 ? (
        <EmptyState title="No Suggestions" description="No suggestions have been submitted yet." />
      ) : (
        <FlatList
          data={suggestions}
          renderItem={renderSuggestion}
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


import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SellerWithDistance } from '@/types';
import { formatDistance } from '@/utils/location';

interface SellerCardProps {
  seller: SellerWithDistance;
  onPress: () => void;
}

export function SellerCard({ seller, onPress }: SellerCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        {seller.avatar ? (
          <Image source={{ uri: seller.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {seller.businessName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.businessName}>{seller.businessName}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {seller.description}
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.distance}>
            📍 {formatDistance(seller.distance)}
          </Text>
          {seller.rating > 0 && (
            <Text style={styles.rating}>
              ⭐ {seller.rating.toFixed(1)} ({seller.reviewCount})
            </Text>
          )}
        </View>
        
        {seller.categories && seller.categories.length > 0 && (
          <View style={styles.categories}>
            {seller.categories.slice(0, 3).map((category, index) => (
              <View key={index} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distance: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 12,
  },
  rating: {
    fontSize: 14,
    color: '#666',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
});


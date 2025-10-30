import { LazyImage } from '@/components/ui/lazy-image';
import Colors from '@/constants/Colors';
import { Product } from '@/types';
import { formatPrice } from '@/utils/formatters';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // kept for reference; card now uses responsive width

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  showStatus?: boolean;
  fullWidth?: boolean; // when true, card stretches to parent width (used in buyer seller page)
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  favoritesCount?: number;
}

export function ProductCard({
  product,
  onPress,
  showStatus = false,
  fullWidth = false,
  isFavorite,
  onToggleFavorite,
  favoritesCount,
}: ProductCardProps) {
  return (
    <TouchableOpacity style={[styles.card]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.imageContainer]}>
        {product.images && product.images.length > 0 ? (
          <LazyImage uri={product.images[0]} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            {product.emoji ? (
              <Text style={styles.emoji}>{product.emoji}</Text>
            ) : (
              <Text style={styles.placeholderText}>No Image</Text>
            )}
          </View>
        )}
        {typeof product.quantity !== 'undefined' && (
          <View style={styles.qtyBadge}>
            <Text style={styles.qtyText}>Qty: {product.quantity}</Text>
          </View>
        )}
        {onToggleFavorite && (
          <TouchableOpacity style={styles.heartButton} onPress={(e) => { e.stopPropagation(); onToggleFavorite(); }}>
            <Text style={[styles.heartText, isFavorite ? styles.heartActive : undefined]}>{isFavorite ? '♥' : '♡'}</Text>
            {typeof favoritesCount === 'number' && (
              <Text style={styles.heartCount}>{favoritesCount}</Text>
            )}
          </TouchableOpacity>
        )}
        {!product.inStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={styles.category}>{product.category}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Square
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: Colors.textLight,
    fontSize: 14,
  },
  emoji: {
    fontSize: 64,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  outOfStockText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  qtyBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heartButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartText: {
    fontSize: 16,
    color: '#666',
  },
  heartActive: {
    color: '#d9534f',
  },
  heartCount: {
    marginLeft: 6,
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    height: 40, // Fixed height for 2 lines
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});


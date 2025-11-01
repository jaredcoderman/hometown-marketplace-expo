import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface StarRatingProps {
  rating: number;
  size?: number;
  readonly?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({ 
  rating, 
  size = 20, 
  readonly = false,
  onRatingChange 
}: StarRatingProps) {
  const handleStarPress = (starValue: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((starValue) => (
        <TouchableOpacity
          key={starValue}
          onPress={() => handleStarPress(starValue)}
          disabled={readonly}
          activeOpacity={readonly ? 1 : 0.7}
        >
          <Ionicons
            name={starValue <= rating ? 'star' : 'star-outline'}
            size={size}
            color="#FFA726"
            style={styles.star}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 2,
  },
});

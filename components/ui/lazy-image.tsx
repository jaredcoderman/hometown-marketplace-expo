import React from 'react';
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';

type LazyImageProps = ExpoImageProps & {
  uri: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
};

export function LazyImage({ uri, style, width = '100%', height = '100%', borderRadius = 0, ...rest }: LazyImageProps) {
  return (
    <ExpoImage
      source={{ uri }}
      style={[{ width, height, borderRadius }, style]}
      contentFit="cover"
      transition={150}
      cachePolicy="memory-disk"
      // On web, expo-image sets loading="lazy" by default unless priority is high
      priority="low"
      {...rest}
    />
  );
}

export async function prefetchImages(urls: string[]) {
  const unique = Array.from(new Set(urls.filter(Boolean)));
  await Promise.allSettled(unique.map((u) => ExpoImage.prefetch(u)));
}



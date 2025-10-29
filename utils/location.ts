import { Location } from '@/types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return 'Less than 0.1 mi';
  }
  if (miles < 1) {
    return `${miles.toFixed(1)} mi`;
  }
  return `${miles.toFixed(1)} mi`;
}

/**
 * Get geohash bounds for a location and radius
 * Used for Firestore geoqueries
 */
export function getGeohashRange(
  latitude: number,
  longitude: number,
  radiusMiles: number
): { lower: string; upper: string } {
  const { geohashForLocation, geohashQueryBounds } = require('geofire-common');
  
  const center = [latitude, longitude];
  const radiusInM = radiusMiles * 1609.34; // Convert miles to meters
  
  const bounds = geohashQueryBounds(center, radiusInM);
  return bounds[0]; // Returns first bound pair
}

/**
 * Generate geohash for a location
 */
export function generateGeohash(latitude: number, longitude: number): string {
  const { geohashForLocation } = require('geofire-common');
  return geohashForLocation([latitude, longitude]);
}

/**
 * Check if a location is within a certain radius
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusMiles: number
): boolean {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusMiles;
}


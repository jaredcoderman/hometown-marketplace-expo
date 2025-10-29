import { Location } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoLocation from 'expo-location';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface LocationContextType {
  location: Location | null;
  loading: boolean;
  error: string | null;
  radiusMiles: number;
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<void>;
  setLocation: (location: Location) => Promise<void>;
  setRadiusMiles: (radius: number) => void;
  clearLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_STORAGE_KEY = '@hometown_marketplace_location';
const RADIUS_STORAGE_KEY = '@hometown_marketplace_radius';

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusMiles, setRadiusMilesState] = useState(10); // Default 10 miles

  useEffect(() => {
    loadStoredLocation();
  }, []);

  const loadStoredLocation = async () => {
    try {
      const [storedLocation, storedRadius] = await Promise.all([
        AsyncStorage.getItem(LOCATION_STORAGE_KEY),
        AsyncStorage.getItem(RADIUS_STORAGE_KEY),
      ]);

      if (storedLocation) {
        setLocationState(JSON.parse(storedLocation));
      }

      if (storedRadius) {
        setRadiusMilesState(parseFloat(storedRadius));
      }
    } catch (error) {
      console.error('Error loading stored location:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setError('Failed to request location permission');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      // Reverse geocode to get address (best-effort on web)
      let address: any | undefined;
      try {
        const addresses = await ExpoLocation.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        address = addresses?.[0];
      } catch (geocodeErr) {
        console.warn('Reverse geocoding failed, continuing with coords only:', geocodeErr);
      }

      // If Expo reverse geocode didn't give city/state, try Nominatim (no key, dev-friendly)
      if (!address || (!address.city && !address.region)) {
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
          const resp = await fetch(url, {
            headers: {
              'Accept-Language': 'en',
              // User-Agent per Nominatim usage policy
              'User-Agent': 'HometownMarketplace/1.0 (contact: dev@example.com)'
            },
          });
          if (resp.ok) {
            const nomi = await resp.json();
            const a = nomi?.address || {};
            address = {
              street: a.road || a.pedestrian || a.footway,
              city: a.city || a.town || a.village || a.hamlet,
              region: a.state || a.region,
              postalCode: a.postcode,
            };
          }
        } catch (nomiErr) {
          console.warn('OSM reverse geocoding failed:', nomiErr);
        }
      }
      const newLocation: Location = {
        latitude,
        longitude,
        address: address
          ? `${address?.street || ''}${address?.street ? ', ' : ''}${address?.city || ''}${address?.city ? ', ' : ''}${address?.region || ''}`.trim()
          : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        city: address?.city,
        state: address?.region,
        zipCode: address?.postalCode,
      };

      await setLocation(newLocation);
    } catch (error: any) {
      console.error('Error getting current location:', error);
      // Web fallback via IP-based geolocation (approximate)
      try {
        const resp = await fetch('https://ipapi.co/json/');
        if (resp.ok) {
          const data = await resp.json();
          const lat = parseFloat(data.latitude);
          const lon = parseFloat(data.longitude);
          if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
            const fallbackLoc: Location = {
              latitude: lat,
              longitude: lon,
              address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
              city: data.city,
              state: data.region,
              zipCode: data.postal,
            };
            await setLocation(fallbackLoc);
            setLoading(false);
            return;
          }
        }
        setError(error.message || 'Failed to get current location');
      } catch (ipErr) {
        console.warn('IP geolocation fallback failed:', ipErr);
        setError(error.message || 'Failed to get current location');
      }
    } finally {
      setLoading(false);
    }
  };

  const setLocation = async (newLocation: Location) => {
    try {
      setLocationState(newLocation);
      await AsyncStorage.setItem(
        LOCATION_STORAGE_KEY,
        JSON.stringify(newLocation)
      );
      setError(null);
    } catch (error) {
      console.error('Error saving location:', error);
      setError('Failed to save location');
    }
  };

  const setRadiusMiles = async (radius: number) => {
    try {
      setRadiusMilesState(radius);
      await AsyncStorage.setItem(RADIUS_STORAGE_KEY, radius.toString());
    } catch (error) {
      console.error('Error saving radius:', error);
    }
  };

  const clearLocation = async () => {
    try {
      setLocationState(null);
      await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
      setError(null);
    } catch (error) {
      console.error('Error clearing location:', error);
    }
  };

  const value: LocationContextType = {
    location,
    loading,
    error,
    radiusMiles,
    requestLocationPermission,
    getCurrentLocation,
    setLocation,
    setRadiusMiles,
    clearLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}


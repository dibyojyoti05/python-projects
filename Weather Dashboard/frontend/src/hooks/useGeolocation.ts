import { useState } from 'react';
import { LocationSearchItem } from '@/types/weather';

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      }
    });
  };

  const getDeviceLocation = async (): Promise<LocationSearchItem | null> => {
    setLoading(true);
    setError(null);
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      // Since OpenMeteo doesn't have a direct /reverse geocoding endpoint returning the exact same LocationSearchItem schema,
      // in a real prod app we'd call our backend /api/geocoding/reverse. 
      // For now, we simulate the LocationSearchItem from coordinates.
      
      return {
        id: Math.floor(Math.random() * 100000),
        name: "Current Location",
        admin1: null,
        country: "Unknown",
        latitude,
        longitude,
        timezone: "auto"
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Unable to retrieve location.");
      } else {
        setError("Unable to retrieve location.");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { getDeviceLocation, loading, error };
}

import * as Location from 'expo-location';
import { useCallback } from 'react';

const GPS_TIMEOUT_MS = 8000;

async function getCurrentPositionWithTimeout(): Promise<Location.LocationObject | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), GPS_TIMEOUT_MS);
  });

  const locationPromise = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  }).catch(() => null);

  const result = await Promise.race([locationPromise, timeoutPromise]);

  if (timer) {
    clearTimeout(timer);
  }

  return result;
}

/**
 * Niestandardowy hak do pobierania bieżącej lokalizacji użytkownika.
 * @returns {{getLocation: () => Promise<{latitude: number, longitude: number, city: string} | null>}} Obiekt zawierający funkcję `getLocation`.
 */
export const useCurrentLocation = () => {
  const getLocation = useCallback(
    async (options?: { forceFresh?: boolean }): Promise<{
      latitude: number;
      longitude: number;
      city: string;
    } | null> => {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        console.warn('Lokalizacja jest wylaczona na urzadzeniu');
        return null;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Brak uprawnień do lokalizacji');
        return null;
      }

      const forceFresh = options?.forceFresh ?? false;

      const current = await getCurrentPositionWithTimeout();
      const lastKnown = forceFresh ? null : await Location.getLastKnownPositionAsync();
      const location = current ?? lastKnown;

      if (!location) {
        console.warn('Nie udalo sie pobrac pozycji GPS w wymaganym czasie');
        return null;
      }

      let city = '';
      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        city = reverse[0]?.city || reverse[0]?.region || reverse[0]?.subregion || '';
      } catch (err) {
        console.warn('Native reverse geocoding failed:', err);
        // Fallback to Nominatim HTTP lookup
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
          );
          const data = await resp.json();
          city = data?.address?.city || data?.address?.town || data?.address?.village || '';
        } catch (httpErr) {
          console.warn('Fallback reverse geocoding failed:', httpErr);
        }
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city,
      };
    },
    [],
  );

  return { getLocation };
};

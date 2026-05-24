import * as ImagePicker from 'expo-image-picker';
import { savePhotoToAppDirectory } from '../storage/fileHelpers';

/**
 * Hook do wykonania zdjęcia i zapisania go lokalnie
 */
export const useCameraCapture = () => {
  const pickPhotoFromLibrary = async (): Promise<string | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      console.warn('Brak uprawnien do galerii');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return null;
    }

    const savedUri = await savePhotoToAppDirectory(result.assets[0].uri);
    return savedUri;
  };

  const takePhoto = async (): Promise<string | null> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      console.warn('Brak uprawnień do kamery');
      return pickPhotoFromLibrary();
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        const savedUri = await savePhotoToAppDirectory(photoUri);
        return savedUri;
      }
    } catch (error) {
      console.warn('Uruchomienie aparatu nie powiodlo sie, przejscie do galerii:', error);
      return pickPhotoFromLibrary();
    }

    return pickPhotoFromLibrary();
  };

  return { takePhoto, pickPhotoFromLibrary };
};

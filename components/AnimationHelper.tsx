import { Platform } from 'react-native';

/**
 * Platform'a göre animasyon ayarlarını döndürür
 * Web platformunda useNativeDriver false olmalı
 */
export const getAnimationConfig = () => {
  return {
    useNativeDriver: Platform.OS !== 'web',
  };
};

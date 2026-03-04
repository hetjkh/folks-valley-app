import { Platform } from 'react-native';

/**
 * Font configuration for system-installed Gilroy font
 * Adjust these names based on how Gilroy appears in your system
 */
export const GilroyFonts = {
  regular: Platform.select({
    ios: 'Gilroy-Regular',
    android: 'Gilroy-Regular',
    web: 'Gilroy, Gilroy-Regular, system-ui, sans-serif',
    default: 'Gilroy-Regular',
  }),
  medium: Platform.select({
    ios: 'Gilroy-Medium',
    android: 'Gilroy-Medium',
    web: 'Gilroy, Gilroy-Medium, system-ui, sans-serif',
    default: 'Gilroy-Medium',
  }),
  semibold: Platform.select({
    ios: 'Gilroy-SemiBold',
    android: 'Gilroy-SemiBold',
    web: 'Gilroy, Gilroy-SemiBold, system-ui, sans-serif',
    default: 'Gilroy-SemiBold',
  }),
  bold: Platform.select({
    ios: 'Gilroy-Bold',
    android: 'Gilroy-Bold',
    web: 'Gilroy, Gilroy-Bold, system-ui, sans-serif',
    default: 'Gilroy-Bold',
  }),
};

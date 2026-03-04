import { useFonts as useExpoFonts } from 'expo-font';

// Load Gilroy font files from assets/fonts/
// Using simplified names that match the codebase usage
export function useFonts() {
  const [fontsLoaded, fontError] = useExpoFonts({
    // Main font name used in StyleSheet (maps to Regular)
    'Gilroy': require('../assets/fonts/Gilroy-Regular.ttf'),
    // Variants used in StyleSheet
    'Gilroy-Medium': require('../assets/fonts/Gilroy-Medium.ttf'),
    'Gilroy-SemiBold': require('../assets/fonts/Gilroy-SemiBold.ttf'),
    'Gilroy-Bold': require('../assets/fonts/Gilroy-Bold.ttf'),
    // Also load with full names for Tailwind compatibility
    'Gilroy-Regular': require('../assets/fonts/Gilroy-Regular.ttf'),
  });

  if (fontError) {
    console.error('Error loading fonts:', fontError);
  }

  return fontsLoaded;
}


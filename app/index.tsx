import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getToken, getCurrentUser } from '@/utils/api';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const token = await getToken();
      if (token) {
        // Verify token is valid by making a request
        try {
          await getCurrentUser();
          // Token is valid, redirect to dashboard
          router.replace('/dashboard');
        } catch (error) {
          // Token is invalid, redirect to login
          router.replace('/login');
        }
      } else {
        // No token, redirect to login
        router.replace('/login');
      }
    } catch (error) {
      // Error checking auth, redirect to login
      router.replace('/login');
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}


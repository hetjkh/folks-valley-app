import { useTheme } from '@/contexts/ThemeContext';
import { getCurrentUser, getToken, loginUser } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        try {
          await getCurrentUser();
          // User is already authenticated, redirect to dashboard
          router.replace('/dashboard');
          return;
        } catch (error) {
          // Token is invalid, continue to login screen
        }
      }
    } catch (error) {
      // Error checking auth, continue to login screen
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await loginUser(email, password);
      router.replace('/dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: colors.bg }}
    >
      <View className="absolute top-12 right-6 z-10">
        <TouchableOpacity 
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.toggle }}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-md mx-auto">
          {/* Logo */}
          <View className="items-center mb-12">
            <Image
              source={require('@/assets/images/logo.png')}
              style={{ width: 350, height: 140 }}
              contentFit="contain"
            />
          </View>

          {/* Welcome Text */}
          <View className="mb-10">
            <Text className="font-gilroy-bold text-3xl mb-3 text-center" style={{ color: colors.text }}>
              Welcome Back
            </Text>
            <Text className="font-gilroy text-base text-center" style={{ color: colors.textSecondary }}>
              Sign in to continue
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="font-gilroy-medium text-sm mb-2" style={{ color: colors.textSecondary }}>
                Email
              </Text>
              <TextInput
                className="w-full px-4 py-3 rounded-full text-base"
                style={{ 
                  backgroundColor: colors.input,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                  borderRadius: 9999,
                }}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            <View>
              <Text className="font-gilroy-medium text-sm mb-2" style={{ color: colors.textSecondary }}>
                Password
              </Text>
              <TextInput
                className="w-full px-4 py-3 rounded-full text-base"
                style={{ 
                  backgroundColor: colors.input,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                  borderRadius: 9999,
                }}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              className="w-full py-4 rounded-full mt-6"
              style={{ backgroundColor: '#D2FD00', borderRadius: 9999 }}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text className="font-gilroy-bold text-black text-center text-base">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Don't have an account?{' '}
              </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text className="font-gilroy-semibold text-sm" style={{ color: '#D2FD00' }}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


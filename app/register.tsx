import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { registerUser, getToken, getCurrentUser } from '@/utils/api';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/utils/theme-colors';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
          // Token is invalid, continue to register screen
        }
      }
    } catch (error) {
      // Error checking auth, continue to register screen
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Validate username format
    if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
      Alert.alert('Error', 'Username can only contain lowercase letters, numbers, and underscores');
      return;
    }

    if (username.length < 3 || username.length > 30) {
      Alert.alert('Error', 'Username must be between 3 and 30 characters');
      return;
    }

    setLoading(true);
    try {
      await registerUser(name, username.toLowerCase(), email, password, confirmPassword);
      router.replace('/dashboard');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
    >
      <View className="absolute top-12 right-6 z-10">
        <TouchableOpacity 
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: isDark ? '#272727' : '#000000' }}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32 }}
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
            <Text className="font-gilroy-bold text-3xl mb-3 text-center" style={{ color: isDark ? '#ffffff' : '#111827' }}>
              Create Account
            </Text>
            <Text className="font-gilroy text-base text-center" style={{ color: isDark ? '#9CA3AF' : '#4B5563' }}>
              Sign up to get started
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="font-gilroy-medium text-sm mb-2" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
                Name
              </Text>
              <TextInput
                className="w-full px-4 py-3 rounded-full text-base"
                style={{ 
                  backgroundColor: isDark ? '#0D0D0D' : '#F9FAFB',
                  borderWidth: 1,
                  borderColor: isDark ? '#272727' : '#E5E7EB',
                  color: isDark ? '#ffffff' : '#111827',
                  borderRadius: 9999,
                }}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View>
              <Text className="font-gilroy-medium text-sm mb-2" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
                Username
              </Text>
              <TextInput
                className="w-full px-4 py-3 rounded-full text-base"
                style={{ 
                  backgroundColor: isDark ? '#0D0D0D' : '#F9FAFB',
                  borderWidth: 1,
                  borderColor: isDark ? '#272727' : '#E5E7EB',
                  color: isDark ? '#ffffff' : '#111827',
                  borderRadius: 9999,
                }}
                placeholder="Enter your username"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase())}
                autoCapitalize="none"
                autoComplete="username"
                editable={!loading}
              />
              <Text className="font-gilroy text-xs mt-1" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>
                Only lowercase letters, numbers, and underscores
              </Text>
            </View>

            <View>
              <Text className="font-gilroy-medium text-sm mb-2" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
                Email
              </Text>
              <TextInput
                className="w-full px-4 py-3 rounded-full text-base"
                style={{ 
                  backgroundColor: isDark ? '#0D0D0D' : '#F9FAFB',
                  borderWidth: 1,
                  borderColor: isDark ? '#272727' : '#E5E7EB',
                  color: isDark ? '#ffffff' : '#111827',
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
              <Text className="font-gilroy-medium text-sm mb-2" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
                Password
              </Text>
              <TextInput
                className="w-full px-4 py-3 rounded-full text-base"
                style={{ 
                  backgroundColor: isDark ? '#0D0D0D' : '#F9FAFB',
                  borderWidth: 1,
                  borderColor: isDark ? '#272727' : '#E5E7EB',
                  color: isDark ? '#ffffff' : '#111827',
                  borderRadius: 9999,
                }}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!loading}
              />
            </View>

            <View>
              <Text className="font-gilroy-medium text-sm mb-2" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
                Confirm Password
              </Text>
              <TextInput
                className="w-full px-4 py-3 rounded-full text-base"
                style={{ 
                  backgroundColor: isDark ? '#0D0D0D' : '#F9FAFB',
                  borderWidth: 1,
                  borderColor: isDark ? '#272727' : '#E5E7EB',
                  color: isDark ? '#ffffff' : '#111827',
                  borderRadius: 9999,
                }}
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              className="w-full py-4 rounded-full mt-6"
              style={{ backgroundColor: '#D2FD00', borderRadius: 9999 }}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text className="font-gilroy-bold text-black text-center text-base">
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Already have an account?{' '}
              </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text className="font-gilroy-semibold text-sm" style={{ color: '#D2FD00' }}>
                    Sign In
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


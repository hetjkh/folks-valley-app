import BottomNavigation from '@/components/BottomNavigation';
import FollowButton from '@/components/FollowButton';
import { useTheme } from '@/contexts/ThemeContext';
import { Follower, Following, getFollowers, getFollowing } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function FollowersScreen() {
  const { userId, type } = useLocalSearchParams<{ userId?: string; type?: 'followers' | 'following' }>();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(type || 'followers');
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    if (userId) {
      loadData();
    } else {
      router.back();
    }
  }, [userId, activeTab]);

  const loadData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      if (activeTab === 'followers') {
        const data = await getFollowers(userId);
        setFollowers(data.followers);
      } else {
        const data = await getFollowing(userId);
        setFollowing(data.following);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const displayList = activeTab === 'followers' ? followers : following;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <LinearGradient
        colors={isDark ? ['#1a1a1a', colors.bg] : ['#D3C4FB', colors.bg]}
        locations={[0, 0.8]}
        className="pt-[50px] pb-3 rounded-bl-[20px] rounded-br-[20px]"
      >
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text className="font-gilroy-bold text-2xl" style={{ color: colors.text }}>
              {activeTab === 'followers' ? 'Followers' : 'Following'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Tabs */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 rounded-lg py-2 items-center"
              style={{
                backgroundColor: activeTab === 'followers' ? colors.border : colors.card,
              }}
              onPress={() => setActiveTab('followers')}
            >
              <Text
                className="font-gilroy-semibold"
                style={{
                  color: activeTab === 'followers' ? colors.text : colors.textSecondary,
                }}
              >
                Followers ({followers.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 rounded-lg py-2 items-center"
              style={{
                backgroundColor: activeTab === 'following' ? colors.border : colors.card,
              }}
              onPress={() => setActiveTab('following')}
            >
              <Text
                className="font-gilroy-semibold"
                style={{
                  color: activeTab === 'following' ? colors.text : colors.textSecondary,
                }}
              >
                Following ({following.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-3 py-6">
          {displayList.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Text className="font-gilroy-semibold text-lg mt-4" style={{ color: colors.text }}>
                No {activeTab} yet
              </Text>
            </View>
          ) : (
            displayList.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="flex-row items-center rounded-xl p-4 mb-3"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.username) {
                    router.push(`/profile`);
                  }
                }}
              >
                {item.profilePicture ? (
                  <Image
                    source={{ uri: item.profilePicture }}
                    style={{ width: 56, height: 56, borderRadius: 28, marginRight: 12 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name="person" size={28} color={colors.textSecondary} />
                  </View>
                )}

                <View className="flex-1">
                  <Text className="font-gilroy-bold text-base" style={{ color: colors.text }}>
                    {item.name}
                  </Text>
                  {item.username && (
                    <Text className="font-gilroy text-sm" style={{ color: colors.textSecondary }}>
                      @{item.username}
                    </Text>
                  )}
                </View>

                <FollowButton userId={item.id} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

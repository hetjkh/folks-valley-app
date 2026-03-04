import BottomNavigation from '@/components/BottomNavigation';
import { useTheme } from '@/contexts/ThemeContext';
import { Activity, getActivityFeed } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ActivityScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await getActivityFeed(20, 1);
      setActivities(data.activities);
    } catch (error: any) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return 'person-add';
      case 'like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'project_created':
        return 'folder';
      default:
        return 'notifications';
    }
  };

  const getActivityText = (activity: Activity) => {
    const userName = activity.userId.name;
    switch (activity.type) {
      case 'follow':
        return `${userName} started following ${activity.targetUserId?.name || 'someone'}`;
      case 'like':
        return `${userName} liked ${activity.projectId?.title || 'a project'}`;
      case 'comment':
        return `${userName} commented on ${activity.projectId?.title || 'a project'}`;
      case 'project_created':
        return `${userName} created a new project`;
      default:
        return `${userName} updated their profile`;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <LinearGradient
        colors={isDark ? ['#1a1a1a', colors.bg] : ['#D3C4FB', colors.bg]}
        locations={[0, 0.8]}
        className="pt-[50px] pb-3 rounded-bl-[20px] rounded-br-[20px]"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-gilroy-bold text-3xl" style={{ color: colors.text }}>Activity Feed</Text>
            <TouchableOpacity
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.toggle }}
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        <View className="px-3 py-6">
          {activities.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="notifications-outline" size={64} color={colors.textSecondary} />
              <Text className="font-gilroy-semibold text-lg mt-4" style={{ color: colors.text }}>
                No activity yet
              </Text>
              <Text className="font-gilroy text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
                Follow users to see their activity here
              </Text>
            </View>
          ) : (
            activities.map((activity) => (
              <TouchableOpacity
                key={activity._id}
                className="rounded-xl p-4 mb-3"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                activeOpacity={0.7}
                onPress={() => {
                  if (activity.projectId) {
                    router.push(`/projects`);
                  } else if (activity.targetUserId) {
                    router.push(`/profile`);
                  }
                }}
              >
                <View className="flex-row items-start">
                  {activity.userId.profilePicture ? (
                    <Image
                      source={{ uri: activity.userId.profilePicture }}
                      style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="person" size={24} color={colors.textSecondary} />
                    </View>
                  )}

                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Ionicons
                        name={getActivityIcon(activity.type)}
                        size={16}
                        color={colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text className="font-gilroy text-xs" style={{ color: colors.textSecondary }}>
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="font-gilroy text-sm" style={{ color: colors.text }}>
                      {getActivityText(activity)}
                    </Text>
                    {activity.projectId?.image && (
                      <Image
                        source={{ uri: activity.projectId.image }}
                        style={{
                          width: '100%',
                          height: 120,
                          borderRadius: 8,
                          marginTop: 8,
                        }}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

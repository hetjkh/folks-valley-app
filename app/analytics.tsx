import BottomNavigation from '@/components/BottomNavigation';
import { useTheme } from '@/contexts/ThemeContext';
import { getAnalytics, getAnalyticsExport } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  viewsByDay: Array<{ _id: string; count: number }>;
  viewsByDevice: Array<{ _id: string; count: number }>;
  viewsByReferrer: Array<{ _id: string; count: number }>;
  popularProjects: Array<{ projectId: string; title: string; views: number }>;
  period: string;
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics(selectedPeriod);
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      Alert.alert('Error', error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await getAnalyticsExport(selectedPeriod);
      
      // Convert to CSV format
      const csvHeaders = 'Date,Project,Device,Referrer,IP Address\n';
      const csvRows = data.data.map((row: any) => 
        `${row.date},${row.project || 'Profile'},${row.device},${row.referrer || 'Direct'},${row.ipAddress || 'N/A'}`
      ).join('\n');
      const csvContent = csvHeaders + csvRows;

      // Share the CSV data
      await Share.share({
        message: csvContent,
        title: `Analytics Export - ${selectedPeriod}`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to export analytics');
    }
  };

  const getMaxValue = (data: Array<{ count: number }>) => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(d => d.count), 1);
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
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-gilroy-bold text-3xl" style={{ color: colors.text }}>
              Analytics
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.toggle }}
                onPress={handleExport}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={20} color="#ffffff" />
              </TouchableOpacity>
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

          {/* Period Selector */}
          <View className="flex-row gap-2 mb-4">
            {(['day', 'week', 'month'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                className="flex-1 rounded-lg py-2 items-center"
                style={{
                  backgroundColor: selectedPeriod === period ? '#2563eb' : colors.card,
                  borderWidth: 1,
                  borderColor: selectedPeriod === period ? '#2563eb' : colors.border,
                }}
                onPress={() => setSelectedPeriod(period)}
                activeOpacity={0.7}
              >
                <Text
                  className="font-gilroy-semibold text-sm"
                  style={{
                    color: selectedPeriod === period ? '#ffffff' : colors.text,
                    textTransform: 'capitalize',
                  }}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-3 py-6">
          {analytics && (
            <>
              {/* Real-time Stats Cards */}
              <View className="flex-row gap-3 mb-6">
                <View
                  className="flex-1 rounded-xl p-4"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="eye-outline" size={20} color="#2563eb" />
                    <Text className="font-gilroy-semibold text-sm ml-2" style={{ color: colors.textSecondary }}>
                      Total Views
                    </Text>
                  </View>
                  <Text className="font-gilroy-bold text-2xl" style={{ color: colors.text }}>
                    {analytics.totalViews}
                  </Text>
                </View>

                <View
                  className="flex-1 rounded-xl p-4"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="people-outline" size={20} color="#10b981" />
                    <Text className="font-gilroy-semibold text-sm ml-2" style={{ color: colors.textSecondary }}>
                      Unique Visitors
                    </Text>
                  </View>
                  <Text className="font-gilroy-bold text-2xl" style={{ color: colors.text }}>
                    {analytics.uniqueVisitors}
                  </Text>
                </View>
              </View>

              {/* Views Over Time Chart */}
              <View
                className="rounded-xl p-4 mb-6"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="font-gilroy-bold text-lg mb-4" style={{ color: colors.text }}>
                  Views Over Time
                </Text>
                {analytics.viewsByDay.length > 0 ? (
                  <View className="flex-row items-end justify-between h-32">
                    {analytics.viewsByDay.map((day, index) => {
                      const maxValue = getMaxValue(analytics.viewsByDay);
                      const height = (day.count / maxValue) * 100;
                      return (
                        <View key={index} className="flex-1 items-center mx-1">
                          <View
                            className="w-full rounded-t-lg"
                            style={{
                              height: `${height}%`,
                              backgroundColor: '#2563eb',
                              minHeight: day.count > 0 ? 4 : 0,
                            }}
                          />
                          <Text className="font-gilroy text-xs mt-2" style={{ color: colors.textSecondary }}>
                            {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                          <Text className="font-gilroy-bold text-xs mt-1" style={{ color: colors.text }}>
                            {day.count}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View className="items-center justify-center py-8">
                    <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
                    <Text className="font-gilroy text-sm mt-2" style={{ color: colors.textSecondary }}>
                      No views in this period
                    </Text>
                  </View>
                )}
              </View>

              {/* Visitor Demographics */}
              <View
                className="rounded-xl p-4 mb-6"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="font-gilroy-bold text-lg mb-4" style={{ color: colors.text }}>
                  Visitor Demographics
                </Text>
                {analytics.viewsByDevice.length > 0 ? (
                  <View className="gap-3">
                    {analytics.viewsByDevice.map((device, index) => {
                      const total = analytics.viewsByDevice.reduce((sum, d) => sum + d.count, 0);
                      const percentage = ((device.count / total) * 100).toFixed(1);
                      return (
                        <View key={index}>
                          <View className="flex-row items-center justify-between mb-1">
                            <View className="flex-row items-center">
                              <Ionicons
                                name={
                                  device._id === 'mobile'
                                    ? 'phone-portrait-outline'
                                    : device._id === 'tablet'
                                    ? 'tablet-portrait-outline'
                                    : device._id === 'desktop'
                                    ? 'desktop-outline'
                                    : 'help-outline'
                                }
                                size={16}
                                color={colors.textSecondary}
                              />
                              <Text className="font-gilroy-semibold text-sm ml-2 capitalize" style={{ color: colors.text }}>
                                {device._id || 'Unknown'}
                              </Text>
                            </View>
                            <Text className="font-gilroy-bold text-sm" style={{ color: colors.text }}>
                              {device.count} ({percentage}%)
                            </Text>
                          </View>
                          <View
                            className="h-2 rounded-full"
                            style={{
                              backgroundColor: colors.border,
                              overflow: 'hidden',
                            }}
                          >
                            <View
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: device._id === 'mobile' ? '#2563eb' : device._id === 'tablet' ? '#10b981' : '#f59e0b',
                              }}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View className="items-center justify-center py-4">
                    <Text className="font-gilroy text-sm" style={{ color: colors.textSecondary }}>
                      No device data available
                    </Text>
                  </View>
                )}
              </View>

              {/* Traffic Sources */}
              <View
                className="rounded-xl p-4 mb-6"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="font-gilroy-bold text-lg mb-4" style={{ color: colors.text }}>
                  Traffic Sources
                </Text>
                {analytics.viewsByReferrer.length > 0 ? (
                  <View className="gap-3">
                    {analytics.viewsByReferrer.map((source, index) => {
                      const total = analytics.viewsByReferrer.reduce((sum, s) => sum + s.count, 0);
                      const percentage = ((source.count / total) * 100).toFixed(1);
                      return (
                        <View key={index} className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <Ionicons
                              name={
                                source._id === 'Social Media'
                                  ? 'share-social-outline'
                                  : source._id === 'Search Engine'
                                  ? 'search-outline'
                                  : source._id === 'Direct'
                                  ? 'link-outline'
                                  : 'globe-outline'
                              }
                              size={16}
                              color={colors.textSecondary}
                            />
                            <Text className="font-gilroy-semibold text-sm ml-2" style={{ color: colors.text }}>
                              {source._id}
                            </Text>
                          </View>
                          <Text className="font-gilroy-bold text-sm" style={{ color: colors.text }}>
                            {source.count} ({percentage}%)
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View className="items-center justify-center py-4">
                    <Text className="font-gilroy text-sm" style={{ color: colors.textSecondary }}>
                      No traffic source data available
                    </Text>
                  </View>
                )}
              </View>

              {/* Popular Projects */}
              {analytics.popularProjects.length > 0 && (
                <View
                  className="rounded-xl p-4 mb-6"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text className="font-gilroy-bold text-lg mb-4" style={{ color: colors.text }}>
                    Popular Projects
                  </Text>
                  <View className="gap-3">
                    {analytics.popularProjects.map((project, index) => (
                      <View
                        key={index}
                        className="flex-row items-center justify-between p-3 rounded-lg"
                        style={{
                          backgroundColor: colors.bg,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <View className="flex-1">
                          <Text className="font-gilroy-semibold text-sm" style={{ color: colors.text }} numberOfLines={1}>
                            {project.title}
                          </Text>
                        </View>
                        <View className="flex-row items-center ml-3">
                          <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
                          <Text className="font-gilroy-bold text-sm ml-1" style={{ color: colors.text }}>
                            {project.views}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

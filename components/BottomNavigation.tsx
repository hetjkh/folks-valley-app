import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';

function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = useMemo(() => {
    if (pathname === '/dashboard') return 'home';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/profile') return 'profile';
    if (pathname === '/activity') return 'activity';
    if (pathname === '/analytics') return 'analytics';
    if (pathname === '/feed') return 'feed';
    if (pathname === '/projects') return 'projects';
    return 'home';
  }, [pathname]);

  const handleNavigation = useCallback((route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace(route);
  }, [router]);

  return (
    <View 
      className="absolute left-0 right-0 flex-row justify-around items-center"
      style={{
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#000000',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
      }}
    >
      <TouchableOpacity
        className="flex-1 items-center justify-center"
        onPress={() => handleNavigation('/profile')}
        activeOpacity={0.6}
      >
        <View className={`w-12 h-12 items-center justify-center ${activeTab === 'profile' ? 'bg-white rounded-full' : ''}`}>
          <Ionicons
            name="person-outline"
            size={26}
            color={activeTab === 'profile' ? '#000000' : '#ffffff'}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 items-center justify-center"
        onPress={() => handleNavigation('/feed')}
        activeOpacity={0.6}
      >
        <View className={`w-12 h-12 items-center justify-center ${activeTab === 'feed' ? 'bg-white rounded-full' : ''}`}>
          <Ionicons
            name="compass-outline"
            size={26}
            color={activeTab === 'feed' ? '#000000' : '#ffffff'}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 items-center justify-center"
        onPress={() => handleNavigation('/activity')}
        activeOpacity={0.6}
      >
        <View className={`w-12 h-12 items-center justify-center ${activeTab === 'activity' ? 'bg-white rounded-full' : ''}`}>
          <Ionicons
            name="notifications-outline"
            size={26}
            color={activeTab === 'activity' ? '#000000' : '#ffffff'}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 items-center justify-center"
        onPress={() => handleNavigation('/analytics')}
        activeOpacity={0.6}
      >
        <View className={`w-12 h-12 items-center justify-center ${activeTab === 'analytics' ? 'bg-white rounded-full' : ''}`}>
          <Ionicons
            name="analytics-outline"
            size={26}
            color={activeTab === 'analytics' ? '#000000' : '#ffffff'}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 items-center justify-center"
        onPress={() => handleNavigation('/dashboard')}
        activeOpacity={0.6}
      >
        <View className={`w-12 h-12 items-center justify-center ${activeTab === 'home' ? 'bg-white rounded-full' : ''}`}>
          <Ionicons
            name="grid-outline"
            size={26}
            color={activeTab === 'home' ? '#000000' : '#ffffff'}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 items-center justify-center"
        onPress={() => handleNavigation('/projects')}
        activeOpacity={0.6}
      >
        <View className={`w-12 h-12 items-center justify-center ${activeTab === 'projects' ? 'bg-white rounded-full' : ''}`}>
          <Ionicons
            name="folder-outline"
            size={26}
            color={activeTab === 'projects' ? '#000000' : '#ffffff'}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 items-center justify-center"
        onPress={() => handleNavigation('/settings')}
        activeOpacity={0.6}
      >
        <View className={`w-12 h-12 items-center justify-center ${activeTab === 'settings' ? 'bg-white rounded-full' : ''}`}>
          <Ionicons
            name="settings-outline"
            size={26}
            color={activeTab === 'settings' ? '#000000' : '#ffffff'}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default memo(BottomNavigation);


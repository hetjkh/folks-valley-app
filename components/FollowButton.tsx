import { useTheme } from '@/contexts/ThemeContext';
import { followUser, getFollowStatus, unfollowUser } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  userId,
  initialIsFollowing = false,
  onFollowChange,
}: FollowButtonProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkFollowStatus();
  }, [userId]);

  const checkFollowStatus = async () => {
    try {
      const status = await getFollowStatus(userId);
      setIsFollowing(status.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleFollow = async () => {
    if (loading || checking) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error: any) {
      console.error('Follow error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.followButton, { backgroundColor: colors.border }]}
        disabled
      >
        <ActivityIndicator size="small" color={colors.text} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isFollowing ? styles.unfollowButton : styles.followButton,
        {
          backgroundColor: isFollowing ? colors.border : '#2563eb',
        },
      ]}
      onPress={handleFollow}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isFollowing ? colors.text : '#ffffff'} />
      ) : (
        <>
          <Ionicons
            name={isFollowing ? 'checkmark' : 'add'}
            size={16}
            color={isFollowing ? colors.text : '#ffffff'}
          />
          <Text
            style={[
              styles.buttonText,
              { color: isFollowing ? colors.text : '#ffffff' },
            ]}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  followButton: {
    backgroundColor: '#2563eb',
  },
  unfollowButton: {
    backgroundColor: '#272727',
  },
  buttonText: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 14,
  },
});

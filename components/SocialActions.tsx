import { useTheme } from '@/contexts/ThemeContext';
import { likeProject, unlikeProject } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SocialActionsProps {
  projectId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  commentCount?: number;
  onCommentPress?: () => void;
  onSharePress?: () => void;
  onLikeCountPress?: () => void;
  onLikeUpdate?: (newCount: number, newIsLiked: boolean) => void;
}

export default function SocialActions({
  projectId,
  initialLikeCount = 0,
  initialIsLiked = false,
  commentCount = 0,
  onCommentPress,
  onSharePress,
  onLikeCountPress,
  onLikeUpdate,
}: SocialActionsProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  // Update state when props change (for refresh)
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
  }, [initialIsLiked, initialLikeCount]);

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (isLiked) {
        const result = await unlikeProject(projectId);
        setIsLiked(false);
        setLikeCount(result.likeCount);
        onLikeUpdate?.(result.likeCount, false);
      } else {
        const result = await likeProject(projectId);
        setIsLiked(true);
        setLikeCount(result.likeCount);
        onLikeUpdate?.(result.likeCount, true);
      }
    } catch (error: any) {
      console.error('Like error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.actionButton, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={handleLike}
          disabled={loading}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={isLiked ? '#ef4444' : colors.text} />
          ) : (
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={isLiked ? '#ef4444' : colors.text}
            />
          )}
        </TouchableOpacity>
        {likeCount > 0 && onLikeCountPress ? (
          <TouchableOpacity
            onPress={onLikeCountPress}
            activeOpacity={0.7}
            style={{ paddingLeft: 4 }}
          >
            <Text style={[styles.actionText, { color: colors.text, fontWeight: '600' }]}>
              {likeCount}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.actionText, { color: colors.text }]}>
            {likeCount}
          </Text>
        )}
      </View>

      {onCommentPress && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={onCommentPress}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text, fontWeight: commentCount > 0 ? '600' : '400' }]}>
            {commentCount > 0 ? `${commentCount}` : 'Comment'}
          </Text>
        </TouchableOpacity>
      )}

      {onSharePress && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={onSharePress}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={18} color={colors.text} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            Share
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontFamily: 'Gilroy',
    fontSize: 12,
  },
});

import { useTheme } from '@/contexts/ThemeContext';
import { addComment, Comment, deleteComment, getCurrentUser, getProjectComments } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CommentSectionProps {
  projectId: string;
  onClose?: () => void;
}

export default function CommentSection({ projectId, onClose }: CommentSectionProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
    loadCurrentUser();
  }, [projectId]);

  const loadCurrentUser = async () => {
    try {
      const data = await getCurrentUser();
      setCurrentUserId(data.user.id);
    } catch (error) {
      // Not logged in
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getProjectComments(projectId);
      setComments(data.comments);
    } catch (error: any) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting || !currentUserId) return;

    setSubmitting(true);
    try {
      const result = await addComment(projectId, commentText.trim());
      setComments([result.comment, ...comments]);
      setCommentText('');
    } catch (error: any) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (error: any) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {onClose && (
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Comments</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.commentsList}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={colors.text} />
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No comments yet. Be the first to comment!
            </Text>
          </View>
        ) : (
          comments.map((comment) => (
            <View key={comment._id} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                {comment.userId.profilePicture ? (
                  <Image
                    source={{ uri: comment.userId.profilePicture }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                    <Ionicons name="person" size={16} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.commentInfo}>
                  <Text style={[styles.commentAuthor, { color: colors.text }]}>
                    {comment.userId.name}
                  </Text>
                  <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {currentUserId === comment.userId.id && (
                  <TouchableOpacity
                    onPress={() => handleDeleteComment(comment._id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.commentText, { color: colors.text }]}>
                {comment.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {currentUserId && (
        <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write a comment..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: commentText.trim() ? '#2563eb' : colors.border }]}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="send" size={18} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Gilroy-Bold',
    fontSize: 18,
  },
  commentsList: {
    maxHeight: 300,
    marginBottom: 12,
  },
  center: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Gilroy',
    fontSize: 12,
  },
  commentItem: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 13,
  },
  commentTime: {
    fontFamily: 'Gilroy',
    fontSize: 10,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  commentText: {
    fontFamily: 'Gilroy',
    fontSize: 13,
    marginLeft: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  input: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    fontFamily: 'Gilroy',
    fontSize: 13,
    maxHeight: 80,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

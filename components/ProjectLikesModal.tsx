import { useTheme } from '@/contexts/ThemeContext';
import { ProjectLikeUser, getProjectLikesUsers } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface ProjectLikesModalProps {
  visible: boolean;
  projectId: string | null;
  projectTitle?: string;
  onClose: () => void;
}

export default function ProjectLikesModal({ visible, projectId, projectTitle, onClose }: ProjectLikesModalProps) {
  const [users, setUsers] = useState<ProjectLikeUser[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    if (visible && projectId) {
      loadLikes();
    } else {
      setUsers([]);
    }
  }, [visible, projectId]);

  const loadLikes = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await getProjectLikesUsers(projectId);
      setUsers(data.users);
    } catch (error: any) {
      console.error('Error loading likes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '80%',
            paddingTop: 20,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Likes</Text>
              {projectTitle && (
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{projectTitle}</Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : users.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="heart-outline" size={64} color={colors.textSecondary} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 16 }}>No likes yet</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                Be the first to like this project!
              </Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    marginBottom: 8,
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  onPress={() => {
                    onClose();
                    router.push(`/profile`);
                  }}
                >
                  {user.profilePicture ? (
                    <Image
                      source={{ uri: user.profilePicture }}
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

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{user.name}</Text>
                    {user.username && (
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>@{user.username}</Text>
                    )}
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                      {new Date(user.likedAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <Ionicons name="heart" size={20} color="#ef4444" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

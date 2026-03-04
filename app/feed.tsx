import BottomNavigation from '@/components/BottomNavigation';
import FollowButton from '@/components/FollowButton';
import { useTheme } from '@/contexts/ThemeContext';
import { addPortfolioComment, deletePortfolioComment, getCurrentUser, getPortfolioComments, getPortfolioFeed, getPortfolioLikes, getPortfolioLikeStatus, likePortfolio, PortfolioComment, PortfolioFeedItem, unlikePortfolio } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FeedScreen() {
  const [portfolios, setPortfolios] = useState<PortfolioFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [portfolioLikes, setPortfolioLikes] = useState<Record<string, { count: number; isLiked: boolean }>>({});
  const [portfolioComments, setPortfolioComments] = useState<Record<string, PortfolioComment[]>>({});
  const [showComments, setShowComments] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    loadCurrentUser();
    loadFeed();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const data = await getCurrentUser();
      setCurrentUserId(data.user.id);
    } catch (error) {
      // Not logged in
    }
  };

  const loadFeed = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      const data = await getPortfolioFeed(pageNum, 10);
      
      if (append) {
        setPortfolios(prev => [...prev, ...data.portfolios]);
      } else {
        setPortfolios(data.portfolios);
      }
      
      setPage(pageNum);
      setHasMore(data.hasMore);
      
      // Load likes and comments for all portfolios
      await loadPortfolioSocialData(data.portfolios);
    } catch (error: any) {
      console.error('Error loading feed:', error);
      Alert.alert('Error', error.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioSocialData = async (portfoliosList: PortfolioFeedItem[]) => {
    try {
      const likesData: Record<string, { count: number; isLiked: boolean }> = {};
      const commentsData: Record<string, PortfolioComment[]> = {};

      await Promise.all(
        portfoliosList.map(async (portfolio) => {
          try {
            const [likesResult, likeStatusResult, commentsResult] = await Promise.all([
              getPortfolioLikes(portfolio.user.id),
              getPortfolioLikeStatus(portfolio.user.id),
              getPortfolioComments(portfolio.user.id).catch(() => ({ comments: [] })),
            ]);
            
            likesData[portfolio.user.id] = {
              count: likesResult.likeCount,
              isLiked: likeStatusResult.isLiked,
            };
            commentsData[portfolio.user.id] = commentsResult.comments || [];
          } catch (error) {
            likesData[portfolio.user.id] = { count: 0, isLiked: false };
            commentsData[portfolio.user.id] = [];
          }
        })
      );

      setPortfolioLikes(prev => ({ ...prev, ...likesData }));
      setPortfolioComments(prev => ({ ...prev, ...commentsData }));
    } catch (error) {
      console.error('Error loading social data:', error);
    }
  };

  const handleLike = async (userId: string) => {
    if (!currentUserId) {
      Alert.alert('Login Required', 'Please login to like portfolios');
      router.push('/login');
      return;
    }

    try {
      const isLiked = portfolioLikes[userId]?.isLiked || false;
      let result;
      
      if (isLiked) {
        result = await unlikePortfolio(userId);
      } else {
        result = await likePortfolio(userId);
      }

      setPortfolioLikes(prev => ({
        ...prev,
        [userId]: {
          count: result.likeCount,
          isLiked: !isLiked,
        },
      }));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like/unlike portfolio');
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadFeed(page + 1, true);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setCurrentIndex(index || 0);
      // Load more when near the end
      if (index !== null && index >= portfolios.length - 3 && hasMore && !loading) {
        handleLoadMore();
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderPortfolio = ({ item: portfolio, index }: { item: PortfolioFeedItem; index: number }) => {
    return (
      <View style={[styles.portfolioCard, { backgroundColor: colors.bg }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topBarButton}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={[styles.portfolioNumber, { color: '#ffffff' }]}>
            {index + 1} / {portfolios.length}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Banner Image - Full Screen Background */}
        {portfolio.user.bannerImage ? (
          <Image
            source={{ uri: portfolio.user.bannerImage }}
            style={styles.fullBanner}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={isDark ? ['#1a1a1a', '#2d2d2d', '#1a1a1a'] : ['#D3C4FB', '#E8D9FF', '#D3C4FB']}
            style={styles.fullBanner}
          >
            <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
          </LinearGradient>
        )}

        {/* Content Overlay - Bottom Half */}
        <View style={styles.contentOverlay}>
          {/* User Header */}
          <View style={styles.userHeader}>
            <TouchableOpacity
              style={styles.userInfo}
              activeOpacity={0.7}
            >
              {portfolio.user.profilePicture ? (
                <Image
                  source={{ uri: portfolio.user.profilePicture }}
                  style={styles.headerAvatar}
                />
              ) : (
                <View style={[styles.headerAvatarPlaceholder, { backgroundColor: colors.border }]}>
                  <Ionicons name="person" size={24} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: '#ffffff' }]}>
                  {portfolio.user.name}
                </Text>
                {portfolio.user.username && (
                  <Text style={[styles.userUsername, { color: '#999' }]}>
                    @{portfolio.user.username}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            <FollowButton userId={portfolio.user.id} />
          </View>

          {/* About Section */}
          {portfolio.user.about && (
            <View style={styles.aboutSection}>
              <Text style={[styles.aboutText, { color: '#ffffff' }]} numberOfLines={3}>
                {portfolio.user.about}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#ffffff' }]}>
                {portfolio.stats.projectsCount}
              </Text>
              <Text style={[styles.statLabel, { color: '#999' }]}>Projects</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#ffffff' }]}>
                {portfolio.stats.experienceCount}
              </Text>
              <Text style={[styles.statLabel, { color: '#999' }]}>Experience</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#ffffff' }]}>
                {portfolio.stats.skillsCount}
              </Text>
              <Text style={[styles.statLabel, { color: '#999' }]}>Skills</Text>
            </View>
          </View>

          {/* Project Thumbnails */}
          {portfolio.projects.length > 0 && (
            <View style={styles.projectsSection}>
              <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>Featured Projects</Text>
              <View style={styles.projectsGrid}>
                {portfolio.projects.slice(0, 3).map((project) => (
                  <TouchableOpacity
                    key={project._id}
                    style={styles.projectCard}
                    activeOpacity={0.8}
                  >
                    {project.image ? (
                      <Image
                        source={{ uri: project.image }}
                        style={styles.projectImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.projectImage, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Ionicons name="folder-outline" size={20} color="#ffffff" />
                      </View>
                    )}
                    <Text
                      style={[styles.projectTitle, { color: '#ffffff' }]}
                      numberOfLines={1}
                    >
                      {project.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Bottom Actions Bar */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(portfolio.user.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={portfolioLikes[portfolio.user.id]?.isLiked ? 'heart' : 'heart-outline'}
                size={32}
                color={portfolioLikes[portfolio.user.id]?.isLiked ? '#ef4444' : '#ffffff'}
              />
              <Text style={[styles.actionCount, { color: '#ffffff' }]}>
                {portfolioLikes[portfolio.user.id]?.count || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowComments(portfolio.user.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={32} color="#ffffff" />
              <Text style={[styles.actionCount, { color: '#ffffff' }]}>
                {portfolioComments[portfolio.user.id]?.length || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={32} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Comments Preview */}
          {portfolioComments[portfolio.user.id] && portfolioComments[portfolio.user.id].length > 0 && (
            <View style={styles.commentsPreview}>
              <Text style={[styles.commentPreviewText, { color: '#ffffff' }]} numberOfLines={2}>
                <Text style={{ fontWeight: '600' }}>{portfolioComments[portfolio.user.id][0].userId.name}</Text>
                {' '}
                {portfolioComments[portfolio.user.id][0].text}
              </Text>
              {portfolioComments[portfolio.user.id].length > 1 && (
                <TouchableOpacity
                  onPress={() => setShowComments(portfolio.user.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.viewAllComments, { color: '#999' }]}>
                    View all {portfolioComments[portfolio.user.id].length} comments
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && portfolios.length === 0) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (portfolios.length === 0) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.bg }}>
        <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
        <Text className="font-gilroy-semibold text-lg mt-4" style={{ color: colors.text }}>
          No portfolios yet
        </Text>
        <Text className="font-gilroy text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
          Be the first to create a portfolio!
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#000000' }}>
      <FlatList
        ref={flatListRef}
        data={portfolios}
        renderItem={renderPortfolio}
        keyExtractor={(item) => item.user.id}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && portfolios.length > 0 ? (
            <View style={styles.loader}>
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          ) : null
        }
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />

      {/* Comments Modal */}
      <Modal
        visible={showComments !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowComments(null)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' }}>
            {showComments && (
              <PortfolioCommentSection
                userId={showComments}
                onClose={() => {
                  setShowComments(null);
                  // Refresh comments
                  if (showComments) {
                    getPortfolioComments(showComments).then(data => {
                      setPortfolioComments(prev => ({ ...prev, [showComments]: data.comments }));
                    }).catch(() => {});
                  }
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      <BottomNavigation />
    </View>
  );
}

// Portfolio Comment Section Component
function PortfolioCommentSection({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [comments, setComments] = useState<PortfolioComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
    loadCurrentUser();
  }, [userId]);

  const loadCurrentUser = async () => {
    try {
      const { getCurrentUser } = await import('@/utils/api');
      const data = await getCurrentUser();
      setCurrentUserId(data.user.id);
    } catch (error) {
      // Not logged in
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getPortfolioComments(userId);
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
      const result = await addPortfolioComment(userId, commentText.trim());
      setComments([result.comment, ...comments]);
      setCommentText('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deletePortfolioComment(commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete comment');
    }
  };

  return (
    <View style={[styles.commentContainer, { backgroundColor: colors.card }]}>
      <View style={styles.commentHeader}>
        <Text style={[styles.commentHeaderTitle, { color: colors.text }]}>Comments</Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.commentsList}>
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
              <View style={styles.commentHeaderRow}>
                {comment.userId.profilePicture ? (
                  <Image
                    source={{ uri: comment.userId.profilePicture }}
                    style={styles.commentAvatar}
                  />
                ) : (
                  <View style={[styles.commentAvatarPlaceholder, { backgroundColor: colors.border }]}>
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
      </View>

      {currentUserId && (
        <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input || colors.card, color: colors.text, borderColor: colors.border }]}
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
  portfolioCard: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioNumber: {
    fontFamily: 'Gilroy',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  fullBanner: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 100,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontFamily: 'Gilroy-Bold',
    fontSize: 18,
    color: '#ffffff',
  },
  userUsername: {
    fontFamily: 'Gilroy',
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  aboutSection: {
    marginBottom: 12,
  },
  aboutText: {
    fontFamily: 'Gilroy',
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Gilroy-Bold',
    fontSize: 24,
    color: '#ffffff',
  },
  statLabel: {
    fontFamily: 'Gilroy',
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  projectsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Gilroy-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 10,
  },
  projectsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  projectCard: {
    flex: 1,
  },
  projectImage: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectTitle: {
    fontFamily: 'Gilroy',
    fontSize: 10,
    color: '#ffffff',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCount: {
    fontFamily: 'Gilroy-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  commentsPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  commentPreviewText: {
    fontFamily: 'Gilroy',
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
  },
  viewAllComments: {
    fontFamily: 'Gilroy',
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  loader: {
    padding: 20,
    alignItems: 'center',
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
  },
  commentContainer: {
    borderRadius: 12,
    padding: 16,
    maxHeight: 500,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentHeaderTitle: {
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
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentAvatarPlaceholder: {
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

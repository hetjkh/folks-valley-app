import BottomNavigation from '@/components/BottomNavigation';
import CommentSection from '@/components/CommentSection';
import ProjectLikesModal from '@/components/ProjectLikesModal';
import SocialActions from '@/components/SocialActions';
import { useTheme } from '@/contexts/ThemeContext';
import { createProject, deleteProject, getCurrentUser, getLikeStatus, getProjectComments, getProjectLikes, getProjects, Project, updateProject, uploadProjectImage } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Platform, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProjectsScreen() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'technologies' | 'url' | 'category' | null>(null);
  const [titleValue, setTitleValue] = useState('');
  const [technologiesValue, setTechnologiesValue] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [categoryValue, setCategoryValue] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [showLikes, setShowLikes] = useState<string | null>(null);
  const [projectLikes, setProjectLikes] = useState<Record<string, { count: number; isLiked: boolean }>>({});
  const [projectComments, setProjectComments] = useState<Record<string, number>>({});
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    checkAuth();
    requestImagePermission();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (projects.length > 0) {
        loadProjectLikes(projects);
        loadProjectComments(projects);
      }
    }, [projects])
  );

  const requestImagePermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images!');
      }
    }
  };

  const checkAuth = async () => {
    try {
      await getCurrentUser();
      loadProjects();
    } catch (error) {
      router.replace('/login');
    }
  };

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      if (data.projects.length === 0) {
        // Create default projects if none exist
        const defaultTechs = ['HTML', 'CSS', 'JavaScript', 'Python', 'PHP', 'MySQL', 'React.js', 'Figma', 'Next.js', 'UI Design', 'Photoshop', 'Prototyping'];
        const project1 = await createProject('Alliance Landing Alliance Landing', defaultTechs, 'Web Development');
        const project2 = await createProject('Alliance Landing Alliance Landing', defaultTechs, 'Web Development');
        const project3 = await createProject('Alliance Landing Alliance Landing', defaultTechs, 'Mobile Apps');
        setProjects([project1.project, project2.project, project3.project]);
        setCategories(['Web Development', 'Mobile Apps', 'Uncategorized']);
      } else {
        setProjects(data.projects);
        setCategories(data.categories || ['Uncategorized']);
        // Load likes and comments for all projects
        loadProjectLikes(data.projects);
        loadProjectComments(data.projects);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectLikes = async (projectsList: Project[]) => {
    try {
      const likesData: Record<string, { count: number; isLiked: boolean }> = {};
      await Promise.all(
        projectsList.map(async (project) => {
          try {
            const [likesResult, likeStatusResult] = await Promise.all([
              getProjectLikes(project._id),
              getLikeStatus(project._id),
            ]);
            likesData[project._id] = {
              count: likesResult.likeCount,
              isLiked: likeStatusResult.isLiked,
            };
          } catch (error) {
            likesData[project._id] = { count: 0, isLiked: false };
          }
        })
      );
      setProjectLikes(likesData);
    } catch (error) {
      console.error('Error loading project likes:', error);
    }
  };

  const loadProjectComments = async (projectsList: Project[]) => {
    try {
      const commentsData: Record<string, number> = {};
      await Promise.all(
        projectsList.map(async (project) => {
          try {
            const commentsResult = await getProjectComments(project._id);
            commentsData[project._id] = commentsResult.comments.length;
          } catch (error) {
            commentsData[project._id] = 0;
          }
        })
      );
      setProjectComments(commentsData);
    } catch (error) {
      console.error('Error loading project comments:', error);
    }
  };

  const handleShareProject = async (project: Project) => {
    try {
      const profileUrl = `http://localhost:3000/profile/${project.userId}`;
      await Share.share({
        message: `Check out this project: ${project.title}\n${profileUrl}`,
        title: project.title,
      });
    } catch (error: any) {
      console.error('Share error:', error);
    }
  };

  const handleAddNewProject = async () => {
    try {
      const defaultTechs: string[] = [];
      const newProject = await createProject('New Project', defaultTechs, 'Uncategorized');
      
      // Reload projects to get updated list and categories
      const updatedData = await getProjects();
      setProjects(updatedData.projects);
      setCategories(updatedData.categories || ['Uncategorized']);
      
      Alert.alert('Success', 'New project created! You can now edit it.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create project');
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const categoryName = newCategoryName.trim();
      if (!categories.includes(categoryName)) {
        setCategories(prev => [...prev, categoryName]);
      }
      setNewCategoryName('');
      setShowAddCategory(false);
      Alert.alert('Success', `Category "${categoryName}" added!`);
    }
  };

  const getProjectsByCategory = (category: string) => {
    return projects.filter(p => (p.category || 'Uncategorized') === category);
  };

  const getDisplayCategories = () => {
    if (selectedCategory === null) {
      return categories;
    }
    return [selectedCategory];
  };

  const pickImage = async (projectId: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(projectId, result.assets[0].base64 || '');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (projectId: string, imageBase64: string) => {
    setUploading(projectId);
    try {
      const response = await uploadProjectImage(projectId, imageBase64);
      setProjects(prev => prev.map(p => 
        p._id === projectId ? { ...p, image: response.image } : p
      ));
      Alert.alert('Success', 'Project image uploaded successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setUploading(null);
    }
  };

  const handleEditProject = (project: Project, field: 'title' | 'technologies' | 'url' | 'category') => {
    setEditingProject(project._id);
    setEditingField(field);
    if (field === 'title') {
      setTitleValue(project.title);
    } else if (field === 'technologies') {
      setTechnologiesValue(project.technologies.join(', '));
    } else if (field === 'url') {
      setUrlValue(project.url || '');
    } else if (field === 'category') {
      setCategoryValue(project.category || 'Uncategorized');
    }
  };

  const handleSaveProject = async () => {
    if (!editingProject || !editingField) return;

    setSaving(true);
    try {
      const updates: any = {};
      if (editingField === 'title') {
        if (!titleValue.trim()) {
          Alert.alert('Error', 'Title cannot be empty');
          setSaving(false);
          return;
        }
        updates.title = titleValue.trim();
      } else if (editingField === 'technologies') {
        const techArray = technologiesValue.split(',').map(t => t.trim()).filter(t => t.length > 0);
        updates.technologies = techArray;
      } else if (editingField === 'url') {
        updates.url = urlValue.trim() || null;
      } else if (editingField === 'category') {
        updates.category = categoryValue.trim() || 'Uncategorized';
        // Add new category if it doesn't exist
        if (categoryValue.trim() && !categories.includes(categoryValue.trim())) {
          setCategories(prev => [...prev, categoryValue.trim()]);
        }
      }

      const response = await updateProject(
        editingProject, 
        updates.title, 
        updates.technologies, 
        updates.url, 
        updates.category
      );
      
      // Update projects list
      setProjects(prev => prev.map(p => 
        p._id === editingProject ? response.project : p
      ));
      
      // Reload projects to get updated categories from backend
      const updatedData = await getProjects();
      setCategories(updatedData.categories || ['Uncategorized']);
      
      setEditingProject(null);
      setEditingField(null);
      
      if (editingField === 'url' && urlValue.trim()) {
        Alert.alert('Success', 'Project URL saved! Preview image is being fetched automatically.');
      } else if (editingField === 'category') {
        Alert.alert('Success', `Project category updated to "${categoryValue.trim() || 'Uncategorized'}"!`);
      } else {
        Alert.alert('Success', 'Project updated successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenUrl = async (url: string) => {
    if (!url) {
      Alert.alert('Error', 'No URL available for this project');
      return;
    }
    
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', `Cannot open URL: ${url}`);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject(projectId);
              setProjects(prev => prev.filter(p => p._id !== projectId));
              Alert.alert('Success', 'Project deleted successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete project');
            }
          },
        },
      ]
    );
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
        <View className="px-3 pt-6 pb-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Text className="font-gilroy-bold text-3xl" style={{ color: colors.text }}>Projects Panel</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: editMode ? '#2563eb' : colors.toggle }}
                onPress={() => setEditMode(!editMode)}
                activeOpacity={0.8}
              >
                <Ionicons name={editMode ? 'checkmark' : 'create-outline'} size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.toggle }}
                onPress={toggleTheme}
                activeOpacity={0.8}
              >
                <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity className="w-12 h-12 bg-black rounded-full items-center justify-center relative">
                <Ionicons name="notifications-outline" size={24} color="#ffffff" />
                <View className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full items-center justify-center">
                  <Text className="font-gilroy-bold text-[10px] text-black">3</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-3 pt-6 pb-6">

          {/* Add New Project Button */}
          <TouchableOpacity
            className="flex-row items-center justify-center rounded-xl p-4 mb-6"
            style={{ 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onPress={handleAddNewProject}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.text} />
            <Text className="font-gilroy-semibold text-base ml-2" style={{ color: colors.text }}>
              Add New Project
            </Text>
          </TouchableOpacity>

          {/* Categories Section */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-gilroy-semibold text-lg" style={{ color: colors.text }}>
                Categories
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddCategory(!showAddCategory)}
                className="flex-row items-center"
              >
                <Ionicons name={showAddCategory ? "close" : "add"} size={20} color={colors.text} />
                <Text className="font-gilroy text-sm ml-1" style={{ color: colors.text }}>
                  {showAddCategory ? 'Cancel' : 'Add Category'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Add Category Input */}
            {showAddCategory && (
              <View className="flex-row gap-2 mb-3">
                <TextInput
                  className="flex-1 rounded-lg p-3 font-gilroy text-base"
                  style={{ 
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.input,
                  }}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Enter category name"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
                <TouchableOpacity
                  className="rounded-lg px-4 items-center justify-center"
                  style={{ backgroundColor: colors.border }}
                  onPress={handleAddCategory}
                >
                  <Ionicons name="checkmark" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            )}

            {/* Category Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {/* All Categories Button */}
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCategory(null);
                    console.log('All categories selected');
                  }}
                  className="rounded-full px-4 py-2"
                  style={{ 
                    backgroundColor: selectedCategory === null ? colors.border : colors.card, 
                    borderWidth: 1, 
                    borderColor: colors.border 
                  }}
                  activeOpacity={0.7}
                >
                  <Text className="font-gilroy text-sm" style={{ color: colors.text }}>
                    All ({projects.length})
                  </Text>
                </TouchableOpacity>
                
                {/* Category Pills */}
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => {
                      setSelectedCategory(category);
                      console.log('Category selected:', category);
                    }}
                    className="rounded-full px-4 py-2"
                    style={{ 
                      backgroundColor: selectedCategory === category ? colors.border : colors.card, 
                      borderWidth: 1, 
                      borderColor: colors.border 
                    }}
                    activeOpacity={0.7}
                  >
                    <Text className="font-gilroy text-sm" style={{ color: colors.text }}>
                      {category} ({getProjectsByCategory(category).length})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Projects by Category */}
          {getDisplayCategories().map((category) => {
            const categoryProjects = getProjectsByCategory(category);
            if (categoryProjects.length === 0) return null;

            return (
              <View key={category} className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-gilroy-bold text-xl" style={{ color: colors.text }}>
                    {category}
                  </Text>
                  <Text className="font-gilroy text-sm" style={{ color: colors.textSecondary }}>
                    {categoryProjects.length} {categoryProjects.length === 1 ? 'project' : 'projects'}
                  </Text>
                </View>

                {categoryProjects.map((project, index) => (
                  <View 
                    key={project._id} 
                    className="rounded-xl p-4 mb-4"
                    style={{ 
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    {/* Full Width Image Container */}
                    <View className="relative mb-4">
                      <TouchableOpacity
                        onPress={() => project.image ? setViewingImage(project.image) : pickImage(project._id)}
                        disabled={uploading === project._id}
                        className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden items-center justify-center"
                        activeOpacity={project.image ? 0.8 : 1}
                      >
                        {project.image ? (
                          <Image
                            source={{ uri: project.image }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                        )}
                        {uploading === project._id && (
                          <View className="absolute inset-0 bg-black/50 items-center justify-center">
                            <ActivityIndicator size="small" color="#ffffff" />
                          </View>
                        )}
                        {/* Action Buttons */}
                        {editMode && (
                          <View className="absolute bottom-2 right-2 flex-row gap-2 z-10">
                            {project.image && (
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setViewingImage(project.image!);
                                }}
                                className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center"
                                activeOpacity={0.8}
                              >
                                <Ionicons name="expand-outline" size={16} color="#ffffff" />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                pickImage(project._id);
                              }}
                              className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center"
                              activeOpacity={0.8}
                            >
                              <Ionicons name="pencil" size={12} color="#ffffff" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Project Details - Below Image */}
                    <View className="flex-1">
                      {/* Title with Edit Button */}
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="font-gilroy-bold text-lg flex-1" style={{ color: colors.text }}>
                          {project.title}
                        </Text>
                        {editMode && (
                          <View className="flex-row gap-2">
                            <TouchableOpacity
                              onPress={() => handleEditProject(project, 'title')}
                            >
                              <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteProject(project._id)}
                            >
                              <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                      
                      {/* Technology Tags with Edit */}
                      <View className="mb-3">
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="font-gilroy text-xs" style={{ color: colors.textSecondary }}>Technologies</Text>
                          {editMode && (
                            <TouchableOpacity onPress={() => handleEditProject(project, 'technologies')}>
                              <Ionicons name="pencil" size={14} color={colors.textSecondary} />
                            </TouchableOpacity>
                          )}
                        </View>
                        <View className="flex-row flex-wrap gap-2">
                          {project.technologies.map((tech, techIdx) => (
                            <View
                              key={techIdx}
                              className="bg-black rounded-lg px-3 py-1.5"
                            >
                              <Text className="font-gilroy text-xs text-white">
                                {tech}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Project URL */}
                      <View className="flex-row items-center justify-between mb-2">
                        <TouchableOpacity
                          onPress={() => project.url ? handleOpenUrl(project.url) : (editMode ? handleEditProject(project, 'url') : null)}
                          className="flex-1 flex-row items-center"
                          activeOpacity={project.url ? 0.7 : 1}
                          disabled={!project.url && !editMode}
                        >
                          <Ionicons 
                            name={project.url ? "open-outline" : "link-outline"} 
                            size={18} 
                            color={project.url ? colors.text : colors.textSecondary} 
                          />
                          <Text 
                            className="font-gilroy text-sm ml-2" 
                            style={{ color: project.url ? colors.text : colors.textSecondary }}
                          >
                            {project.url || (editMode ? 'Add project URL' : 'No URL')}
                          </Text>
                        </TouchableOpacity>
                        {editMode && (
                          <TouchableOpacity onPress={() => handleEditProject(project, 'url')}>
                            <Ionicons name="pencil" size={14} color={colors.textSecondary} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Category */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <Ionicons name="folder-outline" size={16} color={colors.textSecondary} />
                          <Text className="font-gilroy text-xs ml-1" style={{ color: colors.textSecondary }}>
                            Category:
                          </Text>
                          {editMode ? (
                            <TouchableOpacity
                              onPress={() => handleEditProject(project, 'category')}
                              className="ml-1"
                            >
                              <Text className="font-gilroy-semibold text-xs" style={{ color: colors.text }}>
                                {project.category || 'Uncategorized'}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <Text className="font-gilroy-semibold text-xs ml-1" style={{ color: colors.text }}>
                              {project.category || 'Uncategorized'}
                            </Text>
                          )}
                        </View>
                        {editMode && (
                          <TouchableOpacity onPress={() => handleEditProject(project, 'category')}>
                            <Ionicons name="pencil" size={14} color={colors.textSecondary} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Social Actions */}
                      {!editMode && (
                        <View style={{ marginTop: 12 }}>
                          <SocialActions
                            projectId={project._id}
                            initialLikeCount={projectLikes[project._id]?.count || 0}
                            initialIsLiked={projectLikes[project._id]?.isLiked || false}
                            commentCount={projectComments[project._id] || 0}
                            onCommentPress={() => setShowComments(project._id)}
                            onSharePress={() => handleShareProject(project)}
                            onLikeCountPress={() => {
                              if ((projectLikes[project._id]?.count || 0) > 0) {
                                setShowLikes(project._id);
                              }
                            }}
                            onLikeUpdate={(newCount, newIsLiked) => {
                              setProjectLikes(prev => ({
                                ...prev,
                                [project._id]: { count: newCount, isLiked: newIsLiked }
                              }));
                            }}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <BottomNavigation />

      {/* Project Likes Modal */}
      <ProjectLikesModal
        visible={showLikes !== null}
        projectId={showLikes}
        projectTitle={showLikes ? projects.find(p => p._id === showLikes)?.title : undefined}
        onClose={() => setShowLikes(null)}
      />

      {/* Edit Project Modal */}
      <Modal
        visible={editingField !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setEditingField(null);
          setEditingProject(null);
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.card }}
          >
            <Text className="font-gilroy-semibold text-lg mb-4" style={{ color: colors.text }}>
              Edit {editingField === 'title' ? 'Title' : editingField === 'technologies' ? 'Technologies' : 'Project URL'}
            </Text>
            
            {editingField === 'title' && (
              <TextInput
                className="rounded-lg p-3 font-gilroy text-base mb-4"
                style={{ 
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.input,
                }}
                value={titleValue}
                onChangeText={setTitleValue}
                placeholder="Enter project title"
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
            )}

            {editingField === 'technologies' && (
              <TextInput
                className="rounded-lg p-3 font-gilroy text-base mb-4 min-h-[100px]"
                style={{ 
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.input,
                }}
                value={technologiesValue}
                onChangeText={setTechnologiesValue}
                placeholder="Enter technologies separated by commas (e.g., React, Node.js, MongoDB)"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
            )}

            {editingField === 'url' && (
              <TextInput
                className="rounded-lg p-3 font-gilroy text-base mb-4"
                style={{ 
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.input,
                }}
                value={urlValue}
                onChangeText={setUrlValue}
                placeholder="Enter project URL (e.g., https://example.com)"
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                autoCapitalize="none"
                autoFocus
              />
            )}

            {editingField === 'category' && (
              <View className="mb-4">
                <TextInput
                  className="rounded-lg p-3 font-gilroy text-base mb-3"
                  style={{ 
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.input,
                  }}
                  value={categoryValue}
                  onChangeText={setCategoryValue}
                  placeholder="Enter category name"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
                <Text className="font-gilroy text-xs mb-2" style={{ color: colors.textSecondary }}>
                  Or select existing category:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                  <View className="flex-row gap-2">
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        className="rounded-full px-3 py-1.5"
                        style={{ 
                          backgroundColor: categoryValue === cat ? colors.border : colors.card,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                        onPress={() => setCategoryValue(cat)}
                      >
                        <Text className="font-gilroy text-xs" style={{ color: colors.text }}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-lg p-3 items-center"
                style={{ backgroundColor: colors.border }}
                onPress={() => {
                  setEditingField(null);
                  setEditingProject(null);
                }}
                disabled={saving}
              >
                <Text className="font-gilroy-semibold text-base" style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-lg p-3 items-center"
                onPress={handleSaveProject}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="font-gilroy-semibold text-base text-white">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
         </View>
       </Modal>

       {/* Full Screen Image Viewer Modal */}
       <Modal
         visible={viewingImage !== null}
         transparent={true}
         animationType="fade"
         onRequestClose={() => setViewingImage(null)}
       >
         <View className="flex-1 bg-black items-center justify-center">
           <TouchableOpacity
             className="absolute top-12 right-6 z-10"
             onPress={() => setViewingImage(null)}
             activeOpacity={0.7}
           >
             <View className="w-10 h-10 bg-black/50 rounded-full items-center justify-center">
               <Ionicons name="close" size={24} color="#ffffff" />
             </View>
           </TouchableOpacity>
           
           {viewingImage && (
             <Image
               source={{ uri: viewingImage }}
               className="w-full h-full"
               resizeMode="contain"
             />
           )}
         </View>
       </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showComments !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowComments(null);
          // Refresh comment count when modal closes
          if (showComments && projects.length > 0) {
            loadProjectComments(projects);
          }
        }}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' }}>
            <CommentSection
              projectId={showComments || ''}
              onClose={() => {
                setShowComments(null);
                // Refresh comment count when modal closes
                if (showComments && projects.length > 0) {
                  loadProjectComments(projects);
                }
              }}
            />
          </View>
        </View>
      </Modal>
     </View>
   );
 }


import BottomNavigation from '@/components/BottomNavigation';
import ProfileCompletionIndicator from '@/components/ProfileCompletionIndicator';
import QRCodeModal from '@/components/QRCodeModal';
import { useTheme } from '@/contexts/ThemeContext';
import { getCurrentUser, getEducation, getExperience, getFollowStats, getProjects, getSkills, updateUserProfile, uploadBannerImage, uploadProfilePicture, User } from '@/utils/api';
import { calculateProfileCompletion } from '@/utils/profile-completion';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Platform, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingSocialLinks, setEditingSocialLinks] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [aboutValue, setAboutValue] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    linkedin: '',
    telegram: '',
    facebook: '',
    instagram: '',
    whatsapp: '',
  });
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [hasProjects, setHasProjects] = useState(false);
  const [hasEducation, setHasEducation] = useState(false);
  const [hasExperience, setHasExperience] = useState(false);
  const [hasSkills, setHasSkills] = useState(false);
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    loadUser();
    loadProfileData();
    requestImagePermission();
  }, []);

  useEffect(() => {
    // Reload profile data when user changes
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const requestImagePermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images!');
      }
    }
  };

  const loadUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data.user);
      setNameValue(data.user.name || '');
      setAboutValue(data.user.about || '');
      setSocialLinks({
        twitter: data.user.socialLinks?.twitter || '',
        linkedin: data.user.socialLinks?.linkedin || '',
        telegram: data.user.socialLinks?.telegram || '',
        facebook: data.user.socialLinks?.facebook || '',
        instagram: data.user.socialLinks?.instagram || '',
        whatsapp: data.user.socialLinks?.whatsapp || '',
      });
    } catch (error) {
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadProfileData = async () => {
    try {
      // Load all profile data to check completion
      const [projectsData, educationData, experienceData, skillsData, statsData] = await Promise.all([
        getProjects().catch(() => ({ projects: [] })),
        getEducation().catch(() => ({ education: [] })),
        getExperience().catch(() => ({ experience: [] })),
        getSkills().catch(() => ({ skills: [] })),
        user?.id ? getFollowStats(user.id).catch(() => ({ followersCount: 0, followingCount: 0 })) : Promise.resolve({ followersCount: 0, followingCount: 0 }),
      ]);

      setHasProjects(projectsData.projects && projectsData.projects.length > 0);
      setHasEducation(educationData.education && educationData.education.length > 0);
      setHasExperience(experienceData.experience && experienceData.experience.length > 0);
      setHasSkills(skillsData.skills && skillsData.skills.length > 0);
      setFollowStats(statsData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handleEditName = () => {
    setNameValue(user?.name || '');
    setEditingName(true);
  };

  const handleEditAbout = () => {
    setAboutValue(user?.about || '');
    setEditingAbout(true);
  };

  const handleEditSocialLinks = () => {
    setSocialLinks({
      twitter: user?.socialLinks?.twitter || '',
      linkedin: user?.socialLinks?.linkedin || '',
      telegram: user?.socialLinks?.telegram || '',
      facebook: user?.socialLinks?.facebook || '',
      instagram: user?.socialLinks?.instagram || '',
      whatsapp: user?.socialLinks?.whatsapp || '',
    });
    setEditingSocialLinks(true);
  };

  const handleSaveSocialLinks = async () => {
    setSaving(true);
    try {
      // Clean up empty strings - convert to empty object if all are empty
      const cleanedLinks = {
        twitter: socialLinks.twitter.trim(),
        linkedin: socialLinks.linkedin.trim(),
        telegram: socialLinks.telegram.trim(),
        facebook: socialLinks.facebook.trim(),
        instagram: socialLinks.instagram.trim(),
        whatsapp: socialLinks.whatsapp.trim(),
      };
      
      const response = await updateUserProfile(undefined, undefined, undefined, undefined, undefined, cleanedLinks);
      setUser(response.user);
      // Reload social links from response
      setSocialLinks({
        twitter: response.user.socialLinks?.twitter || '',
        linkedin: response.user.socialLinks?.linkedin || '',
        telegram: response.user.socialLinks?.telegram || '',
        facebook: response.user.socialLinks?.facebook || '',
        instagram: response.user.socialLinks?.instagram || '',
        whatsapp: response.user.socialLinks?.whatsapp || '',
      });
      setEditingSocialLinks(false);
      Alert.alert('Success', 'Social media links updated successfully!');
    } catch (error: any) {
      console.error('Save social links error:', error);
      Alert.alert('Error', error.message || 'Failed to update social media links');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenLink = async (url: string | undefined, platform: string) => {
    if (!url || !url.trim()) {
      Alert.alert('No Link', `You haven't added a ${platform} link yet. Click the edit button to add one.`);
      return;
    }

    let finalUrl = url.trim();
    
    // Add https:// if not present
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      const canOpen = await Linking.canOpenURL(finalUrl);
      if (canOpen) {
        await Linking.openURL(finalUrl);
      } else {
        Alert.alert('Error', 'Invalid URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const getProfileUrl = (): string => {
    if (!user?.username && !user?.id) {
      return '';
    }

    const websiteUrl = 'http://localhost:3000';
    
    // Use username if available, otherwise fall back to ID
    const identifier = user.username || user.id;
    return `${websiteUrl}/profile/${identifier}`;
  };

  const handleCopyLink = async () => {
    const profileUrl = getProfileUrl();
    
    if (!profileUrl) {
      Alert.alert('Error', 'Unable to generate profile link');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        // Web: Use Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(profileUrl);
          Alert.alert('Success', 'Profile link copied to clipboard!');
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = profileUrl;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          Alert.alert('Success', 'Profile link copied to clipboard!');
        }
      } else {
        // Native: Use Share API which includes copy option on most platforms
        await Share.share({
          message: profileUrl,
          url: profileUrl,
        });
      }
    } catch (error: any) {
      // Fallback: show the link in an alert so user can manually copy
      Alert.alert(
        'Profile Link',
        `Copy this link:\n\n${profileUrl}`,
        [
          { text: 'OK', style: 'default' },
        ]
      );
    }
  };

  const handleShareProfile = async () => {
    const profileUrl = getProfileUrl();
    
    if (!profileUrl) {
      Alert.alert('Error', 'Unable to generate profile link');
      return;
    }

    try {
      const result = await Share.share({
        message: `Check out my profile: ${profileUrl}`,
        url: profileUrl, // iOS
        title: 'My Profile',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          console.log('Shared via', result.activityType);
        } else {
          // Shared
          console.log('Profile shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log('Share dismissed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share profile');
    }
  };

  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const response = await updateUserProfile(nameValue.trim());
      setUser(response.user);
      setEditingName(false);
      Alert.alert('Success', 'Name updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAbout = async () => {
    setSaving(true);
    try {
      const response = await updateUserProfile(undefined, undefined, undefined, undefined, aboutValue.trim());
      setUser(response.user);
      setEditingAbout(false);
      Alert.alert('Success', 'About updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update about');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async (type: 'profile' | 'banner') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'profile' ? [1, 1] : [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].base64 || '', type);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (imageBase64: string, type: 'profile' | 'banner') => {
    setUploading(true);
    try {
      if (type === 'profile') {
        const response = await uploadProfilePicture(imageBase64);
        setUser(prev => prev ? { ...prev, profilePicture: response.profilePicture } : null);
        Alert.alert('Success', 'Profile picture uploaded successfully!');
      } else {
        const response = await uploadBannerImage(imageBase64);
        setUser(prev => prev ? { ...prev, bannerImage: response.bannerImage } : null);
        Alert.alert('Success', 'Banner image uploaded successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
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
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Text className="font-gilroy-bold text-3xl" style={{ color: colors.text }}>User Panel</Text>
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
              <TouchableOpacity 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: '#10b981' }}
                onPress={handleShareProfile}
                activeOpacity={0.8}
              >
                <Ionicons name="share-outline" size={20} color="#ffffff" />
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

          {/* Black Banner Card */}
          <View className="bg-black rounded-xl mb-4 relative overflow-hidden" style={{ height: 200 }}>
            {user?.bannerImage ? (
              <Image 
                source={{ uri: user.bannerImage }} 
                className="absolute inset-0 w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-black" />
            )}
            {editMode && (
              <TouchableOpacity 
                className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full items-center justify-center z-10"
                onPress={() => pickImage('banner')}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="pencil" size={14} color="#ffffff" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Picture Card - Full Width */}
          <View 
            className="w-full rounded-xl p-4 mb-4 relative overflow-hidden"
            style={{ 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="w-full h-96 rounded-lg items-center justify-center relative overflow-hidden" style={{ backgroundColor: colors.input }}>
              {user?.profilePicture ? (
                <Image 
                  source={{ uri: user.profilePicture }} 
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={100} color="#9333EA" />
              )}
            </View>
            {editMode && (
              <TouchableOpacity 
                className="absolute bottom-6 right-6 w-10 h-10 bg-blue-500 rounded-full items-center justify-center"
                onPress={() => pickImage('profile')}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="pencil" size={16} color="#ffffff" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Name Card - Full Width */}
          <View 
            className="w-full rounded-xl p-4 mb-4 relative"
            style={{ 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="font-gilroy-semibold text-base mb-1" style={{ color: colors.text }}>Name</Text>
            <Text className="font-gilroy text-[10px] mb-3" style={{ color: colors.textMuted }}>You can change your name here</Text>
            <Text className="font-gilroy-bold text-xl" style={{ color: colors.text }}>{user?.name || 'User'}</Text>
            {editMode && (
              <TouchableOpacity 
                className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full items-center justify-center"
                onPress={handleEditName}
              >
                <Ionicons name="pencil" size={14} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          {/* About Card - Full Width */}
          <View 
            className="w-full rounded-xl p-4 relative mb-4"
            style={{ 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="font-gilroy-semibold text-base mb-1" style={{ color: colors.text }}>About</Text>
            <Text className="font-gilroy text-[10px] mb-3" style={{ color: colors.textMuted }}>Change about text here</Text>
            <Text className="font-gilroy text-sm leading-5" style={{ color: colors.text }}>
              {user?.about || 'Computer engineering student with aptitudes in web development. Natural skills at quickly learning and applying new technologies. Eager for Industry exposure to hone skill set and professional competence.'}
            </Text>
            {editMode && (
              <TouchableOpacity 
                className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full items-center justify-center"
                onPress={handleEditAbout}
              >
                <Ionicons name="pencil" size={14} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Completion Indicator */}
          <ProfileCompletionIndicator
            completion={calculateProfileCompletion(user, hasProjects, hasEducation, hasExperience, hasSkills)}
            onPress={() => {
              // Scroll to relevant section or show suggestions
            }}
          />

          {/* Profile Link Card */}
          <View 
            className="w-full rounded-xl p-4 mb-4"
            style={{ 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="font-gilroy-semibold text-base mb-1" style={{ color: colors.text }}>Profile Link</Text>
            <Text className="font-gilroy text-[10px] mb-3" style={{ color: colors.textMuted }}>Share your profile with others</Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-1 rounded-lg p-3" style={{ backgroundColor: colors.input }}>
                <Text 
                  className="font-gilroy text-xs" 
                  style={{ color: colors.text }}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {getProfileUrl() || 'Loading...'}
                </Text>
              </View>
              <TouchableOpacity
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: '#9333EA' }}
                onPress={() => setShowQRCode(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="qr-code-outline" size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: '#10b981' }}
                onPress={handleCopyLink}
                activeOpacity={0.8}
              >
                <Ionicons name="copy-outline" size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                className="rounded-lg px-4 py-3"
                style={{ backgroundColor: '#2563eb' }}
                onPress={handleShareProfile}
                activeOpacity={0.8}
              >
                <Ionicons name="share-outline" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Connect Card */}
          <View 
            className="w-full rounded-xl p-4 relative mb-4"
            style={{ 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="font-gilroy-semibold text-base mb-1" style={{ color: colors.text }}>Connect</Text>
            <Text className="font-gilroy text-[10px] mb-4" style={{ color: colors.textMuted }}>Eyes on You: Total Views</Text>
            <View className="flex-row flex-wrap gap-3">
              {user?.socialLinks?.twitter && user.socialLinks.twitter.trim() && (
                <TouchableOpacity 
                  className="w-12 h-12 bg-blue-400 rounded-full items-center justify-center"
                  onPress={() => handleOpenLink(user?.socialLinks?.twitter, 'Twitter')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-twitter" size={24} color="#ffffff" />
                </TouchableOpacity>
              )}
              {user?.socialLinks?.linkedin && user.socialLinks.linkedin.trim() && (
                <TouchableOpacity 
                  className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center"
                  onPress={() => handleOpenLink(user?.socialLinks?.linkedin, 'LinkedIn')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-linkedin" size={24} color="#ffffff" />
                </TouchableOpacity>
              )}
              {user?.socialLinks?.telegram && user.socialLinks.telegram.trim() && (
                <TouchableOpacity 
                  className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center"
                  onPress={() => handleOpenLink(user?.socialLinks?.telegram, 'Telegram')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="send-outline" size={24} color="#ffffff" />
                </TouchableOpacity>
              )}
              {user?.socialLinks?.facebook && user.socialLinks.facebook.trim() && (
                <TouchableOpacity 
                  className="w-12 h-12 bg-blue-700 rounded-full items-center justify-center"
                  onPress={() => handleOpenLink(user?.socialLinks?.facebook, 'Facebook')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-facebook" size={24} color="#ffffff" />
                </TouchableOpacity>
              )}
              {user?.socialLinks?.instagram && user.socialLinks.instagram.trim() && (
                <TouchableOpacity 
                  className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full items-center justify-center" 
                  style={{ backgroundColor: '#E4405F' }}
                  onPress={() => handleOpenLink(user?.socialLinks?.instagram, 'Instagram')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-instagram" size={24} color="#ffffff" />
                </TouchableOpacity>
              )}
              {user?.socialLinks?.whatsapp && user.socialLinks.whatsapp.trim() && (
                <TouchableOpacity 
                  className="w-12 h-12 bg-green-500 rounded-full items-center justify-center"
                  onPress={() => handleOpenLink(user?.socialLinks?.whatsapp, 'WhatsApp')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-whatsapp" size={24} color="#ffffff" />
                </TouchableOpacity>
              )}
              {(!user?.socialLinks || 
                (!user.socialLinks.twitter?.trim() && 
                 !user.socialLinks.linkedin?.trim() && 
                 !user.socialLinks.telegram?.trim() && 
                 !user.socialLinks.facebook?.trim() && 
                 !user.socialLinks.instagram?.trim() && 
                 !user.socialLinks.whatsapp?.trim())) && (
                <Text className="font-gilroy text-sm" style={{ color: colors.textSecondary }}>
                  No social links added yet. Click edit to add links.
                </Text>
              )}
            </View>
            {editMode && (
              <TouchableOpacity 
                className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full items-center justify-center"
                onPress={handleEditSocialLinks}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={14} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Follow Stats */}
          <View 
            className="w-full rounded-xl p-4 mb-4"
            style={{ 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="font-gilroy-semibold text-base mb-3" style={{ color: colors.text }}>Social Stats</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 items-center"
                onPress={() => user?.id && router.push(`/followers?userId=${user.id}&type=followers`)}
                activeOpacity={0.7}
              >
                <Text className="font-gilroy-bold text-2xl" style={{ color: colors.text }}>
                  {followStats.followersCount}
                </Text>
                <Text className="font-gilroy text-xs" style={{ color: colors.textSecondary }}>
                  Followers
                </Text>
              </TouchableOpacity>
              <View className="w-px" style={{ backgroundColor: colors.border }} />
              <TouchableOpacity
                className="flex-1 items-center"
                onPress={() => user?.id && router.push(`/followers?userId=${user.id}&type=following`)}
                activeOpacity={0.7}
              >
                <Text className="font-gilroy-bold text-2xl" style={{ color: colors.text }}>
                  {followStats.followingCount}
                </Text>
                <Text className="font-gilroy text-xs" style={{ color: colors.textSecondary }}>
                  Following
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Row */}
          <View className="flex-row gap-3 mb-4">
            {/* Experience Card */}
            <View 
              className="flex-1 rounded-xl p-4 relative overflow-hidden min-h-[160px]"
              style={{ 
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-1">
                <Text className="font-gilroy-semibold text-base mb-1" style={{ color: colors.text }}>Experience</Text>
                <Text className="font-gilroy text-[10px]" style={{ color: colors.textMuted }}>Your total experience till now.</Text>
              </View>
              <Text className="font-gilroy-bold text-[42px]" style={{ color: colors.text }}>6M</Text>
              <Ionicons name="hammer-outline" size={80} color={colors.border} className="absolute -right-2.5 -bottom-2.5 opacity-30" />
              {editMode && (
                <TouchableOpacity className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                  <Ionicons name="pencil" size={14} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Likes Card */}
            <View 
              className="flex-1 rounded-xl p-4 relative overflow-hidden min-h-[160px]"
              style={{ 
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-1">
                <Text className="font-gilroy-semibold text-base mb-1" style={{ color: colors.text }}>Likes</Text>
                <Text className="font-gilroy text-[10px]" style={{ color: colors.textMuted }}>Your total likes till now.</Text>
              </View>
              <Text className="font-gilroy-bold text-[42px]" style={{ color: colors.text }}>75</Text>
              <Ionicons name="heart-outline" size={80} color={colors.border} className="absolute -right-2.5 -bottom-2.5 opacity-30" />
              {editMode && (
                <TouchableOpacity className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                  <Ionicons name="pencil" size={14} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNavigation />

      {/* Edit Name Modal */}
      <Modal
        visible={editingName}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingName(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.card }}
          >
            <Text className="font-gilroy-semibold text-lg mb-4" style={{ color: colors.text }}>Edit Name</Text>
            <TextInput
              className="rounded-lg p-3 font-gilroy text-base mb-4"
              style={{ 
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.input,
              }}
              value={nameValue}
              onChangeText={setNameValue}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-lg p-3 items-center"
                style={{ backgroundColor: colors.border }}
                onPress={() => setEditingName(false)}
                disabled={saving}
              >
                <Text className="font-gilroy-semibold text-base" style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-lg p-3 items-center"
                onPress={handleSaveName}
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

      {/* Edit About Modal */}
      <Modal
        visible={editingAbout}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingAbout(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.card }}
          >
            <Text className="font-gilroy-semibold text-lg mb-4" style={{ color: colors.text }}>Edit About</Text>
            <TextInput
              className="rounded-lg p-3 font-gilroy text-base mb-4 min-h-[120px]"
              style={{ 
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.input,
              }}
              value={aboutValue}
              onChangeText={setAboutValue}
              placeholder="Tell us about yourself"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-lg p-3 items-center"
                style={{ backgroundColor: colors.border }}
                onPress={() => setEditingAbout(false)}
                disabled={saving}
              >
                <Text className="font-gilroy-semibold text-base" style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-lg p-3 items-center"
                onPress={handleSaveAbout}
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

      {/* Edit Social Links Modal */}
      <Modal
        visible={editingSocialLinks}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingSocialLinks(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            className="rounded-t-3xl p-6 max-h-[80%]"
            style={{ backgroundColor: colors.card }}
          >
            <Text className="font-gilroy-semibold text-lg mb-4" style={{ color: colors.text }}>Edit Social Media Links</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Twitter */}
              <View className="mb-4">
                <Text className="font-gilroy-medium text-sm mb-2" style={{ color: colors.text }}>Twitter</Text>
                <TextInput
                  className="rounded-lg p-3 font-gilroy text-base"
                  style={{ 
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.input,
                  }}
                  value={socialLinks.twitter}
                  onChangeText={(text) => setSocialLinks(prev => ({ ...prev, twitter: text }))}
                  placeholder="https://twitter.com/yourusername"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              {/* LinkedIn */}
              <View className="mb-4">
                <Text className="font-gilroy-medium text-sm mb-2" style={{ color: colors.text }}>LinkedIn</Text>
                <TextInput
                  className="rounded-lg p-3 font-gilroy text-base"
                  style={{ 
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.input,
                  }}
                  value={socialLinks.linkedin}
                  onChangeText={(text) => setSocialLinks(prev => ({ ...prev, linkedin: text }))}
                  placeholder="https://linkedin.com/in/yourusername"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              {/* Telegram */}
              <View className="mb-4">
                <Text className="font-gilroy-medium text-sm mb-2" style={{ color: colors.text }}>Telegram</Text>
                <TextInput
                  className="rounded-lg p-3 font-gilroy text-base"
                  style={{ 
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.input,
                  }}
                  value={socialLinks.telegram}
                  onChangeText={(text) => setSocialLinks(prev => ({ ...prev, telegram: text }))}
                  placeholder="https://t.me/yourusername"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              {/* Facebook */}
              <View className="mb-4">
                <Text className="font-gilroy-medium text-sm mb-2" style={{ color: colors.text }}>Facebook</Text>
                <TextInput
                  className="rounded-lg p-3 font-gilroy text-base"
                  style={{ 
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.input,
                  }}
                  value={socialLinks.facebook}
                  onChangeText={(text) => setSocialLinks(prev => ({ ...prev, facebook: text }))}
                  placeholder="https://facebook.com/yourusername"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              {/* Instagram */}
              <View className="mb-4">
                <Text className="font-gilroy-medium text-sm mb-2" style={{ color: colors.text }}>Instagram</Text>
                <TextInput
                  className="rounded-lg p-3 font-gilroy text-base"
                  style={{ 
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.input,
                  }}
                  value={socialLinks.instagram}
                  onChangeText={(text) => setSocialLinks(prev => ({ ...prev, instagram: text }))}
                  placeholder="https://instagram.com/yourusername"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              {/* WhatsApp */}
              <View className="mb-4">
                <Text className="font-gilroy-medium text-sm mb-2" style={{ color: colors.text }}>WhatsApp</Text>
                <TextInput
                  className="rounded-lg p-3 font-gilroy text-base"
                  style={{ 
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.input,
                  }}
                  value={socialLinks.whatsapp}
                  onChangeText={(text) => setSocialLinks(prev => ({ ...prev, whatsapp: text }))}
                  placeholder="https://wa.me/1234567890"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                className="flex-1 rounded-lg p-3 items-center"
                style={{ backgroundColor: colors.border }}
                onPress={() => setEditingSocialLinks(false)}
                disabled={saving}
              >
                <Text className="font-gilroy-semibold text-base" style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-lg p-3 items-center"
                onPress={handleSaveSocialLinks}
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

      {/* QR Code Modal */}
      <QRCodeModal
        visible={showQRCode}
        url={getProfileUrl()}
        username={user?.username}
        onClose={() => setShowQRCode(false)}
      />
    </View>
  );
}


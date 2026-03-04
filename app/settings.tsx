import BottomNavigation from '@/components/BottomNavigation';
import { useTheme } from '@/contexts/ThemeContext';
import { createEducation, createExperience, deleteEducation, deleteExperience, Education, Experience, getCurrentUser, getEducation, getExperience, logout, updateEducation, updateExperience, updateUserProfile, uploadProfilePicture, User } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState('');
  const [firstNameValue, setFirstNameValue] = useState('');
  const [lastNameValue, setLastNameValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [editingEducation, setEditingEducation] = useState<string | null>(null);
  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [degreeValue, setDegreeValue] = useState('');
  const [instituteValue, setInstituteValue] = useState('');
  const [startYearValue, setStartYearValue] = useState('');
  const [endYearValue, setEndYearValue] = useState('');
  const [positionValue, setPositionValue] = useState('');
  const [companyValue, setCompanyValue] = useState('');
  const [durationValue, setDurationValue] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [typeValue, setTypeValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    loadUser();
    loadEducation();
    loadExperience();
    requestImagePermission();
  }, []);

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
      setError(null);
      setLoading(true);
      const data = await getCurrentUser();
      console.log('User data loaded:', data);
      setUser(data.user);
      setNameValue(data.user.name || '');
      setFirstNameValue(data.user.firstName || '');
      setLastNameValue(data.user.lastName || '');
      setPhoneValue(data.user.phone || '');
    } catch (error: any) {
      console.error('Error loading user:', error);
      setError(error.message || 'Failed to load user data');
      // Check if it's an authentication error
      if (error.message?.includes('token') || error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        Alert.alert('Session Expired', 'Please login again.', [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadEducation = async () => {
    try {
      const data = await getEducation();
      setEducation(data.education);
    } catch (error: any) {
      console.error('Failed to load education:', error);
    }
  };

  const loadExperience = async () => {
    try {
      const data = await getExperience();
      setExperience(data.experience);
    } catch (error: any) {
      console.error('Failed to load experience:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].base64 || '');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (imageBase64: string) => {
    setUploading(true);
    try {
      const response = await uploadProfilePicture(imageBase64);
      setUser(prev => prev ? { ...prev, profilePicture: response.profilePicture } : null);
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleEditField = (field: 'name' | 'firstName' | 'lastName' | 'phone') => {
    if (field === 'name') setNameValue(user?.name || '');
    if (field === 'firstName') setFirstNameValue(user?.firstName || '');
    if (field === 'lastName') setLastNameValue(user?.lastName || '');
    if (field === 'phone') setPhoneValue(user?.phone || '');
    setEditingField(field);
  };

  const handleSaveField = async () => {
    if (!editingField) return;

    setSaving(true);
    try {
      // Only send the field that's being edited, preserve others
      let name: string | undefined = undefined;
      let firstName: string | undefined = undefined;
      let lastName: string | undefined = undefined;
      let phone: string | undefined = undefined;

      if (editingField === 'name') {
        name = nameValue.trim();
      } else if (editingField === 'firstName') {
        firstName = firstNameValue.trim();
      } else if (editingField === 'lastName') {
        lastName = lastNameValue.trim();
      } else if (editingField === 'phone') {
        phone = phoneValue.trim();
      }

      console.log('Updating user field:', editingField, { name, firstName, lastName, phone });
      
      const response = await updateUserProfile(name, firstName, lastName, phone);
      
      console.log('Update response:', response);
      
      setUser(response.user);
      setEditingField(null);
      Alert.alert('Success', 'Updated successfully!');
    } catch (error: any) {
      console.error('Error updating field:', error);
      Alert.alert('Error', error.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // Education handlers
  const handleAddEducation = () => {
    setDegreeValue('');
    setInstituteValue('');
    setStartYearValue('');
    setEndYearValue('');
    setEditingEducation(null);
    setShowEducationModal(true);
  };

  const handleEditEducation = (edu: Education) => {
    setDegreeValue(edu.degree);
    setInstituteValue(edu.institute);
    setStartYearValue(edu.startYear);
    setEndYearValue(edu.endYear);
    setEditingEducation(edu._id);
    setShowEducationModal(true);
  };

  const handleSaveEducation = async () => {
    if (!degreeValue.trim() || !instituteValue.trim() || !startYearValue.trim() || !endYearValue.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    setSaving(true);
    try {
      if (editingEducation) {
        const response = await updateEducation(editingEducation, degreeValue.trim(), instituteValue.trim(), startYearValue.trim(), endYearValue.trim());
        setEducation(prev => prev.map(e => e._id === editingEducation ? response.education : e));
      } else {
        const response = await createEducation(degreeValue.trim(), instituteValue.trim(), startYearValue.trim(), endYearValue.trim());
        setEducation(prev => [...prev, response.education]);
      }
      setShowEducationModal(false);
      setEditingEducation(null);
      Alert.alert('Success', 'Education saved successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save education');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    Alert.alert(
      'Delete Education',
      'Are you sure you want to delete this education entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEducation(id);
              setEducation(prev => prev.filter(e => e._id !== id));
              Alert.alert('Success', 'Education deleted successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete education');
            }
          },
        },
      ]
    );
  };

  // Experience handlers
  const handleAddExperience = () => {
    setPositionValue('');
    setCompanyValue('');
    setDurationValue('');
    setLocationValue('');
    setTypeValue('');
    setEditingExperience(null);
    setShowExperienceModal(true);
  };

  const handleEditExperience = (exp: Experience) => {
    setPositionValue(exp.position);
    setCompanyValue(exp.company);
    setDurationValue(exp.duration);
    setLocationValue(exp.location || '');
    setTypeValue(exp.type || '');
    setEditingExperience(exp._id);
    setShowExperienceModal(true);
  };

  const handleSaveExperience = async () => {
    if (!positionValue.trim() || !companyValue.trim() || !durationValue.trim()) {
      Alert.alert('Error', 'Position, Company, and Duration are required');
      return;
    }

    setSaving(true);
    try {
      if (editingExperience) {
        const response = await updateExperience(editingExperience, positionValue.trim(), companyValue.trim(), durationValue.trim(), locationValue.trim(), typeValue.trim());
        setExperience(prev => prev.map(e => e._id === editingExperience ? response.experience : e));
      } else {
        const response = await createExperience(positionValue.trim(), companyValue.trim(), durationValue.trim(), locationValue.trim(), typeValue.trim());
        setExperience(prev => [...prev, response.experience]);
      }
      setShowExperienceModal(false);
      setEditingExperience(null);
      Alert.alert('Success', 'Experience saved successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save experience');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    Alert.alert(
      'Delete Experience',
      'Are you sure you want to delete this experience entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExperience(id);
              setExperience(prev => prev.filter(e => e._id !== id));
              Alert.alert('Success', 'Experience deleted successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete experience');
            }
          },
        },
      ]
    );
  };

  if (loading && !user) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="font-gilroy mt-4" style={{ color: colors.textSecondary }}>
          Loading user data...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}>
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
            <Text className="font-gilroy-bold text-3xl" style={{ color: isDark ? '#ffffff' : '#111827' }}>Settings</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: editMode ? '#2563eb' : (isDark ? '#272727' : '#000000') }}
                onPress={() => setEditMode(!editMode)}
                activeOpacity={0.8}
              >
                <Ionicons name={editMode ? 'checkmark' : 'create-outline'} size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: isDark ? '#272727' : '#000000' }}
                onPress={toggleTheme}
                activeOpacity={0.8}
              >
                <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-12 h-12 bg-black rounded-full items-center justify-center relative"
                onPress={loadUser}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={24} color="#ffffff" />
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

          {/* Error Message */}
          {error && (
            <View 
              className="rounded-lg p-4 mb-4"
              style={{ backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' }}
            >
              <Text className="font-gilroy-semibold text-sm mb-1" style={{ color: '#DC2626' }}>
                Error loading data
              </Text>
              <Text className="font-gilroy text-xs" style={{ color: '#991B1B' }}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={loadUser}
                className="mt-2"
              >
                <Text className="font-gilroy-semibold text-xs" style={{ color: '#DC2626' }}>
                  Tap to retry
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Profile Information Card */}
          <View 
            className="rounded-xl p-4 mb-4"
            style={{ 
              backgroundColor: isDark ? '#0D0D0D' : '#ffffff',
              borderWidth: 1,
              borderColor: isDark ? '#272727' : '#E5E7EB',
            }}
          >
            <View className="flex-row">
              {/* Left Section - Name Fields */}
              <View className="flex-1 pr-4">
                {/* Name */}
                {editMode ? (
                  <TouchableOpacity onPress={() => handleEditField('name')} activeOpacity={0.7}>
                    <Text className="font-gilroy text-xs mb-1" style={{ color: colors.textSecondary }}>NAME</Text>
                    <Text className="font-gilroy-bold text-base mb-3" style={{ color: colors.text }}>
                      {user?.name || 'Name'}
                    </Text>
                    <View className="h-px mb-3" style={{ backgroundColor: colors.border }} />
                  </TouchableOpacity>
                ) : (
                  <View>
                    <Text className="font-gilroy text-xs mb-1" style={{ color: colors.textSecondary }}>NAME</Text>
                    <Text className="font-gilroy-bold text-base mb-3" style={{ color: colors.text }}>
                      {user?.name || 'Name'}
                    </Text>
                    <View className="h-px mb-3" style={{ backgroundColor: colors.border }} />
                  </View>
                )}

                {/* First Name */}
                {editMode ? (
                  <TouchableOpacity onPress={() => handleEditField('firstName')} activeOpacity={0.7}>
                    <Text className="font-gilroy text-xs mb-1" style={{ color: colors.textSecondary }}>FIRST-NAME</Text>
                    <Text className="font-gilroy-bold text-base mb-3" style={{ color: colors.text }}>
                      {user?.firstName || 'First Name'}
                    </Text>
                    <View className="h-px mb-3" style={{ backgroundColor: colors.border }} />
                  </TouchableOpacity>
                ) : (
                  <View>
                    <Text className="font-gilroy text-xs mb-1" style={{ color: colors.textSecondary }}>FIRST-NAME</Text>
                    <Text className="font-gilroy-bold text-base mb-3" style={{ color: colors.text }}>
                      {user?.firstName || 'First Name'}
                    </Text>
                    <View className="h-px mb-3" style={{ backgroundColor: colors.border }} />
                  </View>
                )}

                {/* Last Name */}
                {editMode ? (
                  <TouchableOpacity onPress={() => handleEditField('lastName')} activeOpacity={0.7}>
                    <Text className="font-gilroy text-xs mb-1" style={{ color: colors.textSecondary }}>LAST-NAME</Text>
                    <Text className="font-gilroy-bold text-base" style={{ color: colors.text }}>
                      {user?.lastName || 'Last Name'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View>
                    <Text className="font-gilroy text-xs mb-1" style={{ color: colors.textSecondary }}>LAST-NAME</Text>
                    <Text className="font-gilroy-bold text-base" style={{ color: colors.text }}>
                      {user?.lastName || 'Last Name'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Right Section - Profile Picture */}
              <View className="relative">
                <TouchableOpacity
                  onPress={pickImage}
                  disabled={uploading}
                  className="relative"
                >
                  {/* Purple Starburst Border Effect */}
                  <View 
                    className="absolute inset-0"
                    style={{
                      borderWidth: 3,
                      borderColor: '#9333EA',
                      borderRadius: 60,
                      borderStyle: 'dashed',
                      transform: [{ rotate: '5deg' }],
                    }}
                  />
                  <View 
                    className="absolute inset-0"
                    style={{
                      borderWidth: 3,
                      borderColor: '#9333EA',
                      borderRadius: 60,
                      borderStyle: 'dashed',
                      transform: [{ rotate: '-5deg' }],
                    }}
                  />
                  <View 
                    className="absolute inset-0"
                    style={{
                      borderWidth: 2,
                      borderColor: '#9333EA',
                      borderRadius: 60,
                      borderStyle: 'dashed',
                      transform: [{ rotate: '10deg' }],
                    }}
                  />
                  
                  {/* Profile Picture */}
                  <View className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                    {user?.profilePicture ? (
                      <Image
                        source={{ uri: user.profilePicture }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Ionicons name="person" size={40} color="#9CA3AF" />
                      </View>
                    )}
                    {uploading && (
                      <View className="absolute inset-0 bg-black/50 items-center justify-center">
                        <ActivityIndicator size="small" color="#ffffff" />
                      </View>
                    )}
                  </View>

                  {/* Edit Button */}
                  {editMode && (
                    <View className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full items-center justify-center z-10">
                      <Ionicons name="pencil" size={12} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Contact Information Card */}
          <View 
            className="rounded-xl p-4"
            style={{ 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Email Field 1 */}
            <View>
              <Text className="font-gilroy text-xs mb-1" style={{ color: colors.textSecondary }}>EMAIL</Text>
              <Text className="font-gilroy-bold text-base mb-3" style={{ color: colors.text }}>
                {user?.email || 'email@example.com'}
              </Text>
              <View className="h-px mb-3" style={{ backgroundColor: colors.border }} />
            </View>

            {/* Phone Field 1 */}
            {editMode ? (
              <TouchableOpacity onPress={() => handleEditField('phone')} activeOpacity={0.7}>
                <Text className="font-gilroy text-xs mb-1" style={{ color: colors.textSecondary }}>PHONE</Text>
                <Text className="font-gilroy-bold text-base mb-3" style={{ color: colors.text }}>
                  {user?.phone || '+91 9104320305'}
                </Text>
                <View className="h-px mb-3" style={{ backgroundColor: colors.border }} />
              </TouchableOpacity>
            ) : (
              <View>
                <Text className="font-gilroy text-xs mb-1" style={{ color: colors.textSecondary }}>PHONE</Text>
                <Text className="font-gilroy-bold text-base mb-3" style={{ color: colors.text }}>
                  {user?.phone || '+91 9104320305'}
                </Text>
                <View className="h-px mb-3" style={{ backgroundColor: colors.border }} />
              </View>
            )}

            {/* Email Field 2 */}
            <View>
              <Text className="font-gilroy text-xs mb-1" style={{ color: colors.textSecondary }}>EMAIL</Text>
              <Text className="font-gilroy-bold text-base mb-3" style={{ color: colors.text }}>
                {user?.email || 'email@example.com'}
              </Text>
              <View className="h-px mb-3" style={{ backgroundColor: colors.border }} />
            </View>

            {/* Phone Field 2 */}
            {editMode ? (
              <TouchableOpacity onPress={() => handleEditField('phone')} activeOpacity={0.7}>
                <Text className="font-gilroy text-xs mb-1" style={{ color: colors.textSecondary }}>PHONE</Text>
                <Text className="font-gilroy-bold text-base" style={{ color: colors.text }}>
                  {user?.phone || '+91 9104320305'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text className="font-gilroy text-xs mb-1" style={{ color: colors.textSecondary }}>PHONE</Text>
                <Text className="font-gilroy-bold text-base" style={{ color: colors.text }}>
                  {user?.phone || '+91 9104320305'}
                </Text>
              </View>
            )}
          </View>

          {/* Education Section */}
          <View 
            className="rounded-xl p-4 mb-4"
            style={{ 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-gilroy-bold text-xl" style={{ color: colors.text }}>Education</Text>
              {editMode && (
                <TouchableOpacity
                  onPress={handleAddEducation}
                  className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center"
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>

            {education.length === 0 ? (
              <Text className="font-gilroy text-sm text-center py-4" style={{ color: colors.textSecondary }}>
                No education entries. Tap + to add.
              </Text>
            ) : (
              education.map((edu) => (
                <View key={edu._id} className="mb-4 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="font-gilroy-bold text-base mb-1" style={{ color: colors.text }}>
                        {edu.degree}
                      </Text>
                      <Text className="font-gilroy text-sm mb-1" style={{ color: colors.textSecondary }}>
                        {edu.institute}
                      </Text>
                      <Text className="font-gilroy text-xs" style={{ color: colors.textMuted }}>
                        {edu.startYear} - {edu.endYear}
                      </Text>
                    </View>
                    {editMode && (
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleEditEducation(edu)}
                          className="w-8 h-8 items-center justify-center"
                        >
                          <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteEducation(edu._id)}
                          className="w-8 h-8 items-center justify-center"
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Experience Section */}
          <View 
            className="rounded-xl p-4 mb-4"
            style={{ 
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-gilroy-bold text-xl" style={{ color: colors.text }}>Experience</Text>
              {editMode && (
                <TouchableOpacity
                  onPress={handleAddExperience}
                  className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center"
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>

            {experience.length === 0 ? (
              <Text className="font-gilroy text-sm text-center py-4" style={{ color: colors.textSecondary }}>
                No experience entries. Tap + to add.
              </Text>
            ) : (
              experience.map((exp) => (
                <View key={exp._id} className="mb-4 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="font-gilroy-bold text-base mb-1" style={{ color: colors.text }}>
                        {exp.position}
                      </Text>
                      <Text className="font-gilroy text-sm mb-1" style={{ color: colors.textSecondary }}>
                        {exp.company}
                      </Text>
                      <Text className="font-gilroy text-xs" style={{ color: colors.textMuted }}>
                        {exp.duration}
                        {exp.location && ` - ${exp.location}`}
                        {exp.type && ` - ${exp.type}`}
                      </Text>
                    </View>
                    {editMode && (
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleEditExperience(exp)}
                          className="w-8 h-8 items-center justify-center"
                        >
                          <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteExperience(exp._id)}
                          className="w-8 h-8 items-center justify-center"
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Logout Button */}
          <View className="mt-6 mb-4">
            <TouchableOpacity
              className="w-full py-4 rounded-lg items-center justify-center"
              style={{ backgroundColor: '#EF4444' }}
              onPress={() => {
                Alert.alert(
                  'Logout',
                  'Are you sure you want to logout?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Logout',
                      style: 'destructive',
                      onPress: handleLogout,
                    },
                  ]
                );
              }}
              activeOpacity={0.8}
            >
              <Text className="font-gilroy-bold text-white text-base">
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BottomNavigation />

      {/* Edit Field Modal */}
      <Modal
        visible={editingField !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingField(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: isDark ? '#0D0D0D' : '#ffffff' }}
          >
            <Text className="font-gilroy-semibold text-lg mb-4" style={{ color: isDark ? '#ffffff' : '#111827' }}>
              Edit {editingField === 'name' ? 'Name' : editingField === 'firstName' ? 'First Name' : editingField === 'lastName' ? 'Last Name' : 'Phone'}
            </Text>
            <TextInput
              className="rounded-lg p-3 font-gilroy text-base mb-4"
              style={{ 
                borderWidth: 1,
                borderColor: isDark ? '#272727' : '#D1D5DB',
                color: isDark ? '#ffffff' : '#111827',
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              }}
              value={
                editingField === 'name' ? nameValue :
                editingField === 'firstName' ? firstNameValue :
                editingField === 'lastName' ? lastNameValue :
                phoneValue
              }
              onChangeText={
                editingField === 'name' ? setNameValue :
                editingField === 'firstName' ? setFirstNameValue :
                editingField === 'lastName' ? setLastNameValue :
                setPhoneValue
              }
              placeholder={`Enter ${editingField === 'name' ? 'name' : editingField === 'firstName' ? 'first name' : editingField === 'lastName' ? 'last name' : 'phone number'}`}
              placeholderTextColor="#9CA3AF"
              keyboardType={editingField === 'phone' ? 'phone-pad' : 'default'}
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-lg p-3 items-center"
                style={{ backgroundColor: isDark ? '#272727' : '#E5E7EB' }}
                onPress={() => setEditingField(null)}
                disabled={saving}
              >
                <Text className="font-gilroy-semibold text-base" style={{ color: isDark ? '#ffffff' : '#111827' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-lg p-3 items-center"
                onPress={handleSaveField}
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

      {/* Education Modal */}
      <Modal
        visible={showEducationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowEducationModal(false);
          setEditingEducation(null);
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.card }}
          >
            <Text className="font-gilroy-semibold text-lg mb-4" style={{ color: colors.text }}>
              {editingEducation ? 'Edit Education' : 'Add Education'}
            </Text>
            
            <TextInput
              className="rounded-lg p-3 font-gilroy text-base mb-3"
              style={{ 
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.input,
              }}
              value={degreeValue}
              onChangeText={setDegreeValue}
              placeholder="Degree (e.g., B.Tech IT)"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />

            <TextInput
              className="rounded-lg p-3 font-gilroy text-base mb-3"
              style={{ 
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.input,
              }}
              value={instituteValue}
              onChangeText={setInstituteValue}
              placeholder="Institute (e.g., Institute of Advanced Research)"
              placeholderTextColor="#9CA3AF"
            />

            <View className="flex-row gap-3 mb-3">
              <TextInput
                className="flex-1 rounded-lg p-3 font-gilroy text-base"
                style={{ 
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.input,
                }}
                value={startYearValue}
                onChangeText={setStartYearValue}
                placeholder="Start Year (e.g., 2024)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
              <TextInput
                className="flex-1 rounded-lg p-3 font-gilroy text-base"
                style={{ 
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.input,
                }}
                value={endYearValue}
                onChangeText={setEndYearValue}
                placeholder="End Year (e.g., 2027)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-lg p-3 items-center"
                style={{ backgroundColor: colors.border }}
                onPress={() => {
                  setShowEducationModal(false);
                  setEditingEducation(null);
                }}
                disabled={saving}
              >
                <Text className="font-gilroy-semibold text-base" style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-lg p-3 items-center"
                onPress={handleSaveEducation}
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

      {/* Experience Modal */}
      <Modal
        visible={showExperienceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowExperienceModal(false);
          setEditingExperience(null);
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.card }}
          >
            <Text className="font-gilroy-semibold text-lg mb-4" style={{ color: colors.text }}>
              {editingExperience ? 'Edit Experience' : 'Add Experience'}
            </Text>
            
            <TextInput
              className="rounded-lg p-3 font-gilroy text-base mb-3"
              style={{ 
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.input,
              }}
              value={positionValue}
              onChangeText={setPositionValue}
              placeholder="Position (e.g., Graphic Designer)"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />

            <TextInput
              className="rounded-lg p-3 font-gilroy text-base mb-3"
              style={{ 
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.input,
              }}
              value={companyValue}
              onChangeText={setCompanyValue}
              placeholder="Company (e.g., Institute of Advanced Research)"
              placeholderTextColor="#9CA3AF"
            />

            <TextInput
              className="rounded-lg p-3 font-gilroy text-base mb-3"
              style={{ 
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.input,
              }}
              value={durationValue}
              onChangeText={setDurationValue}
              placeholder="Duration (e.g., Present - Remote - Freelance)"
              placeholderTextColor="#9CA3AF"
            />

            <TextInput
              className="rounded-lg p-3 font-gilroy text-base mb-3"
              style={{ 
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.input,
              }}
              value={locationValue}
              onChangeText={setLocationValue}
              placeholder="Location (optional)"
              placeholderTextColor="#9CA3AF"
            />

            <TextInput
              className="rounded-lg p-3 font-gilroy text-base mb-4"
              style={{ 
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.input,
              }}
              value={typeValue}
              onChangeText={setTypeValue}
              placeholder="Type (optional, e.g., Full-time, Part-time)"
              placeholderTextColor="#9CA3AF"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-lg p-3 items-center"
                style={{ backgroundColor: colors.border }}
                onPress={() => {
                  setShowExperienceModal(false);
                  setEditingExperience(null);
                }}
                disabled={saving}
              >
                <Text className="font-gilroy-semibold text-base" style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-lg p-3 items-center"
                onPress={handleSaveExperience}
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
    </View>
  );
}

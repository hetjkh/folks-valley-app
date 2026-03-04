import BottomNavigation from '@/components/BottomNavigation';
import { useTheme } from '@/contexts/ThemeContext';
import { createSkill, deleteSkill, getCurrentUser, getSkills, Skill, updateSkill, User } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [skillNameValue, setSkillNameValue] = useState('');
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    loadUser();
    loadSkills();
  }, []);

  const loadUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data.user);
    } catch (error) {
      // If token is invalid, redirect to login
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadSkills = async () => {
    try {
      const data = await getSkills();
      setSkills(data.skills);
    } catch (error) {
      console.error('Failed to load skills:', error);
    }
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill._id);
    setSkillNameValue(skill.name);
  };

  const handleSaveSkill = async () => {
    if (!editingSkill || !skillNameValue.trim()) {
      Alert.alert('Error', 'Skill name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const response = await updateSkill(editingSkill, skillNameValue.trim());
      setSkills(prev => prev.map(s => s._id === editingSkill ? response.skill : s));
      setEditingSkill(null);
      setSkillNameValue('');
      Alert.alert('Success', 'Skill updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update skill');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) {
      Alert.alert('Error', 'Please enter a skill name');
      return;
    }

    setSaving(true);
    try {
      const response = await createSkill(newSkillName.trim(), 'Intermediate');
      setSkills(prev => [...prev, response.skill]);
      setShowAddSkillModal(false);
      setNewSkillName('');
      Alert.alert('Success', 'Skill added successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add skill');
    } finally {
      setSaving(false);
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
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-gilroy text-3xl" style={{ color: colors.text }}>
                Hello, <Text className="font-gilroy-bold">{user?.name || 'User'}</Text>
              </Text>
              <Text className="font-gilroy text-base mt-2 mb-0" style={{ color: colors.textSecondary }}>
                Time to show off your skills!
              </Text>
            </View>
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
                className="w-12 h-12 bg-black rounded-full items-center justify-center"
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-3 py-6">
          <Text className="font-gilroy-bold text-3xl mb-6" style={{ color: colors.text }}>
            Dashboard
          </Text>

          {/* Grid of Cards */}
          <View className="gap-3">
            {/* Portfolio View Card - Full Width */}
            <TouchableOpacity
              className="w-full rounded-xl p-4 mb-4 relative overflow-hidden min-h-[120px]"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              onPress={() => router.push('/portfolio')}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-gilroy-bold text-xl mb-1" style={{ color: colors.text }}>
                    View My Portfolio
                  </Text>
                  <Text className="font-gilroy text-xs" style={{ color: colors.textSecondary }}>
                    See all your details in one beautiful view
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={40} color="#2563eb" />
              </View>
            </TouchableOpacity>

            {/* Row 1 */}
            <View className="flex-row gap-3 mb-4">
              {/* Total Visits Card */}
              <View 
                className="flex-1 rounded-xl p-4 relative overflow-hidden min-h-[160px]"
                style={{ 
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="font-gilroy-semibold text-base flex-1" style={{ color: colors.text }}>Total Visits</Text>
                  </View>
                  <Text className="font-gilroy text-[10px]" style={{ color: colors.textMuted }}>Eyes on You: Total Views</Text>
                </View>
                <Text className="font-gilroy-bold text-[42px]" style={{ color: colors.text }}>94</Text>
                <Ionicons name="eye-outline" size={80} color={colors.border} className="absolute -right-2.5 -bottom-2.5 opacity-30" />
              </View>

              {/* Total Projects Card */}
              <View 
                className="flex-1 rounded-xl p-4 relative overflow-hidden min-h-[160px]"
                style={{ 
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="font-gilroy-semibold text-base flex-1" style={{ color: colors.text }}>Total Projects</Text>
                  </View>
                  <Text className="font-gilroy text-[10px]" style={{ color: colors.textMuted }}>A Gallery of Your Achievements</Text>
                </View>
                <Text className="font-gilroy-bold text-[42px]" style={{ color: colors.text }}>13</Text>
                <Ionicons name="briefcase-outline" size={80} color={colors.border} className="absolute -right-2.5 -bottom-2.5 opacity-30" />
              </View>
            </View>

            {/* Row 2 - Skills Card (Full Width) */}
            <View className="flex-row gap-3 mb-4">
              <View 
                className="w-full flex-1 rounded-xl p-4 relative overflow-hidden min-h-[160px]"
                style={{ 
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row justify-between items-start mb-2">
                    <Text className="font-gilroy-semibold text-base flex-1" style={{ color: colors.text }}>Your Skills</Text>
                  {editMode && (
                    <TouchableOpacity 
                      className="w-8 h-8 rounded-full bg-black items-center justify-center"
                      onPress={() => setShowAddSkillModal(true)}
                    >
                      <Ionicons name="add" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text className="font-gilroy text-[10px] mb-3" style={{ color: colors.textMuted }}>Your technical skills and expertise</Text>
                <View className="flex-row flex-wrap gap-2 mt-2">
                  {skills.length === 0 ? (
                    <Text className="font-gilroy text-xs" style={{ color: colors.textSecondary }}>
                      {editMode ? 'Tap + to add skills' : 'No skills added yet'}
                    </Text>
                  ) : (
                    skills.map((skill) => (
                      <View key={skill._id} className="flex-row items-center gap-1 bg-black rounded-md px-3 py-1.5">
                        {editingSkill === skill._id ? (
                          <TextInput
                            className="font-gilroy-medium text-white text-xs min-w-[80px]"
                            style={{ color: '#ffffff' }}
                            value={skillNameValue}
                            onChangeText={setSkillNameValue}
                            autoFocus
                            onSubmitEditing={handleSaveSkill}
                            onBlur={handleSaveSkill}
                            placeholder="Skill name"
                            placeholderTextColor="#9CA3AF"
                          />
                        ) : (
                          <TouchableOpacity
                            onPress={() => editMode && handleEditSkill(skill)}
                            disabled={!editMode}
                            activeOpacity={editMode ? 0.7 : 1}
                          >
                            <Text className="font-gilroy-medium text-white text-xs">{skill.name}</Text>
                          </TouchableOpacity>
                        )}
                        {editMode && editingSkill !== skill._id && (
                          <TouchableOpacity
                            onPress={async () => {
                              Alert.alert(
                                'Delete Skill',
                                `Are you sure you want to delete "${skill.name}"?`,
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                      try {
                                        await deleteSkill(skill._id);
                                        setSkills(prev => prev.filter(s => s._id !== skill._id));
                                      } catch (error: any) {
                                        Alert.alert('Error', error.message || 'Failed to delete skill');
                                      }
                                    },
                                  },
                                ]
                              );
                            }}
                          >
                            <Ionicons name="close" size={14} color="#ffffff" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>

            {/* Row 3 */}
            <View className="flex-row gap-3 mb-4">
              {/* Social Links Card */}
              <View 
                className="flex-1 rounded-xl p-4 relative overflow-hidden min-h-[160px]"
                style={{ 
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="font-gilroy-semibold text-base flex-1" style={{ color: colors.text }}>Social Links</Text>
                  </View>
                  <Text className="font-gilroy text-[10px]" style={{ color: colors.textMuted }}>Eyes on You: Total Views</Text>
                </View>
                <Text className="font-gilroy-bold text-[42px]" style={{ color: colors.text }}>5</Text>
                <Ionicons name="logo-github" size={80} color={colors.border} className="absolute -right-2.5 -bottom-2.5 opacity-30" />
              </View>

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
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="font-gilroy-semibold text-base flex-1" style={{ color: colors.text }}>Experience</Text>
                  </View>
                  <Text className="font-gilroy text-[10px]" style={{ color: colors.textMuted }}>Your total experience till now.</Text>
                </View>
                <Text className="font-gilroy-bold text-[42px]" style={{ color: colors.text }}>6M</Text>
                <Ionicons name="hammer-outline" size={80} color={colors.border} className="absolute -right-2.5 -bottom-2.5 opacity-30" />
              </View>
            </View>

            {/* Row 4 - Likes Card (centered) */}
            <View className="flex-row gap-3 mb-4">
              <View 
                className="flex-1 max-w-[47%] rounded-xl p-4 relative overflow-hidden min-h-[160px]"
                style={{ 
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="font-gilroy-semibold text-base flex-1" style={{ color: colors.text }}>Likes</Text>
                  </View>
                  <Text className="font-gilroy text-[10px]" style={{ color: colors.textMuted }}>Your total likes till now.</Text>
                </View>
                <Text className="font-gilroy-bold text-[42px]" style={{ color: colors.text }}>75</Text>
                <Ionicons name="heart-outline" size={80} color={colors.border} className="absolute -right-2.5 -bottom-2.5 opacity-30" />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNavigation />

      {/* Add Skill Modal */}
      <Modal
        visible={showAddSkillModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddSkillModal(false);
          setNewSkillName('');
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.card }}
          >
            <Text className="font-gilroy-semibold text-lg mb-4" style={{ color: colors.text }}>
              Add New Skill
            </Text>
            <TextInput
              className="rounded-lg p-3 font-gilroy text-base mb-4"
              style={{ 
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.input || colors.card,
              }}
              value={newSkillName}
              onChangeText={setNewSkillName}
              placeholder="Enter skill name (e.g., React, Python, JavaScript)"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-lg p-3 items-center"
                style={{ backgroundColor: colors.border }}
                onPress={() => {
                  setShowAddSkillModal(false);
                  setNewSkillName('');
                }}
                disabled={saving}
              >
                <Text className="font-gilroy-semibold text-base" style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-lg p-3 items-center"
                onPress={handleAddSkill}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="font-gilroy-semibold text-base text-white">Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


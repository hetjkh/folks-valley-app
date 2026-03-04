import BottomNavigation from '@/components/BottomNavigation';
import { useTheme } from '@/contexts/ThemeContext';
import { Education, Experience, getCurrentUser, getEducation, getExperience, getFollowStats, getProjects, getSkills, Project, Skill, User } from '@/utils/api';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';

export default function PortfolioScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      const [userData, projectsData, educationData, experienceData, skillsData, statsData] = await Promise.all([
        getCurrentUser().catch(() => ({ user: null })),
        getProjects().catch(() => ({ projects: [] })),
        getEducation().catch(() => ({ education: [] })),
        getExperience().catch(() => ({ experience: [] })),
        getSkills().catch(() => ({ skills: [] })),
        getCurrentUser().then(u => getFollowStats(u.user.id)).catch(() => ({ followersCount: 0, followingCount: 0 })),
      ]);

      setUser(userData.user);
      setProjects(projectsData.projects || []);
      setEducation(educationData.education || []);
      setExperience(experienceData.experience || []);
      setSkills(skillsData.skills || []);
      setFollowStats(statsData);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProfileUrl = () => {
    if (!user) return '';
    const identifier = user.username || user.id;
    return `http://localhost:3000/profile/${identifier}`;
  };

  const handleShare = async () => {
    const url = getProfileUrl();
    try {
      await Share.share({
        message: `Check out my portfolio: ${url}`,
        url,
        title: 'My Portfolio',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleOpenLink = async (url: string, platform: string) => {
    if (!url || !url.trim()) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const getCompanyInitials = (company: string) => {
    return company
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const parseExperienceTimeline = (duration: string) => {
    const parts = duration.split(' - ');
    return {
      start: parts[0] || '',
      end: parts[1] || 'Present',
    };
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.bg }}>
        <Text className="font-gilroy text-lg" style={{ color: colors.text }}>Please login to view portfolio</Text>
        <TouchableOpacity
          className="mt-4 px-6 py-3 rounded-lg"
          style={{ backgroundColor: '#2563eb' }}
          onPress={() => router.push('/login')}
        >
          <Text className="font-gilroy-semibold text-white">Go to Login</Text>
        </TouchableOpacity>
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
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-gilroy-bold text-3xl" style={{ color: colors.text }}>
              My Portfolio
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.toggle }}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Ionicons name="share-outline" size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.toggle }}
                onPress={toggleTheme}
                activeOpacity={0.8}
              >
                <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-4 py-6">
          {/* Profile Header */}
          <View
            className="rounded-2xl p-6 mb-6"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Banner Image */}
            {user.bannerImage ? (
              <Image
                source={{ uri: user.bannerImage }}
                className="w-full h-32 rounded-xl mb-4"
                resizeMode="cover"
              />
            ) : (
              <View
                className="w-full h-32 rounded-xl mb-4 items-center justify-center"
                style={{ backgroundColor: colors.border }}
              >
                <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
              </View>
            )}

            {/* Profile Picture and Name */}
            <View className="flex-row items-start">
              {user.profilePicture ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  className="w-20 h-20 rounded-full"
                  style={{ marginTop: -40, borderWidth: 4, borderColor: colors.card }}
                />
              ) : (
                <View
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{
                    marginTop: -40,
                    backgroundColor: colors.border,
                    borderWidth: 4,
                    borderColor: colors.card,
                  }}
                >
                  <Ionicons name="person" size={32} color={colors.textSecondary} />
                </View>
              )}

              <View className="flex-1 ml-4 mt-2">
                <Text className="font-gilroy-bold text-2xl" style={{ color: colors.text }}>
                  {user.name}
                </Text>
                {user.username && (
                  <Text className="font-gilroy text-sm mt-1" style={{ color: colors.textSecondary }}>
                    @{user.username}
                  </Text>
                )}
                {user.about && (
                  <Text className="font-gilroy text-sm mt-2" style={{ color: colors.text }}>
                    {user.about}
                  </Text>
                )}
              </View>
            </View>

            {/* Social Stats */}
            <View className="flex-row gap-4 mt-4 pt-4 border-t" style={{ borderTopColor: colors.border }}>
              <View className="flex-1 items-center">
                <Text className="font-gilroy-bold text-xl" style={{ color: colors.text }}>
                  {followStats.followersCount}
                </Text>
                <Text className="font-gilroy text-xs" style={{ color: colors.textSecondary }}>
                  Followers
                </Text>
              </View>
              <View className="w-px" style={{ backgroundColor: colors.border }} />
              <View className="flex-1 items-center">
                <Text className="font-gilroy-bold text-xl" style={{ color: colors.text }}>
                  {followStats.followingCount}
                </Text>
                <Text className="font-gilroy text-xs" style={{ color: colors.textSecondary }}>
                  Following
                </Text>
              </View>
              <View className="w-px" style={{ backgroundColor: colors.border }} />
              <View className="flex-1 items-center">
                <Text className="font-gilroy-bold text-xl" style={{ color: colors.text }}>
                  {projects.length}
                </Text>
                <Text className="font-gilroy text-xs" style={{ color: colors.textSecondary }}>
                  Projects
                </Text>
              </View>
            </View>

            {/* Social Links */}
            {user.socialLinks && (
              <View className="flex-row gap-3 mt-4 pt-4 border-t" style={{ borderTopColor: colors.border }}>
                {user.socialLinks.linkedin && user.socialLinks.linkedin.trim() && (
                  <TouchableOpacity
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#0077b5' }}
                    onPress={() => handleOpenLink(user.socialLinks!.linkedin!, 'LinkedIn')}
                  >
                    <Ionicons name="logo-linkedin" size={20} color="#ffffff" />
                  </TouchableOpacity>
                )}
                {user.socialLinks.twitter && user.socialLinks.twitter.trim() && (
                  <TouchableOpacity
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#1DA1F2' }}
                    onPress={() => handleOpenLink(user.socialLinks!.twitter!, 'Twitter')}
                  >
                    <Ionicons name="logo-twitter" size={20} color="#ffffff" />
                  </TouchableOpacity>
                )}
                {user.socialLinks.instagram && user.socialLinks.instagram.trim() && (
                  <TouchableOpacity
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#E4405F' }}
                    onPress={() => handleOpenLink(user.socialLinks!.instagram!, 'Instagram')}
                  >
                    <Ionicons name="logo-instagram" size={20} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Skills Section */}
          {skills.length > 0 && (
            <View
              className="rounded-xl p-4 mb-6"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center mb-4">
                <Ionicons name="code-slash-outline" size={24} color="#2563eb" />
                <Text className="font-gilroy-bold text-xl ml-2" style={{ color: colors.text }}>
                  Skills
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {skills.map((skill) => (
                  <View
                    key={skill._id}
                    className="px-4 py-2 rounded-full"
                    style={{ backgroundColor: colors.border }}
                  >
                    <Text className="font-gilroy-semibold text-sm" style={{ color: colors.text }}>
                      {skill.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <View
              className="rounded-xl p-4 mb-6"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center mb-4">
                <Ionicons name="school-outline" size={24} color="#10b981" />
                <Text className="font-gilroy-bold text-xl ml-2" style={{ color: colors.text }}>
                  Education
                </Text>
              </View>
              {education.map((edu) => (
                <View
                  key={edu._id}
                  className="mb-4 pb-4 border-b"
                  style={{ borderBottomColor: colors.border }}
                >
                  <Text className="font-gilroy-bold text-base" style={{ color: colors.text }}>
                    {edu.degree}
                  </Text>
                  <Text className="font-gilroy text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {edu.institute}
                  </Text>
                  <Text className="font-gilroy text-xs mt-1" style={{ color: colors.textSecondary }}>
                    {edu.startYear} - {edu.endYear || 'Present'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Experience Section */}
          {experience.length > 0 && (
            <View
              className="rounded-xl p-4 mb-6"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center mb-4">
                <Ionicons name="briefcase-outline" size={24} color="#f59e0b" />
                <Text className="font-gilroy-bold text-xl ml-2" style={{ color: colors.text }}>
                  Experience
                </Text>
              </View>
              {experience.map((exp) => {
                const timeline = parseExperienceTimeline(exp.duration);
                return (
                  <View
                    key={exp._id}
                    className="mb-4 pb-4 border-b"
                    style={{ borderBottomColor: colors.border }}
                  >
                    <Text className="font-gilroy-bold text-base" style={{ color: colors.text }}>
                      {exp.position}
                    </Text>
                    <Text className="font-gilroy text-sm mt-1" style={{ color: colors.textSecondary }}>
                      {exp.company}
                    </Text>
                    <Text className="font-gilroy text-xs mt-1" style={{ color: colors.textSecondary }}>
                      {timeline.start} - {timeline.end}
                    </Text>
                    {exp.location && (
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                        <Text className="font-gilroy text-xs ml-1" style={{ color: colors.textSecondary }}>
                          {exp.location}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <View
              className="rounded-xl p-4 mb-6"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center mb-4">
                <Ionicons name="folder-outline" size={24} color="#8b5cf6" />
                <Text className="font-gilroy-bold text-xl ml-2" style={{ color: colors.text }}>
                  Projects
                </Text>
              </View>
              {projects.map((project) => (
                <View
                  key={project._id}
                  className="mb-4 pb-4 border-b"
                  style={{ borderBottomColor: colors.border }}
                >
                  {project.image && (
                    <Image
                      source={{ uri: project.image }}
                      className="w-full h-40 rounded-lg mb-3"
                      resizeMode="cover"
                    />
                  )}
                  <Text className="font-gilroy-bold text-base" style={{ color: colors.text }}>
                    {project.title}
                  </Text>
                  {project.technologies && project.technologies.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 mt-2">
                      {project.technologies.slice(0, 5).map((tech, index) => (
                        <View
                          key={index}
                          className="px-2 py-1 rounded"
                          style={{ backgroundColor: colors.border }}
                        >
                          <Text className="font-gilroy text-xs" style={{ color: colors.textSecondary }}>
                            {tech}
                          </Text>
                        </View>
                      ))}
                      {project.technologies.length > 5 && (
                        <Text className="font-gilroy text-xs self-center" style={{ color: colors.textSecondary }}>
                          +{project.technologies.length - 5} more
                        </Text>
                      )}
                    </View>
                  )}
                  {project.url && (
                    <TouchableOpacity
                      className="flex-row items-center mt-2"
                      onPress={() => Linking.openURL(project.url!)}
                    >
                      <Ionicons name="link-outline" size={14} color="#2563eb" />
                      <Text className="font-gilroy text-xs ml-1" style={{ color: '#2563eb' }}>
                        View Project
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Contact Info */}
          <View
            className="rounded-xl p-4 mb-6"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center mb-4">
              <Ionicons name="mail-outline" size={24} color="#ef4444" />
              <Text className="font-gilroy-bold text-xl ml-2" style={{ color: colors.text }}>
                Contact
              </Text>
            </View>
            <View className="gap-3">
              <View className="flex-row items-center">
                <Ionicons name="mail" size={16} color={colors.textSecondary} />
                <Text className="font-gilroy text-sm ml-2" style={{ color: colors.text }}>
                  {user.email}
                </Text>
              </View>
              {user.phone && (
                <View className="flex-row items-center">
                  <Ionicons name="call" size={16} color={colors.textSecondary} />
                  <Text className="font-gilroy text-sm ml-2" style={{ color: colors.text }}>
                    {user.phone}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

'use client';

import { trackView } from '@/utils/auth';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface User {
  id: string;
  name: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  profilePicture?: string | null;
  bannerImage?: string | null;
  about?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    telegram?: string;
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    github?: string;
  };
}

interface Project {
  _id: string;
  title: string;
  image?: string | null;
  technologies: string[];
  url?: string | null;
  category?: string;
}

interface Education {
  _id: string;
  degree: string;
  institute: string;
  startYear: string;
  endYear: string;
}

interface Experience {
  _id: string;
  position: string;
  company: string;
  duration: string;
  location?: string;
  type?: string;
}

interface Skill {
  _id: string;
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

interface ProfileData {
  user: User;
  projects: Project[];
  education: Education[];
  experience: Experience[];
  skills: Skill[];
}

const API_URL = 'http://192.168.1.13:3000/api';

async function getProfileData(username: string): Promise<ProfileData | null> {
  try {
    // First try to fetch by username
    let response = await fetch(`${API_URL}/public/username/${username}`, {
      cache: 'no-store',
    });

    // If username fails, try as ID for backward compatibility
    if (!response.ok && /^[0-9a-fA-F]{24}$/.test(username)) {
      response = await fetch(`${API_URL}/public/user/${username}`, {
        cache: 'no-store',
      });
    }

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

async function getProjectLikes(projectId: string): Promise<number> {
  try {
    const response = await fetch(`${API_URL}/projects/${projectId}/likes`, {
      cache: 'no-store',
    });
    if (response.ok) {
      const data = await response.json();
      return data.likeCount || 0;
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

async function getProjectComments(projectId: string) {
  try {
    const response = await fetch(`${API_URL}/projects/${projectId}/comments`, {
      cache: 'no-store',
    });
    if (response.ok) {
      const data = await response.json();
      return data.comments || [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

async function getFollowStats(userId: string) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/follow-stats`, {
      cache: 'no-store',
    });
    if (response.ok) {
      return await response.json();
    }
    return { followersCount: 0, followingCount: 0 };
  } catch (error) {
    return { followersCount: 0, followingCount: 0 };
  }
}

// Metadata is handled via useEffect in Client Component

// Helper function to get company initials for logo
function getCompanyInitials(company: string): string {
  const words = company.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return company.substring(0, 2).toUpperCase();
}

// Helper function to parse duration and extract dates
function parseExperienceTimeline(duration: string): { start: string; duration: string; end: string } {
  // Try to extract dates from duration string
  const parts = duration.split(/[-–—]/).map(s => s.trim());
  
  if (parts.length >= 2) {
    return {
      start: parts[0],
      duration: parts[1] || '',
      end: parts[1] || 'Present',
    };
  }
  
  // If it's just a duration like "6 Months"
  if (duration.match(/\d+\s*(month|year|day)/i)) {
    return {
      start: 'Start',
      duration: duration,
      end: 'Present',
    };
  }
  
  return {
    start: 'Start',
    duration: duration || 'N/A',
    end: 'Present',
  };
}

// Follow Button Component
function FollowButtonComponent({ userId, token, onFollowChange }: { userId: string; token: string; onFollowChange: (stats: any) => void }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkFollowStatus();
  }, [userId, token]);

  const checkFollowStatus = async () => {
    try {
      setChecking(true);
      const response = await fetch(`${API_URL}/users/${userId}/follow-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
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
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/users/${userId}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setIsFollowing(!isFollowing);
        const stats = await getFollowStats(userId);
        onFollowChange(stats);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to follow/unfollow');
      }
    } catch (error) {
      console.error('Follow error:', error);
      alert('Failed to follow/unfollow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-lg font-semibold bg-gray-700 text-white opacity-50"
      >
        ...
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
        isFollowing
          ? 'bg-gray-700 text-white hover:bg-gray-600'
          : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'
      } disabled:opacity-50`}
    >
      {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.id as string; // Using id param but treating it as username
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectLikes, setProjectLikes] = useState<Record<string, number>>({});
  const [projectComments, setProjectComments] = useState<Record<string, any[]>>({});
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
  const [token, setToken] = useState<string | null>(null);
  const hasTrackedView = useRef(false); // Track if we've already recorded a view for this page load

  const loadSocialData = async () => {
    if (!data?.user) return;
    
    try {
      // Load follow stats
      const stats = await getFollowStats(data.user.id);
      setFollowStats(stats);

      // Load likes and comments for all projects
      if (data.projects) {
        const likesData: Record<string, number> = {};
        const commentsData: Record<string, any[]> = {};
        
        await Promise.all(
          data.projects.map(async (project) => {
            const [likes, comments] = await Promise.all([
              getProjectLikes(project._id),
              getProjectComments(project._id),
            ]);
            likesData[project._id] = likes;
            commentsData[project._id] = comments;
          })
        );
        
        setProjectLikes(likesData);
        setProjectComments(commentsData);
      }
    } catch (error) {
      console.error('Error loading social data:', error);
    }
  };

  useEffect(() => {
    // Check for auth token (from localStorage)
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const profileData = await getProfileData(username);
        setData(profileData);
        
        // Update document title
        if (profileData?.user) {
          document.title = `${profileData.user.name} - Profile`;
          
          // Track profile view (only once per page load)
          if (!hasTrackedView.current && profileData.user.id) {
            hasTrackedView.current = true;
            // Track view asynchronously - don't wait for it
            trackView(profileData.user.id).catch(err => {
              console.error('Failed to track view:', err);
            });
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [username]);

  // Refresh social data when token changes or data loads
  useEffect(() => {
    if (data?.user) {
      loadSocialData();
    }
  }, [data?.user, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#080808] text-[#cfcfcf]">
        <div>Loading...</div>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const { user, projects, education, experience, skills } = data;

  return (
    <div className="relative flex justify-center items-start min-h-screen min-w-screen bg-[#080808] text-[#cfcfcf] text-base leading-[1.4em]" style={{ fontFamily: 'var(--font-poppins), "Poppins", sans-serif' }}>
      <div className="relative flex justify-center items-start w-[95vw] h-auto">
        {/* Left Section - Profile & Experience */}
        <div className="relative flex justify-center items-center flex-col w-[30%] h-auto">
          {/* Profile Details Card */}
          <div className="relative flex justify-center items-center flex-col w-[90%] h-auto m-2.5 bg-[#1d1d1d] border border-[#ffffff20] p-2.5 pb-5 rounded-[15px]">
            {/* Banner */}
            <div className="relative flex justify-center items-center flex-col w-full h-auto rounded-[10px] overflow-hidden bg-black shadow-[0_-50px_40px_5px_#000_inset]">
              {user.bannerImage ? (
                <img
                  src={user.bannerImage}
                  alt="Banner"
                  className="z-0 w-full"
                />
              ) : (
                <div className="w-full h-[200px] bg-gradient-to-br from-[#667eea] to-[#764ba2]" />
              )}
            </div>

            {/* About Section */}
            <div className="relative flex justify-center items-start flex-col w-full h-auto -mt-[70px]">
              {/* Name and Follow Button */}
              <div className="flex justify-between items-start w-full pl-2.5 pr-2.5">
                <div className="text-[40px] text-white font-semibold">
                  {user.name}
                </div>
                {token && user.id && (
                  <FollowButtonComponent 
                    userId={user.id} 
                    token={token} 
                    onFollowChange={(stats) => {
                      setFollowStats(stats);
                    }} 
                  />
                )}
                {!token && (
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-[#2563eb] text-white rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors"
                  >
                    Sign In to Follow
                  </Link>
                )}
              </div>

              {/* Follow Stats */}
              <div className="flex gap-6 pl-2.5 mt-4">
                <div className="cursor-pointer" onClick={() => router.push(`/profile/${username}?tab=followers`)}>
                  <span className="font-bold text-white">{followStats.followersCount}</span>
                  <span className="text-sm text-gray-400 ml-1">Followers</span>
                </div>
                <div className="cursor-pointer" onClick={() => router.push(`/profile/${username}?tab=following`)}>
                  <span className="font-bold text-white">{followStats.followingCount}</span>
                  <span className="text-sm text-gray-400 ml-1">Following</span>
                </div>
              </div>

              {/* Skills */}
              {skills.length > 0 && (
                <div className="relative flex justify-start items-start flex-wrap w-4/5 my-2.5 pl-2.5">
                  {skills.map((skill) => (
                    <div
                      key={skill._id}
                      className="relative flex justify-center items-center bg-[rgb(132,255,132)] text-[#080808] px-2 text-xs font-semibold rounded-[5px] m-[3px]"
                    >
                      {skill.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              {user.about && (
                <div className="relative px-2.5 mb-2.5 text-sm font-medium text-white opacity-60">
                  {user.about}
                </div>
              )}
            </div>

            {/* Connect Button */}
            {user.socialLinks && Object.values(user.socialLinks).some((link) => link?.trim()) && (
              <div className="relative flex justify-center items-center flex-col w-[95%] h-auto">
                <a
                  href="#connect-section"
                  className="relative flex justify-center items-center w-full min-h-[40px] rounded-[10px] border-0 bg-[#e0c8ff] text-xl font-bold text-[#080808] no-underline cursor-pointer"
                >
                  Connect
                </a>
              </div>
            )}
          </div>

          {/* Experience Section */}
          {experience.length > 0 && (
            <div className="relative flex justify-start items-start flex-col w-[90%] h-auto m-2.5 p-2.5 rounded-[15px]">
              <h4 className="relative mt-[5px] mb-[15px] text-[30px] font-semibold text-white transition-all duration-500 w-full text-center">
                Experience
              </h4>

              {experience.map((exp) => {
                const timeline = parseExperienceTimeline(exp.duration);
                return (
                  <div
                    key={exp._id}
                    className="experi-card relative flex justify-start items-center flex-col w-full h-auto py-2.5 mt-5 border border-[#ffffff20] bg-[#1d1d1d] rounded-[15px]"
                  >
                    <div className="relative flex justify-start items-start w-[95%] h-auto">
                      {/* Logo */}
                      <div className="relative flex justify-center items-center w-[70px] h-[70px] rounded-[10px] overflow-hidden bg-[#080808]">
                        <div className="w-[90%] h-[90%] flex justify-center items-center text-2xl font-semibold text-white bg-[#1d1d1d]">
                          {getCompanyInitials(exp.company)}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="relative flex justify-start items-start flex-col w-[78%] h-full ml-2.5">
                        <div className="text-xl font-semibold h-full mb-[5px] text-white">
                          {exp.position}
                        </div>
                        <div className="text-base font-normal h-full text-[#ddd6e9]">
                          {exp.company}
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="timeline relative flex justify-center items-center w-[85%] h-[3px] bg-[#cfcfcf] mt-5 mb-2.5 transition-all duration-500">
                      <div className="timeline-start absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-white border-2 border-[#cfcfcf] transition-all duration-500"></div>
                      <div className="timeline-end absolute -right-[5px] h-2.5 w-2.5 rounded-full bg-white border-2 border-[#cfcfcf] transition-all duration-500"></div>
                    </div>

                    {/* Time Section */}
                    <div className="relative flex justify-center items-center w-[95%] text-xl font-medium mt-2.5">
                      <div className="relative flex justify-start items-center w-1/3 text-[15px] font-semibold text-left">
                        {timeline.start}
                      </div>
                      <div className="time-duration relative flex justify-center items-center w-1/3 font-semibold text-left text-[#cfcfcf] text-[15px] transition-all duration-500">
                        {timeline.duration}
                      </div>
                      <div className="relative flex justify-end items-center w-1/3 text-right font-semibold text-[15px]">
                        {timeline.end}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <div className="relative flex justify-start items-start flex-col w-[90%] h-auto m-2.5 p-2.5 rounded-[15px]">
              <h4 className="relative mt-[5px] mb-[15px] text-[30px] font-semibold text-white transition-all duration-500 w-full text-center">
                Education
              </h4>

              {education.map((edu) => (
                <div
                  key={edu._id}
                  className="relative flex justify-start items-center flex-col w-full h-auto py-2.5 mt-5 border border-[#ffffff20] bg-[#1d1d1d] rounded-[15px]"
                >
                  <div className="relative flex justify-start items-start w-[95%] h-auto">
                    <div className="relative flex justify-center items-center w-[70px] h-[70px] rounded-[10px] overflow-hidden bg-[#080808]">
                      <div className="w-[90%] h-[90%] flex justify-center items-center text-2xl font-semibold text-white bg-[#1d1d1d]">
                        {getCompanyInitials(edu.institute)}
                      </div>
                    </div>

                    <div className="relative flex justify-start items-start flex-col w-[78%] h-full ml-2.5">
                      <div className="text-xl font-semibold h-full mb-[5px] text-white">
                        {edu.degree}
                      </div>
                      <div className="text-base font-normal h-full text-[#ddd6e9]">
                        {edu.institute}
                      </div>
                      <div className="text-sm font-normal mt-[5px] text-[#cfcfcf] opacity-70">
                        {edu.startYear} - {edu.endYear}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Connect Section */}
          {user.socialLinks && Object.values(user.socialLinks).some((link) => link?.trim()) && (
            <div id="connect-section" className="relative flex justify-start items-start flex-col w-[90%] h-auto m-2.5 p-2.5 rounded-[15px] bg-[#1d1d1d] border border-[#ffffff20]">
              <h4 className="text-[25px] text-white mb-[15px]">
                Connect
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {user.socialLinks.linkedin && user.socialLinks.linkedin.trim() && (
                  <a
                    href={user.socialLinks.linkedin.startsWith('http') ? user.socialLinks.linkedin : `https://${user.socialLinks.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#1d1d1d] border border-[#ffffff20] text-[#e7d9f4] no-underline text-sm"
                  >
                    LinkedIn
                  </a>
                )}
                {user.socialLinks.github && user.socialLinks.github.trim() && (
                  <a
                    href={user.socialLinks.github.startsWith('http') ? user.socialLinks.github : `https://${user.socialLinks.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#1d1d1d] border border-[#ffffff20] text-[#e7d9f4] no-underline text-sm"
                  >
                    GitHub
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Projects */}
        <div className="relative w-[70%] p-2.5 h-auto">
          {/* Projects Container - Masonry Layout */}
          <div className="projects-container">
            {/* Projects Header - White Card (First Pin) */}
            <div className="inline-block w-full h-auto mb-5 mt-0 bg-white overflow-hidden rounded-[15px] p-2.5 border border-[#ffffff20]">
              <div className="relative flex justify-center items-center w-full min-h-[200px]">
                <p className="text-[60px] font-semibold text-[#080808] text-center w-full m-0">
                  Projects
                </p>
              </div>
            </div>

            {/* Project Cards */}
            {projects.length > 0 ? projects.map((project) => (
              <div
                key={project._id}
                className="inline-block w-full h-auto mb-5 mt-0 bg-[#1d1d1d] overflow-hidden rounded-[15px] p-2.5 border border-[#ffffff20]"
              >
                {/* Project Image */}
                <div className="relative flex justify-center items-center w-full">
                  {project.image ? (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full rounded-[10px] cursor-pointer"
                      onClick={() => project.url && window.open(project.url.startsWith('http') ? project.url : `https://${project.url}`, '_blank')}
                    />
                  ) : (
                    <div className="w-full h-[200px] rounded-[10px] bg-gradient-to-br from-[#667eea] to-[#764ba2]" />
                  )}
                </div>

                {/* Project Title */}
                <p className="text-sm font-semibold mt-2.5 text-white">
                  {project.title}
                </p>

                {/* Tools/Skills */}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="relative flex justify-end items-center flex-wrap w-full mt-2.5">
                    {project.technologies.map((tech, idx) => (
                      <div
                        key={idx}
                        className="relative flex justify-center items-center bg-[rgb(132,255,132)] text-[#080808] px-2 text-xs font-semibold rounded-[5px] m-[3px]"
                      >
                        {tech}
                      </div>
                    ))}
                  </div>
                )}

                {/* Social Actions */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#ffffff20]">
                  <button
                    onClick={async () => {
                      if (!token) {
                        if (confirm('Please login to like projects. Would you like to go to login page?')) {
                          router.push('/login');
                        }
                        return;
                      }
                      try {
                        // Check if already liked
                        const statusResponse = await fetch(`${API_URL}/projects/${project._id}/like-status`, {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                          },
                        });
                        const isLiked = statusResponse.ok ? (await statusResponse.json()).isLiked : false;
                        
                        const response = await fetch(`${API_URL}/projects/${project._id}/like`, {
                          method: isLiked ? 'DELETE' : 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                          },
                        });
                        if (response.ok) {
                          const likes = await getProjectLikes(project._id);
                          setProjectLikes(prev => ({ ...prev, [project._id]: likes }));
                        }
                      } catch (error) {
                        console.error('Like error:', error);
                      }
                    }}
                    className="flex items-center gap-2 text-white hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm">{projectLikes[project._id] || 0}</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (!token) {
                        if (confirm('Please login to comment. Would you like to go to login page?')) {
                          router.push('/login');
                        }
                        return;
                      }
                      const commentText = prompt('Enter your comment:');
                      if (commentText && commentText.trim()) {
                        try {
                          const response = await fetch(`${API_URL}/projects/${project._id}/comment`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({ text: commentText }),
                          });
                          if (response.ok) {
                            const comments = await getProjectComments(project._id);
                            setProjectComments(prev => ({ ...prev, [project._id]: comments }));
                          }
                        } catch (error) {
                          console.error('Comment error:', error);
                        }
                      }
                    }}
                    className="flex items-center gap-2 text-white hover:text-blue-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm">{projectComments[project._id]?.length || 0}</span>
                  </button>

                  <button
                    onClick={() => {
                      const profileUrl = window.location.href;
                      if (navigator.share) {
                        navigator.share({
                          title: project.title,
                          text: `Check out this project: ${project.title}`,
                          url: profileUrl,
                        });
                      } else {
                        navigator.clipboard.writeText(profileUrl);
                        alert('Link copied to clipboard!');
                      }
                    }}
                    className="flex items-center gap-2 text-white hover:text-green-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="text-sm">Share</span>
                  </button>
                </div>

                {/* Comments Section */}
                {projectComments[project._id] && projectComments[project._id].length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#ffffff20]">
                    <h5 className="text-sm font-semibold text-white mb-2">Comments:</h5>
                    {projectComments[project._id].slice(0, 3).map((comment: any) => (
                      <div key={comment._id} className="mb-2 text-xs text-gray-400">
                        <span className="font-semibold text-white">{comment.userId.name}:</span> {comment.text}
                      </div>
                    ))}
                    {projectComments[project._id].length > 3 && (
                      <button className="text-xs text-blue-400 hover:underline">
                        View all {projectComments[project._id].length} comments
                      </button>
                    )}
                  </div>
                )}
              </div>
            )) : (
              <div className="w-full p-10 text-center text-[#cfcfcf] opacity-60">
                No projects yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

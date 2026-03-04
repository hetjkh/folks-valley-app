import { User } from './api';

export interface CompletionItem {
  key: string;
  label: string;
  completed: boolean;
  weight: number;
}

export interface ProfileCompletion {
  percentage: number;
  items: CompletionItem[];
  suggestions: string[];
}

export const calculateProfileCompletion = (
  user: User | null,
  hasProjects: boolean = false,
  hasEducation: boolean = false,
  hasExperience: boolean = false,
  hasSkills: boolean = false
): ProfileCompletion => {
  if (!user) {
    return {
      percentage: 0,
      items: [],
      suggestions: ['Create an account to get started'],
    };
  }

  const items: CompletionItem[] = [
    {
      key: 'name',
      label: 'Full Name',
      completed: !!user.name && user.name.trim().length > 0,
      weight: 10,
    },
    {
      key: 'username',
      label: 'Username',
      completed: !!user.username && user.username.trim().length > 0,
      weight: 10,
    },
    {
      key: 'profilePicture',
      label: 'Profile Picture',
      completed: !!user.profilePicture,
      weight: 15,
    },
    {
      key: 'bannerImage',
      label: 'Banner Image',
      completed: !!user.bannerImage,
      weight: 10,
    },
    {
      key: 'about',
      label: 'About Section',
      completed: !!user.about && user.about.trim().length > 50,
      weight: 15,
    },
    {
      key: 'phone',
      label: 'Phone Number',
      completed: !!user.phone && user.phone.trim().length > 0,
      weight: 5,
    },
    {
      key: 'socialLinks',
      label: 'Social Media Links',
      completed: !!user.socialLinks && Object.values(user.socialLinks).some(link => link && link.trim().length > 0),
      weight: 10,
    },
    {
      key: 'projects',
      label: 'Projects',
      completed: hasProjects,
      weight: 15,
    },
    {
      key: 'education',
      label: 'Education',
      completed: hasEducation,
      weight: 5,
    },
    {
      key: 'experience',
      label: 'Experience',
      completed: hasExperience,
      weight: 5,
    },
    {
      key: 'skills',
      label: 'Skills',
      completed: hasSkills,
      weight: 5,
    },
  ];

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const completedWeight = items
    .filter(item => item.completed)
    .reduce((sum, item) => sum + item.weight, 0);
  
  const percentage = Math.round((completedWeight / totalWeight) * 100);

  const suggestions = items
    .filter(item => !item.completed)
    .slice(0, 3)
    .map(item => {
      switch (item.key) {
        case 'name':
          return 'Add your full name';
        case 'username':
          return 'Set up your username';
        case 'profilePicture':
          return 'Upload a profile picture';
        case 'bannerImage':
          return 'Add a banner image';
        case 'about':
          return 'Write a detailed about section (at least 50 characters)';
        case 'phone':
          return 'Add your phone number';
        case 'socialLinks':
          return 'Add at least one social media link';
        case 'projects':
          return 'Add at least one project';
        case 'education':
          return 'Add your education details';
        case 'experience':
          return 'Add your work experience';
        case 'skills':
          return 'Add your skills';
        default:
          return `Complete ${item.label}`;
      }
    });

  return {
    percentage,
    items,
    suggestions,
  };
};

// ============================================
// THEME COLORS - SINGLE SOURCE OF TRUTH
// ============================================
// Change colors here to update them across ALL pages
// This is the ONLY file you need to edit to change theme colors

const THEME_COLORS = {
  dark: {
    bg: '#000000',        // Main background
    card: '#0D0D0D',      // Card background
    border: '#272727',    // Card border (1px)
    text: '#ffffff',      // Primary text
    textSecondary: '#9CA3AF', // Secondary text
    textMuted: '#6B7280', // Muted text
    input: '#1a1a1a',     // Input background
    toggle: '#272727',    // Toggle button background
  },
  light: {
    bg: '#ffffff',        // Main background
    card: '#ffffff',      // Card background
    border: '#E5E7EB',    // Card border
    text: '#111827',      // Primary text
    textSecondary: '#4B5563', // Secondary text
    textMuted: '#6B7280', // Muted text
    input: '#F9FAFB',     // Input background
    toggle: '#000000',    // Toggle button background
  },
};

// Returns theme colors based on dark/light mode
export const getThemeColors = (isDark: boolean) => {
  return isDark ? THEME_COLORS.dark : THEME_COLORS.light;
};

// For use with className (requires conditional logic in components)
export const getThemeClasses = (isDark: boolean) => {
  return {
    bg: isDark ? 'bg-theme-dark-bg' : 'bg-theme-light-bg',
    card: isDark ? 'bg-theme-dark-card' : 'bg-theme-light-card',
    border: isDark ? 'border-theme-dark-border' : 'border-theme-light-border',
    text: isDark ? 'text-theme-dark-text' : 'text-theme-light-text',
    textSecondary: isDark ? 'text-theme-dark-text-secondary' : 'text-theme-light-text-secondary',
    textMuted: isDark ? 'text-theme-dark-text-muted' : 'text-theme-light-text-muted',
    input: isDark ? 'bg-theme-dark-input' : 'bg-theme-light-input',
    toggle: isDark ? 'bg-theme-dark-toggle' : 'bg-theme-light-toggle',
  };
};


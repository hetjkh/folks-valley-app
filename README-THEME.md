# Theme Colors Guide

## How to Change Colors

All theme colors are centralized in **ONE file**: `utils/theme-colors.ts`

### Steps to Change Colors:

1. **Open `utils/theme-colors.ts`**
2. **Find the `THEME_COLORS` object**
3. **Update the color values** (e.g., change `bg: '#000000'` to your desired color)
4. **That's it!** All pages will automatically use the new colors

### Available Theme Colors:

#### Dark Mode:
- `bg`: Main background color
- `card`: Card background color
- `border`: Card border color (1px)
- `text`: Primary text color
- `textSecondary`: Secondary text color
- `textMuted`: Muted text color
- `input`: Input field background
- `toggle`: Toggle button background

#### Light Mode:
- `bg`: Main background color
- `card`: Card background color
- `border`: Card border color
- `text`: Primary text color
- `textSecondary`: Secondary text color
- `textMuted`: Muted text color
- `input`: Input field background
- `toggle`: Toggle button background

### Usage in Components:

```typescript
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/utils/theme-colors';

const { isDark } = useTheme();
const colors = getThemeColors(isDark);

// Use colors in style prop
<View style={{ backgroundColor: colors.bg }}>
  <Text style={{ color: colors.text }}>Hello</Text>
</View>
```

### Example: Change Dark Mode Background

In `utils/theme-colors.ts`, change:
```typescript
dark: {
  bg: '#1a1a1a', // Changed from '#000000'
  // ... other colors
}
```

All pages will automatically use the new color!


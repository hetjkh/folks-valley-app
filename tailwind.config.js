/** @type {import('tailwindcss').Config} */

module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/_layout.tsx", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // Gilroy font classes (using system-installed font)
        // NativeWind will handle platform-specific font resolution
        // For React Native: Uses the font name as-is (Gilroy-Regular, etc.)
        // For Web: Uses the CSS font-family stack
        gilroy: ['Gilroy-Regular', 'Gilroy', 'system-ui', 'sans-serif'],
        'gilroy-medium': ['Gilroy-Medium', 'Gilroy', 'system-ui', 'sans-serif'],
        'gilroy-semibold': ['Gilroy-SemiBold', 'Gilroy', 'system-ui', 'sans-serif'],
        'gilroy-bold': ['Gilroy-Bold', 'Gilroy', 'system-ui', 'sans-serif'],
        // Inter font classes (fallback)
        inter: ['Inter-Regular', 'system-ui', 'sans-serif'],
        'inter-medium': ['Inter-Medium', 'system-ui', 'sans-serif'],
        'inter-semibold': ['Inter-SemiBold', 'system-ui', 'sans-serif'],
        'inter-bold': ['Inter-Bold', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Note: Theme colors are defined in utils/theme-colors.ts
        // Update colors there to change them across all pages
        // Base Black and White (derived from oklch inspiration's grayscale)
        background: "#000", // oklch(0.145 0 0) - Very dark gray
        foreground: "#fff", // oklch(0.985 0 0) - Very light gray

        // Card & Popover (slightly lighter than background for depth)
        card: "#353535", // oklch(0.205 0 0)
        "card-foreground": "#FDFDFD", // oklch(0.985 0 0)
        popover: "#353535", // oklch(0.205 0 0)
        "popover-foreground": "#FDFDFD", // oklch(0.985 0 0)

        // Primary (Your existing accent color)
        primary: "#eac5ff", // Your original primary color
        // Text/icon color that works well on the primary color
        "primary-foreground": "#252525", // Using the background color for strong contrast

        // Secondary (A mid-dark gray for less emphasis than primary)
        secondary: "#454545", // oklch(0.269 0 0)
        "secondary-foreground": "#FDFDFD", // oklch(0.985 0 0)

        // Muted (For subtle text, icons, or disabled states)
        muted: "#454545", // oklch(0.269 0 0)
        "muted-foreground": "#B5B5B5", // oklch(0.708 0 0) - Mid-light gray

        // Accent (Similar to secondary for general accents)
        accent: "#454545", // oklch(0.269 0 0)
        "accent-foreground": "#FDFDFD", // oklch(0.985 0 0)

        // Destructive (For errors, warnings, or delete actions)
        destructive: "#ED6D5D", // oklch(0.704 0.191 22.216) - A warm reddish-orange

        // Borders, Inputs, and Rings
        border: "rgba(255, 255, 255, 0.1)", // oklch(1 0 0 / 10%) - Transparent white for subtle borders
        input: "rgba(255, 255, 255, 0.15)", // oklch(1 0 0 / 15%) - Transparent white for input backgrounds
        ring: "#8E8E8E", // oklch(0.556 0 0) - Mid-gray for focus rings

        // Chart Colors (Vibrant colors for data visualization)
        "chart-1": "#6F3FDD", // oklch(0.488 0.243 264.376) - Blue-Purple
        "chart-2": "#5FE69D", // oklch(0.696 0.17 162.48) - Green-Cyan
        "chart-3": "#F2C84D", // oklch(0.769 0.188 70.08) - Yellow-Orange
        "chart-4": "#C546D8", // oklch(0.627 0.265 303.9) - Magenta
        "chart-5": "#E88C55", // oklch(0.645 0.246 16.439) - Orange-Red

        // Sidebar Colors (Specific definitions for sidebar elements, can often alias base colors)
        sidebar: "#353535", // Same as card/popover
        "sidebar-foreground": "#FDFDFD", // Same as foreground
        "sidebar-primary": "#6F3FDD", // Same as chart-1 (often a key accent in sidebars)
        "sidebar-primary-foreground": "#FDFDFD", // Same as foreground
        "sidebar-accent": "#454545", // Same as secondary/muted/accent
        "sidebar-accent-foreground": "#FDFDFD", // Same as foreground
        "sidebar-border": "rgba(255, 255, 255, 0.1)", // Same as border
        "sidebar-ring": "#8E8E8E", // Same as ring
      },
    },
  },
  plugins: [],
}


# Gilroy Font Setup

This directory should contain the Gilroy font files. Please download the following font files and place them in this directory:

## Required Font Files:

1. **Gilroy-Regular.ttf** - Regular weight (400)
2. **Gilroy-Medium.ttf** - Medium weight (500)
3. **Gilroy-SemiBold.ttf** - SemiBold weight (600)
4. **Gilroy-Bold.ttf** - Bold weight (700)

## Important Setup Steps:

1. **Download the font files** and place them in this directory (`assets/fonts/`)

2. **Enable font loading** by editing `hooks/use-fonts.ts`:
   - Change `const GILROY_FONTS_ENABLED = false;` to `const GILROY_FONTS_ENABLED = true;`

3. **Restart your development server** with cleared cache:
   ```bash
   expo start -c
   ```

## Where to Get Gilroy Font:

Gilroy is a commercial font. You can obtain it from:

1. **Radomir Tinkov's Website** (Original creator):
   - Visit: https://www.radomirtinkov.com/gilroy.html
   - Purchase a license if needed

2. **Alternative Free Option** (Similar font):
   - If you need a free alternative, consider using **Inter** or **Poppins** from Google Fonts
   - These can be used with similar styling

## After Adding Font Files:

1. Make sure all 4 font files are in this directory: `assets/fonts/`
2. Restart your Expo development server: `npm start` or `expo start`
3. Clear cache if needed: `expo start -c`

## Font Usage:

Once the fonts are loaded, you can use them in your app with Tailwind classes:

- `font-gilroy` - Regular weight
- `font-gilroy-medium` - Medium weight
- `font-gilroy-semibold` - SemiBold weight
- `font-gilroy-bold` - Bold weight

Example:
```tsx
<Text className="font-gilroy text-lg">Regular Text</Text>
<Text className="font-gilroy-bold text-xl">Bold Text</Text>
```


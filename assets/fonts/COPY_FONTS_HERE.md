# How to Add Gilroy Fonts to Your App

Since you have Gilroy fonts installed on your system, follow these steps:

## Step 1: Locate Your Gilroy Font Files

The fonts are likely in one of these locations:

1. **Windows Fonts Folder**: `C:\Windows\Fonts\`
   - Look for files starting with "Gilroy" (e.g., `Gilroy-Regular.ttf`, `Gilroy-Bold.ttf`)

2. **User Fonts Folder**: `C:\Users\Admin\AppData\Local\Microsoft\Windows\Fonts\`

3. **Figma Fonts** (if installed via Figma):
   - Check: `C:\Users\Admin\AppData\Local\Figma\fonts\` or similar

4. **Affinity Fonts**:
   - Check: `C:\Users\Admin\AppData\Roaming\Affinity\fonts\` or similar

## Step 2: Copy Font Files

You need these 4 font files:
- **Gilroy-Regular.ttf** (or .otf)
- **Gilroy-Medium.ttf** (or .otf)
- **Gilroy-SemiBold.ttf** (or .otf) 
- **Gilroy-Bold.ttf** (or .otf)

**Copy them to this folder**: `assets/fonts/` (this directory)

## Step 3: Rename if Needed

Make sure the files are named exactly:
- `Gilroy-Regular.ttf`
- `Gilroy-Medium.ttf`
- `Gilroy-SemiBold.ttf`
- `Gilroy-Bold.ttf`

If your files have different names (like `Gilroy-Regular.otf` or `GilroyRegular.ttf`), rename them to match.

## Step 4: Enable Gilroy in Code

After copying the files, edit `hooks/use-fonts.ts`:
- Change line 7: `const FONT_TYPE: 'gilroy' | 'inter' = 'inter';`
- To: `const FONT_TYPE: 'gilroy' | 'inter' = 'gilroy';`

## Step 5: Restart Your App

```bash
expo start -c
```

## Quick Method: Find Fonts Using File Explorer

1. Open File Explorer
2. Navigate to `C:\Windows\Fonts\`
3. Search for "Gilroy" in the search box
4. Copy the .ttf or .otf files you find
5. Paste them into `assets/fonts/` folder in your project

## Alternative: Extract from Figma/Affinity

If fonts are embedded in Figma/Affinity projects:
1. Open your design file
2. Select text using Gilroy font
3. Export or extract the font files
4. Copy to `assets/fonts/` folder


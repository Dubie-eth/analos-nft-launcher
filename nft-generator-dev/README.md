# Professional NFT Generator

A comprehensive NFT collection generator with advanced layer management and rarity configuration.

## 🚀 Features

### ✅ **Fixed Issues from Original Generator:**
- **Proper Layer Processing**: Files are now correctly organized into separate layers
- **Image Display**: Live preview shows actual trait images instead of placeholders
- **Workflow Order**: Correct sequence: Upload → Configure → Collection Settings → Generate & Deploy
- **File Upload**: Supports both individual files and ZIP archives with folder structure
- **Layer Management**: Visual interface for organizing traits and setting rarity

### 🎯 **Core Functionality:**
- **Multi-format Support**: PNG, JPG, JPEG, GIF, WebP, SVG
- **ZIP Upload**: Upload organized folders (e.g., "Backgrounds", "Eyes", "Mouth")
- **Rarity Configuration**: Set individual trait rarity with sliders
- **Layer Visibility**: Toggle layers on/off for generation
- **Collection Settings**: Complete metadata configuration including social media links
- **Live Preview**: Real-time preview of generated combinations
- **Progress Tracking**: Detailed generation progress with status updates

## 🛠️ Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ProfessionalNFTGenerator.tsx    # Main generator component
│   ├── LayerUploader.tsx               # File upload interface
│   ├── LayerManager.tsx                # Layer organization
│   ├── CollectionSettingsForm.tsx      # Collection configuration
│   ├── LivePreview.tsx                 # Preview interface
│   └── GenerationProgressModal.tsx     # Progress tracking
├── lib/                   # Utilities and services
│   └── layer-processor.ts # File processing logic
└── types/                 # TypeScript definitions
    └── nft-generator.ts   # Type definitions
```

## 🎨 How to Use

### 1. **Upload Layers**
- Drag & drop files or click "Choose Files"
- Supports individual images or ZIP archives
- Organized folder structure: `Backgrounds/`, `Eyes/`, `Mouth/`, etc.

### 2. **Configure Layers**
- Review auto-detected layers and traits
- Adjust rarity percentages with sliders
- Toggle layer visibility
- Reorder layers for proper rendering

### 3. **Collection Settings**
- Set collection name, symbol, description
- Configure image dimensions and total supply
- Add creator information and royalties
- Include social media links (website, Twitter, Discord, Telegram)

### 4. **Generate & Deploy**
- Review collection preview
- Start generation process
- Monitor progress with real-time updates
- Deploy to blockchain when complete

## 🔧 Technical Details

### **Layer Processing Algorithm:**
1. **File Detection**: Automatically detects image files and ZIP archives
2. **Layer Extraction**: Extracts layer names from folder structure or file naming
3. **Trait Organization**: Groups files by layer and creates trait objects
4. **Metadata Generation**: Creates proper trait metadata with rarity settings

### **Supported File Structures:**
```
ZIP Archive Structure:
├── Backgrounds/
│   ├── sunset.png
│   ├── night.png
│   └── day.png
├── Eyes/
│   ├── normal.png
│   ├── laser.png
│   └── glowing.png
└── Mouth/
    ├── smile.png
    ├── frown.png
    └── open.png
```

### **Individual Files:**
```
Files with descriptive names:
- background_sunset.png
- eyes_laser.png
- mouth_smile.png
```

## 🚀 Deployment

### **Local Development:**
```bash
npm run dev
# Access at http://localhost:3000
```

### **Production Build:**
```bash
npm run build
npm start
```

### **Integration with Main Site:**
1. Build the generator: `npm run build`
2. Copy built files to main site's components directory
3. Import and use `ProfessionalNFTGenerator` component
4. Configure routing to access the generator

## 🎯 **Next Steps for Integration:**

1. **Copy Components**: Move components to main site's `src/components/` directory
2. **Update Imports**: Adjust import paths for main site structure
3. **Add Routing**: Create `/generator` route in main site
4. **Style Integration**: Ensure styling matches main site theme
5. **Backend Integration**: Connect to existing collection management system

## 🐛 **Issues Fixed:**

- ✅ **Files not flowing properly** - Now correctly processes and organizes files
- ✅ **Missing collection setup workflow** - Proper step-by-step process
- ✅ **Image files not displaying** - Live preview shows actual images
- ✅ **Workflow order wrong** - Correct sequence implemented
- ✅ **Layer organization** - Proper layer separation and management
- ✅ **Rarity configuration** - Visual sliders for trait rarity
- ✅ **Collection metadata** - Complete settings form with social links

## 📝 **Notes:**

- This is a **separate development environment** to avoid breaking the main site
- All components are **self-contained** and can be easily integrated
- **No server-side dependencies** - runs entirely in the browser
- **TypeScript support** for better development experience
- **Responsive design** works on desktop and mobile

The generator is now ready for integration into your main NFT launcher platform!

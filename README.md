# 💖 Family Homepage

A private family messaging app with text, voice, video, and image sharing. Messages sync automatically via Git across all family devices.

## ✨ Features

- 📝 **Text Messages** - Send notes and messages to family
- 🎤 **Voice Recording** - Record and share voice messages
- 📹 **Video Recording** - Record and share video messages
- 🖼️ **Image Sharing** - Upload and share photos
- 🔄 **Auto-Sync** - Messages sync automatically via Git
- 🔔 **Notifications** - Bouncing dock icon when new messages arrive
- 🚀 **Auto-Launch** - Starts automatically when you turn on your computer
- 💗 **Beautiful UI** - Pink theme with glassmorphism effects

## 🚀 Quick Install (Automated)

For the easiest installation, run this one command in Terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/miguelemosreverte/family-homepage/main/setup.sh)"
```

This will automatically:
- ✅ Install all dependencies (Node.js, npm, Git LFS)
- ✅ Build the app
- ✅ Set up the notes repository
- ✅ Configure auto-launch on startup
- ✅ Install the app to /Applications

## 📋 Manual Installation

If you prefer to install manually, follow these steps:

### Prerequisites

You need to have these installed:
- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **Git** - Already installed on macOS
- **Git LFS** - Install with: `brew install git-lfs` (requires [Homebrew](https://brew.sh/))

### Step 1: Clone the Repository

```bash
cd ~/Desktop
git clone https://github.com/miguelemosreverte/family-homepage.git
cd family-homepage
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Generate Icon

```bash
node generate-icon.js
sips -s format png icon.png --out icon.png
mkdir -p icon.iconset
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
cp icon.png icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o icon.icns
rm -rf icon.iconset
```

### Step 4: Build the App

```bash
npm run dist
```

### Step 5: Install to Applications

```bash
cp -R "dist/mac-arm64/Family Homepage.app" /Applications/
xattr -cr "/Applications/Family Homepage.app"
```

### Step 6: Launch the App

```bash
open -a "Family Homepage"
```

## 📁 Setting Up Notes Sync

To sync messages with family members, you need to set up a shared Git repository:

### Create a Private Repository for Notes

1. Create a new **private** repository on GitHub (e.g., `family-notes`)
2. On your computer, navigate to the notes directory:
   ```bash
   cd ~/Desktop/family-homepage/notes
   ```
3. Add the remote and push:
   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/family-notes.git
   git push -u origin main
   ```
4. Share the repository with family members (make sure it's private!)

### For Other Family Members

Each family member should:
1. Install the app using the setup script
2. Configure their notes folder to sync with the same Git repository:
   ```bash
   cd ~/Desktop/family-homepage/notes
   git remote add origin git@github.com:YOUR_USERNAME/family-notes.git
   git pull origin main
   ```

The app will automatically:
- Pull new messages every 60 seconds
- Bounce the dock icon when new messages arrive
- Show a notification badge
- Bring the window to front when messages are received

## 🛠️ Development

### Run in Development Mode

```bash
npm start
```

### Build for Production

```bash
npm run dist
```

## 🎨 Customization

### Change the Heart Color

Edit `generate-icon.js` and modify the gradient colors:

```javascript
gradient.addColorStop(0, '#FF8DB3');  // Lighter pink at top
gradient.addColorStop(1, '#FF6B9D');  // Darker pink at bottom
```

Then regenerate the icon and rebuild.

### Change the UI Theme

Edit `styles.css` and modify the CSS variables:

```css
:root {
    --primary: #FF6B9D;
    --secondary: #FFB6C1;
    --background: linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%);
}
```

## 🔒 Privacy & Security

- All messages are stored locally on each device
- Messages sync via Git (encrypted if using GitHub private repos)
- No data is sent to external servers
- Media files use Git LFS for efficient storage
- Each device is identified by its hostname to prevent conflicts

## 🐛 Troubleshooting

### The app won't open

Try removing the quarantine attribute:
```bash
xattr -cr "/Applications/Family Homepage.app"
```

### Messages aren't syncing

Check your Git remote:
```bash
cd ~/Desktop/family-homepage/notes
git remote -v
```

Make sure you have access to the repository and can push/pull.

### Icon not showing correctly

Rebuild the icon:
```bash
node generate-icon.js
# ... (icon generation steps)
npm run dist
```

## 💝 Credits

Built with love for family communication.

Created with [Claude Code](https://claude.com/claude-code)

## 📜 License

ISC License - Free to use and modify for personal and family use.
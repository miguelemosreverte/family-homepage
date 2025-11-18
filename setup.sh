#!/bin/bash

# Family Homepage - Automated Setup Script
# This script automatically installs and configures Family Homepage on your Mac

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   💖 Family Homepage Setup Script  💖  ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script is designed for macOS only${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Homebrew
install_homebrew() {
    echo -e "${YELLOW}📦 Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
}

# Function to install Node.js
install_node() {
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    if command_exists brew; then
        brew install node
    else
        echo -e "${RED}❌ Homebrew not found. Please install it first.${NC}"
        exit 1
    fi
}

# Function to install Git LFS
install_git_lfs() {
    echo -e "${YELLOW}📦 Installing Git LFS...${NC}"
    if command_exists brew; then
        brew install git-lfs
        git lfs install
    else
        echo -e "${RED}❌ Homebrew not found. Please install it first.${NC}"
        exit 1
    fi
}

# Check and install dependencies
echo -e "${BLUE}🔍 Checking dependencies...${NC}"

# Check Homebrew
if ! command_exists brew; then
    echo -e "${YELLOW}⚠️  Homebrew not found${NC}"
    read -p "Would you like to install Homebrew? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_homebrew
    else
        echo -e "${RED}❌ Homebrew is required. Exiting.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Homebrew installed${NC}"
fi

# Check Node.js
if ! command_exists node; then
    echo -e "${YELLOW}⚠️  Node.js not found${NC}"
    install_node
else
    echo -e "${GREEN}✓ Node.js installed ($(node --version))${NC}"
fi

# Check npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm not found. Please install Node.js.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ npm installed ($(npm --version))${NC}"
fi

# Check Git
if ! command_exists git; then
    echo -e "${RED}❌ Git not found. Please install Xcode Command Line Tools.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Git installed${NC}"
fi

# Check Git LFS
if ! command_exists git-lfs; then
    echo -e "${YELLOW}⚠️  Git LFS not found${NC}"
    install_git_lfs
else
    echo -e "${GREEN}✓ Git LFS installed${NC}"
fi

# Clone or use existing repository
INSTALL_DIR="$HOME/Desktop/family-homepage"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠️  Directory $INSTALL_DIR already exists${NC}"
    read -p "Would you like to use the existing directory? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Please remove or rename the existing directory first.${NC}"
        exit 1
    fi
    cd "$INSTALL_DIR"
else
    echo -e "${BLUE}📥 Cloning repository...${NC}"
    cd "$HOME/Desktop"
    git clone https://github.com/miguelemosreverte/family-homepage.git
    cd family-homepage
fi

# Install npm dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Generate icon
echo -e "${BLUE}🎨 Generating app icon...${NC}"
node generate-icon.js

# Convert icon to .icns
echo -e "${BLUE}🔄 Converting icon...${NC}"
sips -s format png icon.png --out icon.png >/dev/null 2>&1
mkdir -p icon.iconset
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png >/dev/null 2>&1
sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png >/dev/null 2>&1
sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png >/dev/null 2>&1
sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png >/dev/null 2>&1
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png >/dev/null 2>&1
sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png >/dev/null 2>&1
sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png >/dev/null 2>&1
sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png >/dev/null 2>&1
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png >/dev/null 2>&1
cp icon.png icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o icon.icns
rm -rf icon.iconset

# Build the app
echo -e "${BLUE}🔨 Building application...${NC}"
npm run dist

# Install to Applications
echo -e "${BLUE}📲 Installing to /Applications...${NC}"
if [ -d "/Applications/Family Homepage.app" ]; then
    echo -e "${YELLOW}⚠️  Removing existing installation...${NC}"
    rm -rf "/Applications/Family Homepage.app"
fi

cp -R "dist/mac-arm64/Family Homepage.app" /Applications/
xattr -cr "/Applications/Family Homepage.app"

# Success message
echo -e "${GREEN}"
echo "╔════════════════════════════════════════╗"
echo "║     ✨ Installation Complete! ✨       ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}✓ Family Homepage has been installed to /Applications${NC}"
echo -e "${GREEN}✓ The app is configured to launch automatically on startup${NC}"
echo ""
echo -e "${BLUE}📱 To launch the app:${NC}"
echo -e "   ${YELLOW}open -a 'Family Homepage'${NC}"
echo ""
echo -e "${BLUE}📁 Next steps:${NC}"
echo "   1. Create a private GitHub repository for your family notes"
echo "   2. Configure the notes sync:"
echo -e "      ${YELLOW}cd $INSTALL_DIR/notes${NC}"
echo -e "      ${YELLOW}git remote add origin git@github.com:YOUR_USERNAME/family-notes.git${NC}"
echo -e "      ${YELLOW}git push -u origin main${NC}"
echo ""
echo -e "${BLUE}💝 Enjoy staying connected with your family!${NC}"
echo ""

# Ask to launch now
read -p "Would you like to launch Family Homepage now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open -a "Family Homepage"
fi

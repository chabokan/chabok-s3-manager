#!/bin/bash

# Chabokan S3 Manager - Build Script

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Chabokan S3 Manager - Build Tool"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PS3="Choose build option: "
options=("Windows (EXE)" "Linux (DEB + AppImage)" "macOS (DMG)" "All Platforms" "Cancel")

select opt in "${options[@]}"
do
    case $opt in
        "Windows (EXE)")
            echo ""
            echo "🪟 Building for Windows..."
            npm run build:win
            break
            ;;
        "Linux (DEB + AppImage)")
            echo ""
            echo "🐧 Building for Linux..."
            npm run build:linux
            break
            ;;
        "macOS (DMG)")
            echo ""
            echo "🍎 Building for macOS..."
            npm run build:mac
            break
            ;;
        "All Platforms")
            echo ""
            echo "🌍 Building for all platforms..."
            npm run dist
            break
            ;;
        "Cancel")
            echo "Build cancelled."
            break
            ;;
        *) 
            echo "Invalid option $REPLY"
            ;;
    esac
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Build completed!"
echo "📁 Check the dist/ folder for output files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"


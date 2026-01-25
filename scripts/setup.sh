#!/bin/bash

# Setup script for Publish to Dev.to Action
# This script helps you get started with development

set -e

echo "🚀 Setting up Publish to Dev.to Action..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building the action..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get your Dev.to API key from https://dev.to/settings/extensions"
echo "2. Export it: export DEVTO_API_KEY='your-api-key'"
echo "3. Test with: npx tsx scripts/publish-to-devto.ts test/sample-post.md"
echo ""
echo "For GitHub Action usage, see docs/SETUP.md"

#!/bin/bash

# Constellation - One-Command Setup
# This script fetches your notes, analyzes connections, and launches the visualization

echo "🌟 Constellation Setup"
echo "====================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Check if .env exists for API key
if [ ! -f .env ]; then
    echo "⚙️  Setting up environment..."
    echo ""
    echo "📋 Please enter your Anthropic API key:"
    echo "   (Get one at: https://console.anthropic.com/)"
    read -p "API Key: " api_key
    echo "ANTHROPIC_API_KEY=$api_key" > .env
    echo "✅ API key saved to .env"
    echo ""
fi

# Load environment variables
export $(cat .env | xargs)

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --silent
    echo "✅ Dependencies installed"
    echo ""
fi

# Fetch notes from Apple Notes
echo "📝 Fetching your Apple Notes..."
npm run fetch

if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch notes. Please check the error above."
    exit 1
fi

# Analyze connections
echo ""
echo "🔍 Analyzing connections with AI..."
npm run analyze

if [ $? -ne 0 ]; then
    echo "❌ Failed to analyze connections. Please check the error above."
    exit 1
fi

# Launch visualization
echo ""
echo "🚀 Launching your constellation..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Opening http://localhost:5173"
echo "  Your constellation is ready! ✨"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev

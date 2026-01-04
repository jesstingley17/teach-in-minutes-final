#!/bin/bash

# Complete InsForge setup script

set -e

echo "🚀 InsForge Complete Setup"
echo "=========================="
echo ""

# Get current directory
PROJECT_DIR="$(pwd)"
INSFORGE_DIR="../insforge"

# Step 1: Clone InsForge
if [ ! -d "$INSFORGE_DIR" ]; then
    echo "📦 Cloning InsForge..."
    cd ..
    git clone https://github.com/insforge/insforge.git
    cd insforge
    cp .env.example .env
    echo "✅ InsForge cloned"
else
    echo "✅ InsForge already exists"
    cd "$INSFORGE_DIR"
fi

# Step 2: Create function directories
echo "📁 Creating function directories..."
mkdir -p functions/curriculum
mkdir -p functions/documents
mkdir -p functions/integrations/gamma
mkdir -p functions/integrations/adobe
echo "✅ Directories created"

# Step 3: Prompt for environment variables
echo ""
echo "⚙️  Environment Configuration"
echo "Please edit .env file with your API keys:"
echo "  - GEMINI_API_KEY"
echo "  - GAMMA_API_KEY"
echo "  - Other API keys as needed"
echo ""
read -p "Press Enter after updating .env file..."

# Step 4: Start InsForge
echo ""
echo "🐳 Starting InsForge with Docker..."
docker compose up -d

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy function files to functions/ directory"
echo "2. Copy services/ and src/ directories (or create symlinks)"
echo "3. Test endpoints: ./scripts/test-insforge-endpoints.sh"
echo "4. Update frontend .env.local with VITE_INSFORGE_API_URL"


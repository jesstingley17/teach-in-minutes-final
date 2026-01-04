#!/bin/bash

# Migration script to set up InsForge functions from Vercel API routes

set -e

echo "🚀 Starting InsForge Migration..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if InsForge directory exists
INSFORGE_DIR="../insforge"
if [ ! -d "$INSFORGE_DIR" ]; then
    echo -e "${YELLOW}⚠️  InsForge directory not found. Creating it...${NC}"
    mkdir -p "$INSFORGE_DIR"
    echo -e "${BLUE}📦 Cloning InsForge...${NC}"
    git clone https://github.com/insforge/insforge.git "$INSFORGE_DIR"
    cd "$INSFORGE_DIR"
    cp .env.example .env
    echo -e "${GREEN}✅ InsForge cloned and configured${NC}"
else
    echo -e "${GREEN}✅ InsForge directory found${NC}"
    cd "$INSFORGE_DIR"
fi

# Create functions directory structure
echo -e "${BLUE}📁 Creating function directories...${NC}"
mkdir -p functions/curriculum
mkdir -p functions/documents
mkdir -p functions/integrations/gamma
mkdir -p functions/integrations/adobe

# Copy service files (if needed)
echo -e "${BLUE}📋 Setting up service dependencies...${NC}"
# Note: You may need to copy your services directory to InsForge
# or set up a shared location

echo -e "${GREEN}✅ Migration setup complete!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Copy the function files from the migration guide to functions/"
echo "2. Copy your services/ directory to InsForge project"
echo "3. Update .env with your API keys"
echo "4. Run: docker compose up"


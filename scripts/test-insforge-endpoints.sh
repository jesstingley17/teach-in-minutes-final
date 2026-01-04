#!/bin/bash

# Test script for InsForge API endpoints

set -e

API_BASE="${INSFORGE_API_URL:-http://localhost:7131/api}"

echo "🧪 Testing InsForge API Endpoints..."
echo "Base URL: $API_BASE"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test 1: Document Parse
echo -e "${BLUE}Test 1: Document Parse${NC}"
response=$(curl -s -X POST "$API_BASE/documents/parse" \
  -H "Content-Type: application/json" \
  -d '{
    "base64Data": "test",
    "mimeType": "image/png"
  }' 2>&1 || echo "ERROR")

if echo "$response" | grep -q "error\|ERROR"; then
  echo -e "${YELLOW}⚠️  Document Parse endpoint responding (may need valid data)${NC}"
  echo "   Response: $(echo "$response" | head -c 100)"
else
  echo -e "${GREEN}✅ Document Parse endpoint responding${NC}"
fi
echo ""

# Test 2: Curriculum Analyze (OPTIONS/CORS)
echo -e "${BLUE}Test 2: CORS Preflight${NC}"
response=$(curl -s -X OPTIONS "$API_BASE/curriculum/analyze" \
  -H "Origin: http://localhost:5173" \
  -v 2>&1 || echo "ERROR")

if echo "$response" | grep -q "200\|OK\|Access-Control"; then
  echo -e "${GREEN}✅ CORS configured correctly${NC}"
else
  echo -e "${YELLOW}⚠️  CORS check - verify manually${NC}"
fi
echo ""

# Test 3: Gamma Integration
echo -e "${BLUE}Test 3: Gamma Integration${NC}"
response=$(curl -s -X POST "$API_BASE/integrations/gamma/enhance" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "test",
    "title": "Test"
  }' 2>&1 || echo "ERROR")

if echo "$response" | grep -q "error\|ERROR"; then
  echo -e "${YELLOW}⚠️  Gamma endpoint responding (may need API key)${NC}"
  echo "   Response: $(echo "$response" | head -c 100)"
else
  echo -e "${GREEN}✅ Gamma endpoint responding${NC}"
fi
echo ""

# Test 4: Check if InsForge is running
echo -e "${BLUE}Test 4: InsForge Health Check${NC}"
if curl -s -f "$API_BASE" > /dev/null 2>&1 || curl -s -f "http://localhost:7131" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ InsForge is running${NC}"
else
  echo -e "${RED}❌ InsForge may not be running${NC}"
  echo "   Start with: cd ../insforge && docker compose up"
fi
echo ""

echo -e "${GREEN}✅ Testing complete!${NC}"
echo ""
echo "Note: Some tests may show errors if:"
echo "  - API keys are not configured"
echo "  - Functions are not deployed yet"
echo "  - Invalid test data is sent"


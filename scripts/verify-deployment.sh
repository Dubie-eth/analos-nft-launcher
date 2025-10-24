#!/bin/bash

# Analos NFT Launchpad - Deployment Verification Script
# This script tests all endpoints to verify the deployment is working

echo "🚀 Analos NFT Launchpad - Deployment Verification"
echo "=================================================="
echo ""

# Backend URL
BACKEND_URL="https://analos-core-service-production.up.railway.app"

echo "Testing Backend Endpoints..."
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s "${BACKEND_URL}/api/health-simple")
echo "Response: $HEALTH_RESPONSE"
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ Health check PASSED"
else
    echo "❌ Health check FAILED"
fi
echo ""

# Test 2: Database Status
echo "2️⃣  Testing Database Status..."
DB_RESPONSE=$(curl -s "${BACKEND_URL}/api/database/status")
echo "Response: $DB_RESPONSE"
if echo "$DB_RESPONSE" | grep -q "tables"; then
    echo "✅ Database status PASSED"
else
    echo "❌ Database status FAILED"
fi
echo ""

# Test 3: Features Endpoint
echo "3️⃣  Testing Features Endpoint..."
FEATURES_RESPONSE=$(curl -s "${BACKEND_URL}/api/features")
echo "Response: $FEATURES_RESPONSE"
if [ ! -z "$FEATURES_RESPONSE" ]; then
    echo "✅ Features endpoint PASSED"
else
    echo "❌ Features endpoint FAILED"
fi
echo ""

# Test 4: Page Access
echo "4️⃣  Testing Page Access..."
ACCESS_RESPONSE=$(curl -s "${BACKEND_URL}/api/page-access")
echo "Response: $ACCESS_RESPONSE"
if [ ! -z "$ACCESS_RESPONSE" ]; then
    echo "✅ Page access PASSED"
else
    echo "❌ Page access FAILED"
fi
echo ""

echo "=================================================="
echo "✨ Verification Complete!"
echo ""
echo "Next Steps:"
echo "1. If all tests passed, your backend is working! 🎉"
echo "2. Configure environment variables in Railway"
echo "3. Test the frontend at your Vercel URL"
echo ""


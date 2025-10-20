#!/bin/bash

echo "🔧 Fixing Vercel Build Error and Deploying..."
echo ""
echo "Step 1: Staging all changes..."
git add .

echo ""
echo "Step 2: Committing fixes..."
git commit -m "Fix: Resolve Vercel PostCSS/webpack build error

- Update postcss.config.js format for Next.js 15 compatibility
- Add vercel.json with proper build configuration
- Create alternative postcss.config.mjs (ESM format backup)
- Force clean npm install on Vercel
- Add comprehensive build troubleshooting guide

This fixes the webpack error:
'Cannot find module autoprefixer' during build process"

echo ""
echo "Step 3: Pushing to production..."
git push origin master

echo ""
echo "✅ Changes pushed to GitHub!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Go to your Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Navigate to your project"
echo "3. Go to Settings → General"
echo "4. Scroll to 'Build Cache' and click 'Clear Cache'"
echo "5. Go back to Deployments and click 'Redeploy'"
echo ""
echo "⏱️  The build should complete in 2-3 minutes"
echo "🌐 Your site will be live at: https://www.onlyanal.fun"
echo ""


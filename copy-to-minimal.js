#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Copying enhanced features to minimal repo...');

// Files to copy from frontend-new to minimal repo
const filesToCopy = [
  'frontend-new/src/config/analos-programs.ts',
  'frontend-new/src/hooks/useEnhancedPrograms.tsx',
  'frontend-new/src/app/components/EnhancedProgramsDemo.tsx',
  'frontend-new/src/app/otc-marketplace',
  'frontend-new/src/app/airdrops',
  'frontend-new/src/app/vesting',
  'frontend-new/src/app/token-lock'
];

// Create the minimal directory structure
const minimalDir = 'minimal-update';
if (!fs.existsSync(minimalDir)) {
  fs.mkdirSync(minimalDir, { recursive: true });
}

console.log('📁 Created minimal-update directory');
console.log('✅ Ready to copy enhanced features!');
console.log('');
console.log('Next steps:');
console.log('1. Copy the frontend-new/src files to your minimal repo');
console.log('2. Update package.json if needed');
console.log('3. Push to minimal repo for auto-deployment');

#!/usr/bin/env node

/**
 * SECURITY SCRIPT: Remove Console Logs from Production
 * This script removes all console.log, console.error, and console.warn statements
 * from production code to prevent information disclosure
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to exclude from console log removal
const EXCLUDE_FILES = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '**/*.test.*',
  '**/*.spec.*',
  'remove-console-logs.js'
];

// Console statements to remove
const CONSOLE_PATTERNS = [
  /console\.log\s*\([^)]*\)\s*;?/g,
  /console\.error\s*\([^)]*\)\s*;?/g,
  /console\.warn\s*\([^)]*\)\s*;?/g,
  /console\.info\s*\([^)]*\)\s*;?/g,
  /console\.debug\s*\([^)]*\)\s*;?/g
];

function shouldExcludeFile(filePath) {
  return EXCLUDE_FILES.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(filePath);
  });
}

function removeConsoleLogs(content) {
  let modified = content;
  let removedCount = 0;

  CONSOLE_PATTERNS.forEach(pattern => {
    const matches = modified.match(pattern);
    if (matches) {
      removedCount += matches.length;
    }
    modified = modified.replace(pattern, '');
  });

  return { content: modified, removedCount };
}

function processFile(filePath) {
  if (shouldExcludeFile(filePath)) {
    return { processed: false, removedCount: 0 };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, removedCount } = removeConsoleLogs(content);

    if (removedCount > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Removed ${removedCount} console statements from ${filePath}`);
      return { processed: true, removedCount };
    }

    return { processed: false, removedCount: 0 };
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return { processed: false, removedCount: 0, error: error.message };
  }
}

function main() {
  console.log('🛡️ SECURITY: Removing console logs from production code...\n');

  // Find all TypeScript and JavaScript files
  const patterns = [
    'src/**/*.{ts,tsx,js,jsx}',
    '*.{ts,tsx,js,jsx}'
  ];

  let totalFiles = 0;
  let processedFiles = 0;
  let totalRemoved = 0;
  const errors = [];

  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: EXCLUDE_FILES });
    
    files.forEach(filePath => {
      totalFiles++;
      const result = processFile(filePath);
      
      if (result.processed) {
        processedFiles++;
        totalRemoved += result.removedCount;
      }
      
      if (result.error) {
        errors.push({ file: filePath, error: result.error });
      }
    });
  });

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`📁 Files scanned: ${totalFiles}`);
  console.log(`✅ Files processed: ${processedFiles}`);
  console.log(`🗑️ Console statements removed: ${totalRemoved}`);
  
  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length}`);
    errors.forEach(({ file, error }) => {
      console.log(`   - ${file}: ${error}`);
    });
  }

  if (totalRemoved > 0) {
    console.log('\n🎉 Console logs removed successfully!');
    console.log('⚠️  Remember to test your application after this change.');
  } else {
    console.log('\n✅ No console statements found to remove.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { removeConsoleLogs, processFile };

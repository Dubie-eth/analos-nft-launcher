#!/usr/bin/env node

/**
 * CREATE ISOLATED PAGE SCRIPT
 * Helps create new pages with proper isolation from the start
 */

const fs = require('fs');
const path = require('path');

const pageName = process.argv[2];

if (!pageName) {
  console.log('Usage: node scripts/create-isolated-page.js <PageName>');
  console.log('Example: node scripts/create-isolated-page.js LandingPage');
  process.exit(1);
}

const pageNameLower = pageName.toLowerCase();
const pageNameKebab = pageName.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1);

console.log(`Creating isolated page: ${pageName}`);
console.log(`Page name (lowercase): ${pageNameLower}`);
console.log(`Page name (kebab-case): ${pageNameKebab}`);

// Create CSS Module
const cssModulePath = `src/components/${pageName}.module.css`;
const cssModuleContent = `/**
 * ${pageName.toUpperCase()} COMPONENT STYLES
 * Isolated styles - no global impact
 */

/* Copy from PageTemplate.module.css and customize */
.pageContainer {
  width: 100%;
  min-height: 100vh;
  padding: 1rem;
}

@media (max-width: 768px) {
  .pageContainer {
    padding: 0.5rem;
  }
}

/* Add your page-specific styles here */
`;

// Create Component
const componentPath = `src/components/${pageName}.tsx`;
const componentContent = `/**
 * ${pageName.toUpperCase()} COMPONENT
 * Isolated component with CSS module
 */

'use client';

import React from 'react';
import styles from './${pageName}.module.css';

interface ${pageName}Props {
  className?: string;
}

export default function ${pageName}({ className = '' }: ${pageName}Props) {
  return (
    <div className={\`\${styles.pageContainer} \${className}\`}>
      <h1>${pageName}</h1>
      <p>This is an isolated component with CSS module styling.</p>
      
      {/* Add your component content here */}
    </div>
  );
}
`;

// Create Page Route
const pagePath = `src/app/${pageNameKebab}/page.tsx`;
const pageContent = `/**
 * ${pageName.toUpperCase()} PAGE
 * Uses isolated component
 */

import ${pageName} from '@/components/${pageName}';

export default function ${pageName}Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <${pageName} />
    </div>
  );
}
`;

// Create Feature Flag (optional)
const featureFlagName = `NEXT_PUBLIC_${pageName.toUpperCase()}`;
const envExample = `# Add to .env.local for testing
${featureFlagName}=true`;

try {
  // Create CSS Module
  fs.writeFileSync(cssModulePath, cssModuleContent);
  console.log(`✅ Created: ${cssModulePath}`);
  
  // Create Component
  fs.writeFileSync(componentPath, componentContent);
  console.log(`✅ Created: ${componentPath}`);
  
  // Create Page Route
  fs.writeFileSync(pagePath, pageContent);
  console.log(`✅ Created: ${pagePath}`);
  
  console.log('\n🎉 Isolated page created successfully!');
  console.log('\nNext steps:');
  console.log(`1. Customize ${cssModulePath} with your styles`);
  console.log(`2. Update ${componentPath} with your component logic`);
  console.log(`3. Test the page at /${pageNameKebab}`);
  console.log(`4. Use feature flag: ${featureFlagName}=true`);
  console.log('\nEnvironment variable example:');
  console.log(envExample);
  
} catch (error) {
  console.error('❌ Error creating isolated page:', error.message);
  process.exit(1);
}

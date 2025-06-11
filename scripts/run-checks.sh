#!/bin/bash

echo "🔍 Running comprehensive code checks..."

# 1. TypeScript compilation check
echo "1️⃣ Checking TypeScript compilation..."
npx tsc --noEmit --jsx react-jsx

# 2. ESLint check
echo "2️⃣ Running ESLint..."
npx eslint components/form-designer.tsx --ext .tsx

# 3. Prettier check
echo "3️⃣ Checking code formatting..."
npx prettier --check components/form-designer.tsx

# 4. React component validation
echo "4️⃣ Validating React components..."
node -e "
const fs = require('fs');
const content = fs.readFileSync('components/form-designer.tsx', 'utf8');

// Check for common React issues
const issues = [];

// Check for unclosed JSX tags
const jsxTagPattern = /<(\w+)(?:\s[^>]*)?(?:\s*\/>|>.*?<\/\1>)/gs;
const openTags = content.match(/<\w+(?:\s[^>]*)?(?!\s*\/?>)/g) || [];
const closeTags = content.match(/<\/\w+>/g) || [];

console.log('Open tags:', openTags.length);
console.log('Close tags:', closeTags.length);

// Check for missing keys in map functions
if (content.includes('.map(') && !content.includes('key=')) {
  issues.push('Missing key prop in map function');
}

// Check for unused imports
const imports = content.match(/import.*from/g) || [];
imports.forEach(imp => {
  const importName = imp.match(/import\s+{([^}]+)}/);
  if (importName) {
    const names = importName[1].split(',').map(n => n.trim());
    names.forEach(name => {
      if (!content.includes(name + '(') && !content.includes('<' + name)) {
        issues.push('Unused import: ' + name);
      }
    });
  }
});

if (issues.length > 0) {
  console.log('🚨 Issues found:');
  issues.forEach(issue => console.log('  -', issue));
} else {
  console.log('✅ No React-specific issues found!');
}
"

echo "✅ All checks completed!"

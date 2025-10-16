# Development Isolation Guide

## Problem
Changes to one page are affecting other pages, making development frustrating and unpredictable.

## Solution: Isolated Development Strategy

### 1. Component-Scoped Styling
Instead of using `globals.css` for page-specific fixes, use component-specific CSS modules or Tailwind classes directly in components.

### 2. Feature Branches
- Work on features in separate Git branches
- Test thoroughly before merging to master
- Use descriptive branch names: `feature/profile-mobile-fixes`, `fix/wallet-connection`

### 3. Testing Checklist
Before deploying any changes:
- [ ] Test the specific page you're working on
- [ ] Test at least 3 other random pages to ensure no side effects
- [ ] Test on both desktop and mobile
- [ ] Check browser console for errors

### 4. CSS Isolation Rules
- **DO**: Use Tailwind utility classes directly in components
- **DO**: Create component-specific CSS modules for complex styling
- **DON'T**: Add global CSS rules unless absolutely necessary
- **DON'T**: Use `!important` in global CSS unless critical

### 5. Component Architecture
- Keep components focused and single-purpose
- Use composition over modification
- Create new components instead of modifying existing ones for new features

## Current Status
- Profile page: Working with isolated fixes
- Wallet connection: Fixed CSP for Backpack
- Other pages: Should remain unaffected

## Next Steps
1. Test Backpack wallet connection
2. If issues persist, we'll create isolated wallet connection fixes
3. Establish component boundaries for future development

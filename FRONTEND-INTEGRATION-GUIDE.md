# 🎨 Frontend Integration Guide - Enhanced Programs

## ✅ What Was Updated

Your frontend has been updated with **5 new enhanced programs**! Here's everything you need to know.

---

## 📦 Updated Files

### ✅ 1. **Config File Updated**
**File:** `frontend-new/src/config/analos-programs.ts`

All 9 program IDs are now available:
```typescript
import { ANALOS_PROGRAMS, ANALOS_PROGRAM_IDS } from '@/config/analos-programs';

// Access program IDs:
ANALOS_PROGRAMS.OTC_ENHANCED
ANALOS_PROGRAMS.AIRDROP_ENHANCED
ANALOS_PROGRAMS.VESTING_ENHANCED
ANALOS_PROGRAMS.TOKEN_LOCK_ENHANCED
ANALOS_PROGRAMS.MONITORING_SYSTEM
```

### ✅ 2. **New React Hooks**
**File:** `frontend-new/src/hooks/useEnhancedPrograms.tsx`

Easy-to-use hooks for all programs:
```typescript
import { 
  useEnhancedPrograms,
  useOTCTrading,
  useAirdrop,
  useVesting,
  useTokenLock
} from '@/hooks/useEnhancedPrograms';
```

### ✅ 3. **Demo Component**
**File:** `frontend-new/src/app/components/EnhancedProgramsDemo.tsx`

A complete demo showing how to use all features!

---

## 🚀 How to Use in Your Components

### Example 1: Simple Program Access

```typescript
'use client';

import { useEnhancedPrograms } from '@/hooks/useEnhancedPrograms';

export default function MyComponent() {
  const { programs, programIds } = useEnhancedPrograms();
  
  return (
    <div>
      <p>OTC Program: {programIds.otcEnhanced}</p>
      <p>Airdrop Program: {programIds.airdropEnhanced}</p>
    </div>
  );
}
```

### Example 2: Check Program Status

```typescript
'use client';

import { useEnhancedPrograms } from '@/hooks/useEnhancedPrograms';
import { useEffect, useState } from 'react';

export default function ProgramStatus() {
  const { getAllProgramStatuses } = useEnhancedPrograms();
  const [statuses, setStatuses] = useState({});
  
  useEffect(() => {
    async function check() {
      const result = await getAllProgramStatuses();
      setStatuses(result);
    }
    check();
  }, []);
  
  return (
    <div>
      {Object.entries(statuses).map(([name, deployed]) => (
        <div key={name}>
          {name}: {deployed ? '✅' : '❌'}
        </div>
      ))}
    </div>
  );
}
```

### Example 3: OTC Trading

```typescript
'use client';

import { useOTCTrading } from '@/hooks/useEnhancedPrograms';
import { useWallet } from '@solana/wallet-adapter-react';

export default function OTCTradeButton() {
  const { publicKey } = useWallet();
  const { createOffer } = useOTCTrading();
  
  const handleCreateOffer = async () => {
    if (!publicKey) return;
    
    try {
      const result = await createOffer(
        [/* offer items */],
        [/* requested items */],
        Date.now() + 86400000 // 24 hours
      );
      
      console.log('Offer created:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (
    <button 
      onClick={handleCreateOffer}
      disabled={!publicKey}
    >
      Create OTC Offer
    </button>
  );
}
```

### Example 4: Claim Airdrop

```typescript
'use client';

import { useAirdrop } from '@/hooks/useEnhancedPrograms';
import { useWallet } from '@solana/wallet-adapter-react';

export default function AirdropClaim() {
  const { publicKey } = useWallet();
  const { claimAirdrop } = useAirdrop();
  
  const handleClaim = async () => {
    if (!publicKey) return;
    
    const amount = 1000;
    const proof = [/* merkle proof */];
    
    try {
      const result = await claimAirdrop(amount, proof);
      console.log('Claimed:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (
    <button onClick={handleClaim}>
      Claim Airdrop
    </button>
  );
}
```

### Example 5: Create Vesting Schedule

```typescript
'use client';

import { useVesting } from '@/hooks/useEnhancedPrograms';
import { useWallet } from '@solana/wallet-adapter-react';

export default function CreateVesting() {
  const { publicKey } = useWallet();
  const { createVestingSchedule } = useVesting();
  
  const handleCreateVesting = async () => {
    if (!publicKey) return;
    
    const totalAmount = 1000000; // 1M tokens
    const startTime = Date.now();
    const endTime = startTime + (365 * 24 * 60 * 60 * 1000); // 1 year
    const cliffDuration = 90 * 24 * 60 * 60 * 1000; // 90 days
    
    try {
      const result = await createVestingSchedule(
        totalAmount,
        startTime,
        endTime,
        cliffDuration
      );
      console.log('Vesting created:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (
    <button onClick={handleCreateVesting}>
      Create Vesting Schedule
    </button>
  );
}
```

### Example 6: Lock Tokens

```typescript
'use client';

import { useTokenLock } from '@/hooks/useEnhancedPrograms';
import { useWallet } from '@solana/wallet-adapter-react';

export default function LockTokens() {
  const { publicKey } = useWallet();
  const { createLock } = useTokenLock();
  
  const handleLockTokens = async () => {
    if (!publicKey) return;
    
    const amount = 500000; // 500K tokens
    const unlockTime = Date.now() + (180 * 24 * 60 * 60 * 1000); // 6 months
    const lockType = 'LP_TOKEN_LOCK';
    
    try {
      const result = await createLock(amount, unlockTime, lockType);
      console.log('Tokens locked:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (
    <button onClick={handleLockTokens}>
      Lock LP Tokens
    </button>
  );
}
```

---

## 🎯 Available Hooks

### 1. **`useEnhancedPrograms()`**
Main hook that provides access to all programs.

```typescript
const {
  programs,           // All program PublicKeys
  programIds,         // All program IDs as strings
  connection,         // Solana connection
  wallet,            // Connected wallet
  checkProgramDeployment,  // Check if program is deployed
  getAllProgramStatuses,   // Get status of all programs
  getPDA,            // Get Program Derived Address
  otcProgram,        // Direct access to OTC program
  airdropProgram,    // Direct access to Airdrop program
  vestingProgram,    // Direct access to Vesting program
  tokenLockProgram,  // Direct access to Token Lock program
  monitoringProgram, // Direct access to Monitoring program
} = useEnhancedPrograms();
```

### 2. **`useOTCTrading()`**
Hook for OTC trading features.

```typescript
const {
  programId,    // OTC program ID
  createOffer,  // Create a new trade offer
} = useOTCTrading();
```

### 3. **`useAirdrop()`**
Hook for airdrop features.

```typescript
const {
  programId,           // Airdrop program ID
  initializeAirdrop,   // Create new airdrop campaign
  claimAirdrop,        // Claim airdrop tokens
} = useAirdrop();
```

### 4. **`useVesting()`**
Hook for vesting features.

```typescript
const {
  programId,              // Vesting program ID
  createVestingSchedule,  // Create vesting schedule
  claimVestedTokens,      // Claim vested tokens
} = useVesting();
```

### 5. **`useTokenLock()`**
Hook for token lock features.

```typescript
const {
  programId,      // Token Lock program ID
  createLock,     // Lock tokens
  unlockTokens,   // Unlock tokens
} = useTokenLock();
```

---

## 📍 Adding to Your Existing Pages

### Add to Admin Dashboard

```typescript
// frontend-new/src/app/admin/page.tsx

import EnhancedProgramsDemo from '@/app/components/EnhancedProgramsDemo';

export default function AdminPage() {
  return (
    <div>
      {/* Your existing admin content */}
      
      {/* Add the enhanced programs section */}
      <EnhancedProgramsDemo />
    </div>
  );
}
```

### Add to Profile Page

```typescript
// frontend-new/src/app/profile/page.tsx

import { useEnhancedPrograms } from '@/hooks/useEnhancedPrograms';

export default function ProfilePage() {
  const { programIds } = useEnhancedPrograms();
  
  return (
    <div>
      {/* Your existing profile content */}
      
      <div className="mt-8">
        <h2>Enhanced Features Available</h2>
        <ul>
          <li>🤝 OTC Trading</li>
          <li>🎁 Airdrops</li>
          <li>📅 Token Vesting</li>
          <li>🔒 Token Locks</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## 🔗 Program IDs Reference

Quick copy-paste reference:

```typescript
// OTC Enhanced
7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY

// Airdrop Enhanced
J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC

// Vesting Enhanced
Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY

// Token Lock Enhanced
3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH

// Monitoring System
7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG
```

---

## 🧪 Testing in Development

### 1. Start your dev server:
```bash
cd frontend-new
npm run dev
```

### 2. Navigate to the demo page:
Create a new page at `frontend-new/src/app/enhanced-demo/page.tsx`:

```typescript
import EnhancedProgramsDemo from '@/app/components/EnhancedProgramsDemo';

export default function EnhancedDemoPage() {
  return <EnhancedProgramsDemo />;
}
```

### 3. Visit:
```
http://localhost:3000/enhanced-demo
```

---

## 🎨 UI Components to Build

Here are the UI components you might want to build next:

### 1. OTC Marketplace Page
- List of active offers
- Create offer form
- Accept/cancel offer buttons

### 2. Airdrop Claim Page
- Check eligibility
- Claim button with merkle proof
- Claimed amount display

### 3. Vesting Dashboard
- List of vesting schedules
- Progress bars
- Claim button

### 4. Token Lock Manager
- Active locks display
- Create lock form
- Unlock countdown

---

## 📱 Example Full Page

Here's a complete example page:

```typescript
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEnhancedPrograms } from '@/hooks/useEnhancedPrograms';

export default function EnhancedFeaturesPage() {
  const { publicKey } = useWallet();
  const { programIds } = useEnhancedPrograms();
  
  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-4">Connect Your Wallet</h1>
        <WalletMultiButton />
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Enhanced Features</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          title="🤝 OTC Trading"
          description="Trade NFTs and tokens P2P"
          href="/otc-marketplace"
        />
        <FeatureCard
          title="🎁 Airdrops"
          description="Claim token airdrops"
          href="/airdrop-claim"
        />
        <FeatureCard
          title="📅 Vesting"
          description="Manage vesting schedules"
          href="/vesting-dashboard"
        />
        <FeatureCard
          title="🔒 Token Lock"
          description="Lock tokens securely"
          href="/token-lock"
        />
        <FeatureCard
          title="📊 Analytics"
          description="View system metrics"
          href="/analytics"
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, description, href }) {
  return (
    <a
      href={href}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
    >
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </a>
  );
}
```

---

## ✅ Checklist

- [x] Config file updated with 5 new programs
- [x] React hooks created
- [x] Demo component created
- [ ] Add to your main navigation
- [ ] Create UI pages for each feature
- [ ] Test in development
- [ ] Deploy to production

---

## 🚀 Next Steps

1. **Test the Demo Component**
   ```bash
   cd frontend-new
   npm run dev
   ```

2. **Import and Use Hooks**
   - Add to existing pages
   - Create new feature pages
   - Integrate with your UI

3. **Build Feature Pages**
   - OTC Marketplace
   - Airdrop Claim
   - Vesting Dashboard
   - Token Lock Manager

4. **Deploy to Production**
   - Test thoroughly on devnet
   - Update environment variables
   - Deploy to Vercel/Railway

---

## 📞 Need Help?

- Check the demo component: `frontend-new/src/app/components/EnhancedProgramsDemo.tsx`
- Review the hooks: `frontend-new/src/hooks/useEnhancedPrograms.tsx`
- See config: `frontend-new/src/config/analos-programs.ts`

---

**Last Updated:** October 11, 2025  
**Version:** 1.0  
**Status:** ✅ Ready to Use!


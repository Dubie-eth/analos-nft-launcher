'use client';

import React from 'react';
import StandardLayout from '@/app/components/StandardLayout';
import UnifiedAdminDashboard from '@/app/components/UnifiedAdminDashboard';

export default function AdminPage() {
    return (
    <StandardLayout>
      <UnifiedAdminDashboard />
    </StandardLayout>
  );
}
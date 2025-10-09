'use client';

import { ReactNode } from 'react';

interface StandardLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function StandardLayout({ children, className = '' }: StandardLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 ${className}`}>
      {children}
    </div>
  );
}

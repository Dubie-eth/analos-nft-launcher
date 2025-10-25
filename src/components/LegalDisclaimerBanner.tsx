'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';

export default function LegalDisclaimerBanner() {
  const [showBanner, setShowBanner] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem('legal-disclaimer-dismissed');
    if (dismissed) {
      setShowBanner(false);
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('legal-disclaimer-dismissed', 'true');
    setShowBanner(false);
    setIsDismissed(true);
  };

  if (!showBanner) {
    // Show small reopener
    return (
      <button
        onClick={() => setShowBanner(true)}
        className="fixed bottom-4 left-4 z-40 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-3 py-2 rounded-lg border border-yellow-500/50 transition-all shadow-lg backdrop-blur-sm text-xs font-semibold flex items-center gap-2"
        title="View Legal Disclaimer"
      >
        <AlertTriangle className="w-4 h-4" />
        Legal Info
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white shadow-2xl border-t-4 border-yellow-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 animate-pulse" />
          <div className="text-sm font-semibold leading-tight">
            <span className="font-bold">🚨 ENTERTAINMENT ONLY:</span> onlyanal.fun and $LOL are for <strong>FUN</strong> and <strong>COMMUNITY</strong> only—NOT financial tools, investments, or ways to make money. 
            <span className="hidden md:inline"> No guarantees of value, profits, or returns. $LOL is NOT a security. Always DYOR and never spend more than you can afford to lose.</span>
            <Link href="/disclaimer" className="ml-2 underline hover:text-yellow-200 font-bold">
              Full Disclaimer →
            </Link>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors flex-shrink-0"
          title="Dismiss (can reopen later)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}


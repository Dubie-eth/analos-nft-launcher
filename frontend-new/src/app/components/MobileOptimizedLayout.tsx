'use client';

import React from 'react';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileOptimizedLayout({ children, className = '' }: MobileOptimizedLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 ${className}`}>
      {/* Mobile-specific optimizations */}
      <div className="relative">
        {/* Mobile viewport fixes */}
        <div className="min-h-screen flex flex-col">
          {/* Prevent zoom on input focus */}
          <style jsx global>{`
            input, select, textarea {
              font-size: 16px !important;
            }
            
            /* Fix mobile scrolling issues */
            body {
              -webkit-overflow-scrolling: touch;
              overflow-x: hidden;
            }
            
            /* Fix mobile button tap issues */
            button {
              -webkit-tap-highlight-color: transparent;
              touch-action: manipulation;
            }
            
            /* Fix mobile input styling */
            input[type="number"], input[type="text"] {
              -webkit-appearance: none;
              -moz-appearance: textfield;
            }
            
            /* Fix mobile card shadows */
            .mobile-card {
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            
            /* Fix mobile gradient issues */
            .mobile-gradient {
              background: linear-gradient(135deg, rgba(55, 65, 81, 0.95) 0%, rgba(147, 51, 234, 0.95) 50%, rgba(59, 130, 246, 0.95) 100%);
            }
            
            /* Mobile-specific spacing */
            @media (max-width: 768px) {
              .mobile-px { padding-left: 1rem; padding-right: 1rem; }
              .mobile-py { padding-top: 1rem; padding-bottom: 1rem; }
              .mobile-mx { margin-left: 0.5rem; margin-right: 0.5rem; }
              .mobile-text-sm { font-size: 0.875rem; }
              .mobile-text-lg { font-size: 1.125rem; }
              .mobile-text-xl { font-size: 1.25rem; }
            }
          `}</style>
          
          {children}
        </div>
      </div>
    </div>
  );
}

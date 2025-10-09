'use client';

import React from 'react';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileOptimizedLayout({ children, className = '' }: MobileOptimizedLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 ${className}`}>
      {/* Enhanced Mobile-specific optimizations */}
      <div className="relative">
        <div className="min-h-screen flex flex-col">
          {/* Enhanced mobile styles */}
          <style jsx global>{`
            /* Prevent zoom on input focus */
            input, select, textarea {
              font-size: 16px !important;
              -webkit-appearance: none;
              -moz-appearance: textfield;
            }
            
            /* Fix mobile scrolling issues */
            html, body {
              -webkit-overflow-scrolling: touch;
              overflow-x: hidden;
              overscroll-behavior: none;
            }
            
            /* Fix mobile button tap issues */
            button, [role="button"] {
              -webkit-tap-highlight-color: transparent;
              touch-action: manipulation;
              user-select: none;
            }
            
            /* Fix mobile input styling */
            input[type="number"]::-webkit-outer-spin-button,
            input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            
            /* Enhanced mobile card styling */
            .mobile-card {
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              border-radius: 12px;
              backdrop-filter: blur(10px);
            }
            
            /* Mobile gradient optimization */
            .mobile-gradient {
              background: linear-gradient(135deg, rgba(55, 65, 81, 0.95) 0%, rgba(147, 51, 234, 0.95) 50%, rgba(59, 130, 246, 0.95) 100%);
              will-change: transform;
            }
            
            /* Mobile text optimization */
            @media (max-width: 768px) {
              .mobile-px { padding-left: 1rem; padding-right: 1rem; }
              .mobile-py { padding-top: 1rem; padding-bottom: 1rem; }
              .mobile-mx { margin-left: 0.5rem; margin-right: 0.5rem; }
              .mobile-text-sm { font-size: 0.875rem; line-height: 1.25rem; }
              .mobile-text-lg { font-size: 1.125rem; line-height: 1.75rem; }
              .mobile-text-xl { font-size: 1.25rem; line-height: 1.75rem; }
              .mobile-text-2xl { font-size: 1.5rem; line-height: 2rem; }
              
              /* Mobile container optimization */
              .mobile-container {
                max-width: 100vw;
                padding-left: 1rem;
                padding-right: 1rem;
              }
              
              /* Mobile grid optimization */
              .mobile-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
              }
              
              /* Mobile button optimization */
              .mobile-btn {
                min-height: 44px;
                min-width: 44px;
                padding: 0.75rem 1.5rem;
                font-size: 1rem;
                border-radius: 8px;
              }
              
              /* Mobile form optimization */
              .mobile-form-input {
                min-height: 44px;
                padding: 0.75rem;
                font-size: 16px;
                border-radius: 8px;
              }
              
              /* Mobile wallet button optimization */
              .wallet-adapter-button {
                min-height: 44px !important;
                padding: 0.75rem 1.5rem !important;
                font-size: 1rem !important;
              }
              
              /* Mobile navigation optimization */
              .mobile-nav {
                padding: 0.5rem 1rem;
                backdrop-filter: blur(10px);
              }
              
              /* Mobile modal optimization */
              .mobile-modal {
                max-width: 95vw;
                max-height: 95vh;
                margin: 0.5rem;
                border-radius: 12px;
              }
            }
            
            /* Tablet optimization */
            @media (min-width: 769px) and (max-width: 1024px) {
              .tablet-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 1.5rem;
              }
              
              .tablet-container {
                max-width: 768px;
                margin: 0 auto;
                padding: 0 2rem;
              }
            }
            
            /* Performance optimizations */
            .gpu-accelerated {
              transform: translateZ(0);
              will-change: transform;
            }
            
            /* Reduce motion for accessibility */
            @media (prefers-reduced-motion: reduce) {
              *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
              }
            }
            
            /* Dark mode optimization */
            @media (prefers-color-scheme: dark) {
              .auto-dark {
                background-color: rgba(17, 24, 39, 0.95);
                color: white;
              }
            }
          `}</style>
          
          {children}
        </div>
      </div>
    </div>
  );
}

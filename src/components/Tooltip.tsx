'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  autoDismissMs?: number;
}

export default function Tooltip({ 
  content, 
  children, 
  position = 'top',
  autoDismissMs = 15000 // 15 seconds default
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [wasDismissed, setWasDismissed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (!wasDismissed) {
      setIsVisible(true);
      
      // Auto-dismiss after specified time
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setWasDismissed(true);
      }, autoDismissMs);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setWasDismissed(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Reset dismissed state after 60 seconds
  useEffect(() => {
    if (wasDismissed) {
      const resetTimeout = setTimeout(() => {
        setWasDismissed(false);
      }, 60000); // Allow tooltip to show again after 1 minute
      return () => clearTimeout(resetTimeout);
    }
  }, [wasDismissed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div 
          className={`absolute z-50 ${positionClasses[position]} animate-in fade-in slide-in-from-bottom-2 duration-200`}
          style={{ minWidth: '200px', maxWidth: '300px' }}
        >
          {/* Tooltip Content */}
          <div className="bg-gray-800 text-white text-sm rounded-lg shadow-lg border border-gray-700 p-3 relative">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-1 right-1 text-gray-400 hover:text-white transition-colors"
              aria-label="Close tooltip"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Content */}
            <div className="pr-6">{content}</div>
            
            {/* Arrow */}
            <div 
              className={`absolute w-0 h-0 border-8 ${arrowClasses[position]}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}


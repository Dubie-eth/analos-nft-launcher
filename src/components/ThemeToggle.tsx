'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        relative p-2 rounded-lg transition-all duration-200
        bg-white/10 hover:bg-white/20 border border-white/20
        text-white hover:text-yellow-300
        dark:bg-gray-800/50 dark:hover:bg-gray-700/50 dark:border-gray-600/50
        dark:text-gray-200 dark:hover:text-yellow-400
      "
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}

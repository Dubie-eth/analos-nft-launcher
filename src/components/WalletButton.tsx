'use client';

import CleanWalletConnection from './CleanWalletConnection';

interface WalletButtonProps {
  variant?: 'default' | 'minimal' | 'prominent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function WalletButton({ 
  variant = 'default', 
  size = 'md',
  className = ''
}: WalletButtonProps) {
  return (
    <CleanWalletConnection 
      variant={variant}
      size={size}
      className={className}
    />
  );
}

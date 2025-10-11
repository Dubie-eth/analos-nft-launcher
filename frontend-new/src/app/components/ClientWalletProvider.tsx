'use client';

import { WalletContextProvider } from './WalletProvider';

interface Props {
  children: React.ReactNode;
}

export function ClientWalletProvider({ children }: Props) {
  return <WalletContextProvider>{children}</WalletContextProvider>;
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletContextProvider } from '@/components/WalletProvider'
import ClientNavigation from '@/components/ClientNavigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Analos NFT Launcher v4.2.2 - Minimal Clean Architecture with Backpack Wallet',
  description: 'Clean minimal frontend for Analos NFT Launcher with Backpack wallet support, backend testing, marketplace, and mint functionality',
  robots: 'no-cache, no-store, must-revalidate',
  other: {
    'cache-version': '4.2.2',
    'build-timestamp': Date.now().toString(),
    'force-refresh': 'minimal-clean-deployment',
    'program-id': '7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletContextProvider>
          <ClientNavigation />
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {children}
          </div>
        </WalletContextProvider>
      </body>
    </html>
  )
}

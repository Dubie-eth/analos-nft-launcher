import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SecureWalletProvider from '@/components/SecureWalletProvider'
import ClientNavigation from '@/components/ClientNavigation'
import { WalletProvider } from '@/contexts/WalletContext'
import AccessControlManager from '@/components/AccessControlManager'
import CustomerServiceBotProvider from '@/components/CustomerServiceBotProvider'

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
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={inter.className}>
        <SecureWalletProvider>
          <WalletProvider>
            {/* Access Control Manager - syncs wallet state with cookies */}
            <AccessControlManager />
            
            <div className="navigation-container">
              <ClientNavigation />
            </div>
            
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
              {children}
            </div>
            
            {/* Customer Service Bot */}
            <CustomerServiceBotProvider />
          </WalletProvider>
        </SecureWalletProvider>
      </body>
    </html>
  )
}

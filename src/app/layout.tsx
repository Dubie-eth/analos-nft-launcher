import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SecureWalletProvider from '@/components/SecureWalletProvider'
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
        <SecureWalletProvider>
          <ClientNavigation />
          
          {/* Global Warning Banner */}
          <div className="bg-yellow-500/90 border-b border-yellow-400/50 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-center space-x-2 text-yellow-900">
                <span className="text-lg">⚠️</span>
                <span className="font-semibold text-sm">
                  Please use a burner wallet for safety - This platform is in BETA
                </span>
              </div>
            </div>
          </div>
          
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {children}
          </div>
        </SecureWalletProvider>
      </body>
    </html>
  )
}

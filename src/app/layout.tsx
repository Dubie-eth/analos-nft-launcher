import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SecureWalletProvider from '@/components/SecureWalletProvider'
import ClientNavigation from '@/components/ClientNavigation'
import AccessControlManager from '@/components/AccessControlManager'
import CustomerServiceBotProvider from '@/components/CustomerServiceBotProvider'
import DebugAccessInfo from '@/components/DebugAccessInfo'
import WalletSafetyDisclaimer from '@/components/WalletSafetyDisclaimer'
import LegalDisclaimerBanner from '@/components/LegalDisclaimerBanner'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SupabaseProvider } from '@/lib/supabase-provider'
import PageAccessGuard from '@/components/PageAccessGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Analos NFT Launcher v4.2.2 - Minimal Clean Architecture with Backpack Wallet',
  description: 'Clean minimal frontend for Analos NFT Launcher with Backpack wallet support, backend testing, marketplace, and mint functionality',
  robots: 'no-cache, no-store, must-revalidate',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' }
    ],
  },
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
        
        {/* Tell Solana extensions this is NOT a Solana site */}
        <meta name="solana:network" content="disabled" />
        <meta name="solana-actions" content="disabled" />
        <meta name="blockchain" content="analos" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SupabaseProvider>
            <SecureWalletProvider>
              {/* Access Control Manager - syncs wallet state with cookies */}
              <AccessControlManager />
              
              <div className="navigation-container">
                <ClientNavigation />
              </div>
              
              <div className="min-h-screen theme-bg">
                <PageAccessGuard>
                  {children}
                </PageAccessGuard>
              </div>
              
              {/* Customer Service Bot */}
              <CustomerServiceBotProvider />
              
              {/* Debug Access Info Panel (Ctrl+Shift+D to toggle) */}
              <DebugAccessInfo />
              
              {/* Wallet Safety Disclaimer - Shows on first visit */}
              <WalletSafetyDisclaimer />
              
              {/* Legal Disclaimer Banner - Entertainment Only */}
              <LegalDisclaimerBanner />
            </SecureWalletProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

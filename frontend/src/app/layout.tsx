import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

// Dynamically import WalletContextProvider to avoid hydration issues
const WalletContextProvider = dynamic(
  () => import('./components/WalletProvider').then((mod) => ({ default: mod.WalletContextProvider })),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'Analos NFT Launcher',
  description: 'Mint NFTs on the Analos blockchain',
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
          {children}
        </WalletContextProvider>
      </body>
    </html>
  )
}

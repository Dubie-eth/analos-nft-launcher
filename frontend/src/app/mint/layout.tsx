import dynamic from 'next/dynamic'

// Dynamically import to keep this client-only provider out of the server bundle
const WalletContextProvider = dynamic(
  () => import('../components/WalletProvider').then((mod) => ({ default: mod.WalletContextProvider })),
  { ssr: false }
)

export default function MintLayout({ children }: { children: React.ReactNode }) {
  return <WalletContextProvider>{children}</WalletContextProvider>
}


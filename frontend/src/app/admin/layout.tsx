import dynamic from 'next/dynamic'

const WalletContextProvider = dynamic(
  () => import('../components/WalletProvider').then((mod) => ({ default: mod.WalletContextProvider })),
  { ssr: false }
)

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <WalletContextProvider>{children}</WalletContextProvider>
}


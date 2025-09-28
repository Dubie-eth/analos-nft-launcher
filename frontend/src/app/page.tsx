import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          🚀 Analos NFT Launcher
        </h1>
        <p className="text-gray-300 text-xl mb-8 max-w-2xl mx-auto">
          Mint NFTs on the Analos blockchain with support for Backpack, Phantom, and other popular wallets.
        </p>
        <div className="space-x-4">
          <Link 
            href="/admin" 
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105"
          >
            👑 Admin Dashboard
          </Link>
          <Link 
            href="/mint" 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105"
          >
            🎨 Mint NFTs
          </Link>
        </div>
      </div>
    </div>
  )
}

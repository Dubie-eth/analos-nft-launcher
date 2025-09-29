import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-6xl font-bold text-white mb-6">
                  Analos NFT Launcher v3.5.0 - ESLINT FIXED!
                </h1>
          <p className="text-xl text-white/80 mb-12">
            Launch and mint NFTs on the Analos blockchain using $LOS
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Link href="/mint">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <h2 className="text-2xl font-bold text-white mb-4">Mint NFTs</h2>
                <p className="text-white/80">
                  Connect your wallet and mint NFTs from existing collections using $LOS
                </p>
              </div>
            </Link>
            
            <Link href="/admin">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <h2 className="text-2xl font-bold text-white mb-4">Admin Panel</h2>
                <p className="text-white/80">
                  Deploy new NFT collections and manage your projects with $LOS pricing
                </p>
              </div>
            </Link>
          </div>
          
          <div className="mt-16 text-white/60">
            <p>Built for the Analos blockchain ecosystem</p>
          </div>
        </div>
      </div>
    </div>
  );
}

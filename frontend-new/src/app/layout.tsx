import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "./components/WalletProvider";
import ClientNavigation from "./components/ClientNavigation";
import "../lib/restore-losbros"; // Auto-restore LosBros collection
import "../lib/initialize-beta-access"; // Initialize beta access system

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Analos NFT Launcher v4.1.0 - REAL BLOCKCHAIN TRANSACTIONS",
  description: "Launch and mint NFTs on the Analos blockchain with real smart contracts",
  robots: "no-cache, no-store, must-revalidate",
  other: {
    'cache-version': '4.1.0', // Force cache invalidation
    'build-timestamp': Date.now().toString(), // Dynamic timestamp
    'force-refresh': 'css-fix-v2', // Additional cache bust
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletContextProvider>
          <ClientNavigation />
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}

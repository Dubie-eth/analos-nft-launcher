import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Professional NFT Generator',
  description: 'Create stunning generative NFT collections with advanced layer management and rarity configuration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

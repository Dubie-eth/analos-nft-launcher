'use client';

import { useState } from 'react';

export default function LaunchpadDemo() {
  const [mintStatus, setMintStatus] = useState<string>('Ready to mint');
  const [mintCount, setMintCount] = useState<number>(0);

  const handleMint = async () => {
    setMintStatus('Minting...');
    
    // Simulate minting process
    setTimeout(() => {
      setMintCount(prev => prev + 1);
      setMintStatus(`Minted #${mintCount + 1} successfully!`);
    }, 2000);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '700px',
        width: '90%'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎯 NFT Launchpad Demo
        </h1>
        
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#666', 
          marginBottom: '30px' 
        }}>
          Test the blind mint and reveal mechanic
        </p>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>Collection Info</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>
            <div>
              <p><strong>Name:</strong> Analos Mystery Box</p>
              <p><strong>Symbol:</strong> AMB</p>
              <p><strong>Max Supply:</strong> 10,000</p>
            </div>
            <div>
              <p><strong>Price:</strong> 0.1 LOS</p>
              <p><strong>Reveal Threshold:</strong> 50%</p>
              <p><strong>Status:</strong> Active</p>
            </div>
          </div>
        </div>

        <div style={{
          background: '#e8f4f8',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>Mint Status</h3>
          <p style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{mintStatus}</p>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>
            Total Minted: {mintCount} / 10,000
          </p>
        </div>

        <div style={{
          background: '#f0f8e8',
          borderRadius: '15px',
          padding: '30px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>Rarity Tiers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '10px' }}>
              <strong>Legendary</strong><br />
              <span style={{ fontSize: '0.9rem' }}>0-4% (0-400)</span>
            </div>
            <div style={{ padding: '15px', background: '#d1ecf1', borderRadius: '10px' }}>
              <strong>Epic</strong><br />
              <span style={{ fontSize: '0.9rem' }}>5-19% (401-1,900)</span>
            </div>
            <div style={{ padding: '15px', background: '#d4edda', borderRadius: '10px' }}>
              <strong>Rare</strong><br />
              <span style={{ fontSize: '0.9rem' }}>20-49% (1,901-4,900)</span>
            </div>
            <div style={{ padding: '15px', background: '#f8d7da', borderRadius: '10px' }}>
              <strong>Common</strong><br />
              <span style={{ fontSize: '0.9rem' }}>50-100% (4,901-10,000)</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button 
            onClick={handleMint}
            disabled={mintStatus === 'Minting...'}
            style={{
              background: mintStatus === 'Minting...' ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '15px 30px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: mintStatus === 'Minting...' ? 'not-allowed' : 'pointer'
            }}
          >
            {mintStatus === 'Minting...' ? '⏳ Minting...' : '🎯 Mint Mystery Box'}
          </button>
          
          <a 
            href="/"
            style={{
              background: 'transparent',
              color: '#667eea',
              padding: '15px 30px',
              borderRadius: '10px',
              border: '2px solid #667eea',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              display: 'inline-block'
            }}
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

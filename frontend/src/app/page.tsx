'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    // Get API URL from environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    setApiUrl(apiUrl);

    // Test backend connection
    const testBackend = async () => {
      try {
        const response = await fetch(`${apiUrl}/health`);
        const data = await response.json();
        setBackendStatus(data.status === 'healthy' ? '✅ Connected' : '❌ Error');
      } catch (error) {
        setBackendStatus('❌ Connection Failed');
      }
    };

    testBackend();
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '600px',
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
          🚀 Analos NFT Launcher
        </h1>
        
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#666', 
          marginBottom: '30px' 
        }}>
          Clean Deployment - Fresh Start
        </p>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Connection Status</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>Backend:</strong> {backendStatus}</span>
            <span><strong>API URL:</strong> {apiUrl}</span>
          </div>
        </div>

        <div style={{
          background: '#e8f4f8',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Smart Contract</h3>
          <p><strong>Program ID:</strong> FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo</p>
          <p><strong>Network:</strong> Analos (https://rpc.analos.io)</p>
        </div>

        <div style={{
          background: '#f0f8e8',
          borderRadius: '10px',
          padding: '20px'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Next Steps</h3>
          <p>1. ✅ Backend deployed to Railway</p>
          <p>2. ✅ Frontend deployed to Vercel</p>
          <p>3. 🔄 Testing integration...</p>
        </div>

        <div style={{ marginTop: '30px' }}>
          <a 
            href="/launchpad-demo" 
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '15px 30px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              display: 'inline-block'
            }}
          >
            🎯 Try NFT Launchpad Demo
          </a>
        </div>
      </div>
    </div>
  );
}

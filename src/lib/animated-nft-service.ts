/**
 * Animated NFT Service
 * Handles generation and storage of animated Profile NFTs
 */

import { Connection, PublicKey } from '@solana/web3.js';

interface AnimatedNFTMetadata {
  name: string;
  description: string;
  image: string; // Static preview image
  animation_url?: string; // Animated version (HTML/CSS)
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  properties: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
    creators: Array<{
      address: string;
      share: number;
    }>;
  };
}

interface MatrixAnimationConfig {
  matrixColor: string;
  animationType: 'rain' | 'drip' | 'glow' | 'pulse';
  speed: 'slow' | 'medium' | 'fast';
  intensity: 'low' | 'medium' | 'high';
}

class AnimatedNFTService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Generate animated HTML/CSS for matrix effects
   */
  generateAnimatedHTML(
    profileData: any,
    matrixConfig: MatrixAnimationConfig,
    staticImageUrl: string
  ): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${profileData.name} - Profile NFT</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(to bottom, #1a1a1a, #000000);
            font-family: 'Courier New', monospace;
            overflow: hidden;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .nft-container {
            position: relative;
            width: 400px;
            height: 600px;
            border: 3px solid ${this.getMatrixColor(matrixConfig.matrixColor)};
            border-radius: 15px;
            background: linear-gradient(135deg, ${this.getBackgroundGradient(matrixConfig.matrixColor)});
            overflow: hidden;
            box-shadow: 0 0 30px ${this.getMatrixColor(matrixConfig.matrixColor)}40;
        }
        
        /* Matrix Animation */
        .matrix-background {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
            z-index: 1;
        }
        
        .matrix-char {
            position: absolute;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: ${this.getMatrixColor(matrixConfig.matrixColor)};
            animation: matrix-rain ${this.getAnimationSpeed(matrixConfig.speed)}s linear infinite;
            opacity: 0.8;
        }
        
        .matrix-drip {
            position: absolute;
            width: 2px;
            background: linear-gradient(to bottom, transparent, ${this.getMatrixColor(matrixConfig.matrixColor)});
            animation: matrix-drip ${this.getAnimationSpeed(matrixConfig.speed)}s ease-in-out infinite;
            opacity: 0.6;
        }
        
        @keyframes matrix-rain {
            0% { transform: translateY(-100vh); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(100vh); opacity: 0; }
        }
        
        @keyframes matrix-drip {
            0% { transform: translateY(-20px); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(20px); opacity: 0; }
        }
        
        /* Profile Content */
        .profile-content {
            position: relative;
            z-index: 10;
            padding: 20px;
            text-align: center;
            color: ${this.getMatrixColor(matrixConfig.matrixColor)};
        }
        
        .profile-image {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 2px solid ${this.getMatrixColor(matrixConfig.matrixColor)};
            margin: 0 auto 15px;
            display: block;
        }
        
        .profile-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
            text-shadow: 0 0 10px ${this.getMatrixColor(matrixConfig.matrixColor)};
        }
        
        .profile-username {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 10px;
        }
        
        .profile-bio {
            font-size: 12px;
            opacity: 0.7;
            line-height: 1.4;
        }
        
        .rarity-badge {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(0, 0, 0, 0.8);
            color: ${this.getMatrixColor(matrixConfig.matrixColor)};
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: bold;
            border: 1px solid ${this.getMatrixColor(matrixConfig.matrixColor)};
        }
        
        .edition-number {
            position: absolute;
            top: 15px;
            left: 15px;
            background: rgba(0, 0, 0, 0.8);
            color: ${this.getMatrixColor(matrixConfig.matrixColor)};
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: bold;
            border: 1px solid ${this.getMatrixColor(matrixConfig.matrixColor)};
        }
    </style>
</head>
<body>
    <div class="nft-container">
        <div class="rarity-badge">${profileData.rarity}</div>
        <div class="edition-number">#${profileData.mintNumber}</div>
        
        <div class="matrix-background" id="matrix-bg"></div>
        
        <div class="profile-content">
            <img src="${staticImageUrl}" alt="Profile" class="profile-image" onerror="this.style.display='none'">
            <div class="profile-name">${profileData.name}</div>
            <div class="profile-username">@${profileData.username}</div>
            <div class="profile-bio">${profileData.bio || 'Profile NFT on Analos'}</div>
        </div>
    </div>
    
    <script>
        // Generate matrix characters
        function generateMatrix() {
            const matrixBg = document.getElementById('matrix-bg');
            const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
            
            // Generate falling characters
            for (let i = 0; i < 15; i++) {
                const char = document.createElement('div');
                char.className = 'matrix-char';
                char.textContent = chars[Math.floor(Math.random() * chars.length)];
                char.style.left = Math.random() * 100 + '%';
                char.style.animationDelay = Math.random() * 4 + 's';
                char.style.animationDuration = (3 + Math.random() * 2) + 's';
                matrixBg.appendChild(char);
            }
            
            // Generate drips
            for (let i = 0; i < 8; i++) {
                const drip = document.createElement('div');
                drip.className = 'matrix-drip';
                drip.style.left = Math.random() * 100 + '%';
                drip.style.animationDelay = Math.random() * 2 + 's';
                drip.style.height = (20 + Math.random() * 30) + 'px';
                matrixBg.appendChild(drip);
            }
        }
        
        generateMatrix();
    </script>
</body>
</html>`;
    
    return html;
  }

  /**
   * Create animated NFT metadata
   */
  async createAnimatedNFTMetadata(
    mintAddress: PublicKey,
    profileData: any,
    matrixConfig: MatrixAnimationConfig,
    staticImageUrl: string
  ): Promise<AnimatedNFTMetadata> {
    const animatedHTML = this.generateAnimatedHTML(profileData, matrixConfig, staticImageUrl);
    
    // Upload animated HTML to IPFS
    const animatedUrl = await this.uploadToIPFS(animatedHTML, `animated-${mintAddress.toString()}.html`);
    
    const metadata: AnimatedNFTMetadata = {
      name: `${profileData.name} - Profile NFT`,
      description: `Animated Profile NFT with ${matrixConfig.matrixColor} matrix effects on Analos blockchain`,
      image: staticImageUrl, // Static preview for marketplaces
      animation_url: animatedUrl, // Animated version
      attributes: [
        { trait_type: 'Matrix Color', value: matrixConfig.matrixColor },
        { trait_type: 'Animation Type', value: matrixConfig.animationType },
        { trait_type: 'Rarity', value: profileData.rarity },
        { trait_type: 'Edition', value: profileData.mintNumber.toString() },
        { trait_type: 'Platform', value: 'Analos' }
      ],
      properties: {
        files: [
          {
            uri: staticImageUrl,
            type: 'image/png'
          },
          {
            uri: animatedUrl,
            type: 'text/html'
          }
        ],
        category: 'image',
        creators: [
          {
            address: 'launchonlos.fun',
            share: 100
          }
        ]
      }
    };

    return metadata;
  }

  /**
   * Upload content to IPFS
   */
  private async uploadToIPFS(content: string, filename: string): Promise<string> {
    try {
      const response = await fetch('/api/ipfs/upload-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          filename
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload to IPFS');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
  }

  /**
   * Get matrix color based on variant
   */
  private getMatrixColor(matrixColor: string): string {
    const colors: { [key: string]: string } = {
      green: '#00ff41',
      blue: '#0080ff',
      purple: '#8000ff',
      red: '#ff0040',
      yellow: '#ffff00',
      cyan: '#00ffff',
      white: '#ffffff',
      rainbow: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #8000ff, #ff0080)',
      cosmic: '#ff00ff',
      galaxy: '#8000ff',
      aurora: '#00ff80'
    };
    
    return colors[matrixColor] || '#00ff41';
  }

  /**
   * Get background gradient based on matrix color
   */
  private getBackgroundGradient(matrixColor: string): string {
    const gradients: { [key: string]: string } = {
      green: '#1a4d1a, #000000',
      blue: '#1a1a4d, #000000',
      purple: '#4d1a4d, #000000',
      red: '#4d1a1a, #000000',
      yellow: '#4d4d1a, #000000',
      cyan: '#1a4d4d, #000000',
      white: '#4d4d4d, #000000',
      rainbow: '#ff0000, #8000ff, #000000',
      cosmic: '#ff00ff, #8000ff, #000000',
      galaxy: '#8000ff, #ff00ff, #000000',
      aurora: '#00ff80, #8000ff, #000000'
    };
    
    return gradients[matrixColor] || '#1a4d1a, #000000';
  }

  /**
   * Get animation speed based on config
   */
  private getAnimationSpeed(speed: string): number {
    const speeds: { [key: string]: number } = {
      slow: 6,
      medium: 4,
      fast: 2
    };
    
    return speeds[speed] || 4;
  }
}

export { AnimatedNFTService };
export type { MatrixAnimationConfig, AnimatedNFTMetadata };

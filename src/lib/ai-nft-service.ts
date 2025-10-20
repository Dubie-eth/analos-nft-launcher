/**
 * AI NFT SERVICE
 * Creates evolving, AI-powered NFTs with daily content updates
 */

interface AINFTConfig {
  apiKey: string;
  basePrompt: string;
  evolutionStyle: 'artistic' | 'abstract' | 'realistic' | 'anime';
  updateFrequency: 'daily' | 'weekly' | 'monthly';
}

interface NFTEvolution {
  id: string;
  tokenId: string;
  currentVersion: number;
  lastUpdated: Date;
  evolutionHistory: EvolutionStep[];
  currentPrompt: string;
  nextEvolutionDate: Date;
}

interface EvolutionStep {
  version: number;
  prompt: string;
  imageUrl: string;
  videoUrl?: string;
  metadata: {
    traits: Record<string, any>;
    description: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  createdAt: Date;
}

class AINFTService {
  private config: AINFTConfig;
  private evolutions: Map<string, NFTEvolution> = new Map();

  constructor(config: AINFTConfig) {
    this.config = config;
  }

  /**
   * Initialize a new evolving NFT
   */
  async createEvolvingNFT(
    tokenId: string,
    initialPrompt: string,
    ownerWallet: string
  ): Promise<NFTEvolution> {
    const evolution: NFTEvolution = {
      id: `evolution_${tokenId}_${Date.now()}`,
      tokenId,
      currentVersion: 1,
      lastUpdated: new Date(),
      evolutionHistory: [],
      currentPrompt: initialPrompt,
      nextEvolutionDate: this.calculateNextEvolutionDate()
    };

    // Generate initial content
    const initialStep = await this.generateEvolutionStep(
      initialPrompt,
      1,
      evolution
    );
    
    evolution.evolutionHistory.push(initialStep);
    this.evolutions.set(tokenId, evolution);

    return evolution;
  }

  /**
   * Generate AI content for an evolution step
   */
  private async generateEvolutionStep(
    prompt: string,
    version: number,
    evolution: NFTEvolution
  ): Promise<EvolutionStep> {
    // Enhanced prompt with evolution context
    const enhancedPrompt = this.buildEvolutionPrompt(prompt, version, evolution);
    
    try {
      // Generate image using AI service (DALL-E, Midjourney API, etc.)
      const imageUrl = await this.generateImage(enhancedPrompt);
      
      // Generate short video/animation (6.9 seconds as requested)
      const videoUrl = await this.generateEvolutionVideo(enhancedPrompt, imageUrl);
      
      // Generate metadata with evolving traits
      const metadata = await this.generateEvolvingMetadata(enhancedPrompt, version);
      
      return {
        version,
        prompt: enhancedPrompt,
        imageUrl,
        videoUrl,
        metadata,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error generating evolution step:', error);
      throw new Error(`Failed to generate evolution step: ${error}`);
    }
  }

  /**
   * Build enhanced prompt with evolution context
   */
  private buildEvolutionPrompt(
    basePrompt: string,
    version: number,
    evolution: NFTEvolution
  ): string {
    const evolutionContext = this.getEvolutionContext(version);
    const styleContext = this.getStyleContext();
    
    return `${basePrompt}, ${evolutionContext}, ${styleContext}, version ${version}, evolving digital art, high quality, detailed, NFT style`;
  }

  /**
   * Get evolution context based on version
   */
  private getEvolutionContext(version: number): string {
    const contexts = [
      'embryonic stage, simple forms',
      'early development, basic shapes emerging',
      'growing complexity, patterns forming',
      'maturing phase, intricate details',
      'peak evolution, full complexity',
      'transcendent form, beyond normal boundaries',
      'cosmic awareness, universal understanding',
      'infinite wisdom, eternal knowledge'
    ];

    return contexts[Math.min(version - 1, contexts.length - 1)];
  }

  /**
   * Get style context based on configuration
   */
  private getStyleContext(): string {
    const styleMap = {
      artistic: 'artistic style, painterly, expressive brushstrokes',
      abstract: 'abstract art, geometric patterns, flowing forms',
      realistic: 'photorealistic, detailed, high resolution',
      anime: 'anime style, vibrant colors, stylized features'
    };

    return styleMap[this.config.evolutionStyle] || styleMap.artistic;
  }

  /**
   * Generate image using AI service
   */
  private async generateImage(prompt: string): Promise<string> {
    // Integration with AI image generation service
    // This would use OpenAI DALL-E, Stability AI, or similar
    
    const response = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        prompt,
        size: '1024x1024',
        quality: 'hd',
        style: this.config.evolutionStyle
      })
    });

    if (!response.ok) {
      // Try to parse structured error
      let detail = response.statusText;
      try {
        const err = await response.json();
        if (err && err.error === 'ERROR_BAD_REQUEST' && err.details) {
          const fieldErrors = err.details.additionalInfo?.fieldErrors;
          const fields = fieldErrors ? Object.entries(fieldErrors).map(([k, v]) => `${k}: ${v}`).join('; ') : '';
          detail = `${err.details.detail}${fields ? ` (${fields})` : ''}`;
        }
      } catch {
        // ignore json parse failure
      }
      throw new Error(`Image generation failed (${response.status}): ${detail}`);
    }

    const data = await response.json();
    return data.imageUrl;
  }

  /**
   * Generate evolution video (6.9 seconds)
   */
  private async generateEvolutionVideo(prompt: string, imageUrl: string): Promise<string> {
    // Generate short video showing evolution
    const response = await fetch('/api/ai/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        prompt: `Evolution animation: ${prompt}`,
        duration: 6.9, // 6.9 seconds as requested
        baseImage: imageUrl,
        style: 'smooth transition, morphing effect'
      })
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const err = await response.json();
        if (err && err.error === 'ERROR_BAD_REQUEST' && err.details) {
          const fieldErrors = err.details.additionalInfo?.fieldErrors;
          const fields = fieldErrors ? Object.entries(fieldErrors).map(([k, v]) => `${k}: ${v}`).join('; ') : '';
          detail = `${err.details.detail}${fields ? ` (${fields})` : ''}`;
        }
      } catch {
        // ignore json parse failure
      }
      throw new Error(`Video generation failed (${response.status}): ${detail}`);
    }

    const data = await response.json();
    return data.videoUrl;
  }

  /**
   * Generate evolving metadata
   */
  private async generateEvolvingMetadata(prompt: string, version: number) {
    // Generate traits that evolve over time
    const traits = {
      'Evolution Stage': this.getEvolutionStage(version),
      'Complexity Level': Math.min(version * 10, 100),
      'Wisdom Points': version * 50,
      'Art Style': this.config.evolutionStyle,
      'Generation Version': version,
      'Last Evolution': new Date().toISOString()
    };

    return {
      traits,
      description: `An evolving AI-powered NFT that grows and learns. Currently at evolution stage ${version}.`,
      attributes: Object.entries(traits).map(([trait_type, value]) => ({
        trait_type,
        value
      }))
    };
  }

  /**
   * Get evolution stage name
   */
  private getEvolutionStage(version: number): string {
    const stages = [
      'Genesis',
      'Awakening',
      'Growth',
      'Maturity',
      'Transcendence',
      'Enlightenment',
      'Cosmic',
      'Infinite'
    ];

    return stages[Math.min(version - 1, stages.length - 1)];
  }

  /**
   * Check if NFT should evolve
   */
  shouldEvolve(tokenId: string): boolean {
    const evolution = this.evolutions.get(tokenId);
    if (!evolution) return false;

    return new Date() >= evolution.nextEvolutionDate;
  }

  /**
   * Trigger evolution for an NFT
   */
  async evolveNFT(tokenId: string): Promise<EvolutionStep> {
    const evolution = this.evolutions.get(tokenId);
    if (!evolution) {
      throw new Error(`Evolution not found for token ${tokenId}`);
    }

    if (!this.shouldEvolve(tokenId)) {
      throw new Error(`Token ${tokenId} is not ready for evolution`);
    }

    // Generate new evolution step
    const newStep = await this.generateEvolutionStep(
      evolution.currentPrompt,
      evolution.currentVersion + 1,
      evolution
    );

    // Update evolution record
    evolution.evolutionHistory.push(newStep);
    evolution.currentVersion = newStep.version;
    evolution.lastUpdated = new Date();
    evolution.nextEvolutionDate = this.calculateNextEvolutionDate();
    evolution.currentPrompt = newStep.prompt;

    this.evolutions.set(tokenId, evolution);

    return newStep;
  }

  /**
   * Calculate next evolution date
   */
  private calculateNextEvolutionDate(): Date {
    const now = new Date();
    switch (this.config.updateFrequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get current evolution state
   */
  getEvolution(tokenId: string): NFTEvolution | undefined {
    return this.evolutions.get(tokenId);
  }

  /**
   * Get all evolutions
   */
  getAllEvolutions(): NFTEvolution[] {
    return Array.from(this.evolutions.values());
  }
}

export default AINFTService;

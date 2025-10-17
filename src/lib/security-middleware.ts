// Security middleware for input validation and malicious code prevention
import { NextRequest } from 'next/server';

// Malicious patterns to detect and block
const MALICIOUS_PATTERNS = [
  // Script injection patterns
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
  /<link[^>]*>.*?<\/link>/gi,
  /<meta[^>]*>.*?<\/meta>/gi,
  
  // SQL injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  /(\b(OR|AND)\s+'.*?'\s*=\s*'.*?')/gi,
  /(UNION\s+SELECT)/gi,
  /(DROP\s+TABLE)/gi,
  /(DELETE\s+FROM)/gi,
  
  // Command injection patterns
  /(\||&|;|\$\(|\`)/g,
  /(cmd|command|exec|system|shell)/gi,
  
  // Path traversal patterns
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  
  // XSS patterns
  /<[^>]*>/g,
  /&lt;[^&]*&gt;/g,
  /&#x?[0-9a-f]+;/gi,
  
  // File upload malicious patterns
  /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|php|asp|aspx|jsp)$/gi,
  /^.*\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|php|asp|aspx|jsp).*$/gi,
];

// Allowed file extensions for uploads
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const ALLOWED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.txt', '.csv'];

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  document: 5 * 1024 * 1024, // 5MB
  csv: 1 * 1024 * 1024, // 1MB
};

export class SecurityValidator {
  /**
   * Validate and sanitize text input
   */
  static validateTextInput(input: string, maxLength: number = 1000): {
    isValid: boolean;
    sanitized: string;
    errors: string[];
  } {
    const errors: string[] = [];
    let sanitized = input;

    // Check length
    if (input.length > maxLength) {
      errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    }

    // Check for malicious patterns
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pattern.test(input)) {
        errors.push('Input contains potentially malicious content');
        break;
      }
    }

    // Basic sanitization
    sanitized = sanitized
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: File, allowedTypes: string[] = ALLOWED_IMAGE_EXTENSIONS): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check file size
    const maxSize = file.type.startsWith('image/') ? MAX_FILE_SIZES.image : MAX_FILE_SIZES.document;
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedTypes.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check for malicious file names
    if (MALICIOUS_PATTERNS.some(pattern => pattern.test(fileName))) {
      errors.push('File name contains potentially malicious content');
    }

    // Check MIME type
    if (file.type && !file.type.match(/^(image|text|application)\//)) {
      errors.push('Invalid file type');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate wallet address
   */
  static validateWalletAddress(address: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic Solana address validation (44 characters, base58)
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!solanaAddressRegex.test(address)) {
      errors.push('Invalid wallet address format');
    }

    // Check length
    if (address.length < 32 || address.length > 44) {
      errors.push('Wallet address length invalid');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate collection configuration
   */
  static validateCollectionConfig(config: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate required fields
    if (!config.name || typeof config.name !== 'string') {
      errors.push('Collection name is required');
    } else {
      const nameValidation = this.validateTextInput(config.name, 100);
      if (!nameValidation.isValid) {
        errors.push(...nameValidation.errors);
      }
    }

    if (!config.symbol || typeof config.symbol !== 'string') {
      errors.push('Collection symbol is required');
    } else {
      const symbolValidation = this.validateTextInput(config.symbol, 10);
      if (!symbolValidation.isValid) {
        errors.push(...symbolValidation.errors);
      }
    }

    // Validate supply
    if (config.supply && (config.supply < 1 || config.supply > 10000)) {
      errors.push('Collection supply must be between 1 and 10000');
    }

    // Validate price
    if (config.mintPrice && (config.mintPrice < 0 || config.mintPrice > 1000)) {
      errors.push('Mint price must be between 0 and 1000');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize request body
   */
  static sanitizeRequestBody(body: any): any {
    if (typeof body === 'string') {
      const validation = this.validateTextInput(body);
      return validation.sanitized;
    }

    if (Array.isArray(body)) {
      return body.map(item => this.sanitizeRequestBody(item));
    }

    if (body && typeof body === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(body)) {
        // Sanitize key
        const keyValidation = this.validateTextInput(key, 50);
        if (keyValidation.isValid) {
          sanitized[keyValidation.sanitized] = this.sanitizeRequestBody(value);
        }
      }
      return sanitized;
    }

    return body;
  }
}

// Security middleware for API routes
export function withSecurityValidation(handler: Function) {
  return async function(request: NextRequest, ...args: any[]) {
    try {
      // Validate request headers
      const userAgent = request.headers.get('user-agent');
      if (!userAgent || userAgent.length < 10) {
        return new Response(
          JSON.stringify({ error: 'Invalid request headers' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check for suspicious headers
      const suspiciousHeaders = ['x-forwarded-host', 'x-originating-ip', 'x-remote-ip'];
      for (const header of suspiciousHeaders) {
        if (request.headers.get(header)) {
          console.warn(`Suspicious header detected: ${header}`);
        }
      }

      // Validate request body if present
      if (request.method === 'POST' || request.method === 'PUT') {
        try {
          const body = await request.json();
          const sanitizedBody = SecurityValidator.sanitizeRequestBody(body);
          
          // Create new request with sanitized body
          const sanitizedRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(sanitizedBody)
          });
          
          return await handler(sanitizedRequest, ...args);
        } catch (error) {
          return new Response(
            JSON.stringify({ error: 'Invalid request body' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      return await handler(request, ...args);
    } catch (error) {
      console.error('Security validation error:', error);
      return new Response(
        JSON.stringify({ error: 'Security validation failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

// Image cleanup utility
export class ImageCleanup {
  /**
   * Generate unique filename to prevent conflicts
   */
  static generateUniqueFilename(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `${userId}_${timestamp}_${random}.${extension}`;
  }

  /**
   * Validate image file before processing
   */
  static validateImageFile(file: File): { isValid: boolean; errors: string[] } {
    return SecurityValidator.validateFileUpload(file, ALLOWED_IMAGE_EXTENSIONS);
  }

  /**
   * Get old image URLs that need to be cleaned up
   */
  static getOldImageUrls(currentData: any, newData: any): string[] {
    const oldUrls: string[] = [];
    
    // Check for logo changes
    if (currentData.logo_url && currentData.logo_url !== newData.logo_url) {
      oldUrls.push(currentData.logo_url);
    }
    
    // Check for banner changes
    if (currentData.banner_url && currentData.banner_url !== newData.banner_url) {
      oldUrls.push(currentData.banner_url);
    }
    
    // Check for profile picture changes
    if (currentData.profile_picture_url && currentData.profile_picture_url !== newData.profile_picture_url) {
      oldUrls.push(currentData.profile_picture_url);
    }
    
    return oldUrls;
  }
}

/**
 * Security utilities for input validation and XSS prevention
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove potentially dangerous HTML tags and attributes
  const dangerousTags = /<script[^>]*>.*?<\/script>/gi;
  const dangerousAttributes = /on\w+\s*=\s*["'][^"']*["']/gi;
  const dangerousProtocols = /javascript:|data:|vbscript:/gi;
  
  let sanitized = input
    .replace(dangerousTags, '')
    .replace(dangerousAttributes, '')
    .replace(dangerousProtocols, '');
  
  // Escape remaining HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Validate collection name input
 */
export function validateCollectionName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Collection name is required' };
  }
  
  if (name.length < 2) {
    return { isValid: false, error: 'Collection name must be at least 2 characters' };
  }
  
  if (name.length > 50) {
    return { isValid: false, error: 'Collection name must be less than 50 characters' };
  }
  
  // Allow only alphanumeric, spaces, and common punctuation
  const validPattern = /^[a-zA-Z0-9\s\-_.,!?()]+$/;
  if (!validPattern.test(name)) {
    return { isValid: false, error: 'Collection name contains invalid characters' };
  }
  
  return { isValid: true };
}

/**
 * Validate collection symbol input
 */
export function validateCollectionSymbol(symbol: string): { isValid: boolean; error?: string } {
  if (!symbol || symbol.trim().length === 0) {
    return { isValid: false, error: 'Symbol is required' };
  }
  
  if (symbol.length < 2 || symbol.length > 10) {
    return { isValid: false, error: 'Symbol must be between 2 and 10 characters' };
  }
  
  // Allow only alphanumeric characters
  const validPattern = /^[A-Z0-9]+$/;
  if (!validPattern.test(symbol)) {
    return { isValid: false, error: 'Symbol must contain only uppercase letters and numbers' };
  }
  
  return { isValid: true };
}

/**
 * Validate URL input
 */
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { isValid: true }; // URL is optional
  }
  
  try {
    const urlObj = new URL(url);
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    // Check for suspicious domains or patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return { isValid: false, error: 'Invalid URL format' };
      }
    }
    
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate wallet address input
 */
export function validateWalletAddress(address: string): { isValid: boolean; error?: string } {
  if (!address || address.trim().length === 0) {
    return { isValid: true }; // Wallet address is optional
  }
  
  // Basic Solana address validation (44 characters, base58)
  const base58Pattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!base58Pattern.test(address)) {
    return { isValid: false, error: 'Invalid wallet address format' };
  }
  
  return { isValid: true };
}

/**
 * Validate numeric input with min/max constraints
 */
export function validateNumericInput(
  value: string | number, 
  min: number, 
  max: number, 
  fieldName: string
): { isValid: boolean; error?: string; sanitizedValue?: number } {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (numValue < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }
  
  if (numValue > max) {
    return { isValid: false, error: `${fieldName} must be no more than ${max}` };
  }
  
  return { isValid: true, sanitizedValue: numValue };
}

/**
 * Safely create DOM elements with text content (no innerHTML)
 */
export function createSafeElement(tag: string, textContent: string, className?: string): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = sanitizeHtml(textContent);
  if (className) {
    element.className = className;
  }
  return element;
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // HTML encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Validate file upload to prevent malicious files
 */
export function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and ZIP files are allowed' };
  }
  
  // Check file name for suspicious patterns
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.pif$/i,
    /\.com$/i,
    /\.js$/i,
    /\.vbs$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      return { isValid: false, error: 'File type not allowed for security reasons' };
    }
  }
  
  // Check for null bytes in filename
  if (file.name.includes('\x00')) {
    return { isValid: false, error: 'Invalid file name' };
  }
  
  return { isValid: true };
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  private maxRequests: number;
  private windowMs: number;
  
  isAllowed(key: string): boolean {
    return this.isAllowedWithCustom(key, this.maxRequests, this.windowMs);
  }
  
  isAllowedWithCustom(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute by default

/**
 * Content Security Policy helpers
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://rpc.analos.io https://api.coingecko.com https://price.jup.ag",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://rpc.analos.io https://api.coingecko.com https://price.jup.ag https://analos-nft-launcher-backend-production.up.railway.app",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
};
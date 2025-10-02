/**
 * Security utilities for safe HTML rendering and input validation
 */

/**
 * Safely escape HTML to prevent XSS attacks
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Safely create DOM elements with text content (no innerHTML)
 */
export function createSafeElement(tag: string, textContent: string, className?: string): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = textContent;
  if (className) {
    element.className = className;
  }
  return element;
}

/**
 * Safely set text content (prevents XSS)
 */
export function setSafeTextContent(element: HTMLElement, text: string): void {
  element.textContent = text;
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove any potential script tags and dangerous characters
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
  
  // Limit length
  return sanitized.substring(0, maxLength);
}

/**
 * Validate wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Solana wallet addresses are base58 encoded and typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Validate token mint address format
 */
export function isValidTokenMint(mint: string): boolean {
  return isValidWalletAddress(mint); // Same format as wallet addresses
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private maxRequests: number, private timeWindow: number) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the time window
    const validRequests = requests.filter(time => now - time < this.timeWindow);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
}

/**
 * File upload validation
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum 10MB allowed.' };
  }
  
  // Check file type (only images)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' };
  }
  
  // Check file name for suspicious patterns
  const suspiciousPatterns = /[<>:"/\\|?*\x00-\x1f]/;
  if (suspiciousPatterns.test(file.name)) {
    return { valid: false, error: 'Invalid file name. Contains unsafe characters.' };
  }
  
  return { valid: true };
}

/**
 * Validate collection name
 */
export function validateCollectionName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Collection name is required' };
  }
  
  const sanitized = sanitizeInput(name, 100);
  if (sanitized.length < 1) {
    return { valid: false, error: 'Collection name cannot be empty' };
  }
  
  if (sanitized.length > 100) {
    return { valid: false, error: 'Collection name too long. Maximum 100 characters.' };
  }
  
  // Check for potentially dangerous patterns
  const dangerousPatterns = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousPatterns.test(sanitized)) {
    return { valid: false, error: 'Collection name contains invalid characters.' };
  }
  
  return { valid: true, sanitized };
}

/**
 * Validate collection description
 */
export function validateCollectionDescription(description: string): { valid: boolean; error?: string } {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Collection description is required' };
  }
  
  const sanitized = sanitizeInput(description, 1000);
  if (sanitized.length < 1) {
    return { valid: false, error: 'Collection description cannot be empty' };
  }
  
  if (sanitized.length > 1000) {
    return { valid: false, error: 'Collection description too long. Maximum 1000 characters.' };
  }
  
  return { valid: true, sanitized };
}

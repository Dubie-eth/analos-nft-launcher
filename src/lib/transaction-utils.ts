/**
 * TRANSACTION UTILS
 * Utilities for formatting transaction hashes and improving mobile UX
 */

/**
 * Shorten a transaction hash for mobile display
 * Shows first 8 chars + "..." + last 8 chars
 */
export function shortenTxHash(hash: string, startChars = 8, endChars = 8): string {
  if (!hash || hash.length <= startChars + endChars) {
    return hash;
  }
  
  return `${hash.substring(0, startChars)}...${hash.substring(hash.length - endChars)}`;
}

/**
 * Format transaction hash for display with copy functionality
 */
export function formatTxHashDisplay(
  hash: string, 
  showFull = false,
  mobile = false
): {
  display: string;
  copyText: string;
  explorerUrl: string;
} {
  const copyText = hash;
  const explorerUrl = `https://explorer.analos.io/tx/${hash}`;
  
  let display: string;
  if (showFull || !mobile) {
    display = hash;
  } else {
    // Mobile: show shorter version
    display = shortenTxHash(hash, 6, 6);
  }
  
  return {
    display,
    copyText,
    explorerUrl
  };
}

/**
 * Copy text to clipboard with user feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      console.error('Failed to copy to clipboard:', fallbackError);
      return false;
    }
  }
}

/**
 * Show a temporary success message
 */
export function showCopySuccess(element: HTMLElement): void {
  const originalText = element.textContent;
  element.textContent = 'Copied!';
  element.classList.add('text-green-400');
  
  setTimeout(() => {
    element.textContent = originalText;
    element.classList.remove('text-green-400');
  }, 1500);
}

/**
 * Detect if user is on mobile
 */
export function isMobile(): boolean {
  return window.innerWidth <= 768;
}

/**
 * Format error messages for mobile display
 */
export function formatErrorForMobile(error: string): string {
  // Remove long URLs and replace with shortened versions
  const urlRegex = /https:\/\/[^\s]+/g;
  const shortened = error.replace(urlRegex, (url) => {
    if (url.includes('explorer.analos.io')) {
      const hash = url.split('/tx/')[1];
      if (hash) {
        return `explorer.analos.io/...${hash.slice(-8)}`;
      }
    }
    return url.length > 30 ? url.substring(0, 30) + '...' : url;
  });
  
  // Limit total length for mobile
  if (isMobile() && shortened.length > 150) {
    return shortened.substring(0, 150) + '...';
  }
  
  return shortened;
}

/**
 * Format success messages for mobile display
 */
export function formatSuccessForMobile(message: string): string {
  // Limit length for mobile
  if (isMobile() && message.length > 120) {
    return message.substring(0, 120) + '...';
  }
  
  return message;
}

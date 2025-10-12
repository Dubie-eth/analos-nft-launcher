/**
 * Utility function to completely clear all 2FA-related storage
 * This should only be used for debugging or complete reset scenarios
 */

export function clearAll2FAStorage() {
  // Clear localStorage
  localStorage.removeItem('admin-2fa-setup');
  localStorage.removeItem('admin-2fa-secret-shown');
  
  // Clear sessionStorage
  sessionStorage.removeItem('admin-2fa-setup');
  sessionStorage.removeItem('admin-2fa-secret-shown');
  sessionStorage.removeItem('admin-authenticated');
  
  console.log('🔐 All 2FA storage cleared');
}

/**
 * Check if 2FA is properly set up
 */
export function is2FASetupComplete(): boolean {
  const localSetup = localStorage.getItem('admin-2fa-setup') === 'true';
  const sessionSetup = sessionStorage.getItem('admin-2fa-setup') === 'true';
  
  return localSetup || sessionSetup;
}

/**
 * Check if 2FA secret has been shown
 */
export function has2FASecretBeenShown(): boolean {
  const localShown = localStorage.getItem('admin-2fa-secret-shown') === 'true';
  const sessionShown = sessionStorage.getItem('admin-2fa-secret-shown') === 'true';
  
  return localShown || sessionShown;
}

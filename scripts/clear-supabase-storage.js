// Clear Supabase storage to reduce multiple instance warnings
// Run this in your browser console

// Clear all Supabase-related localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('analos')) {
    localStorage.removeItem(key);
    console.log('Cleared:', key);
  }
});

// Clear sessionStorage
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('analos')) {
    sessionStorage.removeItem(key);
    console.log('Cleared session:', key);
  }
});

console.log('✅ Supabase storage cleared! Refresh the page to see if warnings are reduced.');

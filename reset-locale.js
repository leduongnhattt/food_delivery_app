// Script to reset locale to English
// Run this in browser console to reset locale

console.log('Current locale in localStorage:', localStorage.getItem('locale'));

// Reset to English
localStorage.removeItem('locale');

console.log('Locale reset to default (English)');
console.log('New locale in localStorage:', localStorage.getItem('locale'));

// Reload page to apply changes
window.location.reload();

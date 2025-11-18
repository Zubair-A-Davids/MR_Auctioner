// Clear localStorage utility
// Run this in your browser's console (F12) to clear all localStorage data

console.log('Current localStorage data:');
console.log('========================');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`${key}:`, localStorage.getItem(key));
}

console.log('\nClearing all MR Auctioner localStorage data...');

// Remove all MR Auctioner keys
const keysToRemove = [
  'mr_users',
  'mr_currentUser',
  'mr_listings',
  'mr_loginAttempts',
  'mr_itemsSold',
  'mr_modHistory',
  'mr_api_token'
];

keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`✅ Removed: ${key}`);
  }
});

console.log('\n✅ localStorage cleared! Refresh the page to use SQL database only.');

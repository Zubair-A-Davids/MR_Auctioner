// API Configuration
// Toggle this flag to switch between localStorage (false) and API backend (true)
const API_CONFIG = {
  // Set to true when you have the API server running
  USE_API: true,
  
  // API base URL - update this to your actual API endpoint
  // Local development: http://localhost:8787
  // Production (via tunnel): https://api.mr-auctioner.co.za
  API_BASE: 'https://heather-transpenetrable-bettina.ngrok-free.dev',
  
  // CORS origins for the API server (.env file)
  // Update server/.env CORS_ORIGINS to: https://mr-auctioner.co.za,https://zubair-a-davids.github.io
};

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
}

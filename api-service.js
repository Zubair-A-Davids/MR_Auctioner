// API Service Layer
// Provides a unified interface for auth and items operations
// Switches between localStorage and API based on API_CONFIG.USE_API

const ApiService = {
  // Internal storage for JWT token
  _token: null,

  // Get stored token
  getToken() {
    if (!this._token) {
      this._token = localStorage.getItem('mr_api_token');
    }
    return this._token;
  },

  // Store token
  setToken(token) {
    this._token = token;
    if (token) {
      localStorage.setItem('mr_api_token', token);
    } else {
      localStorage.removeItem('mr_api_token');
    }
  },

  // Make authenticated API request
  async apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',  // Skip ngrok warning page
      ...options.headers
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      
      // Handle banned users - force logout
      if (response.status === 403 && error.error && error.error.includes('banned')) {
        console.warn('User is banned, forcing logout');
        this.logout();
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
      
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  // Auth methods
  async register(username, password, displayName) {
    if (!API_CONFIG.USE_API) {
      return register(username, password, displayName);
    }

    try {
      console.log('Registering user:', { email: username, displayName });
      const data = await this.apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: username, password, displayName })
      });
      console.log('Registration successful, received token');
      // Automatically set the token after registration
      if (data.token) {
        this.setToken(data.token);
        localStorage.setItem(LS_CURRENT, username);
      }
      return { ok: true, token: data.token };
    } catch (e) {
      console.error('Registration error:', e);
      return { ok: false, msg: e.message };
    }
  },

  async login(username, password) {
    if (!API_CONFIG.USE_API) {
      return login(username, password);
    }

    try {
      const data = await this.apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: username, password })
      });
      this.setToken(data.token);
      // Store username for compatibility with localStorage flow
      localStorage.setItem(LS_CURRENT, username);
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e.message };
    }
  },

  logout() {
    if (!API_CONFIG.USE_API) {
      return logout();
    }
    this.setToken(null);
    localStorage.removeItem(LS_CURRENT);
  },

  async getMe() {
    if (!API_CONFIG.USE_API) {
      return null;
    }

    try {
      const data = await this.apiRequest('/auth/me');
      return data;
    } catch (e) {
      console.error('Failed to get user info:', e);
      return null;
    }
  },

  async getUserProfile(userId) {
    if (!API_CONFIG.USE_API) {
      return getUser(userId);
    }

    try {
      // Check if userId is a UUID (contains hyphens) or email
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      const endpoint = isUUID 
        ? `/auth/users/${userId}/profile`
        : `/auth/users/by-email/${encodeURIComponent(userId)}/profile`;
      
      const data = await this.apiRequest(endpoint);
      return data;
    } catch (e) {
      console.error('Failed to get user profile:', e);
      return null;
    }
  },

  async updateProfile(displayName, discord, bio, avatar) {
    if (!API_CONFIG.USE_API) {
      // Fallback to localStorage
      const u = currentUser();
      if (!u) return { ok: false, msg: 'Not signed in' };
      const users = loadJSON(LS_USERS, {});
      if (!users[u]) {
        users[u] = { password: '', displayName: displayName || u, bio: bio || '', avatar: avatar || '', discord: discord || '', isAdmin: false, isMod: false, bannedUntil: null, bannedReason: '' };
      } else {
        users[u].displayName = displayName || users[u].displayName || u;
        users[u].discord = discord || '';
        users[u].bio = bio || '';
        users[u].avatar = avatar || '';
      }
      saveJSON(LS_USERS, users);
      return { ok: true };
    }

    try {
      console.log('Sending profile update:', { displayName, discord, bio, avatarLength: avatar ? avatar.length : 0 });
      const response = await this.apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ displayName, discord, bio, avatar })
      });
      console.log('Profile update response:', response);
      return { ok: true };
    } catch (e) {
      console.error('Profile update error:', e);
      return { ok: false, msg: e.message };
    }
  },

  async updatePassword(currentPassword, newPassword) {
    if (!API_CONFIG.USE_API) {
      // Fallback to localStorage
      const u = currentUser();
      if (!u) return { ok: false, msg: 'Not signed in' };
      const users = loadJSON(LS_USERS, {});
      const me = users[u];
      if (!me) return { ok: false, msg: 'User not found' };
      if (me.password !== currentPassword) return { ok: false, msg: 'Current password incorrect' };
      if (newPassword.length < 4) return { ok: false, msg: 'New password too short' };
      me.password = newPassword;
      saveJSON(LS_USERS, users);
      return { ok: true };
    }

    try {
      await this.apiRequest('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e.message };
    }
  },

  async getAllUsers() {
    if (!API_CONFIG.USE_API) {
      return null;
    }

    try {
      console.log('Fetching all users from API...');
      const users = await this.apiRequest('/auth/users');
      console.log('getAllUsers response:', users);
      return users;
    } catch (e) {
      console.error('Failed to get users:', e);
      return null;
    }
  },

  async deleteUser(username) {
    if (!API_CONFIG.USE_API) {
      return { ok: false, msg: 'API mode required' };
    }

    try {
      await this.apiRequest(`/auth/users/${encodeURIComponent(username)}`, {
        method: 'DELETE'
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e.message };
    }
  },

  async updateUser(username, updates) {
    if (!API_CONFIG.USE_API) {
      return { ok: false, msg: 'API mode required' };
    }

    try {
      await this.apiRequest(`/auth/users/${encodeURIComponent(username)}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e.message };
    }
  },

  // Items methods
  async getListings(filters = {}) {
    if (!API_CONFIG.USE_API) {
      return getListings();
    }

    try {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.ownerId) params.set('ownerId', filters.ownerId);
      
      const query = params.toString();
      const data = await this.apiRequest(`/items${query ? '?' + query : ''}`);
      
      // Transform API response to match localStorage format
      return data.map(item => ({
        id: item.id,
        title: item.title,
        desc: item.description,
        price: item.price,
        itemTypeId: item.item_type_id || null,
        elite: !!item.elite,
        element: item.element || null,
        seller: item.owner_id,
        sellerName: item.owner_name,
        createdAt: item.created_at,
        image: item.image_url
      }));
    } catch (e) {
      console.error('Failed to get listings:', e);
      return [];
    }
  },

  async createListing(title, desc, price, itemTypeId = null, elite = false, element = null) {
    if (!API_CONFIG.USE_API) {
      return createListing(title, desc, price, itemTypeId, elite, element);
    }

    if (!currentUser()) {
      return { ok: false, msg: 'Must be logged in to create listings' };
    }

    try {
      const data = await this.apiRequest('/items', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: desc,
          price: Number(price) || 0,
          itemTypeId: itemTypeId,
          elite: !!elite,
          element: element || null,
          imageUrl: null // Will be updated separately if needed
        })
      });

      return { ok: true, listing: { id: data.id, title, desc, price, itemTypeId, elite, element, seller: currentUser(), sellerName: currentDisplayName(), createdAt: new Date().toISOString(), image: null } };
    } catch (e) {
      return { ok: false, msg: e.message };
    }
  },

  async updateListing(id, updates) {
    if (!API_CONFIG.USE_API) {
      return updateListing(id, updates);
    }

    try {
      await this.apiRequest(`/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: updates.title,
          description: updates.desc,
          price: updates.price,
          itemTypeId: updates.itemTypeId,
          elite: updates.elite,
          element: updates.element,
          imageUrl: updates.image
        })
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e.message };
    }
  },

  async deleteListing(id) {
    if (!API_CONFIG.USE_API) {
      return deleteListing(id);
    }

    try {
      await this.apiRequest(`/items/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      console.error('Failed to delete listing:', e);
      return false;
    }
  },

  // Get site statistics
  async getStats() {
    if (!API_CONFIG.USE_API) {
      // Fallback to localStorage
      const users = loadJSON(LS_USERS, {});
      const listings = loadJSON(LS_LISTINGS, []);
      const itemsSold = loadJSON(LS_ITEMS_SOLD, {});
      
      let soldCount = 0;
      Object.values(itemsSold).forEach(userItems => {
        soldCount += userItems.length;
      });
      
      return {
        totalUsers: Object.keys(users).length,
        activeListings: listings.length,
        itemsSold: soldCount
      };
    }

    try {
      const data = await this.apiRequest('/auth/stats');
      return data;
    } catch (e) {
      console.error('Failed to get stats:', e);
      return { totalUsers: 0, activeListings: 0, itemsSold: 0 };
    }
  },

  // Check API connection status
  async checkConnection() {
    if (!API_CONFIG.USE_API) {
      return { connected: true, mode: 'localStorage' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // Try /health first, fallback to /healthz if 404
      let response = await fetch(`${API_CONFIG.API_BASE}/health`, {
        signal: controller.signal,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if(response.status === 404){
        // Fallback attempt
        response = await fetch(`${API_CONFIG.API_BASE}/healthz`, {
          signal: controller.signal,
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
      }
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return { connected: true, mode: 'API' };
      }
      return { connected: false, mode: 'API', error: 'API returned error' };
    } catch (e) {
      return { connected: false, mode: 'API', error: e.message };
    }
  },

  // Get items sold history
  async getItemsSoldHistory(userId = null) {
    if (!API_CONFIG.USE_API) {
      // Fallback to localStorage
      const history = loadJSON(LS_ITEMS_SOLD, {});
      const targetUser = userId || currentUser();
      return history[targetUser] || [];
    }

    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      
      const query = params.toString();
      const data = await this.apiRequest(`/items/sold/history${query ? '?' + query : ''}`);
      
      // Transform to match localStorage format
      return data.map(item => ({
        id: item.original_item_id,
        title: item.title,
        desc: item.description || '',
        price: item.price,
        itemTypeId: item.item_type_id,
        elite: !!item.elite,
        element: item.element || null,
        createdAt: item.created_at,
        deletedAt: item.deleted_at
      }));
    } catch (e) {
      console.error('Failed to get items sold history:', e);
      return [];
    }
  }
};

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.ApiService = ApiService;
}

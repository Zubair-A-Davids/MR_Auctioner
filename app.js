// MR Auctioner — client-only demo using localStorage
const LS_USERS = 'mr_users';
const LS_CURRENT = 'mr_currentUser';
const LS_LISTINGS = 'mr_listings';
const LS_LOGIN_ATTEMPTS = 'mr_loginAttempts';
const LS_ITEMS_SOLD = 'mr_itemsSold';
const LS_MOD_HISTORY = 'mr_modHistory';

// Filter state
let currentFilters = { name: '', priceSort: 'none', sort: 'newest', seller: '', elite: 'all', element: 'all' };
let currentRenderedListingIds = [];
let currentDetailIndex = -1;
// Cache of last fetched listings to avoid refetching for detail modal
let cachedListings = [];
// Virtual scrolling state
const VIRTUAL_SCROLL_BUFFER = 20;
const VIRTUAL_SCROLL_THRESHOLD = 500;
let allListings = [];
let renderedStartIndex = 0;
let renderedEndIndex = 0;
let virtualScrollContainer = null;
// Admin/Mod panel state
const adminView = { mode: 'admin', roleFilter: 'all', search: '', page: 1, pageSize: 50 };
const itemsSoldView = { page: 1, pageSize: 20 };
let banTargetUser = null;
let renameTargetUser = null;

// API connection status
let apiStatusCheckInterval = null;

// Utilities
const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));
const hideEl = el => { if(!el) return; el.classList.add('hidden'); el.classList.remove('show'); el.style.display = ''; };
const showFlex = el => { if(!el) return; el.style.display = 'flex'; el.classList.remove('hidden'); el.classList.add('show'); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);

// Debounce helper for performance optimization
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
// Open enlarged listing detail modal (repaired)
async function openListingDetail(id){
  try {
    // Use cached listings if available to avoid extra network round trip
    let listings = cachedListings;
    if(!listings || listings.length === 0){
      if(API_CONFIG.USE_API){
        listings = await ApiService.getListings();
        cachedListings = listings;
      } else {
        listings = getListings();
        cachedListings = listings;
      }
    }
    const l = listings.find(x => String(x.id) === String(id));
    if(!l){ return showMessage('Listing not found','error'); }

    const itemType = l.itemTypeId ? getItemType(l.itemTypeId) : null;
    let sellerDisplay = l.sellerName || l.seller || 'unknown';
    if(!API_CONFIG.USE_API){
      const sellerProfile = getUser(l.seller) || {};
      sellerDisplay = sellerProfile.displayName || sellerDisplay;
    }

    const titleEl = qs('#listing-detail-title');
    const metaEl = qs('#listing-detail-meta');
    const infoEl = qs('#listing-detail-info');
    const notesEl = qs('#listing-detail-notes');
    const imgWrap = qs('#listing-detail-image');
    const modalInner = qs('#listing-detail-modal .modal-inner');

    // Remove any existing badge elements from modal
    const existingBadges = modalInner.querySelectorAll('.elite-badge-detail, .element-badge-detail');
    existingBadges.forEach(b => b.remove());

    // Add badges to modal inner container (right edge)
    if(l.elite){
      const eliteBadge = document.createElement('img');
      eliteBadge.className = 'elite-badge-detail';
      eliteBadge.src = 'Items/Elite/Elite.png';
      eliteBadge.alt = 'Elite';
      eliteBadge.title = 'Elite Item';
      eliteBadge.loading = 'lazy';
      eliteBadge.decoding = 'async';
      modalInner.appendChild(eliteBadge);
    }
    if(l.element){
      const elementBadge = document.createElement('img');
      elementBadge.className = 'element-badge-detail';
      elementBadge.src = `Items/Enchants/${escapeHtml(l.element)}.png`;
      elementBadge.alt = escapeHtml(l.element);
      elementBadge.title = `${escapeHtml(l.element)} Element`;
      elementBadge.loading = 'lazy';
      elementBadge.decoding = 'async';
      modalInner.appendChild(elementBadge);
    }

    // Title without icons (badges are now on right edge)
    titleEl.innerHTML = escapeHtml(l.title);

    // Meta
    metaEl.innerHTML = `<strong>Seller:</strong> <span style="color:var(--accent)">${escapeHtml(sellerDisplay)}</span> · <strong>Price:</strong> ${Number(l.price)||0} gold`;

    // Info
    if(itemType){
      infoEl.innerHTML = `<strong>Info:</strong> ${escapeHtml(itemType.description)}`;
    } else { infoEl.innerHTML = ''; }

    // Notes
    if(l.desc){
      notesEl.innerHTML = `<strong>Seller's Notes:</strong><div style="margin-top:.25rem">${colorizeStats(escapeHtml(l.desc))}</div>`;
    } else { notesEl.innerHTML = ''; }

    // Image
    const listedText = daysAgoText(l.createdAt);
    if(l.image){
      imgWrap.classList.remove('no-image');
      imgWrap.classList.add('shimmer');
      imgWrap.innerHTML = `
        <img id="listing-detail-img" data-src="${l.image}" alt="${escapeHtml(l.title)}" style="max-width:100%;max-height:400px;object-fit:contain;border-radius:6px" loading="lazy" decoding="async" fetchpriority="high"/>
        <div class="listed-overlay">Listed: ${listedText}</div>
      `;
      requestAnimationFrame(() => {
        const img = qs('#listing-detail-img');
        if(img && img.getAttribute('data-src')){
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          img.onclick = () => {
            const modal = qs('#image-modal');
            const modalImg = qs('#modal-image');
            modalImg.src = img.src;
            modal.classList.remove('hidden');
            modal.classList.add('show');
          };
          img.addEventListener('load', ()=>{ imgWrap.classList.remove('shimmer'); });
        }
      });
    } else {
      imgWrap.classList.add('no-image');
      imgWrap.innerHTML = `<span>No User Screenshot</span><div class="listed-overlay">Listed: ${listedText}</div>`;
    }

    // Show modal
    requestAnimationFrame(()=> showFlex(qs('#listing-detail-modal')));
    qs('#listing-detail-close').onclick = () => hideEl(qs('#listing-detail-modal'));
    currentDetailIndex = currentRenderedListingIds.findIndex(x => String(x) === String(l.id));
  } catch(err){
    console.error('openListingDetail error', err);
    showMessage('Failed to open listing detail','error');
  }
}

function timeAgo(iso){
  try{
    const then = new Date(iso);
    const diff = Date.now() - then.getTime();
    const sec = Math.floor(diff/1000);
    if(sec < 10) return 'just now';
    if(sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec/60);
    if(min < 60) return `${min}m ago`;
    const hr = Math.floor(min/60);
    if(hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr/24);
    return `${days}d ago`;
  }catch(e){ return new Date(iso).toLocaleString(); }
}

function daysAgoText(iso){
  try{
    const then = new Date(iso);
    const diff = Date.now() - then.getTime();
    const days = Math.floor(diff / (1000*60*60*24));
    if(days <= 0) return 'Today';
    if(days === 1) return '1 day ago';
    return days + ' days ago';
  }catch(e){ return 'Unknown'; }
}

// Storage helpers
function loadJSON(key, fallback){ try{ const v = localStorage.getItem(key); return v? JSON.parse(v) : fallback;}catch(e){return fallback} }
function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

// Auth
function register(username, password, displayName){
  const users = loadJSON(LS_USERS, {});
  if(!username || !password) return {ok:false,msg:'Username and password required'};
  if(users[username]) return {ok:false,msg:'Username taken'};
  users[username] = {password, displayName: displayName || username, bio: '', avatar: '', discord:'', isAdmin:false, isMod:false, bannedUntil:null, bannedReason:''};
  saveJSON(LS_USERS, users);
  return {ok:true};
}

function getUser(username){
  const users = loadJSON(LS_USERS, {});
  return users[username] || null;
}

function saveUser(username, data){
  const users = loadJSON(LS_USERS, {});
  users[username] = {...users[username], ...data};
  saveJSON(LS_USERS, users);
}

function login(username, password){
  const attempts = loadJSON(LS_LOGIN_ATTEMPTS, {});
  const userAttempts = attempts[username] || {count: 0, lockedUntil: null};
  const users = loadJSON(LS_USERS, {});
  const urec = users[username];

  // Ban enforcement (takes precedence over lockouts)
  if(urec && urec.bannedUntil && Date.now() < urec.bannedUntil){
    const remainingMin = Math.ceil((urec.bannedUntil - Date.now()) / 60000);
    const reason = urec.bannedReason ? ` Reason: ${urec.bannedReason}` : '';
    return {ok:false, msg:`Account banned. ${remainingMin} minutes remaining.${reason}`};
  }
  // Clear expired ban
  if(urec && urec.bannedUntil && Date.now() >= urec.bannedUntil){
    urec.bannedUntil = null; urec.bannedReason = '';
    saveJSON(LS_USERS, users);
  }
  
  // Check if account is locked
  if(userAttempts.lockedUntil && Date.now() < userAttempts.lockedUntil){
    const remainingMin = Math.ceil((userAttempts.lockedUntil - Date.now()) / 60000);
    return {ok:false, msg:`Account locked. Try again in ${remainingMin} minutes`};
  }
  
  // Reset if lockout period has passed
  if(userAttempts.lockedUntil && Date.now() >= userAttempts.lockedUntil){
    userAttempts.count = 0;
    userAttempts.lockedUntil = null;
  }
  
  const u = users[username];
  if(!u || u.password !== password){
    // Failed login - increment attempts
    userAttempts.count++;
    if(userAttempts.count >= 5){
      // Lock account for 1 hour
      userAttempts.lockedUntil = Date.now() + (60 * 60 * 1000);
      attempts[username] = userAttempts;
      saveJSON(LS_LOGIN_ATTEMPTS, attempts);
      return {ok:false, msg:'Too many failed attempts. Account locked for 1 hour'};
    }
    attempts[username] = userAttempts;
    saveJSON(LS_LOGIN_ATTEMPTS, attempts);
    const remaining = 5 - userAttempts.count;
    return {ok:false, msg:`Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`};
  }
  
  // Success - reset attempts
  attempts[username] = {count: 0, lockedUntil: null};
  saveJSON(LS_LOGIN_ATTEMPTS, attempts);
  localStorage.setItem(LS_CURRENT, username);
  return {ok:true};
}

function logout(){ localStorage.removeItem(LS_CURRENT); }
function currentUser(){ return localStorage.getItem(LS_CURRENT); }
function currentDisplayName(){ const u = currentUser(); if(!u) return null; const users = loadJSON(LS_USERS, {}); return users[u]?.displayName || u; }

// Listings
async function createListing(title, desc, price, itemTypeId=null, elite=false, element=null){
  if (API_CONFIG.USE_API) {
    return await ApiService.createListing(title, desc, price, itemTypeId, elite, element);
  }
  if(!title) return {ok:false,msg:'Title required'};
  if(!currentUser()) return {ok:false,msg:'Must be logged in to create listings'};
  const listings = loadJSON(LS_LISTINGS, []);
  const l = {id:uid(), title, desc, price: Number(price)||0, itemTypeId, elite: !!elite, element: element || null, seller: currentUser(), sellerName: currentDisplayName(), createdAt: new Date().toISOString(), image:null};
  listings.unshift(l);
  saveJSON(LS_LISTINGS, listings);
  // Record to items sold history
  recordItemSold(l);
  return {ok:true, listing:l};
}

function recordItemSold(listing){
  const history = loadJSON(LS_ITEMS_SOLD, {});
  const seller = listing.seller;
  if(!history[seller]) history[seller] = [];
  history[seller].unshift({
    id: listing.id,
    title: listing.title,
    desc: listing.desc || '',
    price: listing.price,
    createdAt: listing.createdAt,
    deletedAt: null
  });
  saveJSON(LS_ITEMS_SOLD, history);
}

function recordModAction(action, targetUser, moderator, reason=''){
  const history = loadJSON(LS_MOD_HISTORY, []);
  history.unshift({
    id: uid(),
    action,
    targetUser,
    moderator,
    reason,
    timestamp: new Date().toISOString()
  });
  saveJSON(LS_MOD_HISTORY, history);
}

async function getListings(){ 
  if (API_CONFIG.USE_API) {
    return await ApiService.getListings();
  }
  return loadJSON(LS_LISTINGS, []); 
}

// Search and filter functions
let isRendering = false;
let sellerCache = new Map(); // Cache for seller lookups

async function applyFilters(){
  // Update filter values
  currentFilters.name = qs('#search-name').value.trim().toLowerCase();
  currentFilters.priceSort = qs('#search-price').value;
  currentFilters.sort = qs('#search-sort').value;
  currentFilters.elite = qs('#search-elite').value;
  currentFilters.element = qs('#search-element').value;
  
  // Apply filters immediately
  updateURL();
  await renderListings();
  updateSellerFilterChip();
}

async function getFilteredListings(){
  let listings = await getListings();
  
  // Early return if no listings
  if(!listings || listings.length === 0) return [];
  
  // Build seller cache once if needed for name filtering
  if(currentFilters.name && !API_CONFIG.USE_API){
    sellerCache.clear();
    const users = loadJSON(LS_USERS, {});
    Object.keys(users).forEach(username => {
      const displayName = (users[username].displayName || username).toLowerCase();
      sellerCache.set(username, displayName);
    });
  }
  
  // Filter by seller first (most selective)
  if(currentFilters.seller){
    if(API_CONFIG.USE_API) {
      const sellerId = String(currentFilters.seller).trim();
      listings = listings.filter(l => String(l.seller).trim() === sellerId);
    } else {
      const wanted = currentFilters.seller.toLowerCase();
      listings = listings.filter(l => {
        const cachedName = sellerCache.get(l.seller) || '';
        return cachedName === wanted || l.seller.toLowerCase() === wanted;
      });
    }
    if(listings.length === 0) return [];
  }
  
  // Filter by Elite status (fast boolean check)
  if(currentFilters.elite === 'elite'){
    listings = listings.filter(l => l.elite === true);
    if(listings.length === 0) return [];
  } else if(currentFilters.elite === 'non-elite'){
    listings = listings.filter(l => !l.elite);
    if(listings.length === 0) return [];
  }
  
  // Filter by Element (fast string comparison)
  if(currentFilters.element && currentFilters.element !== 'all'){
    if(currentFilters.element === 'none'){
      listings = listings.filter(l => !l.element || l.element === '');
    } else {
      const targetElement = currentFilters.element.toLowerCase();
      listings = listings.filter(l => l.element && l.element.toLowerCase() === targetElement);
    }
    if(listings.length === 0) return [];
  }
  
  // Filter by name (searches both item title and seller name) - most expensive, do last
  if(currentFilters.name){
    const searchTerm = currentFilters.name;
    listings = listings.filter(l => {
      // Check title first (most common match)
      if(l.title.toLowerCase().includes(searchTerm)) return true;
      
      // Check seller name
      if(API_CONFIG.USE_API){
        const sellerName = (l.sellerName || l.seller || '').toLowerCase();
        return sellerName.includes(searchTerm);
      } else {
        const cachedName = sellerCache.get(l.seller) || '';
        return cachedName.includes(searchTerm);
      }
    });
    if(listings.length === 0) return [];
  }
  
  // Optimize sorting - combine into single pass when possible
  const needsPriceSort = currentFilters.priceSort && currentFilters.priceSort !== 'none';
  const needsDateSort = currentFilters.sort && currentFilters.sort !== 'newest';
  
  if(needsPriceSort){
    // Price sort takes priority
    const ascending = currentFilters.priceSort === 'low-high';
    listings.sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      return ascending ? priceA - priceB : priceB - priceA;
    });
  } else if(needsDateSort){
    // Date sort (oldest first)
    listings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else {
    // Default: newest first
    listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  return listings;
}

function resetFilters(){
  qs('#search-name').value = '';
  qs('#search-price').value = 'none';
  qs('#search-sort').value = 'newest';
  qs('#search-elite').value = 'all';
  qs('#search-element').value = 'all';
  currentFilters = { name: '', priceSort: 'none', sort: 'newest', seller: '', sellerLabel: '', elite: 'all', element: 'all' };
  updateURL();
  renderListings();
  updateSellerFilterChip();
}

// UI rendering
async function renderUserState(){
  const u = currentUser();
  const greeting = qs('#user-greeting');
  const btnLogout = qs('#btn-logout');
  const btnShowLogin = qs('#btn-show-login');
  const btnShowRegister = qs('#btn-show-register');
  const btnHamburger = qs('#btn-hamburger');
  const hamburgerMenu = qs('#hamburger-menu');
  const btnAdmin = qs('#btn-admin-panel');
  const btnMod = qs('#btn-mod-panel');
  const btnModHistory = qs('#btn-mod-history');
  const btnItemsSold = qs('#btn-items-sold');
  const navbarAvatarWrap = qs('#navbar-avatar-wrap');
  const navbarAvatar = qs('#navbar-avatar');
  
  // Always show stats section
  const statsSection = qs('#site-stats');
  if(statsSection) {
    statsSection.classList.remove('hidden');
    // Fire stats fetch without blocking other user state/network requests
    renderSiteStats();
  }
  
  // Update API status when rendering user state
  if (typeof updateApiStatus === 'function') {
    updateApiStatus();
  }
  
  if(u){
    greeting.textContent = `Signed in: ${currentDisplayName()}`;
    btnLogout.classList.remove('hidden');
    btnShowLogin.classList.add('hidden');
    btnShowRegister.classList.add('hidden');
    // Fetch user data from API if using API, otherwise from localStorage
    let me = {};
    if(API_CONFIG.USE_API){
      const apiUser = await ApiService.getMe();
      if(apiUser){
        me = {
          avatar: apiUser.avatar,
          isAdmin: apiUser.isAdmin,
          isMod: apiUser.isMod
        };
      }
    } else {
      me = getUser(u) || {};
    }
    // Show navbar avatar if user has one
    if(me.avatar){
      navbarAvatar.src = me.avatar;
      navbarAvatarWrap.classList.remove('hidden');
    } else {
      navbarAvatarWrap.classList.add('hidden');
    }
    // Role-based menu entries
    if(btnAdmin) me.isAdmin ? btnAdmin.classList.remove('hidden') : btnAdmin.classList.add('hidden');
    if(btnMod) (me.isAdmin || me.isMod) ? btnMod.classList.remove('hidden') : btnMod.classList.add('hidden');
    if(btnModHistory) (me.isAdmin || me.isMod) ? btnModHistory.classList.remove('hidden') : btnModHistory.classList.add('hidden');
    if(btnItemsSold) btnItemsSold.classList.remove('hidden');
    // only show hamburger/menu when signed in; creation area is shown via SELL action
    if(btnHamburger) btnHamburger.classList.remove('hidden');
    if(hamburgerMenu) hamburgerMenu.classList.add('hidden');
    qs('#create-listing-area').classList.add('hidden');
    qs('#landing').classList.add('hidden');
    qs('#listings-section').classList.remove('hidden');
  } else {
    greeting.textContent = '';
    btnLogout.classList.add('hidden');
    btnShowLogin.classList.remove('hidden');
    btnShowRegister.classList.remove('hidden');
    if(navbarAvatarWrap) navbarAvatarWrap.classList.add('hidden');
    if(btnHamburger) btnHamburger.classList.add('hidden');
    if(hamburgerMenu) hamburgerMenu.classList.add('hidden');
    if(btnAdmin) btnAdmin.classList.add('hidden');
    if(btnMod) btnMod.classList.add('hidden');
    if(btnModHistory) btnModHistory.classList.add('hidden');
    if(btnItemsSold) btnItemsSold.classList.add('hidden');
    qs('#create-listing-area').classList.add('hidden');
    qs('#landing').classList.remove('hidden');
    qs('#listings-section').classList.remove('hidden');
  }
}

async function renderSiteStats() {
  try {
    const stats = await ApiService.getStats();
    
    const usersEl = qs('#stat-users');
    const listingsEl = qs('#stat-listings');
    const soldEl = qs('#stat-sold');
    
    if(usersEl) usersEl.textContent = stats.totalUsers || 0;
    if(listingsEl) listingsEl.textContent = stats.activeListings || 0;
    if(soldEl) soldEl.textContent = stats.itemsSold || 0;
  } catch(e) {
    console.error('Failed to render stats:', e);
  }
}

async function renderListings(){
  // Prevent concurrent rendering
  if(isRendering) {
    console.warn('⚠️ Render already in progress, skipping...');
    return;
  }
  
  isRendering = true;
  
  // Show loading indicator
  const loader = qs('#listings-loader');
  const container = qs('#listings');
  if(loader) loader.classList.remove('hidden');
  if(container) container.style.opacity = '0.5'; // Fade out old content
  
  try {
    const listings = await getFilteredListings();
    cachedListings = listings; // update cache
    allListings = listings; // store for virtual scrolling
    currentRenderedListingIds = [];
    
    // Clear container
    if(container) container.innerHTML = '';
    
    // Hide loading indicator
    if(loader) loader.classList.add('hidden');
    if(container) container.style.opacity = '1'; // Fade in new content
    
    if(listings.length === 0){ 
      container.innerHTML = '<p class="hint">No listings match your filters.</p>'; 
      return; 
    }
    
    // Enable virtual scrolling for large datasets
    if(listings.length > VIRTUAL_SCROLL_THRESHOLD) {
      virtualScrollContainer = container;
      setupVirtualScroll(container);
      renderVisibleListings();
    } else {
      virtualScrollContainer = null;
      renderAllListings(listings, container);
    }
  } catch(error) {
    console.error('Error rendering listings:', error);
    const loader = qs('#listings-loader');
    if(loader) loader.classList.add('hidden');
    const container = qs('#listings');
    if(container) container.innerHTML = '<p class="hint" style="color:var(--accent)">Failed to load listings. Please try again.</p>';
  } finally {
    isRendering = false;
  }
}

function setupVirtualScroll(container) {
  // Remove old scroll listener if exists
  container.removeEventListener('scroll', handleVirtualScroll);
  container.addEventListener('scroll', debounce(handleVirtualScroll, 50));
  renderedStartIndex = 0;
  renderedEndIndex = Math.min(VIRTUAL_SCROLL_BUFFER, allListings.length);
}

function handleVirtualScroll() {
  if(!virtualScrollContainer || allListings.length <= VIRTUAL_SCROLL_THRESHOLD) return;
  
  const container = virtualScrollContainer;
  const scrollTop = container.scrollTop;
  const containerHeight = container.clientHeight;
  const scrollHeight = container.scrollHeight;
  
  // Check if near bottom (within 1.5 screens)
  if(scrollTop + containerHeight * 2.5 >= scrollHeight && renderedEndIndex < allListings.length) {
    renderedEndIndex = Math.min(renderedEndIndex + VIRTUAL_SCROLL_BUFFER, allListings.length);
    appendListingBatch(renderedEndIndex - VIRTUAL_SCROLL_BUFFER, renderedEndIndex);
  }
}

function renderVisibleListings() {
  const container = virtualScrollContainer;
  if(!container) return;
  container.innerHTML = '';
  appendListingBatch(0, renderedEndIndex);
}

async function appendListingBatch(start, end) {
  const container = virtualScrollContainer || qs('#listings');
  const batch = allListings.slice(start, end);
  
  const isAdmin = await isAdminUser();
  let currentUserId = null;
  
  if(currentUser() && API_CONFIG.USE_API) {
    const me = await ApiService.getMe();
    if(me) {
      currentUserId = String(me.id).trim();
    }
  }
  
  batch.forEach(l => {
    renderSingleListing(l, container, isAdmin, currentUserId);
  });
  
  // Attach click listeners to new batch
  attachListingClickListeners(container);
}

async function renderAllListings(listings, container) {
  currentRenderedListingIds = [];
  
  // Fetch user info once for all listings (performance optimization)
  const isAdmin = await isAdminUser();
  let currentUserId = null;
  
  if(currentUser() && API_CONFIG.USE_API) {
    const me = await ApiService.getMe();
    if(me) {
      currentUserId = String(me.id).trim();
    }
  }
  
  listings.forEach(l => {
    renderSingleListing(l, container, isAdmin, currentUserId);
  });
  
  // Attach click listeners to entire listing cards for detail modal (faster UX)
  attachListingClickListeners(container);
}

function renderSingleListing(l, container, isAdmin, currentUserId) {
  currentRenderedListingIds.push(String(l.id));
  const el = document.createElement('div'); el.className='listing card'; el.setAttribute('data-id', String(l.id));
  const fullDate = new Date(l.createdAt).toLocaleString();
  const itemType = l.itemTypeId ? getItemType(l.itemTypeId) : null;
  
  // Elite badge in top right corner
  if(l.elite){
    const eliteBadge = document.createElement('img');
    eliteBadge.className = 'elite-badge-corner';
    eliteBadge.src = 'Items/Elite/Elite.png';
    eliteBadge.alt = 'Elite';
    eliteBadge.title = 'Elite Item';
    eliteBadge.loading = 'lazy';
    eliteBadge.decoding = 'async';
    el.appendChild(eliteBadge);
  }
  // Element badge in top-right corner
  if(l.element){
    const elementBadge = document.createElement('img');
    elementBadge.className = 'element-badge-corner';
    elementBadge.src = `Items/Enchants/${escapeHtml(l.element)}.png`;
    elementBadge.alt = escapeHtml(l.element);
    elementBadge.title = `${escapeHtml(l.element)} Element`;
    elementBadge.loading = 'lazy';
    elementBadge.decoding = 'async';
    el.appendChild(elementBadge);
  }
  
  // Content area
  const contentDiv = document.createElement('div'); contentDiv.className='listing-content';
  const sellerProfile = getUser(l.seller) || {};
  const sellerDisplay = sellerProfile.displayName || l.sellerName || l.seller || 'unknown';
  
  // Title only (element icon moved to top-right badge)
  let titleHtml = `<div class=\"title-row\"><h3 class=\"listing-title\" data-id=\"${l.id}\">${escapeHtml(l.title)}</h3></div>`;
  
  let html = titleHtml + `<p class="hint seller-line"><span class="seller-label">Seller:</span> <a href="#" class="seller-link" data-user="${l.seller}" data-display="${escapeHtml(sellerDisplay)}">${escapeHtml(sellerDisplay)}</a></p>`;
  
  // Show item type description if available (Info comes first)
  if(itemType){
    html += `<p class="hint no-gap"><strong>Info:</strong></p><p class="hint no-gap">${escapeHtml(itemType.description)}</p>`;
  }
  
  // Show listing-specific description if any (Seller's Notes with content below, no gap)
  if(l.desc){
    html += `<p class="no-gap"><strong>Seller's Notes:</strong></p><p class="no-gap">${colorizeStats(escapeHtml(l.desc))}</p>`;
  }
  
  // Price row with item type image on far left, gold amount on far right
  html += `<div class="price-row">`;
  if(itemType && itemType.image){
    html += `<img class="item-type-image" src="${itemType.image}" alt="${escapeHtml(itemType.name)}" title="${escapeHtml(itemType.description)}" loading="lazy" decoding="async"/>`;
  }
  html += `<div class="price-group"><img src="Gold.png" alt="gold" class="gold-icon" decoding="async"/><strong class="gold-amount">${Number(l.price)||0}</strong></div></div>`;

  // Separator above image area
  html += `<div class="section-separator"></div>`;
  
  // User-uploaded image (centered below gold amount) or placeholder
  if(l.image){
    html += `<div class="image-container"><img class="user-uploaded-image" src="${l.image}" alt="${escapeHtml(l.title)}" loading="lazy" decoding="async"/></div>`;
  } else {
    html += `<div class="image-container no-image"><span>No User Screenshot</span></div>`;
  }
  
  contentDiv.innerHTML = html;
  el.appendChild(contentDiv);
  
  // Footer with time and controls
  const footerDiv = document.createElement('div'); footerDiv.className='listing-footer';
  const timeEl = document.createElement('p'); timeEl.className='listing-time'; timeEl.title=fullDate; timeEl.textContent=timeAgo(l.createdAt);
  footerDiv.appendChild(timeEl);
  
  // Determine ownership synchronously using pre-fetched data
  let isOwner = false;
  
  if(currentUser()) {
    if(API_CONFIG.USE_API) {
      // Compare with pre-fetched user ID
      if(currentUserId) {
        const sellerId = String(l.seller).trim();
        isOwner = currentUserId === sellerId;
      }
    } else {
      // In localStorage mode, compare emails
      isOwner = currentUser() === l.seller;
    }
  }
  
  // Add controls immediately if user is owner or admin
  if(isOwner || isAdmin){
    const controls = document.createElement('div'); controls.className='controls';
    const btnEdit = document.createElement('button'); btnEdit.textContent='Edit'; btnEdit.className='btn btn-small btn-accent'; btnEdit.type='button';
    const btnDel = document.createElement('button'); btnDel.textContent='Delete'; btnDel.className='btn btn-small btn-delete'; btnDel.type='button';
    btnEdit.addEventListener('click', async (e)=> { e.stopPropagation(); await startEditListing(l.id); });
    btnDel.addEventListener('click', async (e)=> {
      e.stopPropagation();
      const msg = `Delete this listing${isAdmin && !isOwner ? ' by '+(l.sellerName||l.seller) : ''}?`;
      showConfirmModal(msg, async ()=> { await deleteListing(l.id); await renderListings(); });
    });
    controls.appendChild(btnEdit); controls.appendChild(btnDel);
    footerDiv.appendChild(controls);
  }
    
  el.appendChild(footerDiv);
  container.appendChild(el);
}

function attachListingClickListeners(container) {
  // Attach click listeners to entire listing cards for detail modal (faster UX)
  container.querySelectorAll('.listing').forEach(card => {
    if(card.dataset.bound === '1') return; // prevent duplicate binding
    const id = card.getAttribute('data-id') || (card.querySelector('.listing-title') && card.querySelector('.listing-title').getAttribute('data-id'));
    if(!id) return;
    card.addEventListener('click', (e) => {
      if(e.target.classList && e.target.classList.contains('user-uploaded-image')) return;
      if(e.target.closest && (e.target.closest('.controls') || e.target.closest('button') || e.target.closest('a'))) return;
      openListingDetail(id);
    });
    card.dataset.bound = '1';
  });
}

async function deleteListing(id){
  if (API_CONFIG.USE_API) {
    const result = await ApiService.deleteListing(id);
    await renderSiteStats(); // Update stats after deletion
    return result;
  }
  const listings = getListings();
  const idx = listings.findIndex(x=>x.id===id);
  if(idx===-1) return false;
  const listing = listings[idx];
  // Mark as deleted in items sold history
  const history = loadJSON(LS_ITEMS_SOLD, {});
  const seller = listing.seller;
  if(history[seller]){
    const item = history[seller].find(i => i.id === id);
    if(item) item.deletedAt = new Date().toISOString();
    saveJSON(LS_ITEMS_SOLD, history);
  }
  listings.splice(idx,1);
  saveJSON(LS_LISTINGS, listings);
  await renderSiteStats(); // Update stats after deletion
  return true;
}

async function updateListing(id, data){
  if (API_CONFIG.USE_API) {
    return await ApiService.updateListing(id, data);
  }
  const listings = getListings();
  const idx = listings.findIndex(x=>x.id===id);
  if(idx===-1) return {ok:false,msg:'Listing not found'};
  const l = listings[idx];
  if(currentUser() !== l.seller) return {ok:false,msg:'Not allowed'};
  listings[idx] = {...l, ...data};
  saveJSON(LS_LISTINGS, listings);
  return {ok:true, listing:listings[idx]};
}

function readFileAsDataURL(file){
  return new Promise((res,rej)=>{
    if(!file) return res(null);
    const fr = new FileReader();
    fr.onload = ()=> res(fr.result);
    fr.onerror = ()=> rej(new Error('File read error'));
    fr.readAsDataURL(file);
  });
}

// Process image file: enforce max bytes by resizing + compressing client-side
async function processImageFile(file, maxBytes=200*1024, maxDim=1200){
  if(!file) return null;
  if(file.size <= maxBytes){
    return await readFileAsDataURL(file);
  }

  // load into image
  const dataUrl = await readFileAsDataURL(file);
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = ()=> res(i);
    i.onerror = ()=> rej(new Error('Image load error'));
    i.src = dataUrl;
  });

  // compute initial target dimensions while keeping aspect ratio
  let { width, height } = img;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // try progressively reducing quality and dimensions until under limit
  let quality = 0.92;
  let attempt = 0;
  let result = null;
  while(attempt < 8){
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // convert to jpeg for better compression; PNG transparency will be lost
    try{
      result = canvas.toDataURL('image/jpeg', quality);
    }catch(e){
      result = canvas.toDataURL();
    }
    const byteLen = Math.ceil((result.length - 'data:image/jpeg;base64,'.length) * 3/4);
    if(byteLen <= maxBytes) return result;

    // lower quality first, then dimensions
    quality = Math.max(0.35, quality - 0.15);
    if(quality <= 0.35){
      // shrink dimensions
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
      quality = 0.85; // reset to try again
    }
    attempt++;
  }

  // if still too large, return the last attempt (may still exceed limit)
  return result || dataUrl;
}

// Edit flow
async function startEditListing(id){
  // Use cached listings to avoid unnecessary API call
  let listings = cachedListings && cachedListings.length > 0 ? cachedListings : null;
  
  if(!listings){
    if(API_CONFIG.USE_API) {
      listings = await ApiService.getListings();
      cachedListings = listings;
    } else {
      listings = getListings();
      cachedListings = listings;
    }
  }
  
  const l = listings.find(x=>x.id===id); 
  if(!l) return showMessage('Listing not found', 'error');
  
  // Show form immediately for better UX
  qs('#create-listing-area').classList.remove('hidden');
  qs('#listings-section').classList.add('hidden');
  qs('#hamburger-menu').classList.add('hidden');
  
  // Populate fields asynchronously
  requestAnimationFrame(() => {
    qs('#item-title').value = l.title;
    
    // Load item type description if available
    const itemType = l.itemTypeId ? getItemType(l.itemTypeId) : null;
    if(itemType){
      qs('#item-type-desc').value = itemType.description;
      selectedItemTypeId = l.itemTypeId;
      qs('#selected-item-info').textContent = `Selected: ${itemType.name} (${itemType.type})`;
    } else {
      qs('#item-type-desc').value = '';
      qs('#selected-item-info').textContent = '';
    }
    
    qs('#item-desc').value = l.desc || '';
    qs('#item-price').value = Number(l.price)||0;
    
    // Load Elite and Element statuses
    qs('#item-elite').checked = !!l.elite;
    qs('#item-element').value = l.element || '';
    
    qs('#editing-id').value = l.id;
    if(l.image){ 
      qs('#item-image-preview').src = l.image; 
      qs('#item-image-preview').classList.remove('hidden'); 
    } else {
      qs('#item-image-preview').classList.add('hidden');
    }
    
    qs('#btn-create-listing').textContent = 'Save changes'; 
    qs('#btn-cancel-edit').classList.remove('hidden');
  });
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Parse and colorize stats in seller notes
function colorizeStats(text) {
  if(!text) return '';
  
  // Define stat colors matching the game's color scheme
  const statColors = {
    'melee': '#00cccc',      // Cyan (30 Melee color)
    'distance': '#ff66cc',   // Pink/Magenta (18 Distance color)
    'magic': '#ff9933',      // Orange (21 Magic color)
    'stamina': '#66ff66',    // Light Green (10 Stamina color)
    'spirit': '#66ccff',     // Light Blue (10 Spirit color)
    'defence': '#cccccc',    // Light Gray (14 Defence color)
    'defense': '#cccccc'     // Light Gray (alternate spelling)
  };
  
  // Replace pattern #<number><stat> with colored version
  // Match #followed by digits followed by stat word (case insensitive)
  const pattern = /#(\d+)(melee|distance|magic|stamina|spirit|defence|defense)/gi;
  
  return text.replace(pattern, (match, number, stat) => {
    const color = statColors[stat.toLowerCase()] || '#ffffff';
    return `<span style="color: ${color}; font-weight: 700;">${number}${stat}</span>`;
  });
}

// Item type selector
let selectedItemTypeId = null;

function renderItemTypeGallery(filterCategory='all'){
  const gallery = qs('#item-type-gallery');
  gallery.innerHTML = '';
  const itemsToShow = filterCategory === 'all' ? ITEM_TYPES : ITEM_TYPES.filter(i => i.type === filterCategory);
  itemsToShow.forEach(item => {
    const card = document.createElement('div'); card.className='item-type-card';
    card.innerHTML = `<img src="${item.image}" alt="${item.name}"/>
      <h4>${escapeHtml(item.name)}</h4>
      <p>${escapeHtml(item.type)}</p>`;
    card.addEventListener('click', ()=> selectItemType(item));
    gallery.appendChild(card);
  });
}

function selectItemType(item){
  selectedItemTypeId = item.id;
  qs('#item-title').value = item.name;
  qs('#item-type-desc').value = item.description;
  qs('#item-desc').value = '';
  qs('#item-image-preview').src = item.image;
  qs('#item-image-preview').classList.remove('hidden');
  qs('#selected-item-info').textContent = `Selected: ${item.name} (${item.type})`;
  hideEl(qs('#item-type-modal'));
  showMessage(`${item.name} selected as item type`, 'info', 2000);
}

function renderItemTypeModal(){
  const cats = getItemCategories();
  const catContainer = qs('#item-type-categories');
  catContainer.innerHTML = '';
  
  // Add "All Items" button
  const allBtn = document.createElement('button');
  allBtn.className = 'item-category-btn active';
  allBtn.textContent = 'All Items';
  allBtn.setAttribute('data-category', 'all');
  allBtn.addEventListener('click', ()=> {
    qsa('.item-category-btn').forEach(b => b.classList.remove('active'));
    allBtn.classList.add('active');
    renderItemTypeGallery('all');
  });
  catContainer.appendChild(allBtn);
  
  // Add category buttons
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'item-category-btn';
    btn.textContent = cat;
    btn.setAttribute('data-category', cat);
    btn.addEventListener('click', ()=> {
      qsa('.item-category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderItemTypeGallery(cat);
    });
    catContainer.appendChild(btn);
  });
  renderItemTypeGallery('all');
}

// Wire up
function setup(){
  try {
    ensureAdmin();
  } catch(e) {
    console.error('ensureAdmin error:', e);
  }
  
  // Ensure any modals are hidden on startup (defensive)
  try {
    ['#profile-modal','#user-popup','#item-type-modal','#confirm-modal','#change-password-modal','#help-modal'].forEach(id => {
      const el = qs(id);
      if(el) hideEl(el);
    });
  } catch(e) {
    console.error('Modal hide error:', e);
  }
  
  // MR Auctioner title click to return to Active Listings
  const siteTitle = qs('#site-title-link');
  if(siteTitle) {
    siteTitle.addEventListener('click', () => {
      qs('#create-listing-area').classList.add('hidden');
      qs('#listings-section').classList.remove('hidden');
      currentFilters.seller = '';
      currentFilters.sellerLabel = '';
      updateURL();
      updateSellerFilterChip();
      renderListings();
    });
  }
  
  // show/hide forms
  const btnShowRegister = qs('#btn-show-register');
  const btnShowLogin = qs('#btn-show-login');
  const btnLogout = qs('#btn-logout');
  
  if(btnShowRegister) btnShowRegister.addEventListener('click', ()=>{ qs('#register-card').classList.remove('hidden'); qs('#login-card').classList.add('hidden'); });
  if(btnShowLogin) btnShowLogin.addEventListener('click', ()=>{ qs('#login-card').classList.remove('hidden'); qs('#register-card').classList.add('hidden'); });
  if(btnLogout) btnLogout.addEventListener('click', ()=>{
    showConfirmModal('Log out from MR Auctioner?', async ()=>{ ApiService.logout(); await renderUserState(); renderListings(); showMessage('Logged out', 'info'); });
  });

  // Item type selector
  const btnOpenItemTypes = qs('#btn-open-item-types');
  const closeItemModal = qs('#close-item-modal');
  if(btnOpenItemTypes) btnOpenItemTypes.addEventListener('click', ()=>{ renderItemTypeModal(); showFlex(qs('#item-type-modal')); });
  if(closeItemModal) closeItemModal.addEventListener('click', ()=> hideEl(qs('#item-type-modal')));

  // Confirm modal handlers
  const confirmYes = qs('#confirm-yes');
  const confirmNo = qs('#confirm-no');
  if(confirmYes) confirmYes.addEventListener('click', ()=>{
    hideEl(qs('#confirm-modal'));
    if(confirmCallback) confirmCallback();
    confirmCallback = null;
  });
  if(confirmNo) confirmNo.addEventListener('click', ()=>{
    hideEl(qs('#confirm-modal'));
    confirmCallback = null;
  });

  // hamburger menu toggle
  const btnHamburger = qs('#btn-hamburger');
  if(btnHamburger){
    btnHamburger.addEventListener('click', ()=>{
      const m = qs('#hamburger-menu'); if(!m) return; m.classList.toggle('hidden');
    });
  }

  // Admin / Mod panel
  const btnAdmin = qs('#btn-admin-panel');
  if(btnAdmin){ btnAdmin.addEventListener('click', async ()=>{ hideEl(qs('#hamburger-menu')); await openAdminPanel('admin'); }); }
  const btnMod = qs('#btn-mod-panel');
  if(btnMod){ btnMod.addEventListener('click', async ()=>{ hideEl(qs('#hamburger-menu')); await openAdminPanel('mod'); }); }
  const btnAdminClose = qs('#admin-close');
  if(btnAdminClose){ btnAdminClose.addEventListener('click', ()=> hideEl(qs('#admin-modal'))); }

  // Admin controls: role filter + pagination
  const roleFilterSel = qs('#admin-role-filter');
  if(roleFilterSel){
    roleFilterSel.addEventListener('change', ()=>{
      adminView.roleFilter = roleFilterSel.value || 'all';
      adminView.page = 1;
      renderAdminUsers(adminView.mode);
    });
  }
  const adminSearch = qs('#admin-search');
  if(adminSearch){
    const debouncedAdminSearch = debounce(()=>{
      adminView.search = adminSearch.value || '';
      adminView.page = 1;
      renderAdminUsers(adminView.mode);
    }, 300);
    adminSearch.addEventListener('input', debouncedAdminSearch);
  }
  const pagPrev = qs('#admin-prev');
  if(pagPrev){ pagPrev.addEventListener('click', ()=>{ if(adminView.page > 1){ adminView.page--; renderAdminUsers(adminView.mode); } }); }
  const pagNext = qs('#admin-next');
  if(pagNext){ pagNext.addEventListener('click', ()=>{ adminView.page++; renderAdminUsers(adminView.mode); }); }

  // Ban modal handlers
  const banCancel = qs('#ban-cancel');
  if(banCancel){ banCancel.addEventListener('click', ()=>{ banTargetUser = null; hideEl(qs('#ban-modal')); }); }
  const banConfirm = qs('#ban-confirm');
  if(banConfirm){ banConfirm.addEventListener('click', async ()=>{
      if(!banTargetUser) return hideEl(qs('#ban-modal'));
      
      if(API_CONFIG.USE_API){
        const minsRaw = qs('#ban-minutes').value;
        const mins = Math.max(1, parseInt(minsRaw, 10) || 0);
        const reason = (qs('#ban-reason').value || '').slice(0, 120);
        const bannedUntil = new Date(Date.now() + mins*60000).toISOString();
        
        const result = await ApiService.updateUser(banTargetUser, { bannedUntil, bannedReason: reason });
        if(!result.ok) {
          banTargetUser = null;
          hideEl(qs('#ban-modal'));
          return showMessage(result.msg || 'Failed to ban user', 'error');
        }
        
        hideEl(qs('#ban-modal'));
        banTargetUser = null;
        await renderAdminUsers(adminView.mode);
        showMessage('User banned', 'info');
        return;
      }
      
      // localStorage mode
      const users = loadJSON(LS_USERS, {});
      const target = users[banTargetUser];
      const viewer = getUser(currentUser()) || {};
      if(!target) { banTargetUser = null; return hideEl(qs('#ban-modal')); }
      const targetIsAdmin = !!target.isAdmin; const targetIsMod = !!target.isMod;
      const viewerIsAdmin = !!viewer.isAdmin; const viewerIsMod = !!viewer.isMod || viewerIsAdmin;
      if(!(viewerIsAdmin || (viewerIsMod && !targetIsAdmin && !targetIsMod))){
        banTargetUser = null; hideEl(qs('#ban-modal')); return;
      }
      const minsRaw = qs('#ban-minutes').value;
      const mins = Math.max(1, parseInt(minsRaw, 10) || 0);
      const reason = (qs('#ban-reason').value || '').slice(0, 120);
      target.bannedUntil = Date.now() + mins*60000;
      target.bannedReason = reason;
      saveJSON(LS_USERS, users);
      recordModAction('BAN', banTargetUser, currentUser(), reason || `Banned for ${mins} minutes`);
      hideEl(qs('#ban-modal'));
      banTargetUser = null;
      renderAdminUsers(adminView.mode);
      showMessage('User banned', 'info');
  }); }

  // Rename modal handlers
  const renameCancel = qs('#rename-cancel');
  if(renameCancel){ renameCancel.addEventListener('click', ()=>{ renameTargetUser = null; hideEl(qs('#rename-modal')); }); }
  const renameConfirm = qs('#rename-confirm');
  if(renameConfirm){ renameConfirm.addEventListener('click', async ()=>{
      if(!renameTargetUser) return hideEl(qs('#rename-modal'));
      const newName = qs('#rename-input').value.trim();
      
      if(API_CONFIG.USE_API){
        if(newName && newName.length > 0){
          const result = await ApiService.updateUser(renameTargetUser, { displayName: newName.slice(0, 40) });
          if(!result.ok) {
            renameTargetUser = null;
            hideEl(qs('#rename-modal'));
            return showMessage(result.msg || 'Failed to update name', 'error');
          }
          await renderAdminUsers(adminView.mode);
          await renderListings();
          showMessage('Display name updated', 'info');
        }
        renameTargetUser = null;
        hideEl(qs('#rename-modal'));
        return;
      }
      
      // localStorage mode
      const users = loadJSON(LS_USERS, {});
      const target = users[renameTargetUser];
      if(!target){ renameTargetUser = null; return hideEl(qs('#rename-modal')); }
      if(newName && newName.length > 0){
        const oldName = target.displayName || renameTargetUser;
        target.displayName = newName.slice(0, 40);
        saveJSON(LS_USERS, users);
        recordModAction('RENAME', renameTargetUser, currentUser(), `"${oldName}" → "${newName}"`);
        renderAdminUsers(adminView.mode); renderListings();
        showMessage('Display name updated', 'info');
      }
      renameTargetUser = null;
      hideEl(qs('#rename-modal'));
  }); }

  // Items sold history
  const btnItemsSold = qs('#btn-items-sold');
  if(btnItemsSold){ btnItemsSold.addEventListener('click', async ()=>{ hideEl(qs('#hamburger-menu')); await openItemsSoldHistory(); }); }
  const btnItemsSoldClose = qs('#items-sold-close');
  if(btnItemsSoldClose){ btnItemsSoldClose.addEventListener('click', ()=> hideEl(qs('#items-sold-modal'))); }
  const itemsSoldPrev = qs('#items-sold-prev');
  if(itemsSoldPrev){ itemsSoldPrev.addEventListener('click', async ()=>{ 
    if(itemsSoldView.page > 1){ 
      itemsSoldView.page--; 
      const u = currentUser();
      if(API_CONFIG.USE_API) {
        const history = await ApiService.getItemsSoldHistory();
        renderItemsSoldPage(history);
      } else {
        const history = loadJSON(LS_ITEMS_SOLD, {}); 
        renderItemsSoldPage(history[u] || []);
      }
    } 
  }); }
  const itemsSoldNext = qs('#items-sold-next');
  if(itemsSoldNext){ itemsSoldNext.addEventListener('click', async ()=>{ 
    itemsSoldView.page++; 
    const u = currentUser();
    if(API_CONFIG.USE_API) {
      const history = await ApiService.getItemsSoldHistory();
      renderItemsSoldPage(history);
    } else {
      const history = loadJSON(LS_ITEMS_SOLD, {}); 
      renderItemsSoldPage(history[u] || []);
    }
  }); }

  // Mod history
  const btnModHistory = qs('#btn-mod-history');
  if(btnModHistory){ btnModHistory.addEventListener('click', ()=>{ hideEl(qs('#hamburger-menu')); openModHistory(); }); }
  const btnModHistoryClose = qs('#mod-history-close');
  if(btnModHistoryClose){ btnModHistoryClose.addEventListener('click', ()=> hideEl(qs('#mod-history-modal'))); }

  // Filter toggle
  const toggleFilters = qs('#toggle-filters');
  const filterContent = qs('#filter-content');
  if(toggleFilters && filterContent){
    toggleFilters.addEventListener('click', ()=>{
      filterContent.classList.toggle('collapsed');
      toggleFilters.textContent = filterContent.classList.contains('collapsed') ? '+' : '−';
    });
  }

  // Stats toggle
  const toggleStats = qs('#toggle-stats');
  const statsContent = qs('#stats-content');
  if(toggleStats && statsContent){
    toggleStats.addEventListener('click', ()=>{
      statsContent.classList.toggle('collapsed');
      toggleStats.textContent = statsContent.classList.contains('collapsed') ? '+' : '−';
    });
  }

  // Sell button in listings section
  const btnSellListings = qs('#btn-sell-listings');
  if(btnSellListings){ btnSellListings.addEventListener('click', ()=>{ qs('#create-listing-area').classList.remove('hidden'); qs('#listings-section').classList.add('hidden'); }); }

  // Sell item action from menu
  const btnSell = qs('#btn-sell-item');
  if(btnSell){ btnSell.addEventListener('click', ()=>{ qs('#create-listing-area').classList.remove('hidden'); hideEl(qs('#hamburger-menu')); qs('#listings-section').classList.add('hidden'); }); }

  // My Profile menu
  const btnProfile = qs('#btn-my-profile');
  if(btnProfile){ btnProfile.addEventListener('click', async ()=>{ await openProfileModal(); hideEl(qs('#hamburger-menu')); }); }

  // Help / FAQ menu
  const btnUserHelp = qs('#btn-user-help');
  if(btnUserHelp){ btnUserHelp.addEventListener('click', ()=>{ showFlex(qs('#help-modal')); hideEl(qs('#hamburger-menu')); }); }

  // View listings action from menu
  const btnViewListings = qs('#btn-view-listings-menu');
  if(btnViewListings){ btnViewListings.addEventListener('click', ()=>{ qs('#create-listing-area').classList.add('hidden'); hideEl(qs('#hamburger-menu')); qs('#listings-section').classList.remove('hidden'); currentFilters.seller=''; currentFilters.sellerLabel=''; updateURL(); updateSellerFilterChip(); renderListings(); }); }
  
  // My Listings action from menu
  const btnMyListings = qs('#btn-my-listings');
  if(btnMyListings){ 
    btnMyListings.addEventListener('click', async ()=>{ 
      qs('#create-listing-area').classList.add('hidden'); 
      hideEl(qs('#hamburger-menu')); 
      qs('#listings-section').classList.remove('hidden');
      
      if(API_CONFIG.USE_API) {
        // In API mode, filter by user ID
        const me = await ApiService.getMe();
        if(me) {
          currentFilters.seller = String(me.id);
          currentFilters.sellerLabel = me.displayName || me.email;
        }
      } else {
        // In localStorage mode, filter by email
        currentFilters.seller = currentUser();
        currentFilters.sellerLabel = currentDisplayName() || currentUser();
      }
      
      updateURL(); 
      updateSellerFilterChip(); 
      await renderListings(); 
    }); 
  }
  
  // Clear seller filter chip
  const clearChip = qs('#clear-seller-filter');
  if(clearChip){ clearChip.addEventListener('click', ()=>{ currentFilters.seller=''; currentFilters.sellerLabel=''; updateURL(); updateSellerFilterChip(); renderListings(); }); }

  // Search and filter event listeners with debouncing for better performance
  const debouncedApplyFilters = debounce(applyFilters, 300);
  
  const searchButton = qs('#search-button');
  const searchName = qs('#search-name');
  const searchPrice = qs('#search-price');
  const searchSort = qs('#search-sort');
  const searchElite = qs('#search-elite');
  const searchElement = qs('#search-element');
  const searchReset = qs('#search-reset');
  
  if(searchButton) searchButton.addEventListener('click', applyFilters);
  if(searchName) {
    searchName.addEventListener('keypress', (e) => {
      if(e.key === 'Enter') applyFilters();
    });
    searchName.addEventListener('input', debouncedApplyFilters);
  }
  
  if(searchPrice) searchPrice.addEventListener('change', applyFilters);
  if(searchSort) searchSort.addEventListener('change', applyFilters);
  if(searchElite) searchElite.addEventListener('change', applyFilters);
  if(searchElement) searchElement.addEventListener('change', applyFilters);
  if(searchReset) searchReset.addEventListener('click', resetFilters);

  // Price spinner controls
  const btnPriceMinus = qs('#btn-price-minus');
  const btnPricePlus = qs('#btn-price-plus');
  const itemPriceInput = qs('#item-price');
  
  if(btnPriceMinus && itemPriceInput) {
    btnPriceMinus.addEventListener('click', ()=>{
      const current = Number(itemPriceInput.value) || 0;
      itemPriceInput.value = Math.max(1, current - 1);
    });
  }
  
  if(btnPricePlus && itemPriceInput) {
    btnPricePlus.addEventListener('click', ()=>{
      const current = Number(itemPriceInput.value) || 0;
      itemPriceInput.value = current + 1;
    });
  }

  // Price input validation - only allow positive numbers
  if(itemPriceInput) {
    itemPriceInput.addEventListener('input', ()=>{
      let val = itemPriceInput.value;
      val = val.replace(/[^0-9]/g, '');
      if(val === '' || parseInt(val) === 0) val = '1';
      itemPriceInput.value = val;
    });
  }

  // Image type validation
  const itemImage = qs('#item-image');
  const itemImagePreview = qs('#item-image-preview');
  
  if(itemImage && itemImagePreview) {
    itemImage.addEventListener('change', (ev)=>{
      const file = ev.target.files?.[0];
      if(!file) return;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if(!allowedTypes.includes(file.type)){
        showMessage('Only JPG, PNG, GIF, and WebP images are allowed', 'error');
        ev.target.value = '';
        itemImagePreview.style.display = 'none';
        return;
      }
      // Continue with existing file processing logic
      itemImage.dispatchEvent(new Event('change-valid'));
    });
  }

  // Drag and drop for image upload
  const dropZone = qs('#image-drop-zone');
  if(dropZone){
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('drag-over');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if(files.length > 0){
        const file = files[0];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if(!allowedTypes.includes(file.type)){
          showMessage('Only JPG, PNG, GIF, and WebP images are allowed', 'error');
          return;
        }
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        qs('#item-image').files = dataTransfer.files;
        qs('#item-image').dispatchEvent(new Event('change-valid'));
      }
    });
  }

  // Paste image from clipboard
  document.addEventListener('paste', (e) => {
    // Only handle paste when create listing area is visible
    if(qs('#create-listing-area').classList.contains('hidden')) return;
    
    const items = e.clipboardData?.items;
    if(!items) return;
    
    for(let i = 0; i < items.length; i++){
      if(items[i].type.indexOf('image') !== -1){
        e.preventDefault();
        const file = items[i].getAsFile();
        if(file){
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          qs('#item-image').files = dataTransfer.files;
          qs('#item-image').dispatchEvent(new Event('change-valid'));
          showMessage('Image pasted from clipboard', 'info', 2000);
          break;
        }
      }
    }
  });

  qs('#btn-register').addEventListener('click', async ()=>{
    const u = qs('#reg-username').value.trim(); const p = qs('#reg-password').value; const d = qs('#reg-displayname').value.trim();
    if(u.length < 3) return showMessage('Username must be at least 3 characters', 'error');
    if(p.length < 4) return showMessage('Password must be at least 4 characters', 'error');
    
    console.log('Starting registration for:', u);
    const res = await ApiService.register(u, p, d);
    if(!res.ok) return showMessage(res.msg, 'error');
    
    console.log('Registration successful, token received:', !!res.token);
    
    // Clear the form
    qs('#register-card').classList.add('hidden');
    qs('#reg-username').value=''; 
    qs('#reg-password').value=''; 
    qs('#reg-displayname').value='';
    
    // Update UI (user is already logged in after registration in API mode)
    showMessage('Account created successfully! Welcome to MR Auctioner!', 'success');
    await renderUserState();
    await renderListings();
  });

  // cancel buttons for auth cards
  const cancelLogin = qs('#btn-cancel-login');
  if(cancelLogin){ cancelLogin.addEventListener('click', ()=>{ qs('#login-card').classList.add('hidden'); }); }
  const cancelRegister = qs('#btn-cancel-register');
  if(cancelRegister){ cancelRegister.addEventListener('click', ()=>{ qs('#register-card').classList.add('hidden'); }); }

  // profile modal handlers
  const profileCancelBtn = qs('#profile-cancel');
  if(profileCancelBtn) {
    profileCancelBtn.addEventListener('click', ()=> hideEl(qs('#profile-modal')));
  }
  const helpCloseBtn = qs('#help-close');
  if(helpCloseBtn){ helpCloseBtn.addEventListener('click', ()=> hideEl(qs('#help-modal'))); }
  const btnOpenChangePassword = qs('#btn-open-change-password');
  if(btnOpenChangePassword) {
    btnOpenChangePassword.addEventListener('click', (e)=> {
      e.preventDefault();
      e.stopPropagation();
      showFlex(qs('#change-password-modal'));
    });
  }
  const btnCancelPassword = qs('#btn-cancel-password');
  if(btnCancelPassword) {
    btnCancelPassword.addEventListener('click', (e)=> {
      e.preventDefault();
      e.stopPropagation();
      hideEl(qs('#change-password-modal'));
      // Clear password fields
      qs('#profile-current-pass').value = '';
      qs('#profile-new-pass').value = '';
      qs('#profile-new-pass-confirm').value = '';
    });
  }
  qs('#profile-avatar').addEventListener('change', async (ev)=>{
    const f = ev.target.files && ev.target.files[0];
    if(!f) return;
    const allowed = ['image/jpeg','image/png','image/gif','image/webp'];
    if(!allowed.includes(f.type)) return showMessage('Avatar must be JPG/PNG/GIF/WebP', 'error');
    try{
      const data = await processImageFile(f, 60*1024, 200);
      qs('#profile-avatar-preview').src = data; qs('#profile-avatar-preview').classList.remove('hidden');
      // temporarily store on element dataset for save
      qs('#profile-avatar').dataset.preview = data;
    }catch(e){ showMessage('Failed to process avatar', 'error'); }
  });

  const profileSaveBtn = qs('#profile-save');
  if(profileSaveBtn) {
    profileSaveBtn.addEventListener('click', async (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const u = currentUser(); 
      if(!u) return showMessage('Not signed in', 'error');
      
      const displayName = qs('#profile-displayname').value.trim();
      const discord = qs('#profile-discord').value.trim();
      const bio = qs('#profile-bio').value.trim();
      const avatar = qs('#profile-avatar').dataset.preview || qs('#profile-avatar-preview').src || '';
      
      console.log('Saving profile:', { displayName, discord, bio, avatarLength: avatar.length });
      
      const result = await ApiService.updateProfile(displayName, discord, bio, avatar);
      if(!result.ok) return showMessage(result.msg || 'Failed to save profile', 'error');
      
      showMessage('Profile saved', 'info');
      hideEl(qs('#profile-modal'));
      await renderUserState(); 
      renderListings();
    });
  }

  // Change password modal save handler
  const btnSavePassword = qs('#btn-save-password');
  if(btnSavePassword) {
    btnSavePassword.addEventListener('click', async (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const u = currentUser(); 
      if(!u) return showMessage('Not signed in', 'error');
      
      const cur = qs('#profile-current-pass').value;
      const np = qs('#profile-new-pass').value;
      const nc = qs('#profile-new-pass-confirm').value;
      
      if(!cur) return showMessage('Enter current password', 'error');
      if(!np) return showMessage('Enter new password', 'error');
      if(np.length < 4) return showMessage('New password too short', 'error');
      if(np !== nc) return showMessage('New passwords do not match', 'error');
      
      const result = await ApiService.updatePassword(cur, np);
      if(!result.ok) return showMessage(result.msg || 'Failed to change password', 'error');
      
      showMessage('Password changed successfully', 'info');
      hideEl(qs('#change-password-modal'));
      // Clear password fields
      qs('#profile-current-pass').value = '';
      qs('#profile-new-pass').value = '';
      qs('#profile-new-pass-confirm').value = '';
    });
  }

  // seller popup close
  qs('#popup-close').addEventListener('click', ()=> hideEl(qs('#user-popup')));

  // Seller "Selling" button
  qs('#popup-selling').addEventListener('click', async ()=>{
    const btn = qs('#popup-selling');
    const userId = btn && btn.dataset && btn.dataset.username ? btn.dataset.username : '';
    const dname = btn && btn.dataset && btn.dataset.displayname ? btn.dataset.displayname : '';
    
    if(API_CONFIG.USE_API) {
      // In API mode, filter by user ID
      currentFilters.seller = userId;
      currentFilters.sellerLabel = dname || 'User';
    } else {
      // In localStorage mode, filter by email/display name
      currentFilters.seller = (dname || '').toLowerCase();
      currentFilters.sellerLabel = dname || '';
    }
    
    hideEl(qs('#user-popup'));
    qs('#create-listing-area').classList.add('hidden');
    qs('#listings-section').classList.remove('hidden');
    updateURL();
    updateSellerFilterChip();
    await renderListings();
  });

  // Popup "Items Sold History" button
  qs('#popup-items-sold').addEventListener('click', ()=>{
    const btn = qs('#popup-items-sold');
    const username = btn && btn.dataset && btn.dataset.username ? btn.dataset.username : '';
    if(!username) return showMessage('No user selected', 'error');
    hideEl(qs('#user-popup'));
    openItemsSoldHistoryForUser(username);
  });

  // delegate clicks on seller links
  document.body.addEventListener('click', async (ev)=>{
    const a = ev.target.closest && ev.target.closest('.seller-link');
    if(a){ 
      ev.preventDefault(); 
      const userIdentifier = a.getAttribute('data-user');
      await openUserPopup(userIdentifier); 
    }
  });
  
  // Copy discord name when double-clicked
  document.body.addEventListener('dblclick', async (ev)=>{
    if(ev.target.id === 'popup-discord'){
      const discord = ev.target.dataset.discord;
      if(discord){
        navigator.clipboard.writeText(discord).then(()=>{
          showMessage('Discord name copied: ' + discord, 'info', 2000);
        }).catch(()=>{
          showMessage('Failed to copy', 'error', 2000);
        });
      }
    }
  });

  // Double click handlers for images and Discord
  document.body.addEventListener('dblclick', (ev)=>{
    // Double click on user uploaded images to open in modal
    if(ev.target.classList.contains('user-uploaded-image')){
      ev.stopPropagation();
      const modal = qs('#image-modal');
      const modalImg = qs('#modal-image');
      modalImg.src = ev.target.src;
      modal.classList.remove('hidden');
      modal.classList.add('show');
    }
  });

  // Close image modal
  qs('#close-image-modal').addEventListener('click', ()=>{
    const modal = qs('#image-modal');
    modal.classList.remove('show');
    modal.classList.add('hidden');
  });

  // Global key navigation & ESC close
  document.addEventListener('keydown', (e)=>{
    const detailVisible = !qs('#listing-detail-modal').classList.contains('hidden');
    if(e.key === 'Escape'){
      if(detailVisible) hideEl(qs('#listing-detail-modal'));
      const imgModal = qs('#image-modal');
      if(imgModal.classList.contains('show')){
        imgModal.classList.remove('show'); imgModal.classList.add('hidden');
      }
    }
    if(detailVisible && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')){
      if(currentRenderedListingIds.length < 2) return;
      if(currentDetailIndex < 0) return;
      if(e.key === 'ArrowRight') currentDetailIndex = (currentDetailIndex + 1) % currentRenderedListingIds.length;
      else currentDetailIndex = (currentDetailIndex - 1 + currentRenderedListingIds.length) % currentRenderedListingIds.length;
      openListingDetail(currentRenderedListingIds[currentDetailIndex]);
    }
  });

  // Close hamburger when clicking outside
  document.addEventListener('click', (e)=>{
    const menu = qs('#hamburger-menu');
    const trigger = qs('#btn-hamburger');
    if(menu && !menu.classList.contains('hidden')){
      if(!menu.contains(e.target) && e.target !== trigger){
        menu.classList.add('hidden');
      }
    }
  });

  // Close modal on background click
  qs('#image-modal').addEventListener('click', (ev)=>{
    if(ev.target.id === 'image-modal'){
      ev.target.classList.remove('show');
      ev.target.classList.add('hidden');
    }
  });

  qs('#btn-login').addEventListener('click', async ()=>{
    const u = qs('#login-username').value.trim(); const p = qs('#login-password').value;
    if(!u || !p) return showMessage('Enter username and password', 'error');
    const res = await ApiService.login(u,p);
    if(!res.ok) return showMessage(res.msg, 'error');
    qs('#login-card').classList.add('hidden'); qs('#login-username').value=''; qs('#login-password').value='';
    await renderUserState(); renderListings();
    showMessage('Welcome back, ' + currentDisplayName(), 'info');
  });

  // image preview
  qs('#item-image').addEventListener('change-valid', async (ev)=>{
    const f = qs('#item-image').files && qs('#item-image').files[0];
    if(!f){ qs('#item-image-preview').classList.add('hidden'); qs('#item-image-preview').src=''; return; }
    const maxBytes = 200 * 1024; // 200KB
    if(f.size <= maxBytes){
      const d = await readFileAsDataURL(f);
      qs('#item-image-preview').src = d; qs('#item-image-preview').classList.remove('hidden');
      return;
    }
    showMessage('Image is large (' + Math.round(f.size/1024) + ' KB). Resizing...', 'info', 4000);
    try{
      const processed = await processImageFile(f, maxBytes, 1200);
      qs('#item-image-preview').src = processed; qs('#item-image-preview').classList.remove('hidden');
      const approxKb = Math.round((processed.length * 3/4)/1024);
      showMessage('Image resized to approx ' + approxKb + ' KB.', 'info', 4000);
    }catch(e){
      showMessage('Failed to process image: ' + e.message, 'error', 5000);
    }
  });

  qs('#btn-create-listing').addEventListener('click', async ()=>{
    const t = qs('#item-title').value.trim(); const d = qs('#item-desc').value.trim(); const p = qs('#item-price').value;
    const elite = qs('#item-elite').checked;
    const element = qs('#item-element').value || null;
    if(!t) return showMessage('Title required', 'error');
    if(!currentUser()) return showMessage('You must be logged in', 'error');
    if(!p || Number(p) < 1) return showMessage('Price must be at least 1 gold', 'error');
    const editingId = qs('#editing-id').value;
    const file = qs('#item-image').files && qs('#item-image').files[0];
    let img = null;
    if(file){
      try{
        img = await processImageFile(file, 200*1024, 1200);
      }catch(e){
        return showMessage('Image processing failed', 'error');
      }
    }

    // Add this validation check:
    const itemDesc = document.getElementById('item-desc').value.trim();
    if (!itemDesc) {
      showMessage('Please add details about your listing in the "Your Listing Description" field.', 'error');
      return;
    }

    if(editingId){
      const updateData = { title: t, desc: d, price: Number(p)||0, elite, element };
      if(img) updateData.image = img;
      const res = await updateListing(editingId, updateData);
      if(!res.ok) return showMessage(res.msg, 'error');
      finishEditUI();
      await renderListings();
      return showMessage('Listing updated', 'info');
    }

    const res = await createListing(t,d,p,selectedItemTypeId,elite,element);
    if(!res.ok) return showMessage(res.msg, 'error');
    // attach image after creation asynchronously
    if(img){ updateListing(res.listing.id, {image: img}).catch(()=>{}); }
    // Update cache optimistically
    cachedListings = [res.listing, ...(cachedListings||[])];
    // Reset form
    qs('#item-title').value=''; qs('#item-type-desc').value=''; qs('#item-desc').value=''; qs('#item-price').value=''; qs('#item-image').value=''; qs('#item-image-preview').classList.add('hidden'); qs('#item-image-preview').src='';
    qs('#item-elite').checked = false; qs('#item-element').value = '';
    qs('#selected-item-info').textContent = '';
    selectedItemTypeId = null;
    // Navigate immediately and render listings
    qs('#create-listing-area').classList.add('hidden');
    qs('#listings-section').classList.remove('hidden');
    requestAnimationFrame(()=> { renderListings(); });
    showMessage('Listing created', 'info');
  });

  qs('#btn-cancel-edit').addEventListener('click', ()=>{ finishEditUI(); qs('#create-listing-area').classList.add('hidden'); qs('#listings-section').classList.remove('hidden'); });

  qs('#btn-view-listings').addEventListener('click', ()=>{ qs('#create-listing-area').classList.add('hidden'); qs('#listings-section').classList.remove('hidden'); });

  // Restore filter state from URL
  try {
    restoreFiltersFromURL();
  } catch(e) {
    console.error('restoreFiltersFromURL error:', e);
  }
  
  // initial render - async operations that should not block
  Promise.all([
    renderUserState().catch(e => console.error('renderUserState error:', e)),
    renderListings().catch(e => console.error('renderListings error:', e))
  ]).then(() => {
    updateSellerFilterChip();
  }).catch(e => {
    console.error('Initial render error:', e);
  });
}

function finishEditUI(){
  qs('#editing-id').value = '';
  qs('#item-title').value=''; qs('#item-type-desc').value=''; qs('#item-desc').value=''; qs('#item-price').value=''; qs('#item-image').value=''; qs('#item-image-preview').classList.add('hidden'); qs('#item-image-preview').src='';
  qs('#item-elite').checked = false; qs('#item-element').value = '';
  qs('#selected-item-info').textContent = '';
  selectedItemTypeId = null;
  qs('#btn-create-listing').textContent = 'Create listing'; qs('#btn-cancel-edit').classList.add('hidden');
}

// Profile & user popup helpers
async function openProfileModal(){
  const u = currentUser(); if(!u) return showMessage('Not signed in', 'error');
  
  // Fetch user data from API if using API, otherwise from localStorage
  let me = {};
  if(API_CONFIG.USE_API){
    const apiUser = await ApiService.getMe();
    if(apiUser){
      me = {
        displayName: apiUser.displayName,
        discord: apiUser.discord,
        bio: apiUser.bio,
        avatar: apiUser.avatar
      };
    }
  } else {
    me = getUser(u) || {};
  }
  
  console.log('Opening profile modal with data:', me);
  
  qs('#profile-username').textContent = u;
  qs('#profile-displayname').value = me.displayName || '';
  qs('#profile-discord').value = me.discord || '';
  qs('#profile-bio').value = me.bio || '';
  qs('#profile-avatar-preview').src = me.avatar || '';
  if(me.avatar) qs('#profile-avatar-preview').classList.remove('hidden'); else qs('#profile-avatar-preview').classList.add('hidden');
  // Clear any previous preview data
  qs('#profile-avatar').dataset.preview = '';
  showFlex(qs('#profile-modal'));
}

async function openUserPopup(username){
  let u;
  
  if(API_CONFIG.USE_API) {
    // Fetch user profile from API (supports both UUID and email)
    u = await ApiService.getUserProfile(username);
    if(!u) {
      return showMessage('User profile not available', 'error');
    }
  } else {
    u = getUser(username);
    if(!u) return showMessage('User not found', 'error');
  }
  
  qs('#popup-displayname').textContent = u.displayName || username;
  
  // Show last seen if available
  const lastSeenEl = qs('#popup-last-seen');
  if(lastSeenEl && u.lastSeen) {
    const lastSeenText = timeAgo(u.lastSeen);
    lastSeenEl.textContent = `Last seen: ${lastSeenText}`;
    lastSeenEl.style.display = 'block';
  } else if(lastSeenEl) {
    lastSeenEl.style.display = 'none';
  }
  
  const popupDiscordEl = qs('#popup-discord');
  if(u.discord) {
    popupDiscordEl.textContent = '@' + u.discord;
    popupDiscordEl.style.display = 'block';
    popupDiscordEl.style.cursor = 'pointer';
    popupDiscordEl.title = 'Double-click to copy Discord name';
    popupDiscordEl.dataset.discord = u.discord;
  } else {
    popupDiscordEl.textContent = '';
    popupDiscordEl.style.display = 'none';
    delete popupDiscordEl.dataset.discord;
  }
  const sellBtn = qs('#popup-selling');
  if(sellBtn){
    // Store the correct identifier: UUID for API mode, email for localStorage
    const userId = API_CONFIG.USE_API && u.id ? u.id : username;
    sellBtn.dataset.username = userId;
    sellBtn.dataset.displayname = u.displayName || username;
  }
  const itemsSoldBtn = qs('#popup-items-sold');
  if(itemsSoldBtn) itemsSoldBtn.dataset.username = username;
  qs('#popup-bio').textContent = u.bio || 'No bio provided.';
  if(u.avatar){ qs('#popup-avatar').src = u.avatar; qs('#popup-avatar').classList.remove('hidden'); } else { qs('#popup-avatar').classList.add('hidden'); }
  showFlex(qs('#user-popup'));
}

// UI helper: show/hide the active seller filter chip
function updateSellerFilterChip(){
  const chip = qs('#seller-filter-chip');
  const text = qs('#seller-filter-text');
  if(!chip || !text) return;
  if(currentFilters.seller){
    text.textContent = 'Seller: ' + (currentFilters.sellerLabel || currentFilters.seller);
    chip.classList.remove('hidden');
  } else {
    chip.classList.add('hidden');
  }
}

// URL persistence helpers
function updateURL(){
  const params = new URLSearchParams();
  if(currentFilters.name) params.set('search', currentFilters.name);
  if(currentFilters.priceSort && currentFilters.priceSort !== 'none') params.set('price', currentFilters.priceSort);
  if(currentFilters.sort && currentFilters.sort !== 'newest') params.set('sort', currentFilters.sort);
  if(currentFilters.seller) params.set('seller', currentFilters.sellerLabel || currentFilters.seller);
  const newURL = params.toString() ? '?' + params.toString() : window.location.pathname;
  window.history.replaceState({}, '', newURL);
}

function restoreFiltersFromURL(){
  const params = new URLSearchParams(window.location.search);
  if(params.has('search')){
    currentFilters.name = params.get('search').toLowerCase();
    qs('#search-name').value = params.get('search');
  }
  if(params.has('price')){
    currentFilters.priceSort = params.get('price');
    qs('#search-price').value = params.get('price');
  }
  if(params.has('sort')){
    currentFilters.sort = params.get('sort');
    qs('#search-sort').value = params.get('sort');
  }
  if(params.has('seller')){
    const sellerLabel = params.get('seller');
    currentFilters.seller = sellerLabel.toLowerCase();
    currentFilters.sellerLabel = sellerLabel;
  }
}

// Admin bootstrap and permission helpers
function ensureAdmin(){
  const users = loadJSON(LS_USERS, {});
  if(!users['admin']){
    users['admin'] = { password:'admin123', displayName:'Admin', bio:'', avatar:'', discord:'', isAdmin:true, isMod:false, bannedUntil:null, bannedReason:'' };
    saveJSON(LS_USERS, users);
  }
  if(!users['Fukarizoh']){
    users['Fukarizoh'] = { password:'S@lt.123', displayName:'Fukarizoh', bio:'Site Developer', avatar:'', discord:'Fukarizoh', isAdmin:true, isMod:false, bannedUntil:null, bannedReason:'' };
    saveJSON(LS_USERS, users);
  }
}
async function isAdminUser(){ 
  const u = currentUser(); 
  if(!u) return false; 
  if(API_CONFIG.USE_API){
    const me = await ApiService.getMe();
    return me ? !!me.isAdmin : false;
  }
  const me = getUser(u) || {}; 
  return !!me.isAdmin; 
}
async function isModUser(){ 
  const u = currentUser(); 
  if(!u) return false; 
  if(API_CONFIG.USE_API){
    const me = await ApiService.getMe();
    return me ? !!me.isMod : false;
  }
  const me = getUser(u) || {}; 
  return !!me.isMod; 
}

// Admin/Moderation UI
async function openAdminPanel(mode){
  adminView.mode = mode || 'admin';
  const title = qs('#admin-modal-title');
  if(title) title.textContent = adminView.mode === 'mod' ? 'Moderation' : 'Admin Panel';
  // Reset page, keep current roleFilter
  adminView.page = 1;
  adminView.search = '';
  const roleSel = qs('#admin-role-filter'); if(roleSel) roleSel.value = adminView.roleFilter;
  const searchBox = qs('#admin-search'); if(searchBox) searchBox.value = '';
  await renderAdminUsers(adminView.mode);
  showFlex(qs('#admin-modal'));
}

async function renderAdminUsers(mode){
  const container = qs('#admin-users'); if(!container) return;
  
  let users = {};
  if(API_CONFIG.USE_API){
    // Fetch users from API
    const apiUsers = await ApiService.getAllUsers();
    if(apiUsers){
      // Convert API format to localStorage format for compatibility
      apiUsers.forEach(u => {
        users[u.username] = {
          displayName: u.displayName || u.username,
          isAdmin: u.isAdmin,
          isMod: u.isMod,
          bannedUntil: u.bannedUntil ? new Date(u.bannedUntil).getTime() : null,
          bannedReason: u.bannedReason
        };
      });
    }
  } else {
    users = loadJSON(LS_USERS, {});
  }
  
  const viewer = API_CONFIG.USE_API ? await ApiService.getMe() : (getUser(currentUser()) || {});
  let keys = Object.keys(users).sort((a,b)=> a.localeCompare(b));
  // Role filter: all | normal | staff
  if(adminView.roleFilter === 'normal'){
    keys = keys.filter(u => !users[u].isAdmin && !users[u].isMod);
  } else if(adminView.roleFilter === 'staff'){
    keys = keys.filter(u => users[u].isAdmin || users[u].isMod);
  }
  // Text search across username and displayName
  if(adminView.search){
    const q = adminView.search.toLowerCase();
    keys = keys.filter(u => {
      const rec = users[u];
      const dn = (rec.displayName || u || '').toLowerCase();
      return u.toLowerCase().includes(q) || dn.includes(q);
    });
  }
  const total = keys.length;
  const totalPages = Math.max(1, Math.ceil(total / adminView.pageSize));
  if(adminView.page > totalPages) adminView.page = totalPages;
  const start = (adminView.page - 1) * adminView.pageSize;
  const end = Math.min(total, start + adminView.pageSize);

  let html = '<table><thead><tr><th>User</th><th>Display Name</th><th>Roles</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
  keys.slice(start, end).forEach(u => {
    const rec = users[u];
    const isAdmin = !!rec.isAdmin;
    const isMod = !!rec.isMod;
    const roles = [isAdmin ? '<span class="role-badge role-admin">ADMIN</span>' : '', isMod ? '<span class="role-badge role-mod">MOD</span>' : ''].filter(Boolean).join(' ');
    const banned = rec.bannedUntil && Date.now() < rec.bannedUntil;
    let status = '';
    if(banned){
      const mins = Math.ceil((rec.bannedUntil - Date.now())/60000);
      const until = new Date(rec.bannedUntil).toLocaleString();
      status = `<span class="badge-banned">BANNED</span> <small>until ${until}${rec.bannedReason? ' — ' + escapeHtml(rec.bannedReason): ''}</small>`;
    }

    let actions = [];
    const viewerIsAdmin = !!viewer.isAdmin;
    const viewerIsMod = !!viewer.isMod || viewerIsAdmin;
    const targetIsAdmin = !!rec.isAdmin;
    const targetIsMod = !!rec.isMod;
    // Admins can ban anyone; Mods can only ban normal users (not admins or mods)
    const canBan = viewerIsAdmin || (viewerIsMod && !targetIsAdmin && !targetIsMod);
    const canManage = viewerIsAdmin; // rename/delete/toggle mod are admin-only

    if(canManage){ actions.push(`<button class="btn btn-small" data-action="rename" data-user="${u}">Rename</button>`); }
    if(canManage && !targetIsAdmin){ actions.push(`<button class="btn btn-small btn-delete" data-action="delete" data-user="${u}">Delete</button>`); }
    if(canBan){ actions.push(`<button class="btn btn-small ${banned ? '' : 'btn-accent'}" data-action="${banned ? 'unban' : 'ban'}" data-user="${u}">${banned ? 'Unban' : 'Ban'}</button>`); }
    if(canManage && !targetIsAdmin){ actions.push(`<button class="btn btn-small" data-action="toggle-mod" data-user="${u}">${isMod ? 'Revoke Mod' : 'Make Mod'}</button>`); }

    html += `<tr>
      <td><strong>${escapeHtml(u)}</strong></td>
      <td>${escapeHtml(rec.displayName || u)}</td>
      <td><div class="role-badges">${roles || '-'}</div></td>
      <td><div class="status-badges">${status || '-'}</div></td>
      <td><div class="admin-actions">${actions.join(' ') || '-'}</div></td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;

  // Wire action handlers via delegation
  container.onclick = (ev)=>{
    const btn = ev.target.closest('button[data-action]');
    if(!btn) return;
    const action = btn.getAttribute('data-action');
    const uname = btn.getAttribute('data-user');
    handleAdminAction(action, uname, mode);
  };

  // Update pagination UI
  const pageLabel = qs('#admin-page-label');
  const prevBtn = qs('#admin-prev');
  const nextBtn = qs('#admin-next');
  if(pageLabel) pageLabel.textContent = `Page ${adminView.page} of ${Math.max(1, Math.ceil(total / adminView.pageSize))} — ${total} users`;
  if(prevBtn) prevBtn.disabled = adminView.page <= 1;
  if(nextBtn) nextBtn.disabled = adminView.page >= Math.ceil(total / adminView.pageSize);
}

async function handleAdminAction(action, username, mode){
  if(API_CONFIG.USE_API){
    // API-based admin actions
    const viewer = await ApiService.getMe();
    if(!viewer) return showMessage('Not authenticated', 'error');
    
    const viewerIsAdmin = !!viewer.isAdmin;
    const viewerIsMod = !!viewer.isMod || viewerIsAdmin;
    
    if(action === 'delete'){
      if(!viewerIsAdmin) return;
      showConfirmModal(`Delete user "${username}"?`, async ()=>{
        const result = await ApiService.deleteUser(username);
        if(!result.ok) return showMessage(result.msg || 'Failed to delete user', 'error');
        await renderAdminUsers(mode);
        await renderListings();
        showMessage('User deleted', 'info');
      });
      return;
    }

    if(action === 'ban'){
      banTargetUser = username;
      const title = qs('#ban-title'); if(title) title.textContent = 'Ban User: ' + username;
      qs('#ban-minutes').value = '60';
      qs('#ban-reason').value = '';
      showFlex(qs('#ban-modal'));
      return;
    }

    if(action === 'unban'){
      showConfirmModal(`Unban user "${username}"?`, async ()=>{
        const result = await ApiService.updateUser(username, { bannedUntil: null, bannedReason: '' });
        if(!result.ok) return showMessage(result.msg || 'Failed to unban user', 'error');
        await renderAdminUsers(mode);
        showMessage('User unbanned', 'info');
      });
      return;
    }

    if(action === 'toggle-mod'){
      if(!viewerIsAdmin) return;
      // We need to know current mod status - fetch from users list
      const allUsers = await ApiService.getAllUsers();
      const target = allUsers?.find(u => u.username === username);
      if(!target) return showMessage('User not found', 'error');
      if(target.isAdmin) return showMessage('Admins already have all permissions', 'info');
      
      const newStatus = !target.isMod;
      showConfirmModal(`${newStatus ? 'Grant' : 'Revoke'} MOD role for "${username}"?`, async ()=>{
        const result = await ApiService.updateUser(username, { isMod: newStatus });
        if(!result.ok) return showMessage(result.msg || 'Failed to update user', 'error');
        await renderAdminUsers(mode);
        showMessage(newStatus ? 'Granted MOD' : 'Revoked MOD', 'info');
      });
      return;
    }

    if(action === 'rename'){
      if(!viewerIsAdmin) return;
      const allUsers = await ApiService.getAllUsers();
      const target = allUsers?.find(u => u.username === username);
      if(!target) return showMessage('User not found', 'error');
      
      renameTargetUser = username;
      const title = qs('#rename-title'); if(title) title.textContent = 'Rename: ' + username;
      qs('#rename-input').value = target.displayName || username;
      showFlex(qs('#rename-modal'));
      return;
    }
    
    return;
  }
  
  // localStorage-based admin actions
  const users = loadJSON(LS_USERS, {});
  const target = users[username]; if(!target) return showMessage('User not found', 'error');
  const viewer = getUser(currentUser()) || {};
  const viewerIsAdmin = !!viewer.isAdmin;
  const viewerIsMod = !!viewer.isMod || viewerIsAdmin;
  const targetIsAdmin = !!target.isAdmin;
  const targetIsMod = !!target.isMod;

  if(action === 'rename'){
    if(!viewerIsAdmin) return;
    renameTargetUser = username;
    const title = qs('#rename-title'); if(title) title.textContent = 'Rename: ' + username;
    qs('#rename-input').value = target.displayName || username;
    showFlex(qs('#rename-modal'));
    return;
  }

  if(action === 'delete'){
    if(!viewerIsAdmin) return;
    if(targetIsAdmin) return showMessage('Cannot delete an admin account', 'error');
    showConfirmModal(`Delete user "${username}" and their listings?`, ()=>{
      delete users[username];
      // remove their listings
      const listings = getListings().filter(l => l.seller !== username);
      saveJSON(LS_USERS, users);
      saveJSON(LS_LISTINGS, listings);
      recordModAction('DELETE_USER', username, currentUser(), 'User and all listings deleted');
      renderAdminUsers(mode); renderListings();
      showMessage('User deleted', 'info');
    });
    return;
  }

  if(action === 'ban'){
    if(!(viewerIsAdmin || (viewerIsMod && !targetIsAdmin && !targetIsMod))) return;
    banTargetUser = username;
    const title = qs('#ban-title'); if(title) title.textContent = 'Ban User: ' + username;
    qs('#ban-minutes').value = '60';
    qs('#ban-reason').value = '';
    showFlex(qs('#ban-modal'));
    return;
  }

  if(action === 'unban'){
    if(!(viewerIsAdmin || (viewerIsMod && !targetIsAdmin && !targetIsMod))) return;
    showConfirmModal(`Unban user "${username}"?`, ()=>{
      const users = loadJSON(LS_USERS, {});
      const target = users[username];
      if(target){
        target.bannedUntil = null; target.bannedReason = '';
        saveJSON(LS_USERS, users);
        recordModAction('UNBAN', username, currentUser(), 'Ban removed');
        renderAdminUsers(mode);
        showMessage('User unbanned', 'info');
      }
    });
    return;
  }

  if(action === 'toggle-mod'){
    if(!viewerIsAdmin) return;
    if(targetIsAdmin) return showMessage('Admins already have all permissions', 'info');
    const newStatus = !target.isMod;
    showConfirmModal(`${newStatus ? 'Grant' : 'Revoke'} MOD role for "${username}"?`, ()=>{
      const users = loadJSON(LS_USERS, {});
      const target = users[username];
      if(target){
        target.isMod = newStatus;
        saveJSON(LS_USERS, users);
        recordModAction(newStatus ? 'GRANT_MOD' : 'REVOKE_MOD', username, currentUser(), newStatus ? 'MOD role granted' : 'MOD role revoked');
        renderAdminUsers(mode);
        showMessage(newStatus ? 'Granted MOD' : 'Revoked MOD', 'info');
      }
    });
    return;
  }
}

// Items Sold History
async function openItemsSoldHistory(){
  const u = currentUser(); if(!u) return;
  await openItemsSoldHistoryForUser(u);
}

async function openItemsSoldHistoryForUser(username){
  let userHistory = [];
  let displayName = username;
  
  if(API_CONFIG.USE_API) {
    // Use API to get items sold history
    userHistory = await ApiService.getItemsSoldHistory();
    const me = await ApiService.getMe();
    if(me) displayName = me.displayName || me.email;
  } else {
    // Use localStorage
    const history = loadJSON(LS_ITEMS_SOLD, {});
    userHistory = history[username] || [];
    const targetUser = getUser(username);
    displayName = targetUser ? (targetUser.displayName || username) : username;
  }
  
  itemsSoldView.page = 1;
  qs('#items-sold-title').textContent = `Items Sold History - ${displayName}`;
  renderItemsSoldPage(userHistory);
  showFlex(qs('#items-sold-modal'));
}

function renderItemsSoldPage(userHistory){
  const container = qs('#items-sold-list');
  if(!container) return;
  
  const total = userHistory.length;
  const totalPages = Math.max(1, Math.ceil(total / itemsSoldView.pageSize));
  if(itemsSoldView.page > totalPages) itemsSoldView.page = totalPages;
  const start = (itemsSoldView.page - 1) * itemsSoldView.pageSize;
  const end = Math.min(total, start + itemsSoldView.pageSize);
  
  if(userHistory.length === 0){
    container.innerHTML = '<p class="hint">No items sold yet.</p>';
  } else {
    let html = '';
    userHistory.slice(start, end).forEach(item => {
      const createdDate = new Date(item.createdAt).toLocaleString();
      const deletedTag = item.deletedAt ? `<span style="color:var(--accent);font-weight:600"> [DELETED]</span>` : '';
      const description = item.desc ? `<p class="hint" style="margin-top:.35rem">${escapeHtml(item.desc)}</p>` : '';
      
      // Elite and Element badges
      let statusBadges = '';
      if(item.elite || item.element){
        statusBadges = '<div style="display:flex;gap:.35rem;margin-top:.25rem">';
        if(item.elite){
          statusBadges += '<img src="Items/Elite/Elite.png" alt="Elite" title="Elite Item" style="width:20px;height:20px;object-fit:contain"/>';
        }
        if(item.element){
          statusBadges += `<img src="Items/Enchants/${escapeHtml(item.element)}.png" alt="${escapeHtml(item.element)}" title="${escapeHtml(item.element)} Element" style="width:20px;height:20px;object-fit:contain"/>`;
        }
        statusBadges += '</div>';
      }
      
      html += `<div class="history-item">
        <strong>${escapeHtml(item.title)}</strong>${deletedTag}
        ${description}
        ${statusBadges}
        <p class="hint">Price: ${item.price} gold | Listed: ${createdDate}</p>
        ${item.deletedAt ? `<p class="hint">Deleted: ${new Date(item.deletedAt).toLocaleString()}</p>` : ''}
      </div>`;
    });
    container.innerHTML = html;
  }
  
  // Update pagination UI
  const pageLabel = qs('#items-sold-page-label');
  const prevBtn = qs('#items-sold-prev');
  const nextBtn = qs('#items-sold-next');
  if(pageLabel) pageLabel.textContent = `Page ${itemsSoldView.page} of ${totalPages} — ${total} items`;
  if(prevBtn) prevBtn.disabled = itemsSoldView.page <= 1;
  if(nextBtn) nextBtn.disabled = itemsSoldView.page >= totalPages;
}

// Moderation History
function openModHistory(){
  const history = loadJSON(LS_MOD_HISTORY, []);
  const container = qs('#mod-history-list');
  if(!container) return;
  
  if(history.length === 0){
    container.innerHTML = '<p class="hint">No moderation actions yet.</p>';
  } else {
    let html = '';
    history.forEach(entry => {
      const timestamp = new Date(entry.timestamp).toLocaleString();
      const actionLabel = entry.action.replace(/_/g, ' ');
      html += `<div class="history-item">
        <strong class="mod-action">${escapeHtml(actionLabel)}</strong>
        <p class="hint">Target: ${escapeHtml(entry.targetUser)} | By: ${escapeHtml(entry.moderator)}</p>
        <p class="hint">${timestamp}${entry.reason ? ' | ' + escapeHtml(entry.reason) : ''}</p>
      </div>`;
    });
    container.innerHTML = html;
  }
  
  showFlex(qs('#mod-history-modal'));
}

// Custom confirm modal
let confirmCallback = null;
function showConfirmModal(message, onConfirm){
  qs('#confirm-message').textContent = message;
  confirmCallback = onConfirm;
  showFlex(qs('#confirm-modal'));
}

// API Connection Status
async function updateApiStatus() {
  const statusEl = qs('#api-status');
  const dotEl = qs('.api-status-dot');
  const textEl = qs('.api-status-text');
  
  if (!statusEl || !dotEl || !textEl) return;
  
  // Set checking state
  statusEl.className = 'api-status checking';
  textEl.textContent = 'Checking...';
  
  try {
    const status = await ApiService.checkConnection();
    
    if (status.connected) {
      statusEl.className = 'api-status connected';
      textEl.textContent = status.mode === 'localStorage' ? 'Local Mode' : 'API Connected';
      statusEl.title = status.mode === 'localStorage' 
        ? 'Using localStorage (offline mode)' 
        : 'API connection is active';
    } else {
      statusEl.className = 'api-status disconnected';
      textEl.textContent = 'API Offline';
      statusEl.title = `API not reachable: ${status.error || 'Unknown error'}`;
    }
  } catch (e) {
    statusEl.className = 'api-status disconnected';
    textEl.textContent = 'Check Failed';
    statusEl.title = `Error checking API: ${e.message}`;
  }
}

function startApiStatusMonitoring() {
  // Initial check
  updateApiStatus();
  
  // Check every 30 seconds
  if (apiStatusCheckInterval) {
    clearInterval(apiStatusCheckInterval);
  }
  apiStatusCheckInterval = setInterval(updateApiStatus, 30000);
}

function stopApiStatusMonitoring() {
  if (apiStatusCheckInterval) {
    clearInterval(apiStatusCheckInterval);
    apiStatusCheckInterval = null;
  }
}

// Register service worker for caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker available, will activate on next page load');
            }
          });
        });
      })
      .catch((error) => {
        console.warn('⚠️ Service Worker registration failed:', error);
      });
  });
}

// On load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    setup();
    
    // Start API status monitoring
    startApiStatusMonitoring();
  } catch(error) {
    console.error('Setup error:', error);
  } finally {
    // Always hide loading screen after setup attempt
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if(loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
          loadingScreen.remove();
        }, 300);
      }
    }, 100); // Minimal delay for faster perceived performance
  }
});

// Fallback: ensure loading screen never persists beyond 5s even on errors
setTimeout(() => {
  const loadingScreen = document.getElementById('loading-screen');
  if(loadingScreen) {
    loadingScreen.remove();
    console.warn('Loading screen removed by fallback timeout');
  }
}, 5000);
// ===== SERVICE WORKER FOR OFFLINE SUPPORT & CACHING =====

const CACHE_NAME = 'foodiebot-v1.0.0';
const STATIC_CACHE = 'foodiebot-static-v1';
const DYNAMIC_CACHE = 'foodiebot-dynamic-v1';
const API_CACHE = 'foodiebot-api-v1';

// Files to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles/style.css',
    '/js/main.js',
    '/js/chatbot.js',
    '/js/animations.js',
    '/js/location.js',
    '/js/payment.js',
    '/js/qr-code.js',
    '/js/error-handler.js',
    '/js/performance-optimizer.js',
    '/js/security-manager.js',
    '/config.js',
    '/assets/favicon-32x32.png',
    '/assets/favicon-16x16.png',
    '/assets/apple-touch-icon.png',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/restaurants',
    '/api/menu',
    '/api/search'
];

// Cache strategies
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    NETWORK_ONLY: 'network-only',
    CACHE_ONLY: 'cache-only'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(API_CACHE).then((cache) => {
                console.log('Service Worker: Preparing API cache');
                return Promise.resolve();
            })
        ]).then(() => {
            console.log('Service Worker: Installation complete');
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && 
                        cacheName !== DYNAMIC_CACHE && 
                        cacheName !== API_CACHE) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation complete');
            return self.clients.claim();
        })
    );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Determine cache strategy based on request type
    let strategy = CACHE_STRATEGIES.NETWORK_FIRST;
    
    if (isStaticAsset(url)) {
        strategy = CACHE_STRATEGIES.CACHE_FIRST;
    } else if (isAPIRequest(url)) {
        strategy = CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
    } else if (isImageRequest(url)) {
        strategy = CACHE_STRATEGIES.CACHE_FIRST;
    }
    
    event.respondWith(handleRequest(request, strategy));
});

// Handle requests based on strategy
async function handleRequest(request, strategy) {
    switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
            return cacheFirst(request);
        case CACHE_STRATEGIES.NETWORK_FIRST:
            return networkFirst(request);
        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            return staleWhileRevalidate(request);
        case CACHE_STRATEGIES.NETWORK_ONLY:
            return fetch(request);
        case CACHE_STRATEGIES.CACHE_ONLY:
            return caches.match(request);
        default:
            return networkFirst(request);
    }
}

// Cache first strategy - good for static assets
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(getCacheName(request));
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache first strategy failed:', error);
        return getOfflineFallback(request);
    }
}

// Network first strategy - good for dynamic content
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(getCacheName(request));
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', error);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return getOfflineFallback(request);
    }
}

// Stale while revalidate - good for API requests
async function staleWhileRevalidate(request) {
    const cache = await caches.open(getCacheName(request));
    const cachedResponse = await cache.match(request);
    
    // Start network request in background
    const networkPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch((error) => {
        console.log('Background network request failed:', error);
    });
    
    // Return cached response immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // If no cache, wait for network
    try {
        return await networkPromise;
    } catch (error) {
        return getOfflineFallback(request);
    }
}

// Determine cache name based on request type
function getCacheName(request) {
    const url = new URL(request.url);
    
    if (isStaticAsset(url)) {
        return STATIC_CACHE;
    } else if (isAPIRequest(url)) {
        return API_CACHE;
    } else {
        return DYNAMIC_CACHE;
    }
}

// Check if request is for static asset
function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.pathname.endsWith(asset)) ||
           url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/);
}

// Check if request is for API
function isAPIRequest(url) {
    return url.pathname.startsWith('/api/') ||
           API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

// Check if request is for image
function isImageRequest(url) {
    return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/);
}

// Get offline fallback response
async function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
        const cache = await caches.open(STATIC_CACHE);
        return cache.match('/index.html') || new Response('Offline', {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    }
    
    // Return offline API response for API requests
    if (isAPIRequest(url)) {
        return new Response(JSON.stringify({
            error: 'Offline',
            message: 'This feature is not available offline',
            offline: true
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Return placeholder for images
    if (isImageRequest(url)) {
        return new Response(getOfflineImageSVG(), {
            status: 200,
            headers: { 'Content-Type': 'image/svg+xml' }
        });
    }
    
    // Default offline response
    return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

// Generate offline image placeholder
function getOfflineImageSVG() {
    return `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#999" text-anchor="middle" dy=".3em">
                Image Unavailable Offline
            </text>
        </svg>
    `;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered');
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Sync offline orders
        await syncOfflineOrders();
        
        // Sync analytics data
        await syncAnalyticsData();
        
        // Update cached data
        await updateCachedData();
        
        console.log('Background sync completed');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function syncOfflineOrders() {
    // Get offline orders from IndexedDB
    const offlineOrders = await getOfflineOrders();
    
    for (const order of offlineOrders) {
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });
            
            if (response.ok) {
                await removeOfflineOrder(order.id);
                console.log('Offline order synced:', order.id);
            }
        } catch (error) {
            console.error('Failed to sync order:', order.id, error);
        }
    }
}

async function syncAnalyticsData() {
    // Get offline analytics from IndexedDB
    const offlineAnalytics = await getOfflineAnalytics();
    
    for (const event of offlineAnalytics) {
        try {
            const response = await fetch('/api/analytics/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });
            
            if (response.ok) {
                await removeOfflineAnalytics(event.id);
            }
        } catch (error) {
            console.error('Failed to sync analytics:', event.id, error);
        }
    }
}

async function updateCachedData() {
    // Update restaurant data
    try {
        const response = await fetch('/api/restaurants');
        if (response.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put('/api/restaurants', response.clone());
        }
    } catch (error) {
        console.error('Failed to update restaurant cache:', error);
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: 'Your order status has been updated!',
        icon: '/assets/favicon-32x32.png',
        badge: '/assets/favicon-16x16.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Order',
                icon: '/assets/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/assets/xmark.png'
            }
        ]
    };
    
    if (event.data) {
        const data = event.data.json();
        options.body = data.body || options.body;
        options.data = { ...options.data, ...data };
    }
    
    event.waitUntil(
        self.registration.showNotification('FoodieBot', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/orders')
        );
    } else if (event.action === 'close') {
        // Just close the notification
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            cacheUrls(event.data.urls)
        );
    }
});

async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    return cache.addAll(urls);
}

// IndexedDB helpers (simplified - would need full implementation)
async function getOfflineOrders() {
    // Implementation would use IndexedDB to get offline orders
    return [];
}

async function removeOfflineOrder(orderId) {
    // Implementation would remove order from IndexedDB
}

async function getOfflineAnalytics() {
    // Implementation would use IndexedDB to get offline analytics
    return [];
}

async function removeOfflineAnalytics(eventId) {
    // Implementation would remove analytics from IndexedDB
}

console.log('Service Worker: Script loaded');
// ===== FOODIEBOT AI ENGINE - ENHANCED FOR REAL-TIME PRODUCTION =====

class FoodieBotAI {
    constructor() {
        this.nearbyRestaurants = [];
        this.selectedRestaurant = null;
        this.orderMode = 'discovery'; // 'discovery' or 'restaurant'
        this.currentLocation = "Nagaram, Dammiguda";
        this.conversationContext = [];
        this.userPreferences = this.loadUserPreferences();
        this.cache = new Map();
        this.apiEndpoints = this.initializeAPIEndpoints();
        this.websocket = null;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.init();
    }

    init() {
        this.loadRestaurantData();
        this.initializeWebSocket();
        this.setupPerformanceMonitoring();
        this.loadUserSession();
    }

    // ===== REAL-TIME API INTEGRATION =====
    initializeAPIEndpoints() {
        return {
            restaurants: '/api/restaurants',
            menu: '/api/restaurants/{id}/menu',
            orders: '/api/orders',
            tracking: '/api/orders/{id}/track',
            search: '/api/search',
            recommendations: '/api/recommendations',
            analytics: '/api/analytics/events'
        };
    }

    // ===== WEBSOCKET FOR REAL-TIME UPDATES =====
    initializeWebSocket() {
        if (!window.WebSocket) {
            console.warn('WebSocket not supported');
            return;
        }

        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws/foodiebot`;
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('WebSocket connected');
                this.retryAttempts = 0;
                this.sendWebSocketMessage({
                    type: 'subscribe',
                    channels: ['restaurant_updates', 'order_status', 'menu_changes']
                });
            };

            this.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(JSON.parse(event.data));
            };

            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.reconnectWebSocket();
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
        }
    }

    reconnectWebSocket() {
        if (this.retryAttempts < this.maxRetries) {
            this.retryAttempts++;
            const delay = Math.pow(2, this.retryAttempts) * 1000; // Exponential backoff
            
            setTimeout(() => {
                console.log(`Reconnecting WebSocket (attempt ${this.retryAttempts})`);
                this.initializeWebSocket();
            }, delay);
        }
    }

    sendWebSocketMessage(message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'restaurant_update':
                this.updateRestaurantData(data.restaurant);
                break;
            case 'order_status':
                this.updateOrderStatus(data.order);
                break;
            case 'menu_update':
                this.updateMenuData(data.menu);
                break;
            case 'real_time_recommendation':
                this.showRealtimeRecommendation(data.recommendation);
                break;
            default:
                console.log('Unknown WebSocket message type:', data.type);
        }
    }

    // ===== ENHANCED DATA LOADING WITH API INTEGRATION =====
    async loadRestaurantData() {
        try {
            // Check cache first
            const cacheKey = `restaurants_${this.currentLocation}`;
            if (this.cache.has(cacheKey)) {
                const cachedData = this.cache.get(cacheKey);
                if (Date.now() - cachedData.timestamp < 300000) { // 5 minutes cache
                    this.nearbyRestaurants = cachedData.data;
                    return;
                }
            }

            // Show loading state
            this.showLoadingState('Loading restaurants...');

            // Fetch from API
            const response = await this.fetchWithRetry(this.apiEndpoints.restaurants, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Location': this.currentLocation,
                    'X-User-ID': this.getUserId()
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.nearbyRestaurants = data.restaurants || this.getFallbackRestaurants();
                
                // Cache the data
                this.cache.set(cacheKey, {
                    data: this.nearbyRestaurants,
                    timestamp: Date.now()
                });

                // Track analytics
                this.trackEvent('restaurants_loaded', {
                    location: this.currentLocation,
                    count: this.nearbyRestaurants.length
                });
            } else {
                throw new Error(`API Error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading restaurant data:', error);
            this.nearbyRestaurants = this.getFallbackRestaurants();
            this.showErrorNotification('Using offline restaurant data');
        } finally {
            this.hideLoadingState();
        }
    }

    // ===== ENHANCED API CALLS WITH RETRY LOGIC =====
    async fetchWithRetry(url, options, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    timeout: 10000 // 10 second timeout
                });
                
                if (response.ok) {
                    return response;
                }
                
                if (response.status >= 500 && i < retries - 1) {
                    // Retry on server errors
                    await this.delay(Math.pow(2, i) * 1000);
                    continue;
                }
                
                return response;
            } catch (error) {
                if (i === retries - 1) {
                    throw error;
                }
                await this.delay(Math.pow(2, i) * 1000);
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===== ENHANCED AI RESPONSE GENERATION =====
    async generateResponse(userMessage, conversationHistory = []) {
        try {
            // Track user interaction
            this.trackEvent('user_message', {
                message_length: userMessage.length,
                intent: this.detectIntent(userMessage)
            });

            // Add to conversation context
            this.conversationContext.push({
                role: 'user',
                content: userMessage,
                timestamp: Date.now()
            });

            // Detect intent and generate response
            const intent = this.detectIntent(userMessage);
            const response = await this.generateContextualResponse(intent, userMessage);

            // Add AI response to context
            this.conversationContext.push({
                role: 'assistant',
                content: response.text,
                timestamp: Date.now()
            });

            // Limit context size for performance
            if (this.conversationContext.length > 20) {
                this.conversationContext = this.conversationContext.slice(-20);
            }

            return response;
        } catch (error) {
            console.error('Error generating response:', error);
            return {
                text: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
                action: null,
                data: null
            };
        }
    }

    // ===== ENHANCED INTENT DETECTION =====
    detectIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        // Use more sophisticated intent detection
        const intents = {
            search_restaurants: [
                'find', 'search', 'show', 'restaurants', 'nearby', 'around', 'close'
            ],
            view_menu: [
                'menu', 'food', 'dishes', 'items', 'what do you have', 'options'
            ],
            order_food: [
                'order', 'buy', 'purchase', 'add to cart', 'i want', 'get me'
            ],
            track_order: [
                'track', 'status', 'where is', 'delivery', 'order status'
            ],
            recommendations: [
                'recommend', 'suggest', 'popular', 'best', 'top rated', 'what should'
            ],
            location: [
                'location', 'address', 'where', 'area', 'delivery to'
            ],
            help: [
                'help', 'how', 'what can you do', 'assist', 'support'
            ]
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return intent;
            }
        }

        return 'general';
    }

    // ===== PERFORMANCE MONITORING =====
    setupPerformanceMonitoring() {
        // Monitor API response times
        this.performanceMetrics = {
            apiCalls: [],
            responseGeneration: [],
            userInteractions: []
        };

        // Set up performance observer if available
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name.includes('foodiebot')) {
                        this.performanceMetrics.apiCalls.push({
                            name: entry.name,
                            duration: entry.duration,
                            timestamp: entry.startTime
                        });
                    }
                }
            });
            observer.observe({ entryTypes: ['measure'] });
        }
    }

    // ===== USER SESSION MANAGEMENT =====
    loadUserSession() {
        try {
            const sessionData = localStorage.getItem('foodiebot_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                this.userPreferences = { ...this.userPreferences, ...session.preferences };
                this.conversationContext = session.context || [];
            }
        } catch (error) {
            console.error('Error loading user session:', error);
        }
    }

    saveUserSession() {
        try {
            const sessionData = {
                preferences: this.userPreferences,
                context: this.conversationContext.slice(-10), // Save last 10 interactions
                timestamp: Date.now()
            };
            localStorage.setItem('foodiebot_session', JSON.stringify(sessionData));
        } catch (error) {
            console.error('Error saving user session:', error);
        }
    }

    // ===== ANALYTICS AND TRACKING =====
    trackEvent(eventName, properties = {}) {
        try {
            const eventData = {
                event: eventName,
                properties: {
                    ...properties,
                    timestamp: Date.now(),
                    user_id: this.getUserId(),
                    session_id: this.getSessionId(),
                    location: this.currentLocation,
                    user_agent: navigator.userAgent
                }
            };

            // Send to analytics API
            if (navigator.sendBeacon) {
                navigator.sendBeacon(
                    this.apiEndpoints.analytics,
                    JSON.stringify(eventData)
                );
            } else {
                fetch(this.apiEndpoints.analytics, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                }).catch(error => console.error('Analytics error:', error));
            }
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    }

    // ===== REAL-TIME RECOMMENDATIONS =====
    async getPersonalizedRecommendations() {
        try {
            const response = await this.fetchWithRetry(this.apiEndpoints.recommendations, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': this.getUserId()
                },
                body: JSON.stringify({
                    location: this.currentLocation,
                    preferences: this.userPreferences,
                    context: this.conversationContext.slice(-5)
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.recommendations;
            }
        } catch (error) {
            console.error('Error getting recommendations:', error);
        }

        return this.getFallbackRecommendations();
    }

    // ===== ERROR HANDLING AND FALLBACKS =====
    getFallbackRestaurants() {
        return [
            {
                id: 1,
                name: "Biryani Paradise",
                image: "🍛",
                rating: 4.5,
                deliveryTime: "25-35 min",
                distance: "1.2 km",
                cuisines: ["Indian", "Biryani", "Hyderabadi"],
                priceRange: "₹₹",
                location: "Nagaram Main Road",
                offers: ["20% OFF", "Free Delivery"],
                menu: {
                    biryani: [
                        {
                            id: 101,
                            name: "Chicken Dum Biryani",
                            description: "Aromatic basmati rice cooked with tender chicken pieces and traditional spices",
                            price: 280,
                            veg: false,
                            rating: 4.7,
                            popular: true
                        },
                        {
                            id: 102,
                            name: "Mutton Biryani",
                            description: "Premium mutton pieces slow-cooked with fragrant basmati rice",
                            price: 350,
                            veg: false,
                            rating: 4.6
                        },
                        {
                            id: 103,
                            name: "Veg Dum Biryani",
                            description: "Mixed vegetables and paneer cooked with aromatic spices and basmati rice",
                            price: 220,
                            veg: true,
                            rating: 4.3
                        }
                    ],
                    starters: [
                        {
                            id: 201,
                            name: "Chicken 65",
                            description: "Spicy deep-fried chicken with curry leaves and green chilies",
                            price: 180,
                            veg: false,
                            rating: 4.4,
                            popular: true
                        },
                        {
                            id: 202,
                            name: "Paneer Tikka",
                            description: "Grilled cottage cheese marinated in spices and yogurt",
                            price: 160,
                            veg: true,
                            rating: 4.2
                        }
                    ]
                }
            },
            {
                id: 2,
                name: "Pizza Corner",
                image: "🍕",
                rating: 4.3,
                deliveryTime: "20-30 min",
                distance: "0.8 km",
                cuisines: ["Italian", "Pizza", "Fast Food"],
                priceRange: "₹₹",
                location: "Dammiguda Circle",
                offers: ["Buy 1 Get 1", "Free Garlic Bread"],
                menu: {
                    pizza: [
                        {
                            id: 301,
                            name: "Margherita Pizza",
                            description: "Classic pizza with fresh tomatoes, mozzarella, and basil",
                            price: 250,
                            veg: true,
                            rating: 4.5,
                            popular: true
                        },
                        {
                            id: 302,
                            name: "Chicken Supreme",
                            description: "Loaded with chicken, bell peppers, onions, and cheese",
                            price: 320,
                            veg: false,
                            rating: 4.4
                        }
                    ]
                }
            }
        ];
    }

    // ===== UTILITY METHODS =====
    getUserId() {
        let userId = localStorage.getItem('foodiebot_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('foodiebot_user_id', userId);
        }
        return userId;
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('foodiebot_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('foodiebot_session_id', sessionId);
        }
        return sessionId;
    }

    loadUserPreferences() {
        try {
            const prefs = localStorage.getItem('foodiebot_preferences');
            return prefs ? JSON.parse(prefs) : {
                dietary: [],
                cuisines: [],
                priceRange: 'any',
                deliveryTime: 'any'
            };
        } catch (error) {
            return {
                dietary: [],
                cuisines: [],
                priceRange: 'any',
                deliveryTime: 'any'
            };
        }
    }

    showLoadingState(message) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        if (loadingOverlay && loadingText) {
            loadingText.textContent = message;
            loadingOverlay.classList.remove('hidden');
        }
    }

    hideLoadingState() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    showErrorNotification(message) {
        console.warn(message);
        // Could show a toast notification here
    }

    // ===== CLEANUP =====
    destroy() {
        if (this.websocket) {
            this.websocket.close();
        }
        this.saveUserSession();
    }

    // ===== EXISTING METHODS (Enhanced) =====
    async generateContextualResponse(intent, userMessage) {
        const startTime = performance.now();
        
        try {
            let response;
            
            switch (intent) {
                case 'search_restaurants':
                    response = await this.handleRestaurantSearch(userMessage);
                    break;
                case 'view_menu':
                    response = await this.handleMenuRequest(userMessage);
                    break;
                case 'recommendations':
                    response = await this.handleRecommendations(userMessage);
                    break;
                default:
                    response = await this.handleGeneralQuery(userMessage);
            }

            // Track performance
            const duration = performance.now() - startTime;
            this.performanceMetrics.responseGeneration.push({
                intent,
                duration,
                timestamp: Date.now()
            });

            return response;
        } catch (error) {
            console.error('Error in contextual response:', error);
            return {
                text: "I apologize for the technical difficulty. Let me help you in a different way.",
                action: null,
                data: null
            };
        }
    }

    async handleRestaurantSearch(userMessage) {
        await this.loadRestaurantData(); // Ensure fresh data
        
        return {
            text: `I found ${this.nearbyRestaurants.length} restaurants near ${this.currentLocation}! Here are your options:`,
            action: 'show_restaurants',
            data: this.nearbyRestaurants
        };
    }

    async handleMenuRequest(userMessage) {
        if (this.selectedRestaurant) {
            return {
                text: `Here's the menu for ${this.selectedRestaurant.name}:`,
                action: 'show_menu',
                data: this.selectedRestaurant
            };
        } else {
            return {
                text: "Please select a restaurant first to view their menu. Would you like me to show nearby restaurants?",
                action: 'show_restaurants',
                data: this.nearbyRestaurants
            };
        }
    }

    async handleRecommendations(userMessage) {
        const recommendations = await this.getPersonalizedRecommendations();
        
        return {
            text: "Based on your preferences and popular choices in your area, here are my recommendations:",
            action: 'show_popular',
            data: recommendations
        };
    }

    async handleGeneralQuery(userMessage) {
        // Enhanced general query handling with context awareness
        const responses = [
            "I'm here to help you discover great restaurants and order delicious food! What would you like to do?",
            "I can help you find restaurants, browse menus, place orders, and track deliveries. How can I assist you today?",
            "Looking for something specific? I can recommend restaurants based on your preferences!"
        ];
        
        return {
            text: responses[Math.floor(Math.random() * responses.length)],
            action: null,
            data: null
        };
    }

    setSelectedRestaurant(restaurantId) {
        this.selectedRestaurant = this.nearbyRestaurants.find(r => r.id === restaurantId);
        if (this.selectedRestaurant) {
            this.trackEvent('restaurant_selected', {
                restaurant_id: restaurantId,
                restaurant_name: this.selectedRestaurant.name
            });
        }
    }

    getFallbackRecommendations() {
        return this.nearbyRestaurants.slice(0, 3);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.chatbotAI) {
        window.chatbotAI = new FoodieBotAI();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.chatbotAI) {
        window.chatbotAI.destroy();
    }
});
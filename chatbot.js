// ===== RESTAURANT DISCOVERY AI ENGINE FOR NAGARAM-DAMMIGUDA =====

// Chatbot State
const state = {
    currentStep: 'greeting',
    order: {
        items: [],
        type: null,
        table: null,
        time: null,
        people: null,
        address: null
    },
    reservation: {
        name: null,
        date: null,
        time: null,
        people: null,
        phone: null
    },
    location: {
        address: "Nagaram-Dammiguda, Hyderabad",
        openingHours: "10:00 AM - 11:00 PM",
        phone: "+91 98765 43210"
    },
    cart: []
};

// Initialize cart if it doesn't exist and make state globally accessible
window.chatbotState = state;
if (!state.cart) {
    state.cart = [];
}
console.log('Initial cart state:', state.cart);

// Restaurant Information
const restaurantInfo = {
    name: "Spice Garden",
    description: "Authentic Indian cuisine with a modern twist",
    specialties: [
        "Hyderabadi Biryani",
        "Butter Chicken",
        "Tandoori Specialties",
        "South Indian Thalis"
    ],
    ratings: {
        food: 4.5,
        service: 4.3,
        ambiance: 4.4
    },
    deliveryTime: "30-45 minutes",
    minimumOrder: 200,
    deliveryFee: 40
};

// Common Questions and Answers
const qaDatabase = {
    'location': `We are located in ${state.location.address}. We're easily accessible from the main road.`,
    'timings': `We are open ${state.location.openingHours} every day.`,
    'delivery': `We deliver within a 5km radius of our location. Delivery time is ${restaurantInfo.deliveryTime}.`,
    'payment': 'We accept cash, UPI, credit/debit cards, and net banking.',
    'parking': 'Yes, we have free parking available for our customers.',
    'reservation': 'You can make a reservation through our chatbot or by calling us directly.',
    'specialties': `Our specialties include: ${restaurantInfo.specialties.join(', ')}.`,
    'minimum order': `Our minimum order for delivery is ₹${restaurantInfo.minimumOrder}.`,
    'delivery fee': `Delivery fee is ₹${restaurantInfo.deliveryFee} for orders within 3km.`,
    'ratings': `Our restaurant has received excellent ratings: Food: ${restaurantInfo.ratings.food}/5, Service: ${restaurantInfo.ratings.service}/5, Ambiance: ${restaurantInfo.ratings.ambiance}/5.`
};

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendMessage');
const darkModeToggle = document.getElementById('darkModeToggle');

// Enhanced conversation analysis
const conversationAnalysis = {
    // Intent recognition patterns
    intents: {
        greeting: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
        menu: ['menu', 'food', 'dishes', 'items', 'what do you have', 'what can i order'],
        order: ['order', 'place order', 'buy', 'purchase', 'get food'],
        payment: ['pay', 'payment', 'how to pay', 'payment method', 'upi', 'card', 'cash'],
        tracking: ['track', 'where is my order', 'order status', 'delivery status'],
        help: ['help', 'how to', 'what can you do', 'commands', 'options'],
        cancel: ['cancel', 'stop', 'remove', 'delete'],
        quantity: ['more', 'less', 'quantity', 'how many'],
        price: ['price', 'cost', 'how much', 'expensive', 'cheap'],
        time: ['time', 'when', 'how long', 'delivery time', 'waiting time']
    },

    // Analyze user input for intent
    analyzeIntent(input) {
        const words = input.toLowerCase().split(' ');
        const matchedIntents = [];

        for (const [intent, patterns] of Object.entries(this.intents)) {
            for (const pattern of patterns) {
                if (input.toLowerCase().includes(pattern)) {
                    matchedIntents.push(intent);
                    break;
                }
            }
        }

        return matchedIntents;
    },

    // Extract quantity from input
    extractQuantity(input) {
        const numbers = input.match(/\d+/);
        return numbers ? parseInt(numbers[0]) : 1;
    },

    // Extract price range from input
    extractPriceRange(input) {
        const priceMatch = input.match(/(\d+)\s*-\s*(\d+)/);
        if (priceMatch) {
            return {
                min: parseInt(priceMatch[1]),
                max: parseInt(priceMatch[2])
            };
        }
        return null;
    }
};

// Add conversation memory and advanced analysis
const conversationMemory = {
    messages: [],
    userPreferences: {},
    currentTopic: '',
    lastAction: '',
    addMessage(role, content) {
        this.messages.push({
            role,
            content,
            timestamp: new Date().toISOString()
        });
        if (this.messages.length > 20) {
            this.messages = this.messages.slice(-20);
        }
    },
    getRecentContext() {
        return this.messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
    }
};

const advancedAnalysis = {
    analyzeSentiment(input) {
        const positive = ['good', 'great', 'awesome', 'love', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect'];
        const negative = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'disgusting', 'worst', 'disappointing'];
        
        const words = input.toLowerCase().split(' ');
        let score = 0;
        
        words.forEach(word => {
            if (positive.includes(word)) score++;
            if (negative.includes(word)) score--;
        });
        
        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    },

    extractEntities(input) {
        const entities = { foods: [], quantities: [], prices: [] };
        
        const quantityMatches = input.match(/(\d+)\s*(pieces?|items?|plates?|bowls?|cups?)?/gi);
        if (quantityMatches) {
            entities.quantities = quantityMatches.map(m => parseInt(m.match(/\d+/)[0]));
        }
        
        nearbyRestaurants.forEach(restaurant => {
            Object.values(restaurant.menu).flat().forEach(item => {
                if (input.toLowerCase().includes(item.name.toLowerCase())) {
                    entities.foods.push(item.name);
                }
            });
        });
        
        return entities;
    },

    recognizeIntent(input) {
        const patterns = {
            greeting: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
            recommendation: ['recommend', 'suggest', 'best', 'popular', 'favorite', 'good', 'tasty'],
            complaint: ['problem', 'issue', 'wrong', 'bad', 'terrible', 'complaint'],
            compliment: ['great', 'awesome', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love']
        };
        
        const inputLower = input.toLowerCase();
        for (const [intent, keywords] of Object.entries(patterns)) {
            if (keywords.some(keyword => inputLower.includes(keyword))) {
                return intent;
            }
        }
        return 'general';
    }
};

class FoodieBotAI {
    constructor() {
        this.currentLocation = "Nagaram, Dammiguda";
        this.nearbyRestaurants = this.initializeRestaurantDatabase();
        this.contextMemory = new Map();
        this.currentContext = 'discovery';
        this.userPreferences = {};
        this.orderSession = null;
        this.conversationState = 'greeting';
        this.selectedRestaurant = null;
        this.dishCategories = this.initializeDishCategories();
        this.ecoFriendlyMode = false;
        
        // Initialize real-time data
        this.initializeRealTimeData();
    }

    async initializeRealTimeData() {
        try {
            // Get initial restaurant data
            this.nearbyRestaurants = await restaurantDB.getRestaurants();
            
            // Subscribe to restaurant updates
            restaurantDB.restaurantsRef.onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'modified') {
                        const updatedRestaurant = {
                            id: change.doc.id,
                            ...change.doc.data()
                        };
                        const index = this.nearbyRestaurants.findIndex(r => r.id === updatedRestaurant.id);
                        if (index !== -1) {
                            this.nearbyRestaurants[index] = updatedRestaurant;
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error initializing real-time data:', error);
        }
    }

    initializeRestaurantDatabase() {
        return [
            // Indian Restaurants
            {
                id: 1,
                name: "Biryani Paradise",
                location: "Nagaram Main Road",
                distance: "0.8 km",
                rating: 4.5,
                deliveryTime: "25-35 min",
                cuisines: ["Indian", "Biryani", "Hyderabadi"],
                priceRange: "₹₹",
                image: "🍛",
                offers: ["50% off on orders above ₹300"],
                isOpen: true,
                deliveryFee: 30,
                menu: {
                    biryani: [
                        { id: 101, name: "Chicken Biryani", price: 180, description: "Aromatic basmati rice with tender chicken", veg: false, rating: 4.8, popular: true, category: "biryani" },
                        { id: 102, name: "Mutton Biryani", price: 220, description: "Premium mutton with fragrant spices", veg: false, rating: 4.7, popular: true, category: "biryani" },
                        { id: 103, name: "Veg Biryani", price: 150, description: "Mixed vegetables with saffron rice", veg: true, rating: 4.5, popular: false, category: "biryani" },
                        { id: 104, name: "Egg Biryani", price: 160, description: "Boiled eggs with spiced rice", veg: false, rating: 4.3, popular: false, category: "biryani" }
                    ],
                    curries: [
                        { id: 105, name: "Butter Chicken", price: 160, description: "Creamy tomato-based chicken curry", veg: false, rating: 4.6, popular: true, category: "curry" },
                        { id: 106, name: "Dal Tadka", price: 90, description: "Yellow lentils with tempering", veg: true, rating: 4.4, popular: false, category: "curry" },
                        { id: 107, name: "Paneer Butter Masala", price: 140, description: "Cottage cheese in rich gravy", veg: true, rating: 4.5, popular: true, category: "curry" }
                    ]
                }
            },
            {
                id: 2,
                name: "Dosa Junction",
                location: "Dammiguda Circle",
                distance: "1.2 km",
                rating: 4.3,
                deliveryTime: "20-30 min",
                cuisines: ["South Indian", "Dosa", "Breakfast"],
                priceRange: "₹",
                image: "🥞",
                offers: ["Free chutney with every order"],
                isOpen: true,
                deliveryFee: 25,
                menu: {
                    dosas: [
                        { id: 201, name: "Plain Dosa", price: 80, description: "Crispy rice crepe", veg: true, rating: 4.3, popular: false, category: "dosa" },
                        { id: 202, name: "Masala Dosa", price: 100, description: "Dosa with spiced potato filling", veg: true, rating: 4.7, popular: true, category: "dosa" },
                        { id: 203, name: "Cheese Dosa", price: 120, description: "Dosa with cheese filling", veg: true, rating: 4.4, popular: true, category: "dosa" },
                        { id: 204, name: "Chicken Dosa", price: 140, description: "Dosa with chicken filling", veg: false, rating: 4.5, popular: false, category: "dosa" }
                    ],
                    idli_vada: [
                        { id: 205, name: "Idli (2pcs)", price: 60, description: "Steamed rice cakes", veg: true, rating: 4.5, popular: true, category: "south_indian" },
                        { id: 206, name: "Vada (2pcs)", price: 70, description: "Fried lentil donuts", veg: true, rating: 4.2, popular: false, category: "south_indian" },
                        { id: 207, name: "Sambar Vada", price: 80, description: "Vada in sambar", veg: true, rating: 4.4, popular: false, category: "south_indian" }
                    ]
                }
            },
            {
                id: 3,
                name: "Pizza Corner",
                location: "Nagaram X Roads",
                distance: "0.5 km",
                rating: 4.1,
                deliveryTime: "30-40 min",
                cuisines: ["Italian", "Pizza", "Fast Food"],
                priceRange: "₹₹",
                image: "🍕",
                offers: ["Buy 1 Get 1 on medium pizzas"],
                isOpen: true,
                deliveryFee: 35,
                menu: {
                    pizzas: [
                        { id: 301, name: "Margherita Pizza", price: 200, description: "Classic tomato and mozzarella", veg: true, rating: 4.5, popular: true, category: "pizza" },
                        { id: 302, name: "Chicken Supreme", price: 280, description: "Chicken with vegetables", veg: false, rating: 4.6, popular: true, category: "pizza" },
                        { id: 303, name: "Paneer Tikka Pizza", price: 250, description: "Indian style paneer pizza", veg: true, rating: 4.4, popular: false, category: "pizza" },
                        { id: 304, name: "Pepperoni Pizza", price: 300, description: "Spicy pepperoni with cheese", veg: false, rating: 4.7, popular: true, category: "pizza" }
                    ],
                    sides: [
                        { id: 305, name: "Garlic Bread", price: 120, description: "Herb-infused garlic bread", veg: true, rating: 4.2, popular: false, category: "appetizer" },
                        { id: 306, name: "Chicken Wings", price: 180, description: "Spicy chicken wings", veg: false, rating: 4.5, popular: true, category: "appetizer" }
                    ]
                }
            },
            {
                id: 4,
                name: "Burger King",
                location: "Dammiguda Main Road",
                distance: "1.5 km",
                rating: 4.0,
                deliveryTime: "20-30 min",
                cuisines: ["American", "Burgers", "Fast Food"],
                priceRange: "₹₹",
                image: "🍔",
                offers: ["20% off on combo meals"],
                isOpen: true,
                deliveryFee: 40,
                menu: {
                    burgers: [
                        { id: 401, name: "Whopper", price: 220, description: "Flame-grilled beef burger", veg: false, rating: 4.4, popular: true, category: "burger" },
                        { id: 402, name: "Chicken Maharaja", price: 180, description: "Spicy chicken burger", veg: false, rating: 4.6, popular: true, category: "burger" },
                        { id: 403, name: "Veg Whopper", price: 160, description: "Plant-based patty burger", veg: true, rating: 4.2, popular: false, category: "burger" }
                    ],
                    sides: [
                        { id: 404, name: "French Fries", price: 80, description: "Crispy golden fries", veg: true, rating: 4.3, popular: true, category: "fast_food" },
                        { id: 405, name: "Chicken Nuggets", price: 120, description: "Crispy chicken pieces", veg: false, rating: 4.1, popular: false, category: "fast_food" }
                    ]
                }
            },
            {
                id: 5,
                name: "Chai Sutta Bar",
                location: "Nagaram Bus Stop",
                distance: "0.3 km",
                rating: 4.4,
                deliveryTime: "15-25 min",
                cuisines: ["Beverages", "Snacks", "Street Food"],
                priceRange: "₹",
                image: "☕",
                offers: ["Free delivery on orders above ₹150"],
                isOpen: true,
                deliveryFee: 20,
                menu: {
                    beverages: [
                        { id: 501, name: "Masala Chai", price: 25, description: "Traditional spiced tea", veg: true, rating: 4.7, popular: true, category: "beverage" },
                        { id: 502, name: "Filter Coffee", price: 30, description: "South Indian filter coffee", veg: true, rating: 4.5, popular: true, category: "beverage" },
                        { id: 503, name: "Lemon Tea", price: 20, description: "Refreshing lemon tea", veg: true, rating: 4.2, popular: false, category: "beverage" }
                    ],
                    snacks: [
                        { id: 504, name: "Samosa", price: 15, description: "Crispy fried pastry", veg: true, rating: 4.4, popular: true, category: "snack" },
                        { id: 505, name: "Pakoda", price: 40, description: "Mixed vegetable fritters", veg: true, rating: 4.3, popular: false, category: "snack" }
                    ]
                }
            },
            {
                id: 6,
                name: "Chinese Dragon",
                location: "Dammiguda Market",
                distance: "1.0 km",
                rating: 4.2,
                deliveryTime: "25-35 min",
                cuisines: ["Chinese", "Indo-Chinese", "Asian"],
                priceRange: "₹₹",
                image: "🍜",
                offers: ["30% off on weekdays"],
                isOpen: true,
                deliveryFee: 30,
                menu: {
                    noodles: [
                        { id: 601, name: "Chicken Noodles", price: 140, description: "Stir-fried noodles with chicken", veg: false, rating: 4.5, popular: true, category: "noodles" },
                        { id: 602, name: "Veg Noodles", price: 120, description: "Mixed vegetable noodles", veg: true, rating: 4.3, popular: false, category: "noodles" },
                        { id: 603, name: "Schezwan Noodles", price: 150, description: "Spicy Schezwan sauce noodles", veg: true, rating: 4.6, popular: true, category: "noodles" }
                    ],
                    rice: [
                        { id: 604, name: "Chicken Fried Rice", price: 160, description: "Wok-tossed rice with chicken", veg: false, rating: 4.4, popular: true, category: "fried_rice" },
                        { id: 605, name: "Veg Fried Rice", price: 130, description: "Vegetable fried rice", veg: true, rating: 4.2, popular: false, category: "fried_rice" }
                    ]
                }
            }
        ];
    }

    initializeDishCategories() {
        return {
            'biryani': {
                name: 'Biryani',
                description: 'Aromatic rice dishes with premium ingredients',
                icon: '🍛',
                popular_items: []
            },
            'pizza': {
                name: 'Pizza',
                description: 'Italian classics with fresh toppings',
                icon: '🍕',
                popular_items: []
            },
            'dosa': {
                name: 'Dosa',
                description: 'South Indian crispy crepes',
                icon: '🥞',
                popular_items: []
            },
            'burger': {
                name: 'Burger',
                description: 'Juicy burgers with premium patties',
                icon: '🍔',
                popular_items: []
            },
            'noodles': {
                name: 'Noodles',
                description: 'Stir-fried noodles with authentic flavors',
                icon: '🍜',
                popular_items: []
            },
            'beverage': {
                name: 'Beverages',
                description: 'Refreshing drinks and traditional teas',
                icon: '☕',
                popular_items: []
            },
            'curry': {
                name: 'Curry',
                description: 'Rich gravies with authentic spices',
                icon: '🍛',
                popular_items: []
            },
            'fast_food': {
                name: 'Fast Food',
                description: 'Quick bites and crispy snacks',
                icon: '🍟',
                popular_items: []
            }
        };
    }

    async generateResponse(userMessage, conversationHistory) {
        const processedMessage = this.preprocessMessage(userMessage);
        const intent = this.detectIntent(processedMessage, conversationHistory);
        
        // Check for eco-friendly mode toggle
        if (this.matchPatterns(processedMessage.tokens, [['eco', 'green', 'sustainable']])) {
            this.ecoFriendlyMode = !this.ecoFriendlyMode;
            return {
                text: this.ecoFriendlyMode ? 
                    "🌱 Eco-friendly mode activated! I'll help you find sustainable dining options." :
                    "Eco-friendly mode deactivated.",
                action: 'toggle_eco_mode',
                data: { ecoFriendlyMode: this.ecoFriendlyMode }
            };
        }
        
        let response;
        
        switch (intent.type) {
            case 'greeting':
                response = this.generateGreeting(intent);
                break;
            case 'find_restaurants':
                response = this.handleRestaurantSearch(intent);
                break;
            case 'cuisine_search':
                response = this.handleCuisineSearch(intent);
                break;
            case 'restaurant_details':
                response = this.handleRestaurantDetails(intent);
                break;
            case 'menu_inquiry':
                response = this.handleMenuInquiry(intent);
                break;
            case 'add_to_cart':
                response = this.handleAddToCart(intent);
                break;
            case 'dietary_filter':
                response = this.handleDietaryFilter(intent);
                break;
            case 'location_inquiry':
                response = this.handleLocationInquiry(intent);
                break;
            case 'delivery_inquiry':
                response = this.handleDeliveryInquiry(intent);
                break;
            case 'popular_items':
                response = this.handlePopularItems(intent);
                break;
            case 'best_dishes':
                response = this.handleBestDishes(intent);
                break;
            case 'dish_category_search':
                response = this.handleDishCategorySearch(intent);
                break;
            case 'price_inquiry':
                response = this.handlePriceInquiry(intent);
                break;
            default:
                response = this.generateFallbackResponse(intent);
        }
        
        return this.addPersonality(response, intent);
    }

    preprocessMessage(message) {
        return {
            original: message,
            lowercase: message.toLowerCase(),
            tokens: message.toLowerCase().split(/\s+/),
            normalized: message.toLowerCase().replace(/[^\w\s]/g, '').trim()
        };
    }

    detectIntent(processedMessage, history) {
        const { tokens, lowercase } = processedMessage;
        
        // Greeting detection
        if (this.matchPatterns(tokens, [['hello', 'hi', 'hey', 'good'], ['morning', 'afternoon', 'evening']])) {
            return { type: 'greeting', confidence: 0.9 };
        }
        
        // Restaurant search
        if (this.matchPatterns(tokens, [['find', 'show', 'search', 'nearby', 'restaurants', 'places']])) {
            return { type: 'find_restaurants', confidence: 0.9 };
        }
        
        // Best dishes / Top rated queries
        const dishCategory = this.detectDishCategory(tokens);
        if (dishCategory && this.matchPatterns(tokens, [['best', 'top', 'good', 'popular', 'rated']])) {
            return { type: 'best_dishes', category: dishCategory, confidence: 0.9 };
        }

        // Cuisine-specific search
        const cuisine = this.detectCuisine(tokens);
        if (cuisine) {
            return { type: 'cuisine_search', cuisine, confidence: 0.8 };
        }

        // Dish category search (without "best" qualifier)
        if (dishCategory) {
            return { type: 'dish_category_search', category: dishCategory, confidence: 0.8 };
        }
        
        // Menu inquiries
        if (this.matchPatterns(tokens, [['menu', 'food', 'dish', 'items', 'order']])) {
            return { type: 'menu_inquiry', confidence: 0.8 };
        }
        
        // Add to cart
        if (this.matchPatterns(tokens, [['add', 'order', 'buy', 'get']])) {
            const item = this.findMenuItemAcrossRestaurants(lowercase);
            return { type: 'add_to_cart', item, confidence: 0.8 };
        }
        
        // Dietary filters
        if (this.matchPatterns(tokens, [['vegetarian', 'vegan', 'veg', 'non-veg']])) {
            const dietary = this.detectDietaryType(tokens);
            return { type: 'dietary_filter', dietary, confidence: 0.8 };
        }
        
        // Popular items
        if (this.matchPatterns(tokens, [['popular', 'trending', 'best', 'top', 'famous']])) {
            return { type: 'popular_items', confidence: 0.8 };
        }
        
        // Delivery inquiry
        if (this.matchPatterns(tokens, [['delivery', 'deliver', 'time', 'fast']])) {
            return { type: 'delivery_inquiry', confidence: 0.8 };
        }
        
        // Price inquiry
        if (this.matchPatterns(tokens, [['price', 'cost', 'cheap', 'expensive', 'budget']])) {
            return { type: 'price_inquiry', confidence: 0.8 };
        }
        
        return { type: 'general', confidence: 0.5 };
    }

    matchPatterns(tokens, patterns) {
        return patterns.some(pattern => 
            pattern.some(word => tokens.includes(word))
        );
    }

    detectCuisine(tokens) {
        const cuisines = {
            'indian': ['indian', 'biryani', 'curry', 'dal', 'roti'],
            'south indian': ['south', 'dosa', 'idli', 'sambar', 'vada'],
            'chinese': ['chinese', 'noodles', 'fried rice', 'manchurian'],
            'italian': ['italian', 'pizza', 'pasta'],
            'fast food': ['fast', 'burger', 'fries', 'quick'],
            'beverages': ['tea', 'coffee', 'chai', 'drinks']
        };
        
        for (const [cuisine, keywords] of Object.entries(cuisines)) {
            if (keywords.some(keyword => tokens.includes(keyword))) {
                return cuisine;
            }
        }
        return null;
    }

    detectDishCategory(tokens) {
        const categories = {
            'biryani': ['biryani', 'biriyani', 'rice'],
            'pizza': ['pizza', 'pizzas'],
            'dosa': ['dosa', 'dosas', 'crepe'],
            'burger': ['burger', 'burgers'],
            'noodles': ['noodles', 'noodle'],
            'beverage': ['tea', 'coffee', 'chai', 'drink', 'beverage'],
            'curry': ['curry', 'curries', 'gravy'],
            'fast_food': ['fries', 'nuggets', 'wings'],
            'snack': ['samosa', 'pakoda', 'snacks'],
            'fried_rice': ['fried rice', 'rice']
        };
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => tokens.includes(keyword) || tokens.join(' ').includes(keyword))) {
                return category;
            }
        }
        return null;
    }

    generateGreeting(intent) {
        const greetings = [
            "Hello! Welcome to FoodieBot! 🍽️ I can help you discover amazing restaurants near Nagaram-Dammiguda. What are you craving today?",
            "Hi there! 👋 Ready to explore delicious food options in your area? I know all the best spots around Nagaram and Dammiguda!",
            "Welcome! 😊 I'm here to help you find the perfect meal from restaurants near you. What type of cuisine are you in the mood for?",
            "Hey! 🤖 Hungry? Let me help you discover fantastic restaurants and order your favorite food right to your doorstep!"
        ];
        
        return {
            text: greetings[Math.floor(Math.random() * greetings.length)],
            action: 'show_welcome',
            data: { location: this.currentLocation }
        };
    }

    handleRestaurantSearch(intent) {
        try {
            // Sort restaurants by rating and distance
            const sortedRestaurants = [...this.nearbyRestaurants].sort((a, b) => {
                if (b.rating !== a.rating) {
                    return b.rating - a.rating;
                }
                return parseFloat(a.distance) - parseFloat(b.distance);
            });

            const restaurantList = sortedRestaurants.map(r => 
                `🍽️ **${r.name}** (${r.rating}⭐)\n` +
                `📍 ${r.location} • ${r.distance}\n` +
                `🍴 ${r.cuisines.join(', ')}\n` +
                `⏱️ ${r.deliveryTime} • ${r.priceRange}\n` +
                `🆔 ${r.id}`
            ).join('\n\n');

            return {
                text: `Here are all the restaurants near you in ${this.currentLocation}:\n\n${restaurantList}\n\nTap on any restaurant to view their menu! 🍽️`,
                action: 'show_restaurants',
                data: sortedRestaurants
            };
        } catch (error) {
            console.error('Error in restaurant search:', error);
            return {
                text: "I'm having trouble finding restaurants at the moment. Please try again.",
                action: null,
                data: null
            };
        }
    }

    handleCuisineSearch(intent) {
        const { cuisine } = intent;
        const filteredRestaurants = this.nearbyRestaurants.filter(r => 
            r.cuisines.some(c => c.toLowerCase().includes(cuisine.toLowerCase()))
        );
        
        if (filteredRestaurants.length > 0) {
            const restaurantList = filteredRestaurants.slice(0, 4).map(r => 
                `🍽️ **${r.name}** (${r.rating}⭐)\n📍 ${r.distance} • ${r.deliveryTime}\n🎯 Specializes in ${cuisine}`
            ).join('\n\n');
            
            return {
                text: `Great choice! Here are the best ${cuisine} restaurants near you:\n\n${restaurantList}\n\nWhich one catches your eye? 👀`,
                action: 'show_restaurants',
                data: filteredRestaurants
            };
        } else {
            return {
                text: `I couldn't find ${cuisine} restaurants in your immediate area, but let me show you some similar options that you might love! 🤔`,
                action: 'show_alternatives',
                data: { requestedCuisine: cuisine }
            };
        }
    }

    handleMenuInquiry(intent) {
        if (this.selectedRestaurant) {
            const restaurant = this.selectedRestaurant;
            const menuText = this.formatRestaurantMenu(restaurant);
            
            return {
                text: `Here's the menu for **${restaurant.name}**:\n\n${menuText}\n\nWhat would you like to add to your cart? 🛒`,
                action: 'show_menu',
                data: restaurant
            };
        } else {
            return {
                text: "Which restaurant's menu would you like to see? Here are some popular options near you:",
                action: 'show_restaurants',
                data: this.nearbyRestaurants.slice(0, 4)
            };
        }
    }

    handlePopularItems(intent) {
        const popularItems = [
            { restaurant: "Biryani Paradise", item: "Chicken Biryani", price: 180 },
            { restaurant: "Pizza Corner", item: "Margherita Pizza", price: 200 },
            { restaurant: "Dosa Junction", item: "Masala Dosa", price: 100 },
            { restaurant: "Chinese Dragon", item: "Chicken Noodles", price: 140 }
        ];
        
        const itemList = popularItems.map(item => 
            `⭐ **${item.item}** - ₹${item.price}\nFrom ${item.restaurant}`
        ).join('\n\n');
        
        return {
            text: `Here are the most popular dishes in your area right now:\n\n${itemList}\n\nWant to order any of these? Just let me know! 🌟`,
            action: 'show_popular',
            data: popularItems
        };
    }

    handleDeliveryInquiry(intent) {
        const fastDeliveryRestaurants = this.nearbyRestaurants
            .filter(r => parseInt(r.deliveryTime) <= 25)
            .slice(0, 4);
        
        const deliveryList = fastDeliveryRestaurants.map(r => 
            `🚀 **${r.name}** - ${r.deliveryTime}\n📍 ${r.distance} away`
        ).join('\n\n');
        
        return {
            text: `These restaurants offer the fastest delivery to ${this.currentLocation}:\n\n${deliveryList}\n\nAll deliver within 25 minutes! ⚡`,
            action: 'show_fast_delivery',
            data: fastDeliveryRestaurants
        };
    }

    handleBestDishes(intent) {
        const { category } = intent;
        const bestDishes = this.getBestDishesByCategory(category);
        
        if (bestDishes.length === 0) {
            return {
                text: `I couldn't find any ${category} dishes in your area. Let me show you other popular options! 🤔`,
                action: 'show_alternatives',
                data: { requestedCategory: category }
            };
        }

        const categoryInfo = this.dishCategories[category];
        
        return {
            text: `Here are the **best ${categoryInfo?.name || category}** dishes near you! 🌟`,
            action: 'show_dish_cards',
            data: {
                dishes: bestDishes,
                title: `Best ${categoryInfo?.name || category}`,
                category: category
            }
        };
    }

    handleDishCategorySearch(intent) {
        const { category } = intent;
        const categoryDishes = this.getDishesByCategory(category);
        
        if (categoryDishes.length === 0) {
            return {
                text: `No ${category} dishes found in your area. Let me show you similar options! 🔍`,
                action: 'show_alternatives',
                data: { requestedCategory: category }
            };
        }

        const categoryInfo = this.dishCategories[category];
        
        return {
            text: `Found **${categoryDishes.length} ${categoryInfo?.name || category}** options for you! 📋`,
            action: 'show_dish_cards',
            data: {
                dishes: categoryDishes.slice(0, 8),
                title: `${categoryInfo?.name || category} Options`,
                category: category
            }
        };
    }

    formatRestaurantMenu(restaurant) {
        let menuText = '';
        for (const [category, items] of Object.entries(restaurant.menu)) {
            menuText += `**${category.toUpperCase()}**\n`;
            items.forEach(item => {
                const vegIcon = item.veg ? '🟢' : '🔴';
                menuText += `${vegIcon} ${item.name} - ₹${item.price}\n${item.description}\n\n`;
            });
        }
        return menuText;
    }

    findMenuItemAcrossRestaurants(query) {
        for (const restaurant of this.nearbyRestaurants) {
            for (const category of Object.values(restaurant.menu)) {
                const item = category.find(item => 
                    query.includes(item.name.toLowerCase()) ||
                    item.name.toLowerCase().includes(query.split(' ')[0])
                );
                if (item) {
                    return { ...item, restaurant: restaurant.name, restaurantId: restaurant.id };
                }
            }
        }
        return null;
    }

    detectDietaryType(tokens) {
        if (tokens.includes('vegetarian') || tokens.includes('veg')) return 'vegetarian';
        if (tokens.includes('non-veg') || tokens.includes('chicken') || tokens.includes('mutton')) return 'non-vegetarian';
        return 'vegetarian';
    }

    generateFallbackResponse(intent) {
        const fallbacks = [
            "I'd love to help you find great food! Try asking me about restaurants near you, specific cuisines, or popular dishes! 🍽️",
            "Not sure what you're looking for? Ask me about nearby restaurants, delivery options, or what's popular in your area! 😊",
            "I'm here to help you discover amazing food! You can ask about restaurants, menus, prices, or place orders. What sounds good? 🤔",
            "Let me help you find something delicious! Try searching for cuisines like 'Indian food' or 'pizza near me'! 🍕"
        ];
        
        return {
            text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
            action: null,
            data: null
        };
    }

    addPersonality(response, intent) {
        // Add location context and emojis
        if (!response.text.includes('😊') && !response.text.includes('🍽️') && Math.random() > 0.3) {
            const emojis = ['😊', '🍽️', '🤤', '✨', '🎉', '🚀'];
            response.text += ' ' + emojis[Math.floor(Math.random() * emojis.length)];
        }
        
        return response;
    }

    // Helper methods for dish categories
    getBestDishesByCategory(category) {
        const allDishes = [];
        
        this.nearbyRestaurants.forEach(restaurant => {
            Object.values(restaurant.menu).forEach(menuCategory => {
                menuCategory.forEach(dish => {
                    if (dish.category === category && dish.rating >= 4.5) {
                        allDishes.push({
                            ...dish,
                            restaurant: restaurant.name,
                            restaurantId: restaurant.id
                        });
                    }
                });
            });
        });
        
        // Sort by rating (highest first) and popularity
        return allDishes
            .sort((a, b) => {
                if (a.popular && !b.popular) return -1;
                if (!a.popular && b.popular) return 1;
                return b.rating - a.rating;
            })
            .slice(0, 5);
    }
    
    getDishesByCategory(category) {
        const allDishes = [];
        
        this.nearbyRestaurants.forEach(restaurant => {
            Object.values(restaurant.menu).forEach(menuCategory => {
                menuCategory.forEach(dish => {
                    if (dish.category === category) {
                        allDishes.push({
                            ...dish,
                            restaurant: restaurant.name,
                            restaurantId: restaurant.id
                        });
                    }
                });
            });
        });
        
        // Sort by rating and popularity
        return allDishes
            .sort((a, b) => {
                if (a.popular && !b.popular) return -1;
                if (!a.popular && b.popular) return 1;
                return b.rating - a.rating;
            });
    }

    // Helper method to set current restaurant context
    setSelectedRestaurant(restaurantId) {
        this.selectedRestaurant = this.nearbyRestaurants.find(r => r.id === restaurantId);
    }
}

// Initialize the AI when script loads
const chatbotAI = new FoodieBotAI();

// Make it globally accessible
window.chatbotAI = chatbotAI;

// Dynamic response generator with personality
const intelligentResponses = {
    generateResponse(input, context) {
        const sentiment = advancedAnalysis.analyzeSentiment(input);
        const entities = advancedAnalysis.extractEntities(input);
        const intent = advancedAnalysis.recognizeIntent(input);
        
        switch (intent) {
            case 'greeting':
                return this.handleGreeting(sentiment);
            case 'recommendation':
                return this.handleRecommendation(entities);
            case 'complaint':
                return "Oh no! I'm really sorry to hear that. 😔 Your experience matters to us. Can you tell me more about what happened? I'll make sure to address this right away. 💙";
            case 'compliment':
                return "Aww, thank you so much! 😊 That really makes my day! I'm so happy you're enjoying everything!";
            default:
                return this.handleGeneral(input, entities);
        }
    },

    handleGreeting(sentiment) {
        const greetings = [
            "Hello! Welcome to our restaurant family! 😊 What can I help you discover today?",
            "Hi there! I'm excited to help you find some amazing food! 🍽️",
            "Hey! Great to see you here. Ready for a delicious adventure? ✨",
            "Welcome! I'm your friendly food assistant. What sounds good to you today? 🤔"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    },

    handleRecommendation(entities) {
        const restaurant = nearbyRestaurants[currentRestaurantIndex];
        const specials = restaurant.specials;
        
        if (entities.foods.length > 0) {
            return `Great taste! ${entities.foods[0]} is an excellent choice! Would you like me to add it to your cart? 😋`;
        }
        
        return `Oh, I have fantastic recommendations! Our customers absolutely love ${specials[0]} and ${specials[1]}! They're chef's specials! 🌟 Would you like to try one?`;
    },

    handleGeneral(input, entities) {
        if (entities.foods.length > 0) {
            return `I noticed you mentioned ${entities.foods.join(', ')}! That sounds delicious. Would you like me to find it for you? 🔍`;
        }
        
        const helpfulResponses = [
            "I'm here to help! What would you like to know more about? 😊",
            "Interesting! How can I assist you with that? 🤔",
            "I want to make sure I help you perfectly. Could you tell me a bit more? 💭"
        ];
        
        return helpfulResponses[Math.floor(Math.random() * helpfulResponses.length)];
    }
};

// Enhanced message display with personality
function addBotMessage(message) {
    // Remove typing indicator first
    removeTypingIndicator();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message bot-message';
    
    // Add message with enhanced formatting and emoji support
    messageDiv.innerHTML = message.replace(/\n/g, '<br>');
    
    // Add fade-in animation
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(10px)';
    
    chatMessages.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => {
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    }, 50);
    
    scrollToBottom();
}

function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user-message';
    messageDiv.textContent = message;
    
    // Add slide-in animation from right
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateX(20px)';
    
    chatMessages.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => {
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(0)';
    }, 50);
    
    scrollToBottom();
}

function showTypingIndicator() {
    // Remove any existing typing indicator
    removeTypingIndicator();
    
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    
    // Add some personality to typing indicator
    const thinkingMessages = [
        '🤔 Thinking...',
        '💭 Processing...',
        '🧠 Analyzing...',
        '✨ Crafting response...'
    ];
    
    // Randomly show a thinking message sometimes
    if (Math.random() < 0.3) {
        indicator.innerHTML = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
    }
    
    chatMessages.appendChild(indicator);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicators = chatMessages.querySelectorAll('.typing-indicator');
    indicators.forEach(indicator => {
        indicator.style.opacity = '0';
        setTimeout(() => indicator.remove(), 200);
    });
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function processOrder() {
    if (state.cart.length === 0) {
        addBotMessage("Your cart is empty. Please add some items before placing an order.");
        return;
    }

    const orderNumber = generateOrderNumber();
    const orderSummary = {
        orderNumber,
        items: state.cart,
        total: calculateTotal(),
        status: 'confirmed',
        timestamp: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 45 * 60000).toISOString() // 45 minutes from now
    };

    // Store order in session storage
    sessionStorage.setItem('currentOrder', JSON.stringify(orderSummary));
    
    // Clear cart
    state.cart = [];
    updateCartUI();

    // Show order confirmation
    let message = `🎉 Order placed successfully!\n\n`;
    message += `Order #${orderNumber}\n\n`;
    message += `Items ordered:\n`;
    orderSummary.items.forEach(item => {
        message += `• ${item.name} (${item.quantity}x) - ₹${(item.price * item.quantity).toFixed(2)}\n`;
    });
    message += `\nTotal: ₹${orderSummary.total.toFixed(2)}`;
    message += `\n\nEstimated delivery time: ${new Date(orderSummary.estimatedDelivery).toLocaleTimeString()}`;
    message += `\n\nProceeding to payment...`;

    addBotMessage(message);
    state.currentStep = 'order_confirmed';
    
    // Automatically proceed to payment after a short delay
    setTimeout(() => {
        processPayment();
    }, 2000);
}

function processPayment() {
    const order = JSON.parse(sessionStorage.getItem('currentOrder'));
    if (!order) {
        addBotMessage("No active order found. Please place an order first.");
        return;
    }

    if (order.paymentStatus === 'completed') {
        addBotMessage("This order has already been paid for.");
        return;
    }

    state.currentStep = 'payment';
    let message = "💳 Payment Options:\n\n";
    message += "1. UPI (Google Pay, PhonePe, Paytm)\n";
    message += "2. Credit/Debit Card\n";
    message += "3. Net Banking\n";
    message += "4. Cash on Delivery\n\n";
    message += "Please type your preferred payment method or 'cancel' to go back.";

    addBotMessage(message);
}

function trackOrder() {
    const order = JSON.parse(sessionStorage.getItem('currentOrder'));
    if (!order) {
        addBotMessage("No active order found. Please place an order first.");
        return;
    }

    const now = new Date();
    const deliveryTime = new Date(order.estimatedDelivery);
    const timeLeft = Math.max(0, Math.floor((deliveryTime - now) / 60000)); // minutes left

    let status = "🔄";
    if (timeLeft <= 0) {
        status = "✅";
    } else if (timeLeft <= 15) {
        status = "🚚";
    }

    let message = `${status} Order Tracking\n\n`;
    message += `Order #${order.orderNumber}\n\n`;
    message += `Status: ${order.status}\n`;
    message += `Estimated delivery: ${new Date(order.estimatedDelivery).toLocaleTimeString()}\n`;
    
    if (timeLeft > 0) {
        message += `Time remaining: ${timeLeft} minutes\n`;
    } else {
        message += `Your order should be arriving any moment now!\n`;
    }

    if (order.paymentStatus === 'completed') {
        message += `\nPayment Status: ✅ Paid`;
    } else {
        message += `\nPayment Status: ⏳ Pending`;
        message += `\nType "payment" to complete the payment.`;
    }

    addBotMessage(message);
}

function addToCart(item) {
    console.log('=== ADD TO CART DEBUG ===');
    console.log('Item received:', item);
    console.log('Current state object:', state);
    console.log('Current cart before adding:', state.cart);
    
    if (!item) {
        console.error('No item provided to addToCart');
        return;
    }
    
    // Ensure state.cart exists and is an array
    if (!state.cart || !Array.isArray(state.cart)) {
        console.log('Initializing cart as empty array');
        state.cart = [];
    }
    
    // Find existing item in cart
    const existingItem = state.cart.find(cartItem => cartItem.name === item.name);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
        console.log('Updated existing item quantity:', existingItem.quantity);
    } else {
        const newItem = {
            name: item.name,
            price: item.price,
            description: item.description,
            quantity: 1
        };
        state.cart.push(newItem);
        console.log('Added new item to cart:', newItem);
    }
    
    console.log('Cart after adding:', state.cart);
    console.log('Cart length:', state.cart.length);
    console.log('=== END ADD TO CART DEBUG ===');
    
    updateCartUI();
}

function calculateTotal() {
    console.log('=== CALCULATE TOTAL DEBUG ===');
    console.log('Cart for calculation:', state.cart);
    
    if (!state.cart || !Array.isArray(state.cart) || state.cart.length === 0) {
        console.log('Cart is empty or invalid, returning 0');
        return 0;
    }
    
    const total = state.cart.reduce((sum, item) => {
        const itemTotal = item.price * (item.quantity || 1);
        console.log(`Item: ${item.name}, Price: ${item.price}, Quantity: ${item.quantity}, Subtotal: ${itemTotal}`);
        return sum + itemTotal;
    }, 0);
    
    console.log('Total calculated:', total);
    console.log('=== END CALCULATE TOTAL DEBUG ===');
    return total;
}

function updateCartUI() {
    console.log('=== UPDATE CART UI DEBUG ===');
    console.log('Current cart for UI update:', state.cart);
    
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = totalItems;
        console.log('Updated cart UI with total items:', totalItems);
    } else {
        console.log('Cart count element not found');
    }
    console.log('=== END UPDATE CART UI DEBUG ===');
}

function showCart() {
    if (!state.cart || state.cart.length === 0) {
        addBotMessage("Your cart is empty! 🛒\n\nWould you like to browse our menu to add some delicious items?");
        return;
    }
    
    let cartMessage = "🛒 Your Cart:\n\n";
    state.cart.forEach(item => {
        cartMessage += `• ${item.name} x${item.quantity || 1} - ₹${(item.price * (item.quantity || 1)).toFixed(2)}\n`;
    });
    
    const total = calculateTotal();
    cartMessage += `\n💰 Total: ₹${total.toFixed(2)}\n\n`;
    cartMessage += "Ready to order? Type 'place order' or add more items! 😊";
    
    addBotMessage(cartMessage);
}

function generateOrderNumber() {
    return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Enhanced initChatbot with personality
function initChatbot() {
    // Progressive welcome messages for more engaging experience
    setTimeout(() => {
        addBotMessage(`👋 Hello! I'm your AI food assistant at ${restaurantInfo.name}!`);
    }, 500);
    
    setTimeout(() => {
        addBotMessage(`🏠 We're located in ${state.location.address} and I'm here to make your dining experience amazing! ✨`);
    }, 1500);
    
    setTimeout(() => {
        const welcomeMsg = `I'm powered by advanced AI and can help you with:\n\n• 🍽️ Exploring our delicious menu\n• 🛒 Placing orders with smart recommendations\n• 💳 Secure payment processing\n• 🚚 Real-time order tracking\n• 📍 Finding nearby restaurants\n\nJust chat with me naturally - I understand what you're looking for! What sounds good today?`;
        addBotMessage(welcomeMsg);
    }, 2500);

    // Event Listeners with enhanced feedback
    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUserInput();
        }
    });

    // Add typing feedback while user is typing
    let typingTimeout;
    userInput.addEventListener('input', () => {
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            // Could add "user is typing" indicators here
        }, 300);
    });

    // Global click event handler for menu item buttons
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('menu-item-btn')) {
            const itemName = decodeURIComponent(e.target.getAttribute('data-item'));
            console.log('Menu item clicked:', itemName); // Debug log
            console.log('Current cart before click processing:', state.cart);
            // Simulate user typing the item name
            processUserInput(itemName);
        }
    });

    // Dark Mode Toggle
    darkModeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        addBotMessage("Theme switched! 🎨 I can adapt to your preferences just like this!");
    });
}

// Message Handling
function handleUserInput() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to chat with animation
    addUserMessage(message);
    userInput.value = '';

    // Show immediate typing acknowledgment
    showTypingIndicator();
    
    // Add a brief pause to simulate the bot "reading" the message
    setTimeout(() => {
        processUserInput(message);
    }, 500);
}

function processUserInput(input) {
    // Add to conversation memory
    conversationMemory.addMessage('user', input);
    
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate realistic thinking time based on input complexity
    const complexity = input.split(' ').length;
    const thinkingTime = Math.min(800 + (complexity * 100), 2000);
    
    setTimeout(() => {
        // Convert input to lowercase for easier matching
        const userInput = input.toLowerCase().trim();

        // Handle special commands first
        if (userInput === 'place order' || userInput === 'place an order') {
            removeTypingIndicator();
            processOrder();
            return;
        }

        if (userInput === 'payment' || userInput === 'pay') {
            removeTypingIndicator();
            processPayment();
            return;
        }

        if (userInput === 'track' || userInput === 'track order') {
            removeTypingIndicator();
            trackOrder();
            return;
        }

        if (userInput === 'menu' || userInput === 'show menu') {
            removeTypingIndicator();
            showMenu();
            return;
        }

        if (userInput === 'cart' || userInput === 'show cart') {
            removeTypingIndicator();
            showCart();
            return;
        }

        if (userInput === 'nearby' || userInput === 'nearby restaurants' || userInput === 'restaurants nearby' || userInput === 'show nearby restaurants') {
            removeTypingIndicator();
            showNearbyRestaurants();
            return;
        }

        // Handle selecting a nearby restaurant by name or number
        for (let i = 0; i < nearbyRestaurants.length; i++) {
            if (userInput === nearbyRestaurants[i].name.toLowerCase() || userInput === String(i + 1)) {
                currentRestaurantIndex = i;
                removeTypingIndicator();
                addBotMessage(`You selected ${nearbyRestaurants[i].name}. Here is their menu:`);
                showMenu();
                return;
            }
        }

        // Handle payment method selection
        if (state.currentStep === 'payment') {
            if (userInput === 'cancel') {
                state.currentStep = 'order_confirmed';
                removeTypingIndicator();
                addBotMessage("Payment cancelled. You can try again later by typing 'payment'.");
                return;
            }

            const paymentMethod = userInput.toLowerCase();
            if (['upi', 'card', 'netbanking', 'cod'].includes(paymentMethod)) {
                removeTypingIndicator();
                addBotMessage("Processing payment...");
                setTimeout(() => {
                    const order = JSON.parse(sessionStorage.getItem('currentOrder'));
                    order.paymentStatus = 'completed';
                    sessionStorage.setItem('currentOrder', JSON.stringify(order));
                    addBotMessage("✅ Payment successful! Your order will be prepared shortly.");
                    state.currentStep = 'order_confirmed';
                }, 2000);
                return;
            }
        }

        // Handle menu item selection
        const selectedItem = findMenuItem(userInput);
        if (selectedItem) {
            console.log('=== MENU ITEM SELECTION DEBUG ===');
            console.log('Selected item:', selectedItem);
            console.log('Current cart before adding:', state.cart);
            
            const quantity = conversationAnalysis.extractQuantity(input);
            console.log('Quantity to add:', quantity);
            
            // Add items to cart
            for (let i = 0; i < quantity; i++) {
                addToCart(selectedItem);
            }
            
            // Wait a moment for cart to update, then generate message
            setTimeout(() => {
                console.log('Cart after adding items:', state.cart);
                
                // Get updated cart info
                const cartItemCount = state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                const cartTotal = calculateTotal();
                
                console.log('Final cart count:', cartItemCount);
                console.log('Final cart total:', cartTotal);
                
                // Generate confirmation message with updated cart info
                let message = `✅ Perfect choice! I've added ${selectedItem.name} to your cart.\n`;
                message += `Price: ₹${selectedItem.price.toFixed(2)}\n`;
                if (quantity > 1) {
                    message += `Quantity: ${quantity}\n`;
                    message += `Subtotal: ₹${(selectedItem.price * quantity).toFixed(2)}\n`;
                }
                
                message += `\nYour cart now has ${cartItemCount} item${cartItemCount !== 1 ? 's' : ''}.\n`;
                message += `Total: ₹${cartTotal.toFixed(2)}\n\n`;
                
                message += `What else can I get for you? 😊\n`;
                message += `• Add more items by clicking or typing their names\n`;
                message += `• Type 'cart' to review your order\n`;
                message += `• Type 'place order' when you're ready`;
                
                removeTypingIndicator();
                addBotMessage(message);
                conversationMemory.addMessage('assistant', message);
                console.log('=== END MENU ITEM SELECTION DEBUG ===');
            }, 100); // Small delay to ensure cart is updated
            
            return;
        }

        // Check for common questions
        const qaMatch = checkCommonQuestions(input);
        if (qaMatch) {
            removeTypingIndicator();
            addBotMessage(qaMatch);
            conversationMemory.addMessage('assistant', qaMatch);
            return;
        }

        // Use intelligent response generation for everything else
        const response = intelligentResponses.generateResponse(input, conversationMemory.getRecentContext());
        removeTypingIndicator();
        addBotMessage(response);
        conversationMemory.addMessage('assistant', response);
        
        // Auto-suggest follow-up actions based on context
        setTimeout(() => {
            const followUp = generateFollowUpSuggestion(input);
            if (followUp) {
                addBotMessage(followUp);
                conversationMemory.addMessage('assistant', followUp);
            }
        }, 1500);
        
    }, thinkingTime);
}

// Generate contextual follow-up suggestions
function generateFollowUpSuggestion(input) {
    const inputLower = input.toLowerCase();
    
    if (inputLower.includes('hungry') || inputLower.includes('food')) {
        return "Since you're hungry, would you like me to show you our quick bites or today's specials? 🍽️";
    }
    
    if (inputLower.includes('budget') || inputLower.includes('cheap') || inputLower.includes('affordable')) {
        return "I can help you find great value options! Would you like to see our budget-friendly dishes under ₹150? 💰";
    }
    
    if (inputLower.includes('spicy') || inputLower.includes('hot')) {
        return "Love spicy food? 🌶️ Our chef's special hot dishes are incredible! Want to see them?";
    }
    
    if (inputLower.includes('vegetarian') || inputLower.includes('veg')) {
        return "Great! We have amazing vegetarian options. Would you like to see our pure veg menu? 🥗";
    }
    
    return null;
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initChatbot); 
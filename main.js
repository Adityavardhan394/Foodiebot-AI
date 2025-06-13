// ===== FOODIEBOT MAIN FUNCTIONALITY - RESTAURANT DISCOVERY PLATFORM =====

class FoodieBotApp {
    constructor() {
        // Initialize only if not already initialized
        if (!window.foodieBotApp) {
            this.initializeApp();
            window.foodieBotApp = this;
        }
        return window.foodieBotApp;
    }

    initializeApp() {
        this.currentOrder = [];
        this.isTyping = false;
        this.conversationHistory = [];
        this.selectedRestaurant = null;
        this.currentLocation = "Nagaram, Dammiguda";
        this.chatbotAI = null;
        this.init();
    }

    init() {
        this.initializeChatbotAI();
        this.bindEvents();
        this.initializeWelcome();
        this.startBackgroundAnimations();
        this.initializeTheme();
    }

    initializeChatbotAI() {
        try {
            if (!window.chatbotAI) {
                this.chatbotAI = new FoodieBotAI();
                window.chatbotAI = this.chatbotAI;
                console.log('Chatbot AI initialized successfully');
            } else {
                this.chatbotAI = window.chatbotAI;
                console.log('Using existing Chatbot AI instance');
            }
        } catch (error) {
            console.error('Error initializing Chatbot AI:', error);
            // Create a fallback instance with empty data
            this.chatbotAI = new FoodieBotAI();
            window.chatbotAI = this.chatbotAI;
        }
    }

    bindEvents() {
        // Input handling
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const quickBtns = document.querySelectorAll('.quick-btn');

        // Message input events
        messageInput.addEventListener('input', this.handleInputChange.bind(this));
        messageInput.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Send button
        sendBtn.addEventListener('click', this.sendMessage.bind(this));
        
        // Quick action buttons
        quickBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const message = e.target.dataset.message;
                this.sendMessage(message);
            });
        });

        // Header actions
        document.getElementById('clearChat')?.addEventListener('click', this.clearChat.bind(this));
        document.getElementById('searchNearby')?.addEventListener('click', () => {
            this.sendMessage("Show me nearby restaurants");
        });

        // Theme toggle
        document.getElementById('toggleTheme')?.addEventListener('click', this.toggleTheme.bind(this));

        // Auto-resize textarea
        messageInput.addEventListener('input', this.autoResizeTextarea.bind(this));

        // Filter buttons for restaurants
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleRestaurantFilter(e.target.dataset.filter);
            });
        });
    }

    handleInputChange(e) {
        const input = e.target;
        const sendBtn = document.getElementById('sendBtn');
        const charCount = document.querySelector('.character-count');
        
        // Update character count
        if (charCount) {
            charCount.textContent = `${input.value.length}/500`;
        }
        
        // Enable/disable send button
        sendBtn.disabled = input.value.trim().length === 0;
        
        // Update send button opacity
        sendBtn.style.opacity = input.value.trim().length > 0 ? '1' : '0.5';
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    autoResizeTextarea(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    async sendMessage(message = null) {
        const messageInput = document.getElementById('messageInput');
        const userMessage = message || messageInput.value.trim();
        
        if (!userMessage) return;
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        document.getElementById('sendBtn').disabled = true;
        document.querySelector('.character-count').textContent = '0/500';
        
        // Hide welcome message
        this.hideWelcomeMessage();
        
        // Add user message
        this.addMessage(userMessage, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Get AI response
        setTimeout(async () => {
            const response = await this.getAIResponse(userMessage);
            this.hideTypingIndicator();
            this.addMessage(response.text, 'bot');
            
            // Handle special actions
            if (response.action) {
                this.handleSpecialAction(response.action, response.data);
            }
        }, 1000 + Math.random() * 2000);
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = this.formatMessage(text);
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageDiv.appendChild(avatar);
        const contentWrapper = document.createElement('div');
        contentWrapper.appendChild(content);
        contentWrapper.appendChild(time);
        messageDiv.appendChild(contentWrapper);
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Add to conversation history
        this.conversationHistory.push({
            sender,
            text,
            timestamp: new Date()
        });
    }

    formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('messagesContainer');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.isTyping = true;
    }

    hideTypingIndicator() {
        const typingMessage = document.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
        this.isTyping = false;
    }

    hideWelcomeMessage() {
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
    }

    async getAIResponse(userMessage) {
        try {
            if (!this.chatbotAI) {
                throw new Error('Chatbot AI not initialized');
            }
            
            // Use the FoodieBotAI engine
            const response = await this.chatbotAI.generateResponse(userMessage, this.conversationHistory);
            
            if (!response) {
                throw new Error('No response from AI');
            }
            
            return response;
        } catch (error) {
            console.error('Error getting AI response:', error);
            return {
                text: "I apologize, but I'm having trouble accessing the restaurant database. Please try again in a moment.",
                action: null,
                data: null
            };
        }
    }

    handleSpecialAction(action, data) {
        switch (action) {
            case 'show_restaurants':
                this.showRestaurantCards(data);
                break;
            case 'show_menu':
                this.showRestaurantMenu(data);
                break;
            case 'add_to_cart':
                this.addItemToCart(data);
                break;
            case 'show_popular':
                this.showPopularItems(data);
                break;
            case 'show_fast_delivery':
                this.showFastDeliveryRestaurants(data);
                break;
            default:
                break;
        }
    }

    showRestaurantCards(restaurants) {
        try {
            const restaurantsContainer = document.getElementById('restaurantsContainer');
            const restaurantsGrid = document.getElementById('restaurantsGrid');
            
            if (!restaurantsContainer || !restaurantsGrid) {
                throw new Error('Restaurant container elements not found');
            }

            if (!Array.isArray(restaurants) || restaurants.length === 0) {
                throw new Error('No restaurants data available');
            }

            // Show the container
            restaurantsContainer.classList.remove('hidden');
            
            // Clear existing content
            restaurantsGrid.innerHTML = '';
            
            // Add restaurant cards
            restaurantsGrid.innerHTML = restaurants.map(restaurant => `
                <div class="restaurant-card" data-id="${restaurant.id}">
                    <div class="restaurant-image">
                        <span class="cuisine-icon">${restaurant.image}</span>
                        ${restaurant.offers.length > 0 ? `<div class="offer-badge">${restaurant.offers[0]}</div>` : ''}
                    </div>
                    <div class="restaurant-info">
                        <h3>${restaurant.name}</h3>
                        <div class="restaurant-meta">
                            <span class="rating">
                                <i class="fas fa-star"></i>
                                ${restaurant.rating}
                            </span>
                            <span class="delivery-time">
                                <i class="fas fa-clock"></i>
                                ${restaurant.deliveryTime}
                            </span>
                            <span class="distance">
                                <i class="fas fa-map-marker-alt"></i>
                                ${restaurant.distance}
                            </span>
                        </div>
                        <div class="cuisines">${restaurant.cuisines.join(' • ')}</div>
                        <div class="restaurant-footer">
                            <span class="price-range">${restaurant.priceRange}</span>
                            <button class="view-menu-btn" onclick="foodieBotApp.viewRestaurantMenu(${restaurant.id})">
                                View Menu
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Add success message
            this.addMessage(`Found ${restaurants.length} restaurants near you! 🍽️`, 'bot');
        } catch (error) {
            console.error('Error showing restaurant cards:', error);
            this.addMessage("Sorry, I'm having trouble displaying the restaurants. Please try again.", 'bot');
        }
    }

    viewRestaurantMenu(restaurantId) {
        // Ensure chatbot AI is loaded
        if (!window.chatbotAI || !window.chatbotAI.nearbyRestaurants) {
            this.addMessage("Loading restaurant data... Please wait a moment and try again! ⏳", 'bot');
            
            // Try to reload the restaurant data after a short delay
            setTimeout(() => {
                this.viewRestaurantMenu(restaurantId);
            }, 1000);
            return;
        }
        
        // Set selected restaurant in AI
        window.chatbotAI.setSelectedRestaurant(restaurantId);
        
        // Find restaurant data
        const restaurant = window.chatbotAI.nearbyRestaurants.find(r => r.id === restaurantId);
        
        if (restaurant) {
            this.selectedRestaurant = restaurant;
            
            // Hide welcome message
            this.hideWelcomeMessage();
            
            // Directly show the menu instead of sending a message
            this.showRestaurantMenu(restaurant);
            
            // Add a bot message to introduce the menu
            this.addMessage(`Here's the complete menu for **${restaurant.name}**! 🍽️\n\nBrowse through our delicious offerings and click "ADD" to add items to your cart. Happy ordering! 😊`, 'bot');
        } else {
            console.log('Available restaurants:', window.chatbotAI.nearbyRestaurants.map(r => ({ id: r.id, name: r.name })));
            console.log('Looking for restaurant ID:', restaurantId);
            this.addMessage(`Sorry, I couldn't find that restaurant's menu (ID: ${restaurantId}). Please try clicking "🍽️ Find Restaurants" first to reload the restaurant list! 😔`, 'bot');
        }
    }

    showRestaurantMenu(restaurant) {
        // Create menu display in chat
        const menuHTML = this.createMenuHTML(restaurant);
        this.addMessage(menuHTML, 'bot');
    }

    createMenuHTML(restaurant) {
        let menuHTML = `<div class="menu-display">
            <h3>${restaurant.name} Menu</h3>`;
        
        for (const [category, items] of Object.entries(restaurant.menu)) {
            menuHTML += `
                <div class="menu-category">
                    <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                    <div class="menu-items">
            `;
            
            items.forEach(item => {
                const vegIcon = item.veg ? '🟢' : '🔴';
                const itemData = encodeURIComponent(JSON.stringify(item));
                const restaurantNameEncoded = encodeURIComponent(restaurant.name);
                
                const ratingDisplay = item.rating ? `<span class="item-rating">⭐ ${item.rating}</span>` : '';
                const popularBadge = item.popular ? `<span class="popular-badge">🔥 Popular</span>` : '';
                
                menuHTML += `
                    <div class="menu-item">
                        <div class="item-details">
                            <span class="veg-indicator">${vegIcon}</span>
                            <div class="item-info">
                                <div class="item-header">
                                    <h5>${item.name}</h5>
                                    <div class="item-badges">
                                        ${ratingDisplay}
                                        ${popularBadge}
                                    </div>
                                </div>
                                <p>${item.description}</p>
                            </div>
                        </div>
                        <div class="item-order">
                            <span class="item-price">₹${item.price}</span>
                            <button class="add-btn" onclick="window.foodieBotApp.addToCartFromMenu('${itemData}', '${restaurantNameEncoded}')">
                                ADD
                            </button>
                        </div>
                    </div>
                `;
            });
            
            menuHTML += `</div></div>`;
        }
        
        menuHTML += `</div>`;
        return menuHTML;
    }

    addToCartFromMenu(itemDataEncoded, restaurantNameEncoded) {
        try {
            const item = JSON.parse(decodeURIComponent(itemDataEncoded));
            const restaurantName = decodeURIComponent(restaurantNameEncoded);
            this.addToCart(item, restaurantName);
        } catch (error) {
            console.error('Error adding item to cart:', error);
            this.addMessage(`❌ Sorry, there was an issue adding the item to your cart. Please try again!`, 'bot');
        }
    }

    addToCart(item, restaurantName) {
        if (window.paymentService) {
            window.paymentService.addToCart(item, restaurantName);
            this.addMessage(`✅ **${item.name}** added to your cart! 🛒\n\nPrice: ₹${item.price}\nFrom: ${restaurantName}\n\nClick the cart icon 🛒 in the header to view your cart and checkout.`, 'bot');
        } else {
            console.error('Payment service not available');
            this.addMessage(`❌ Sorry, there was an issue adding the item to your cart. Please try again!`, 'bot');
        }
    }

    handleRestaurantFilter(filter) {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(btn => 
            btn.classList.remove('active')
        );
        
        // Add active class to clicked button
        event.target.classList.add('active');
        
        // Apply filter logic
        const restaurantCards = document.querySelectorAll('.restaurant-card');
        restaurantCards.forEach(card => {
            // Simple show/hide - in real app, implement proper filtering
            card.style.display = 'block';
        });
    }

    clearChat() {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        this.conversationHistory = [];
        this.currentOrder = [];
        
        // Hide restaurants container
        const restaurantsContainer = document.getElementById('restaurantsContainer');
        if (restaurantsContainer) {
            restaurantsContainer.classList.add('hidden');
        }
        
        this.initializeWelcome();
    }

    initializeWelcome() {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-animation">
                    <div class="location-icon">📍</div>
                    <h2>Welcome to FoodieBot!</h2>
                    <p>Discover amazing restaurants near Nagaram & Dammiguda. I can help you:</p>
                    <div class="feature-grid">
                        <div class="feature-item">
                            <i class="fas fa-search"></i>
                            <span>Find Nearby Restaurants</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-utensils"></i>
                            <span>Browse Menus & Prices</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-shopping-cart"></i>
                            <span>Order & Track Food</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-credit-card"></i>
                            <span>Secure Payment</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-qrcode"></i>
                            <span>QR Code Ordering</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-motorcycle"></i>
                            <span>Fast Delivery</span>
                        </div>
                    </div>
                    <div class="quick-actions">
                        <button class="quick-btn" data-message="Show me nearby restaurants">🍽️ Find Restaurants</button>
                        <button class="quick-btn" data-message="What's popular in my area?">⭐ Popular Foods</button>
                        <button class="quick-btn" data-message="Show me vegetarian restaurants">🥗 Vegetarian Options</button>
                        <button class="quick-btn" data-message="I want fast food">🍔 Fast Food</button>
                        <button class="quick-btn" data-message="Show me Indian restaurants">🍛 Indian Cuisine</button>
                        <button class="quick-btn" data-message="What restaurants deliver here?">🚚 Delivery Options</button>
                    </div>
                    <div class="tip-message">
                        💡 <strong>Tip:</strong> Click "🍽️ Find Restaurants" above to see restaurant cards, then click "View Menu" on any restaurant to browse their full menu!
                    </div>
                </div>
            </div>
        `;
        
        // Re-bind quick button events
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const message = e.target.dataset.message;
                this.sendMessage(message);
            });
        });
        
        // Remove auto-show restaurants - let customers choose when to see them
    }

    startBackgroundAnimations() {
        // Add dynamic floating animations
        const floatingIcons = document.querySelectorAll('.floating-icon');
        floatingIcons.forEach((icon, index) => {
            icon.style.left = Math.random() * 100 + '%';
            icon.style.animationDelay = Math.random() * 15 + 's';
        });
    }

    toggleTheme() {
        const body = document.body;
        const themeBtn = document.getElementById('toggleTheme');
        const icon = themeBtn.querySelector('i');
        
        if (body.dataset.theme === 'dark') {
            body.dataset.theme = 'light';
            icon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        } else {
            body.dataset.theme = 'dark';
            icon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        }
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        const body = document.body;
        const themeBtn = document.getElementById('toggleTheme');
        const icon = themeBtn?.querySelector('i');
        
        if (savedTheme === 'dark') {
            body.dataset.theme = 'dark';
            if (icon) icon.className = 'fas fa-sun';
        } else {
            body.dataset.theme = 'light';
            if (icon) icon.className = 'fas fa-moon';
        }
    }
}

// Add custom CSS for restaurant cards and menu display
const appStyles = `
    .restaurants-container {
        padding: 2rem;
        background: var(--background-primary);
        margin-top: 1rem;
    }

    .restaurants-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .restaurants-header h3 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .filter-options {
        display: flex;
        gap: 1rem;
    }

    .filter-btn {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color);
        background: var(--background-secondary);
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }

    .filter-btn:hover,
    .filter-btn.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
    }

    .restaurants-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
    }

    .restaurant-card {
        background: var(--background-secondary);
        border-radius: 15px;
        overflow: hidden;
        box-shadow: 0 4px 15px var(--shadow-light);
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .restaurant-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px var(--shadow-medium);
    }

    .restaurant-image {
        position: relative;
        background: var(--gradient-primary);
        padding: 2rem;
        text-align: center;
    }

    .cuisine-icon {
        font-size: 3rem;
    }

    .offer-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background: var(--accent-color);
        color: var(--text-primary);
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .restaurant-info {
        padding: 1.5rem;
    }

    .restaurant-info h3 {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 0.8rem;
        color: var(--text-primary);
    }

    .restaurant-meta {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.8rem;
        font-size: 0.9rem;
        color: var(--text-muted);
    }

    .restaurant-meta span {
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }

    .rating i {
        color: var(--accent-color);
    }

    .cuisines {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin-bottom: 1rem;
    }

    .restaurant-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .price-range {
        font-weight: 600;
        color: var(--primary-color);
    }

    .view-menu-btn {
        background: var(--gradient-primary);
        color: white;
        border: none;
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
    }

    .view-menu-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px var(--shadow-medium);
    }

    .menu-display {
        max-width: 100%;
        margin: 1rem 0;
    }

    .menu-display h3 {
        font-size: 1.3rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--primary-color);
        border-bottom: 2px solid var(--primary-color);
        padding-bottom: 0.5rem;
    }

    .menu-category {
        margin-bottom: 2rem;
    }

    .menu-category h4 {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        margin-bottom: 0.8rem;
        background: var(--background-secondary);
    }

    .item-details {
        display: flex;
        align-items: flex-start;
        gap: 0.8rem;
        flex: 1;
    }

    .veg-indicator {
        font-size: 1rem;
        margin-top: 0.2rem;
    }

    .item-info h5 {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 0.3rem;
        color: var(--text-primary);
    }

    .item-info p {
        font-size: 0.9rem;
        color: var(--text-muted);
        line-height: 1.4;
    }

    .item-order {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;
    }

    .item-price {
        font-size: 1rem;
        font-weight: 600;
        color: var(--primary-color);
    }

    .add-btn {
        background: var(--gradient-primary);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.3s ease;
    }

    .add-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 10px var(--shadow-medium);
    }

    .tip-message {
        background: var(--background-tertiary);
        border: 2px solid var(--primary-color);
        border-radius: 15px;
        padding: 1rem 1.5rem;
        margin-top: 2rem;
        font-size: 0.95rem;
        line-height: 1.5;
        animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.8s both;
    }

    .tip-message strong {
        color: var(--primary-color);
    }

    @media (max-width: 768px) {
        .restaurants-grid {
            grid-template-columns: 1fr;
        }

        .restaurant-meta {
            flex-wrap: wrap;
        }

        .menu-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }

        .item-order {
            align-self: stretch;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
        }
    }
`;

// Add styles to document
const mainStyleSheet = document.createElement('style');
mainStyleSheet.textContent = appStyles;
document.head.appendChild(mainStyleSheet);

// Initialize the app only once
let app;
try {
    app = new FoodieBotApp();
} catch (error) {
    console.error('Error initializing FoodieBot App:', error);
}

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FoodieBotApp;
} 
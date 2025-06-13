// ===== QR CODE RESTAURANT ORDERING SYSTEM =====

class QRCodeSystem {
    constructor() {
        this.isQRMode = false;
        this.currentRestaurant = null;
        this.qrCanvas = null;
        this.generatedQRData = null;
        this.init();
    }

    init() {
        this.checkQRAccess();
        this.bindQREvents();
        this.populateRestaurantDropdown();
    }

    checkQRAccess() {
        const urlParams = new URLSearchParams(window.location.search);
        const restaurantId = urlParams.get('restaurant');
        const mode = urlParams.get('mode');
        const unique = urlParams.get('unique');

        if (restaurantId && mode === 'restaurant') {
            this.handleQRAccess(restaurantId, unique);
        }
    }

    handleQRAccess(restaurantId, unique) {
        const restaurant = this.findRestaurantById(parseInt(restaurantId));
        
        if (restaurant) {
            this.isQRMode = true;
            this.currentRestaurant = restaurant;

            // Initialize restaurant-specific chatbot
            if (window.chatbotAI) {
                window.chatbotAI.setSelectedRestaurant(restaurant.id);
                window.chatbotAI.orderMode = 'restaurant';
                
                // Show restaurant-specific welcome message
                const welcomeMsg = `Welcome to ${restaurant.name}! 🍽️\n\n` +
                    `I'm your personal ordering assistant. You can:\n` +
                    `📋 View our full menu\n` +
                    `🛒 Place orders\n` +
                    `💳 Make payments\n` +
                    `📱 Track your order\n\n` +
                    `What would you like to do?`;
                
                window.chatbotAI.addMessage(welcomeMsg, 'bot');

                // Show menu immediately
                this.showRestaurantMenu();

                // Update UI for restaurant mode
                this.updateUIForRestaurantMode(restaurant);
            }
        } else {
            this.showError("Restaurant not found. Please scan a valid QR code.");
        }
    }

    updateUIForRestaurantMode(restaurant) {
        // Update header with restaurant name
        const header = document.querySelector('.header');
        if (header) {
            header.innerHTML = `
                <div class="restaurant-header">
                    <div class="restaurant-logo">
                        <span class="restaurant-icon">${restaurant.image}</span>
                    </div>
                    <div class="restaurant-info">
                        <h1>${restaurant.name}</h1>
                        <p>${restaurant.location}</p>
                    </div>
                </div>
            `;
        }

        // Show quick action buttons
        const quickActions = document.createElement('div');
        quickActions.className = 'quick-actions';
        quickActions.innerHTML = `
            <button class="quick-btn" data-action="view-menu">📋 View Menu</button>
            <button class="quick-btn" data-action="view-cart">🛒 View Cart</button>
            <button class="quick-btn" data-action="track-order">📱 Track Order</button>
            <button class="quick-btn" data-action="help">❓ Help</button>
        `;
        document.querySelector('.chat-container')?.prepend(quickActions);

        // Add event listeners for quick actions
        quickActions.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    handleQuickAction(action) {
        if (!window.chatbotAI) return;

        switch (action) {
            case 'view-menu':
                this.showRestaurantMenu();
                break;
            case 'view-cart':
                window.chatbotAI.handleViewCart();
                break;
            case 'track-order':
                window.chatbotAI.handleOrderTracking({ type: 'order_tracking' });
                break;
            case 'help':
                window.chatbotAI.addMessage(
                    "How can I help you?\n\n" +
                    "• View our menu\n" +
                    "• Place an order\n" +
                    "• Check your cart\n" +
                    "• Track your order\n" +
                    "• Make a payment",
                    'bot'
                );
                break;
        }
    }

    showRestaurantMenu() {
        // Implementation of showRestaurantMenu method
    }

    bindQREvents() {
        // QR Generator button
        document.getElementById('qrGeneratorBtn')?.addEventListener('click', () => {
            this.showQRGenerator();
        });

        // Restaurant selection change event
        document.getElementById('restaurantSelect')?.addEventListener('change', (event) => {
            if (event.target.value) {
                this.generateQRCode();
            } else {
                // Reset QR code display if no restaurant is selected
                const canvas = document.getElementById('qrCodeCanvas');
                const placeholder = document.querySelector('.qr-placeholder');
                canvas.style.display = 'none';
                placeholder.style.display = 'block';
                document.getElementById('qrInfo').classList.add('hidden');
            }
        });

        // Download QR code button
        document.getElementById('downloadQrBtn')?.addEventListener('click', () => {
            this.downloadQRCode();
        });

        // Print QR code button
        document.getElementById('printQrBtn')?.addEventListener('click', () => {
            this.printQRCode();
        });

        // Table confirmation events
        document.getElementById('confirmTable')?.addEventListener('click', () => {
            this.activateTableMode();
        });

        document.getElementById('wrongTable')?.addEventListener('click', () => {
            document.getElementById('tableNumberModal').classList.add('hidden');
            this.showError("Please scan the QR code at your correct table.");
        });

        // QR Generator form events
        document.getElementById('tableNumberInput')?.addEventListener('input', () => {
            this.updateQRPreview();
        });

        document.getElementById('sectionName')?.addEventListener('input', () => {
            this.updateQRPreview();
        });

        // Call waiter functionality
        document.getElementById('callWaiter')?.addEventListener('click', () => {
            this.callWaiter();
        });

        // Handle order type changes for QR mode
        document.querySelectorAll('input[name="orderType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleOrderTypeChange(e.target.value);
            });
        });
    }

    showQRGenerator() {
        const modal = document.getElementById('qrGeneratorModal');
        modal.classList.remove('hidden');
        this.resetQRGenerator();
    }

    resetQRGenerator() {
        document.getElementById('restaurantSelect').value = '';
        document.getElementById('tableNumberInput').value = '';
        document.getElementById('sectionName').value = '';
        document.getElementById('generateQrBtn').disabled = true;
        document.getElementById('downloadQrBtn').classList.add('hidden');
        document.getElementById('printQrBtn').classList.add('hidden');
        document.getElementById('qrInfo').classList.add('hidden');
        
        // Show placeholder, hide canvas
        const canvas = document.getElementById('qrCodeCanvas');
        const placeholder = document.querySelector('.qr-placeholder');
        if (canvas) canvas.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
    }

    populateRestaurantDropdown() {
        const select = document.getElementById('restaurantSelect');
        if (select && window.chatbotAI) {
            window.chatbotAI.nearbyRestaurants.forEach(restaurant => {
                const option = document.createElement('option');
                option.value = restaurant.id;
                option.textContent = `${restaurant.name} (${restaurant.location})`;
                select.appendChild(option);
            });
        }
    }

    updateQRPreview() {
        const restaurantId = document.getElementById('restaurantSelect').value;
        const tableNumber = document.getElementById('tableNumberInput').value.trim();
        
        const generateBtn = document.getElementById('generateQrBtn');
        
        if (restaurantId && tableNumber) {
            generateBtn.disabled = false;
        } else {
            generateBtn.disabled = true;
        }
    }

    generateQRCode() {
        const restaurantId = document.getElementById('restaurantSelect').value;
        
        if (!restaurantId) {
            this.showError('Please select a restaurant.');
            return;
        }

        // Get restaurant details
        const restaurant = this.findRestaurantById(parseInt(restaurantId));
        if (!restaurant) {
            this.showError('Restaurant not found. Please try again.');
            return;
        }

        // Create unique QR code URL for the restaurant
        const baseUrl = window.location.origin + window.location.pathname;
        const uniqueId = this.generateRestaurantUniqueId(restaurantId);
        let qrUrl = `${baseUrl}?restaurant=${restaurantId}`;
        
        // Add enhanced parameters for direct chatbot access
        qrUrl += `&mode=restaurant&tracking=true&menu=full&unique=${uniqueId}`;
        qrUrl += `&restaurant_name=${encodeURIComponent(restaurant.name)}`;
        qrUrl += `&features=menu,order,cart,payment,tracking`;

        // Generate QR code with enhanced styling
        const canvas = document.getElementById('qrCodeCanvas');
        const placeholder = document.querySelector('.qr-placeholder');
        
        // Check if QRCode library is loaded
        if (typeof QRCode === 'undefined') {
            // Try to load the library dynamically
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
            script.onload = () => {
                this.generateQRCodeOnCanvas(canvas, qrUrl, placeholder, restaurantId, restaurant);
            };
            script.onerror = () => {
                this.showError('Failed to load QR Code library. Please check your internet connection and try again.');
            };
            document.body.appendChild(script);
            return;
        }

        this.generateQRCodeOnCanvas(canvas, qrUrl, placeholder, restaurantId, restaurant);
    }

    generateRestaurantUniqueId(restaurantId) {
        // Generate a unique identifier for the restaurant's QR code
        return `REST-${restaurantId}-${Date.now()}`;
    }

    generateQRCodeOnCanvas(canvas, qrUrl, placeholder, restaurantId, restaurant) {
        try {
            // Clear any existing QR code
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            
            // Generate new QR code with restaurant branding
            new QRCode(canvas, {
                text: qrUrl,
                width: 300,
                height: 300,
                colorDark: '#2d3748',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });

            // Show canvas, hide placeholder
            canvas.style.display = 'block';
            placeholder.style.display = 'none';
            
            // Show QR info and action buttons
            document.getElementById('qrInfo').classList.remove('hidden');
            document.getElementById('qrRestaurantName').textContent = restaurant.name;
            document.getElementById('qrUrl').textContent = qrUrl;
            document.getElementById('qrGeneratedTime').textContent = new Date().toLocaleString();
            document.getElementById('downloadQrBtn').classList.remove('hidden');
            document.getElementById('printQrBtn').classList.remove('hidden');
            
            // Store generated data with enhanced information
            this.generatedQRData = {
                url: qrUrl,
                restaurantId: restaurantId,
                restaurant: restaurant,
                timestamp: new Date().toISOString(),
                uniqueId: this.generateRestaurantUniqueId(restaurantId),
                features: ['menu', 'ordering', 'tracking', 'payment'],
                qrInfo: {
                    restaurantName: restaurant.name,
                    location: restaurant.location,
                    generatedAt: new Date().toLocaleString()
                }
            };
            
            this.showSuccess('Restaurant QR code generated successfully!');
        } catch (error) {
            this.showError('Failed to generate QR code: ' + error.message);
        }
    }

    downloadQRCode() {
        if (!this.generatedQRData) return;
        
        const canvas = document.getElementById('qrCodeCanvas');
        const restaurant = this.findRestaurantById(parseInt(this.generatedQRData.restaurantId));
        
        // Create download link
        const link = document.createElement('a');
        link.download = `${restaurant.name}_Table_${this.generatedQRData.tableNumber}_QR.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        this.showSuccess('QR code downloaded!');
    }

    printQRCode() {
        if (!this.generatedQRData) return;
        
        const restaurant = this.findRestaurantById(parseInt(this.generatedQRData.restaurantId));
        const canvas = document.getElementById('qrCodeCanvas');
        const dataUrl = canvas.toDataURL();
        
        // Create print content
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>QR Code - ${restaurant.name} Table ${this.generatedQRData.tableNumber}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 20px;
                            margin: 0;
                        }
                        .qr-print-container {
                            border: 2px solid #333;
                            padding: 20px;
                            max-width: 400px;
                            margin: 0 auto;
                            border-radius: 10px;
                        }
                        .restaurant-name {
                            font-size: 24px;
                            font-weight: bold;
                            margin-bottom: 10px;
                            color: #ff6b35;
                        }
                        .table-info {
                            font-size: 18px;
                            margin-bottom: 20px;
                            color: #2d3748;
                        }
                        .qr-image {
                            margin: 20px 0;
                        }
                        .instructions {
                            font-size: 14px;
                            color: #666;
                            margin-top: 15px;
                            line-height: 1.4;
                        }
                        .powered-by {
                            font-size: 12px;
                            color: #999;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="qr-print-container">
                        <div class="restaurant-name">${restaurant.name}</div>
                        <div class="table-info">Table ${this.generatedQRData.tableNumber}
                            ${this.generatedQRData.section ? ` - ${this.generatedQRData.section}` : ''}
                        </div>
                        <div class="qr-image">
                            <img src="${dataUrl}" alt="QR Code" style="max-width: 100%;">
                        </div>
                        <div class="instructions">
                            <strong>How to Order:</strong><br>
                            1. Scan this QR code with your phone camera<br>
                            2. Browse our menu and add items to cart<br>
                            3. Pay securely from your phone<br>
                            4. Food will be served to your table
                        </div>
                        <div class="powered-by">Powered by FoodieBot AI</div>
                    </div>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
        
        this.showSuccess('Print dialog opened!');
    }

    callWaiter() {
        if (!this.isQRMode) return;
        
        // Simulate waiter call
        this.showSuccess('🔔 Waiter has been notified! Someone will be with you shortly.');
        
        // Add message to chat
        if (window.foodieBotApp) {
            window.foodieBotApp.addMessage('🔔 You called for assistance. A waiter will be with you shortly!', 'bot');
        }
        
        // In a real app, this would send a notification to restaurant staff
        console.log('Waiter called for table:', this.currentTable.number, 'at restaurant:', this.currentRestaurant.name);
    }

    handleOrderTypeChange(orderType) {
        const deliverySection = document.getElementById('deliverySection');
        const deliveryFeeRow = document.getElementById('deliveryFeeRow');
        const codLabel = document.getElementById('codLabel');
        
        if (orderType === 'dine-in') {
            // Hide delivery section for dine-in orders
            if (deliverySection) deliverySection.classList.add('hidden');
            if (deliveryFeeRow) deliveryFeeRow.classList.add('hidden');
            if (codLabel) codLabel.textContent = 'Pay at Table';
            
            // Update payment service for dine-in
            if (window.paymentService) {
                window.paymentService.orderType = 'dine-in';
            }
        } else {
            // Show delivery section for delivery orders
            if (deliverySection) deliverySection.classList.remove('hidden');
            if (deliveryFeeRow) deliveryFeeRow.classList.remove('hidden');
            if (codLabel) codLabel.textContent = 'Cash on Delivery';
            
            // Update payment service for delivery
            if (window.paymentService) {
                window.paymentService.orderType = 'delivery';
            }
        }
    }

    findRestaurantById(id) {
        if (window.chatbotAI) {
            return window.chatbotAI.nearbyRestaurants.find(r => r.id === id);
        }
        return null;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        return colors[type] || colors.info;
    }

    // Public methods
    isInQRMode() {
        return this.isQRMode;
    }

    getCurrentTable() {
        return this.currentTable;
    }

    getCurrentRestaurant() {
        return this.currentRestaurant;
    }

    getQRModeInfo() {
        return {
            isQRMode: this.isQRMode,
            table: this.currentTable,
            restaurant: this.currentRestaurant
        };
    }
}

// Initialize QR Code system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.qrCodeSystem = new QRCodeSystem();
    
    // Override checkout behavior for QR mode
    if (window.qrCodeSystem.isInQRMode()) {
        // Set default order type to dine-in for QR access
        setTimeout(() => {
            const dineInRadio = document.querySelector('input[name="orderType"][value="dine-in"]');
            if (dineInRadio) {
                dineInRadio.checked = true;
                window.qrCodeSystem.handleOrderTypeChange('dine-in');
            }
        }, 1000);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRCodeSystem;
}

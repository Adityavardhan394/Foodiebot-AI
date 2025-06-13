// ===== PAYMENT & ORDER MANAGEMENT SYSTEM =====

class PaymentService {
    constructor() {
        this.cart = [];
        this.orderHistory = [];
        this.currentOrder = null;
        this.paymentMethods = this.initializePaymentMethods();
        this.init();
    }

    init() {
        this.bindPaymentEvents();
        this.updateCartDisplay();
    }

    initializePaymentMethods() {
        return [
            {
                id: 'card',
                name: 'Credit/Debit Card',
                icon: 'fas fa-credit-card',
                enabled: true,
                processingTime: '2-3 minutes'
            },
            {
                id: 'upi',
                name: 'UPI Payment',
                icon: 'fab fa-google-pay',
                enabled: true,
                processingTime: 'Instant'
            },
            {
                id: 'cod',
                name: 'Cash on Delivery',
                icon: 'fas fa-money-bill-wave',
                enabled: true,
                processingTime: 'Pay on delivery'
            }
        ];
    }

    bindPaymentEvents() {
        document.getElementById('cartBtn')?.addEventListener('click', () => {
            this.showCartModal();
        });

        document.getElementById('continueShopping')?.addEventListener('click', () => {
            this.closeModal('cartModal');
        });

        document.getElementById('proceedToCheckout')?.addEventListener('click', () => {
            this.proceedToCheckout();
        });

        document.getElementById('backToCart')?.addEventListener('click', () => {
            this.backToCart();
        });

        document.getElementById('placeOrder')?.addEventListener('click', () => {
            this.placeOrder();
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Handle order type changes
        document.addEventListener('change', (e) => {
            if (e.target.name === 'orderType') {
                this.handleOrderTypeChange(e.target.value);
            }
        });
    }

    addToCart(item, restaurantName) {
        const existingItem = this.cart.find(cartItem => cartItem.id === item.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...item,
                restaurantName: restaurantName,
                quantity: 1,
                addedAt: new Date()
            });
        }

        this.updateCartDisplay();
        this.showNotification(`✅ ${item.name} added to cart!`, 'success');
    }

    handleOrderTypeChange(orderType) {
        // Update delivery section visibility
        const deliverySection = document.getElementById('deliverySection');
        if (deliverySection) {
            if (orderType === 'delivery') {
                deliverySection.style.display = 'block';
            } else {
                deliverySection.style.display = 'none';
            }
        }

        // Update COD label
        const codLabel = document.getElementById('codLabel');
        if (codLabel) {
            if (orderType === 'takeaway') {
                codLabel.textContent = 'Cash on Pickup';
            } else if (orderType === 'dine-in') {
                codLabel.textContent = 'Pay at Restaurant';
            } else {
                codLabel.textContent = 'Cash on Delivery';
            }
        }

        // Update cart display to reflect new totals
        this.updateCartDisplay();
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.updateCartDisplay();
        this.showNotification('🗑️ Item removed from cart', 'info');
    }

    updateQuantity(itemId, newQuantity) {
        const item = this.cart.find(cartItem => cartItem.id === itemId);

        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(itemId);
            } else {
                item.quantity = newQuantity;
                this.updateCartDisplay();
            }
        }
    }

    calculateCartTotal() {
        const subtotal = this.cart.reduce((total, item) => 
            total + (item.price * item.quantity), 0
        );

        // Check order type - no delivery fee for takeaway and dine-in
        const orderType = document.querySelector('input[name="orderType"]:checked')?.value || 'delivery';
        const deliveryFee = (this.cart.length > 0 && orderType === 'delivery') ? 30 : 0;
        
        const taxRate = 0.05; // 5% tax
        const taxAmount = subtotal * taxRate;
        const total = subtotal + deliveryFee + taxAmount;

        return {
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            taxAmount: taxAmount,
            total: total,
            orderType: orderType
        };
    }

    updateCartDisplay() {
        this.updateCartCount();
        this.updateCartModal();
        this.updateCheckoutModal();
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.classList.toggle('hidden', totalItems === 0);
        }
    }

    updateCartModal() {
        const cartItems = document.getElementById('cartItems');
        const totals = this.calculateCartTotal();

        if (cartItems) {
            if (this.cart.length === 0) {
                cartItems.innerHTML = `
                    <div class="empty-cart">
                        <div class="empty-cart-icon">🛒</div>
                        <h4>Your cart is empty</h4>
                        <p>Add some delicious items to get started!</p>
                    </div>
                `;
            } else {
                cartItems.innerHTML = this.cart.map(item => `
                    <div class="cart-item">
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            <p class="restaurant-name">${item.restaurantName}</p>
                            <div class="item-price">₹${item.price}</div>
                        </div>
                        <div class="quantity-controls">
                            <button class="quantity-btn minus" onclick="paymentService.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn plus" onclick="paymentService.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                        </div>
                        <div class="item-total">₹${(item.price * item.quantity).toFixed(2)}</div>
                        <button class="remove-item" onclick="paymentService.removeFromCart(${item.id})" title="Remove item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // Update totals
        document.getElementById('cartSubtotal').textContent = `₹${totals.subtotal.toFixed(2)}`;
        document.getElementById('deliveryFee').textContent = `₹${totals.deliveryFee.toFixed(2)}`;
        document.getElementById('taxAmount').textContent = `₹${totals.taxAmount.toFixed(2)}`;
        document.getElementById('cartTotal').innerHTML = `<strong>₹${totals.total.toFixed(2)}</strong>`;
        
        // Hide delivery fee row if no delivery fee
        const deliveryFeeRow = document.getElementById('deliveryFeeRow');
        if (deliveryFeeRow) {
            if (totals.deliveryFee === 0) {
                deliveryFeeRow.style.display = 'none';
            } else {
                deliveryFeeRow.style.display = 'flex';
            }
        }

        const checkoutBtn = document.getElementById('proceedToCheckout');
        if (checkoutBtn) {
            checkoutBtn.disabled = this.cart.length === 0;
        }
    }

    updateCheckoutModal() {
        const finalTotal = document.getElementById('finalTotal');
        const totals = this.calculateCartTotal();
        
        if (finalTotal) {
            finalTotal.textContent = `₹${totals.total.toFixed(2)}`;
        }
    }

    showCartModal() {
        const modal = document.getElementById('cartModal');
        modal.classList.remove('hidden');
        this.updateCartModal();
    }

    proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('❌ Your cart is empty!', 'error');
            return;
        }

        this.closeModal('cartModal');
        
        setTimeout(() => {
            const checkoutModal = document.getElementById('checkoutModal');
            checkoutModal.classList.remove('hidden');
            this.updateCheckoutModal();
        }, 300);
    }

    backToCart() {
        this.closeModal('checkoutModal');
        setTimeout(() => {
            this.showCartModal();
        }, 300);
    }

    async placeOrder() {
        const selectedPayment = document.querySelector('input[name="payment"]:checked')?.value;
        
        if (!selectedPayment) {
            this.showNotification('❌ Please select a payment method', 'error');
            return;
        }

        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingOverlay && loadingText) {
            loadingText.textContent = 'Processing your order...';
            loadingOverlay.classList.remove('hidden');
        }

        try {
            const order = await this.processOrder(selectedPayment);
            this.closeModal('checkoutModal');
            this.clearCart();
            this.showOrderSuccess(order);
        } catch (error) {
            this.showNotification(`❌ Order failed: ${error.message}`, 'error');
        } finally {
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }
    }

    async processOrder(paymentMethod) {
        const totals = this.calculateCartTotal();
        const orderType = totals.orderType;
        
        // Set estimated time based on order type
        let estimatedTime;
        if (orderType === 'takeaway') {
            estimatedTime = '15-20 minutes';
        } else if (orderType === 'dine-in') {
            estimatedTime = '20-25 minutes';
        } else {
            estimatedTime = '25-35 minutes';
        }
        
        const order = {
            id: this.generateOrderId(),
            items: [...this.cart],
            totals: totals,
            paymentMethod: paymentMethod,
            orderType: orderType,
            status: 'confirmed',
            estimatedTime: estimatedTime,
            placedAt: new Date()
        };

        // Simulate payment processing
        await this.simulatePaymentProcessing(paymentMethod);
        
        this.orderHistory.push(order);
        this.currentOrder = order;
        
        return order;
    }

    async simulatePaymentProcessing(method) {
        return new Promise((resolve, reject) => {
            const processingTime = method === 'upi' ? 1000 : method === 'card' ? 3000 : 500;
            
            setTimeout(() => {
                // Simulate success (you can add failure simulation here)
                resolve();
            }, processingTime);
        });
    }

    generateOrderId() {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORD${timestamp.slice(-6)}${random}`;
    }

    clearCart() {
        this.cart = [];
        this.updateCartDisplay();
    }

    showOrderSuccess(order) {
        const successHTML = `
            <div class="modal order-success-modal">
                <div class="modal-content success-content">
                    <div class="success-animation">
                        <div class="success-checkmark">✅</div>
                        <h2>Order Placed Successfully!</h2>
                        <div class="order-details">
                            <p><strong>Order ID:</strong> ${order.id}</p>
                            <p><strong>Estimated Delivery:</strong> ${order.estimatedTime}</p>
                            <p><strong>Total Amount:</strong> ₹${order.totals.total.toFixed(2)}</p>
                        </div>
                        <div class="success-actions">
                            <button class="btn-primary track-order-btn" onclick="paymentService.showOrderTracking('${order.id}')">
                                📍 Track Order
                            </button>
                            <button class="btn-secondary" onclick="paymentService.closeSuccessModal()">Continue Shopping</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', successHTML);
        
        // Start order status simulation for this order
        this.startOrderStatusSimulation(order);
        
        // Auto-remove after 15 seconds (increased to give time to track)
        setTimeout(() => {
            this.closeSuccessModal();
        }, 15000);
    }

    closeSuccessModal() {
        const modal = document.querySelector('.order-success-modal');
        if (modal) {
            modal.remove();
        }
    }

    // ===== ORDER TRACKING SYSTEM =====
    
    startOrderStatusSimulation(order) {
        let orderStages;
        
        if (order.orderType === 'takeaway') {
            // Takeaway-specific stages
            orderStages = [
                { status: 'confirmed', message: 'Order confirmed! Restaurant is preparing your food for pickup.', time: 0, icon: '✅' },
                { status: 'preparing', message: 'Your delicious meal is being prepared with care.', time: 2000, icon: '👨‍🍳' },
                { status: 'packing', message: 'Food is ready! Being packed for takeaway.', time: 6000, icon: '📦' },
                { status: 'ready_for_pickup', message: 'Order packed and ready for pickup! Come collect your food.', time: 10000, icon: '🛍️' },
                { status: 'collected', message: 'Order collected! Enjoy your meal! ❤️', time: 15000, icon: '🎉' }
            ];
        } else if (order.orderType === 'dine-in') {
            // Dine-in specific stages
            orderStages = [
                { status: 'confirmed', message: 'Order confirmed! We\'re preparing your meal for your table.', time: 0, icon: '✅' },
                { status: 'preparing', message: 'Your delicious meal is being prepared with care.', time: 3000, icon: '👨‍🍳' },
                { status: 'ready', message: 'Food is ready! Being served to your table.', time: 8000, icon: '🍽️' },
                { status: 'served', message: 'Order served to your table! Enjoy your meal! ❤️', time: 12000, icon: '🎉' }
            ];
        } else {
            // Default delivery stages
            orderStages = [
                { status: 'confirmed', message: 'Order confirmed! Restaurant is preparing your food.', time: 0, icon: '✅' },
                { status: 'preparing', message: 'Your delicious meal is being prepared with care.', time: 3000, icon: '👨‍🍳' },
                { status: 'ready', message: 'Food is ready! Delivery partner is picking up your order.', time: 8000, icon: '🍽️' },
                { status: 'picked_up', message: 'Order picked up! Your delivery is on the way.', time: 12000, icon: '🛵' },
                { status: 'out_for_delivery', message: 'Out for delivery! Your food will arrive shortly.', time: 18000, icon: '🚚' },
                { status: 'delivered', message: 'Order delivered! Enjoy your meal! ❤️', time: 25000, icon: '🎉' }
            ];
        }

        order.stages = orderStages;
        order.currentStage = 0;

        // Update order status progressively
        orderStages.forEach((stage, index) => {
            setTimeout(() => {
                order.status = stage.status;
                order.currentStage = index;
                order.lastUpdated = new Date();
                
                // Update tracking UI if open
                this.updateOrderTrackingUI(order);
                
                // Send notification
                if (stage.status !== 'confirmed') { // Skip first notification as it's shown in success modal
                    this.showNotification(`${stage.icon} ${stage.message}`, 'info');
                }
            }, stage.time);
        });
    }

    showOrderTracking(orderId) {
        const order = this.orderHistory.find(o => o.id === orderId) || this.currentOrder;
        
        if (!order) {
            this.showNotification('❌ Order not found!', 'error');
            return;
        }

        // Close success modal first
        this.closeSuccessModal();

        const trackingHTML = `
            <div class="modal order-tracking-modal">
                <div class="modal-content tracking-content">
                    <div class="modal-header">
                        <h2>📍 Track Your Order</h2>
                        <button class="close-modal" onclick="paymentService.closeOrderTracking()">&times;</button>
                    </div>
                    <div class="tracking-body">
                        <div class="order-info-bar">
                            <div class="order-id">Order ID: <strong>${order.id}</strong></div>
                            <div class="estimated-time">ETA: <strong>${order.estimatedTime}</strong></div>
                        </div>
                        
                        <div class="tracking-progress" id="trackingProgress">
                            <!-- Progress will be updated dynamically -->
                        </div>
                        
                        <div class="order-items-summary">
                            <h4>🍽️ Order Summary</h4>
                            <div class="items-list">
                                ${order.items.map(item => `
                                    <div class="summary-item">
                                        <span class="item-name">${item.name} x${item.quantity}</span>
                                        <span class="item-price">₹${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="total-summary">
                                <strong>Total: ₹${order.totals.total.toFixed(2)}</strong>
                            </div>
                        </div>
                        
                        <div class="delivery-info" id="orderLocationInfo">
                            <!-- Content will be updated based on order type -->
                        </div>
                        
                        <div class="tracking-actions">
                            <button class="btn-secondary" onclick="paymentService.refreshTracking('${order.id}')">
                                🔄 Refresh Status
                            </button>
                            <button class="btn-outline" onclick="paymentService.closeOrderTracking()">
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', trackingHTML);
        this.updateOrderTrackingUI(order);
        this.updateOrderLocationInfo(order);
    }

    updateOrderTrackingUI(order) {
        const progressContainer = document.getElementById('trackingProgress');
        if (!progressContainer || !order.stages) return;

        const stages = order.stages;
        const currentStage = order.currentStage || 0;

        progressContainer.innerHTML = `
            <div class="progress-timeline">
                ${stages.map((stage, index) => {
                    const isCompleted = index <= currentStage;
                    const isCurrent = index === currentStage;
                    
                    return `
                        <div class="progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                            <div class="step-icon">${stage.icon}</div>
                            <div class="step-content">
                                <div class="step-title">${this.getStageTitle(stage.status)}</div>
                                <div class="step-message">${stage.message}</div>
                                ${isCurrent ? `<div class="step-time">Updated: ${new Date().toLocaleTimeString()}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    updateOrderLocationInfo(order) {
        const locationInfoContainer = document.getElementById('orderLocationInfo');
        if (!locationInfoContainer) return;

        let locationHTML = '';

        if (order.orderType === 'takeaway') {
            locationHTML = `
                <div class="info-item">
                    <i class="fas fa-store"></i>
                    <span>Restaurant: <strong>Biryani Paradise</strong></span>
                </div>
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Pickup Address: <strong>Nagaram Main Road, Dammiguda</strong></span>
                </div>
                <div class="info-item">
                    <i class="fas fa-phone"></i>
                    <span>Restaurant Contact: <strong>+91 98765-43210</strong></span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>Pickup Instructions: <strong>Show order ID at counter</strong></span>
                </div>
            `;
        } else if (order.orderType === 'dine-in') {
            const tableNumber = document.getElementById('tableNumber')?.textContent || 'T1';
            locationHTML = `
                <div class="info-item">
                    <i class="fas fa-chair"></i>
                    <span>Table Number: <strong>${tableNumber}</strong></span>
                </div>
                <div class="info-item">
                    <i class="fas fa-store"></i>
                    <span>Restaurant: <strong>Biryani Paradise</strong></span>
                </div>
                <div class="info-item">
                    <i class="fas fa-bell"></i>
                    <span>Service: <strong>Food will be served to your table</strong></span>
                </div>
                <div class="info-item">
                    <i class="fas fa-phone"></i>
                    <span>Need Help: <strong>+91 98765-43210</strong></span>
                </div>
            `;
        } else {
            // Default delivery info
            locationHTML = `
                <div class="info-item">
                    <i class="fas fa-phone"></i>
                    <span>Delivery Partner: <strong>+91 98765-43210</strong></span>
                </div>
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Delivering to: <strong>Nagaram, Dammiguda</strong></span>
                </div>
            `;
        }

        locationInfoContainer.innerHTML = locationHTML;
    }

    getStageTitle(status) {
        const titles = {
            'confirmed': 'Order Confirmed',
            'preparing': 'Being Prepared',
            'packing': 'Packing for Takeaway',
            'ready_for_pickup': 'Ready for Pickup',
            'collected': 'Order Collected',
            'ready': 'Ready for Pickup',
            'picked_up': 'Picked Up',
            'out_for_delivery': 'Out for Delivery',
            'delivered': 'Delivered',
            'served': 'Served to Table'
        };
        return titles[status] || status;
    }

    refreshTracking(orderId) {
        const order = this.orderHistory.find(o => o.id === orderId) || this.currentOrder;
        if (order) {
            this.updateOrderTrackingUI(order);
            this.showNotification('🔄 Status refreshed!', 'info');
        }
    }

    closeOrderTracking() {
        const modal = document.querySelector('.order-tracking-modal');
        if (modal) {
            modal.remove();
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
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

    getCart() {
        return this.cart;
    }

    getCartTotal() {
        return this.calculateCartTotal();
    }
}

// Initialize payment service when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.paymentService = new PaymentService();
});

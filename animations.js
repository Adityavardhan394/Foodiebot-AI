// ===== ADVANCED ANIMATIONS & VISUAL EFFECTS =====

class AnimationController {
    constructor() {
        this.isAnimating = false;
        this.animationQueue = [];
        this.observers = new Map();
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.initializeParticleSystem();
        this.setupLogoAnimations();
        this.bindScrollEffects();
        this.initializeFloatingElements();
    }

    // ===== INTERSECTION OBSERVER FOR SCROLL ANIMATIONS =====
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '50px 0px -50px 0px'
        };

        this.fadeInObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElementIn(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements that should animate in
        document.querySelectorAll('.feature-item, .quick-btn, .message').forEach(el => {
            this.fadeInObserver.observe(el);
        });
    }

    animateElementIn(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    // ===== LOGO ANIMATIONS =====
    setupLogoAnimations() {
        const logoIcon = document.querySelector('.logo-icon');
        const logoText = document.querySelector('.logo-text h1');
        
        if (logoIcon) {
            this.addHoverEffect(logoIcon, {
                scale: 1.1,
                rotation: 5,
                glowIntensity: 1.5
            });

            // Periodic pulse effect
            setInterval(() => {
                if (!logoIcon.matches(':hover')) {
                    this.pulseElement(logoIcon);
                }
            }, 8000);
        }

        if (logoText) {
            this.addTextShimmerEffect(logoText);
        }
    }

    addHoverEffect(element, options) {
        const { scale = 1.05, rotation = 0, glowIntensity = 1 } = options;

        element.addEventListener('mouseenter', () => {
            element.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
            element.style.filter = `brightness(${glowIntensity}) drop-shadow(0 0 20px rgba(255, 107, 53, 0.5))`;
            element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = 'scale(1) rotate(0deg)';
            element.style.filter = 'brightness(1) drop-shadow(0 0 0px rgba(255, 107, 53, 0))';
        });
    }

    pulseElement(element) {
        element.style.animation = 'none';
        requestAnimationFrame(() => {
            element.style.animation = 'logoPulse 1s ease-in-out';
        });
    }

    addTextShimmerEffect(element) {
        const shimmerKeyframes = `
            @keyframes textShimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `;
        
        if (!document.querySelector('#shimmer-styles')) {
            const style = document.createElement('style');
            style.id = 'shimmer-styles';
            style.textContent = shimmerKeyframes;
            document.head.appendChild(style);
        }

        element.style.backgroundImage = 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)';
        element.style.backgroundSize = '200% 100%';
        element.style.animation = 'textShimmer 3s ease-in-out infinite';
    }

    // ===== PARTICLE SYSTEM =====
    initializeParticleSystem() {
        this.createParticleContainer();
        this.spawnParticles();
    }

    createParticleContainer() {
        const container = document.createElement('div');
        container.className = 'particle-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
        `;
        document.body.appendChild(container);
        this.particleContainer = container;
    }

    spawnParticles() {
        const particleCount = window.innerWidth < 768 ? 15 : 25;
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                this.createParticle();
            }, i * 200);
        }

        // Continuously spawn particles
        setInterval(() => {
            if (this.particleContainer.children.length < particleCount) {
                this.createParticle();
            }
        }, 3000);
    }

    createParticle() {
        const particle = document.createElement('div');
        const icons = ['🍕', '🍔', '🍜', '🥗', '🍰', '☕', '🍖', '🥪', '🍣', '🍤'];
        const icon = icons[Math.floor(Math.random() * icons.length)];
        
        particle.textContent = icon;
        particle.className = 'floating-particle';
        particle.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 20 + 15}px;
            opacity: ${Math.random() * 0.3 + 0.1};
            left: ${Math.random() * 100}%;
            top: 100%;
            pointer-events: none;
            user-select: none;
            animation: floatUp ${Math.random() * 10 + 10}s linear infinite;
            transform: rotate(${Math.random() * 360}deg);
        `;

        this.particleContainer.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 20000);
    }

    // ===== MESSAGE ANIMATIONS =====
    animateMessageIn(messageElement, sender) {
        messageElement.style.opacity = '0';
        messageElement.style.transform = sender === 'user' ? 'translateX(50px)' : 'translateX(-50px)';
        messageElement.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

        requestAnimationFrame(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateX(0)';
        });

        // Add subtle bounce effect
        setTimeout(() => {
            messageElement.style.transform = 'scale(1.02)';
            setTimeout(() => {
                messageElement.style.transform = 'scale(1)';
            }, 150);
        }, 300);
    }

    // ===== TYPING INDICATOR ANIMATION =====
    animateTypingIndicator() {
        const dots = document.querySelectorAll('.typing-indicator span');
        dots.forEach((dot, index) => {
            dot.style.animationDelay = `${index * 0.2}s`;
            dot.style.animation = 'typingDot 1.4s ease-in-out infinite';
        });
    }

    // ===== BUTTON HOVER EFFECTS =====
    enhanceButtonAnimations() {
        const buttons = document.querySelectorAll('.quick-btn, .send-btn, .action-btn');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                this.createRippleEffect(button);
            });

            button.addEventListener('click', (e) => {
                this.createClickWave(e);
            });
        });
    }

    createRippleEffect(button) {
        const ripple = document.createElement('div');
        ripple.className = 'button-ripple';
        ripple.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
            border-radius: inherit;
            animation: rippleExpand 0.6s ease-out;
            pointer-events: none;
        `;

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    createClickWave(event) {
        const wave = document.createElement('div');
        const rect = event.target.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        wave.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transform: scale(0);
            animation: clickWave 0.5s ease-out;
            pointer-events: none;
            z-index: 1;
        `;

        event.target.appendChild(wave);

        setTimeout(() => {
            if (wave.parentNode) {
                wave.parentNode.removeChild(wave);
            }
        }, 500);
    }

    // ===== SCROLL EFFECTS =====
    bindScrollEffects() {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateScrollEffects();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    updateScrollEffects() {
        const scrollY = window.scrollY;
        const header = document.querySelector('.header');
        
        if (header) {
            const opacity = Math.max(0.9, 1 - scrollY / 200);
            header.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
            header.style.backdropFilter = `blur(${Math.min(20, scrollY / 5)}px)`;
        }

        // Parallax effect for background elements
        const backgroundElements = document.querySelectorAll('.floating-icon');
        backgroundElements.forEach((el, index) => {
            const speed = 0.1 + (index % 3) * 0.05;
            el.style.transform = `translateY(${scrollY * speed}px) rotate(${scrollY * 0.1}deg)`;
        });
    }

    // ===== FLOATING ELEMENTS =====
    initializeFloatingElements() {
        const elements = document.querySelectorAll('.bot-avatar, .feature-item');
        
        elements.forEach((element, index) => {
            this.addFloatingAnimation(element, {
                duration: 3000 + (index * 500),
                amplitude: 5 + (index % 3) * 2
            });
        });
    }

    addFloatingAnimation(element, options) {
        const { duration = 3000, amplitude = 5 } = options;
        let startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed % duration) / duration;
            const yOffset = Math.sin(progress * Math.PI * 2) * amplitude;
            
            element.style.transform = `translateY(${yOffset}px)`;
            requestAnimationFrame(animate);
        };

        animate();
    }

    // ===== NOTIFICATION ANIMATIONS =====
    animateNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Exit animation
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
        }, 2700);
    }

    // ===== MODAL ANIMATIONS =====
    animateModalIn(modal) {
        const modalContent = modal.querySelector('.modal-content');
        
        modal.style.opacity = '0';
        modalContent.style.transform = 'scale(0.7) translateY(-50px)';
        modalContent.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1) translateY(0)';
        });
    }

    animateModalOut(modal, callback) {
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.style.transform = 'scale(0.7) translateY(-50px)';
        modal.style.opacity = '0';
        
        setTimeout(callback, 400);
    }

    // ===== THEME TRANSITION =====
    animateThemeTransition() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--primary-color);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;

        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = '0.3';
        });

        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }, 150);
    }
}

// ===== CSS ANIMATIONS =====
const animationStyles = `
    @keyframes logoPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4); }
    }

    @keyframes typingDot {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-10px); opacity: 1; }
    }

    @keyframes rippleExpand {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
    }

    @keyframes clickWave {
        0% { transform: scale(0); opacity: 0.5; }
        100% { transform: scale(2); opacity: 0; }
    }

    @keyframes floatUp {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 0.6;
        }
        90% {
            opacity: 0.6;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }

    .floating-particle {
        will-change: transform, opacity;
    }

    .message {
        will-change: transform, opacity;
    }

    .feature-item {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .feature-item:hover {
        transform: translateY(-5px) scale(1.02);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .quick-btn {
        position: relative;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .quick-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(255, 107, 53, 0.3);
    }

    .send-btn:active {
        transform: scale(0.95);
    }

    @media (prefers-reduced-motion: reduce) {
        * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// Initialize animation controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.animationController = new AnimationController();
    
    // Enhance existing elements
    window.animationController.enhanceButtonAnimations();
    
    // Set up mutation observer for new elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (node.classList.contains('message')) {
                        const sender = node.classList.contains('user') ? 'user' : 'bot';
                        window.animationController.animateMessageIn(node, sender);
                    }
                    
                    if (node.classList.contains('notification')) {
                        window.animationController.animateNotification(node);
                    }
                    
                    if (node.classList.contains('modal') && !node.classList.contains('hidden')) {
                        window.animationController.animateModalIn(node);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationController;
} 
// ===== PERFORMANCE OPTIMIZATION SYSTEM =====

class PerformanceOptimizer {
    constructor() {
        this.metrics = {
            loadTimes: [],
            apiCalls: [],
            renderTimes: [],
            memoryUsage: []
        };
        this.observers = new Map();
        this.lazyLoadQueue = new Set();
        this.debounceTimers = new Map();
        this.init();
    }

    init() {
        this.setupPerformanceObservers();
        this.optimizeImages();
        this.setupLazyLoading();
        this.optimizeScrolling();
        this.setupMemoryMonitoring();
        this.optimizeAnimations();
    }

    // ===== PERFORMANCE OBSERVERS =====
    setupPerformanceObservers() {
        if (!('PerformanceObserver' in window)) return;

        // Monitor navigation timing
        try {
            const navObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordNavigationMetrics(entry);
                }
            });
            navObserver.observe({ entryTypes: ['navigation'] });
            this.observers.set('navigation', navObserver);
        } catch (error) {
            console.warn('Navigation observer not supported:', error);
        }

        // Monitor resource loading
        try {
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordResourceMetrics(entry);
                }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.set('resource', resourceObserver);
        } catch (error) {
            console.warn('Resource observer not supported:', error);
        }

        // Monitor long tasks
        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.handleLongTask(entry);
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.set('longtask', longTaskObserver);
        } catch (error) {
            console.warn('Long task observer not supported:', error);
        }

        // Monitor layout shifts
        try {
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordLayoutShift(entry);
                }
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.set('layout-shift', clsObserver);
        } catch (error) {
            console.warn('Layout shift observer not supported:', error);
        }
    }

    recordNavigationMetrics(entry) {
        const metrics = {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint(),
            timestamp: Date.now()
        };

        this.metrics.loadTimes.push(metrics);
        this.optimizeBasedOnMetrics(metrics);
    }

    recordResourceMetrics(entry) {
        if (entry.duration > 1000) { // Resources taking more than 1 second
            console.warn(`Slow resource detected: ${entry.name} (${entry.duration}ms)`);
            this.optimizeSlowResource(entry);
        }
    }

    handleLongTask(entry) {
        if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration}ms`);
            this.breakUpLongTasks();
        }
    }

    recordLayoutShift(entry) {
        if (entry.value > 0.1) { // Significant layout shift
            console.warn(`Layout shift detected: ${entry.value}`);
            this.preventLayoutShifts();
        }
    }

    // ===== IMAGE OPTIMIZATION =====
    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading="lazy" for images below the fold
            if (!this.isInViewport(img)) {
                img.loading = 'lazy';
            }

            // Optimize image format based on browser support
            this.optimizeImageFormat(img);

            // Add error handling
            img.addEventListener('error', () => {
                this.handleImageError(img);
            });
        });
    }

    optimizeImageFormat(img) {
        if (!img.src) return;

        // Check for WebP support
        if (this.supportsWebP() && !img.src.includes('.webp')) {
            const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            
            // Test if WebP version exists
            const testImg = new Image();
            testImg.onload = () => {
                img.src = webpSrc;
            };
            testImg.src = webpSrc;
        }
    }

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    handleImageError(img) {
        // Fallback to placeholder or retry with different format
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
    }

    // ===== LAZY LOADING =====
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyElement(entry.target);
                        lazyObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // Observe lazy elements
            document.querySelectorAll('[data-lazy]').forEach(el => {
                lazyObserver.observe(el);
            });

            this.observers.set('lazy', lazyObserver);
        }
    }

    loadLazyElement(element) {
        if (element.dataset.lazy) {
            element.src = element.dataset.lazy;
            element.removeAttribute('data-lazy');
            element.classList.add('loaded');
        }
    }

    // ===== SCROLL OPTIMIZATION =====
    optimizeScrolling() {
        let ticking = false;

        const optimizedScrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Use passive listeners for better performance
        window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250), { passive: true });
    }

    handleScroll() {
        // Implement virtual scrolling for large lists
        this.updateVisibleItems();
        
        // Update header transparency based on scroll
        this.updateHeaderOnScroll();
    }

    handleResize() {
        // Recalculate layouts
        this.recalculateLayouts();
        
        // Update responsive images
        this.updateResponsiveImages();
    }

    updateVisibleItems() {
        const containers = document.querySelectorAll('.virtual-scroll');
        containers.forEach(container => {
            this.implementVirtualScrolling(container);
        });
    }

    implementVirtualScrolling(container) {
        const items = container.querySelectorAll('.scroll-item');
        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;
        
        items.forEach((item, index) => {
            const itemTop = item.offsetTop;
            const itemHeight = item.offsetHeight;
            
            // Hide items that are far outside the viewport
            if (itemTop + itemHeight < scrollTop - containerHeight ||
                itemTop > scrollTop + containerHeight * 2) {
                item.style.display = 'none';
            } else {
                item.style.display = '';
            }
        });
    }

    // ===== MEMORY MONITORING =====
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                this.recordMemoryUsage();
            }, 30000); // Check every 30 seconds
        }
    }

    recordMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const usage = {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
                timestamp: Date.now()
            };

            this.metrics.memoryUsage.push(usage);

            // Clean up if memory usage is high
            if (usage.used / usage.limit > 0.8) {
                this.performMemoryCleanup();
            }
        }
    }

    performMemoryCleanup() {
        // Clear old metrics
        this.cleanupOldMetrics();
        
        // Clear caches
        this.clearCaches();
        
        // Remove unused event listeners
        this.cleanupEventListeners();
        
        console.log('Memory cleanup performed');
    }

    cleanupOldMetrics() {
        const maxAge = 300000; // 5 minutes
        const now = Date.now();
        
        Object.keys(this.metrics).forEach(key => {
            this.metrics[key] = this.metrics[key].filter(
                metric => now - metric.timestamp < maxAge
            );
        });
    }

    clearCaches() {
        if (window.chatbotAI && window.chatbotAI.cache) {
            window.chatbotAI.cache.clear();
        }
    }

    // ===== ANIMATION OPTIMIZATION =====
    optimizeAnimations() {
        // Reduce animations on low-end devices
        if (this.isLowEndDevice()) {
            document.body.classList.add('reduce-animations');
        }

        // Use CSS containment for better performance
        this.applyCSSContainment();
        
        // Optimize animation frame rate
        this.optimizeAnimationFrameRate();
    }

    isLowEndDevice() {
        // Detect low-end devices based on various factors
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const slowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
        const lowMemory = 'memory' in performance && performance.memory.jsHeapSizeLimit < 1000000000; // Less than 1GB
        const oldDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        
        return slowConnection || lowMemory || oldDevice;
    }

    applyCSSContainment() {
        const containers = document.querySelectorAll('.restaurant-card, .message, .modal-content');
        containers.forEach(container => {
            container.style.contain = 'layout style paint';
        });
    }

    optimizeAnimationFrameRate() {
        // Throttle animations on slower devices
        if (this.isLowEndDevice()) {
            const style = document.createElement('style');
            style.textContent = `
                * {
                    animation-duration: 0.1s !important;
                    transition-duration: 0.1s !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ===== UTILITY METHODS =====
    debounce(func, wait) {
        return (...args) => {
            const key = func.toString();
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.set(key, setTimeout(() => func.apply(this, args), wait));
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : 0;
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : 0;
    }

    // ===== OPTIMIZATION STRATEGIES =====
    optimizeBasedOnMetrics(metrics) {
        // If load time is slow, implement optimizations
        if (metrics.domContentLoaded > 3000) {
            this.implementLoadOptimizations();
        }

        // If FCP is slow, prioritize critical resources
        if (metrics.firstContentfulPaint > 2500) {
            this.prioritizeCriticalResources();
        }
    }

    implementLoadOptimizations() {
        // Defer non-critical scripts
        this.deferNonCriticalScripts();
        
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Minimize main thread work
        this.minimizeMainThreadWork();
    }

    deferNonCriticalScripts() {
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            if (!script.hasAttribute('critical')) {
                script.defer = true;
            }
        });
    }

    preloadCriticalResources() {
        const criticalResources = [
            '/css/critical.css',
            '/js/critical.js',
            '/fonts/main.woff2'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = this.getResourceType(resource);
            document.head.appendChild(link);
        });
    }

    getResourceType(url) {
        if (url.endsWith('.css')) return 'style';
        if (url.endsWith('.js')) return 'script';
        if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
        if (url.match(/\.(jpg|jpeg|png|webp|svg)$/)) return 'image';
        return 'fetch';
    }

    minimizeMainThreadWork() {
        // Use web workers for heavy computations
        this.setupWebWorkers();
        
        // Break up long tasks
        this.breakUpLongTasks();
    }

    setupWebWorkers() {
        if ('Worker' in window) {
            // Create worker for data processing
            const workerCode = `
                self.onmessage = function(e) {
                    const { type, data } = e.data;
                    
                    switch(type) {
                        case 'processRestaurants':
                            const processed = processRestaurantData(data);
                            self.postMessage({ type: 'restaurantsProcessed', data: processed });
                            break;
                    }
                };
                
                function processRestaurantData(restaurants) {
                    // Heavy processing logic here
                    return restaurants.map(restaurant => ({
                        ...restaurant,
                        processed: true
                    }));
                }
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            this.worker = new Worker(URL.createObjectURL(blob));
            
            this.worker.onmessage = (e) => {
                this.handleWorkerMessage(e.data);
            };
        }
    }

    handleWorkerMessage(data) {
        switch(data.type) {
            case 'restaurantsProcessed':
                if (window.chatbotAI) {
                    window.chatbotAI.nearbyRestaurants = data.data;
                }
                break;
        }
    }

    breakUpLongTasks() {
        // Use scheduler.postTask if available, otherwise setTimeout
        const scheduler = window.scheduler || {
            postTask: (callback) => setTimeout(callback, 0)
        };

        // Example: Break up restaurant processing
        this.processInChunks = (items, processor, chunkSize = 10) => {
            return new Promise((resolve) => {
                let index = 0;
                const results = [];
                
                const processChunk = () => {
                    const chunk = items.slice(index, index + chunkSize);
                    results.push(...chunk.map(processor));
                    index += chunkSize;
                    
                    if (index < items.length) {
                        scheduler.postTask(processChunk);
                    } else {
                        resolve(results);
                    }
                };
                
                processChunk();
            });
        };
    }

    // ===== PUBLIC API =====
    getPerformanceReport() {
        return {
            metrics: this.metrics,
            recommendations: this.generateRecommendations(),
            deviceInfo: this.getDeviceInfo()
        };
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Analyze load times
        const avgLoadTime = this.metrics.loadTimes.reduce((sum, metric) => 
            sum + metric.domContentLoaded, 0) / this.metrics.loadTimes.length;
        
        if (avgLoadTime > 3000) {
            recommendations.push('Consider optimizing critical rendering path');
        }
        
        // Analyze memory usage
        const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        if (latestMemory && latestMemory.used / latestMemory.limit > 0.7) {
            recommendations.push('High memory usage detected - consider cleanup');
        }
        
        return recommendations;
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            hardwareConcurrency: navigator.hardwareConcurrency,
            memory: 'memory' in performance ? performance.memory : null,
            connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
            devicePixelRatio: window.devicePixelRatio,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    // ===== CLEANUP =====
    destroy() {
        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // Clear timers
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        // Terminate worker
        if (this.worker) {
            this.worker.terminate();
        }
    }
}

// Initialize performance optimizer
window.performanceOptimizer = new PerformanceOptimizer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}
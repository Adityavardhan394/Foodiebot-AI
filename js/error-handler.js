// ===== COMPREHENSIVE ERROR HANDLING SYSTEM =====

class ErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.maxQueueSize = 100;
        this.retryAttempts = new Map();
        this.errorPatterns = this.initializeErrorPatterns();
        this.init();
    }

    init() {
        this.setupGlobalErrorHandlers();
        this.setupNetworkErrorHandling();
        this.setupPerformanceMonitoring();
    }

    setupGlobalErrorHandlers() {
        // Catch JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                timestamp: Date.now()
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise_rejection',
                message: event.reason?.message || 'Unhandled promise rejection',
                reason: event.reason,
                timestamp: Date.now()
            });
        });

        // Catch resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'resource',
                    message: `Failed to load resource: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    timestamp: Date.now()
                });
            }
        }, true);
    }

    setupNetworkErrorHandling() {
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                if (!response.ok) {
                    this.handleError({
                        type: 'network',
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        url: args[0],
                        status: response.status,
                        timestamp: Date.now()
                    });
                }
                
                return response;
            } catch (error) {
                this.handleError({
                    type: 'network',
                    message: error.message,
                    url: args[0],
                    error: error,
                    timestamp: Date.now()
                });
                throw error;
            }
        };
    }

    setupPerformanceMonitoring() {
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) { // Tasks longer than 50ms
                            this.handleError({
                                type: 'performance',
                                message: `Long task detected: ${entry.duration}ms`,
                                duration: entry.duration,
                                startTime: entry.startTime,
                                timestamp: Date.now()
                            });
                        }
                    }
                });
                observer.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                console.warn('Performance monitoring not available:', error);
            }
        }
    }

    initializeErrorPatterns() {
        return {
            network: {
                patterns: ['fetch', 'network', 'connection', 'timeout'],
                recovery: 'retry_with_backoff',
                userMessage: 'Connection issue detected. Retrying...'
            },
            api: {
                patterns: ['api', 'server', '500', '502', '503'],
                recovery: 'fallback_data',
                userMessage: 'Service temporarily unavailable. Using cached data.'
            },
            validation: {
                patterns: ['validation', 'invalid', 'required'],
                recovery: 'user_correction',
                userMessage: 'Please check your input and try again.'
            },
            permission: {
                patterns: ['permission', 'denied', 'unauthorized'],
                recovery: 'request_permission',
                userMessage: 'Permission required. Please allow access.'
            }
        };
    }

    handleError(errorInfo) {
        try {
            // Add to error queue
            this.addToQueue(errorInfo);
            
            // Classify error
            const classification = this.classifyError(errorInfo);
            
            // Apply recovery strategy
            this.applyRecoveryStrategy(errorInfo, classification);
            
            // Log error
            this.logError(errorInfo, classification);
            
            // Report to analytics if critical
            if (this.isCriticalError(errorInfo)) {
                this.reportError(errorInfo, classification);
            }
            
        } catch (handlingError) {
            console.error('Error in error handler:', handlingError);
        }
    }

    addToQueue(errorInfo) {
        this.errorQueue.push(errorInfo);
        
        // Maintain queue size
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift();
        }
    }

    classifyError(errorInfo) {
        const message = errorInfo.message?.toLowerCase() || '';
        
        for (const [category, config] of Object.entries(this.errorPatterns)) {
            if (config.patterns.some(pattern => message.includes(pattern))) {
                return {
                    category,
                    severity: this.calculateSeverity(errorInfo),
                    recovery: config.recovery,
                    userMessage: config.userMessage
                };
            }
        }
        
        return {
            category: 'unknown',
            severity: 'medium',
            recovery: 'log_only',
            userMessage: 'An unexpected error occurred.'
        };
    }

    calculateSeverity(errorInfo) {
        // Critical: App-breaking errors
        if (errorInfo.type === 'javascript' && errorInfo.message.includes('Cannot read property')) {
            return 'critical';
        }
        
        // High: Feature-breaking errors
        if (errorInfo.type === 'network' && errorInfo.status >= 500) {
            return 'high';
        }
        
        // Medium: Degraded experience
        if (errorInfo.type === 'performance' && errorInfo.duration > 100) {
            return 'medium';
        }
        
        // Low: Minor issues
        return 'low';
    }

    async applyRecoveryStrategy(errorInfo, classification) {
        switch (classification.recovery) {
            case 'retry_with_backoff':
                await this.retryWithBackoff(errorInfo);
                break;
                
            case 'fallback_data':
                this.useFallbackData(errorInfo);
                break;
                
            case 'user_correction':
                this.requestUserCorrection(errorInfo, classification.userMessage);
                break;
                
            case 'request_permission':
                this.requestPermission(errorInfo);
                break;
                
            case 'log_only':
            default:
                // Just log the error
                break;
        }
    }

    async retryWithBackoff(errorInfo) {
        const key = this.getRetryKey(errorInfo);
        const attempts = this.retryAttempts.get(key) || 0;
        
        if (attempts < 3) {
            this.retryAttempts.set(key, attempts + 1);
            
            const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
            
            setTimeout(() => {
                this.showUserMessage('Retrying...', 'info');
                // Trigger retry logic here
            }, delay);
        } else {
            this.showUserMessage('Unable to complete request. Please try again later.', 'error');
            this.retryAttempts.delete(key);
        }
    }

    useFallbackData(errorInfo) {
        this.showUserMessage('Using offline data', 'warning');
        
        // Trigger fallback data loading
        if (window.chatbotAI) {
            window.chatbotAI.loadRestaurantData();
        }
    }

    requestUserCorrection(errorInfo, message) {
        this.showUserMessage(message, 'warning');
    }

    requestPermission(errorInfo) {
        this.showUserMessage('Please grant the required permissions to continue', 'info');
    }

    getRetryKey(errorInfo) {
        return `${errorInfo.type}_${errorInfo.url || errorInfo.message}`;
    }

    isCriticalError(errorInfo) {
        return errorInfo.type === 'javascript' || 
               (errorInfo.type === 'network' && errorInfo.status >= 500) ||
               (errorInfo.type === 'performance' && errorInfo.duration > 200);
    }

    logError(errorInfo, classification) {
        const logLevel = this.getLogLevel(classification.severity);
        const logMessage = `[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`;
        
        console[logLevel](logMessage, {
            ...errorInfo,
            classification
        });
    }

    getLogLevel(severity) {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'error';
            case 'medium': return 'warn';
            case 'low': return 'info';
            default: return 'log';
        }
    }

    async reportError(errorInfo, classification) {
        try {
            const errorReport = {
                ...errorInfo,
                classification,
                userAgent: navigator.userAgent,
                url: window.location.href,
                userId: this.getUserId(),
                sessionId: this.getSessionId()
            };

            // Send to error reporting service
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/errors', JSON.stringify(errorReport));
            } else {
                fetch('/api/errors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(errorReport)
                }).catch(() => {
                    // Silently fail if error reporting fails
                });
            }
        } catch (error) {
            console.error('Failed to report error:', error);
        }
    }

    showUserMessage(message, type = 'info') {
        // Create and show user notification
        const notification = document.createElement('div');
        notification.className = `error-notification error-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            font-size: 0.9rem;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    getNotificationColor(type) {
        const colors = {
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1',
            success: '#48bb78'
        };
        return colors[type] || colors.info;
    }

    getUserId() {
        return localStorage.getItem('foodiebot_user_id') || 'anonymous';
    }

    getSessionId() {
        return sessionStorage.getItem('foodiebot_session_id') || 'no_session';
    }

    // Public methods for manual error reporting
    reportCustomError(message, context = {}) {
        this.handleError({
            type: 'custom',
            message,
            context,
            timestamp: Date.now()
        });
    }

    getErrorStats() {
        const stats = {
            total: this.errorQueue.length,
            byType: {},
            bySeverity: {},
            recent: this.errorQueue.slice(-10)
        };

        this.errorQueue.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });

        return stats;
    }

    clearErrorQueue() {
        this.errorQueue = [];
        this.retryAttempts.clear();
    }
}

// Initialize error handler
window.errorHandler = new ErrorHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
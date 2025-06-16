// ===== SECURITY MANAGEMENT SYSTEM =====

class SecurityManager {
    constructor() {
        this.cspViolations = [];
        this.suspiciousActivities = [];
        this.rateLimits = new Map();
        this.trustedDomains = this.initializeTrustedDomains();
        this.securityHeaders = this.initializeSecurityHeaders();
        this.init();
    }

    init() {
        this.setupCSP();
        this.setupXSSProtection();
        this.setupInputValidation();
        this.setupRateLimiting();
        this.setupSecurityHeaders();
        this.monitorSuspiciousActivity();
    }

    // ===== CONTENT SECURITY POLICY =====
    setupCSP() {
        // Monitor CSP violations
        document.addEventListener('securitypolicyviolation', (event) => {
            this.handleCSPViolation(event);
        });

        // Set up CSP meta tag if not already present
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            this.setCSPMetaTag();
        }
    }

    setCSPMetaTag() {
        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' wss: ws:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ');

        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = csp;
        document.head.appendChild(meta);
    }

    handleCSPViolation(event) {
        const violation = {
            blockedURI: event.blockedURI,
            violatedDirective: event.violatedDirective,
            originalPolicy: event.originalPolicy,
            sourceFile: event.sourceFile,
            lineNumber: event.lineNumber,
            timestamp: Date.now()
        };

        this.cspViolations.push(violation);
        this.reportSecurityIncident('csp_violation', violation);
        
        console.warn('CSP Violation:', violation);
    }

    // ===== XSS PROTECTION =====
    setupXSSProtection() {
        // Sanitize all user inputs
        this.setupInputSanitization();
        
        // Monitor for potential XSS attempts
        this.monitorXSSAttempts();
    }

    setupInputSanitization() {
        // Override innerHTML setter to sanitize content
        const originalInnerHTML = Element.prototype.__lookupSetter__('innerHTML');
        if (originalInnerHTML) {
            Object.defineProperty(Element.prototype, 'innerHTML', {
                set: function(value) {
                    const sanitized = window.securityManager.sanitizeHTML(value);
                    originalInnerHTML.call(this, sanitized);
                },
                get: Element.prototype.__lookupGetter__('innerHTML')
            });
        }
    }

    sanitizeHTML(html) {
        // Create a temporary div to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Remove dangerous elements and attributes
        this.removeDangerousElements(temp);
        this.removeDangerousAttributes(temp);

        return temp.innerHTML;
    }

    removeDangerousElements(element) {
        const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea'];
        
        dangerousTags.forEach(tag => {
            const elements = element.querySelectorAll(tag);
            elements.forEach(el => el.remove());
        });
    }

    removeDangerousAttributes(element) {
        const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'];
        const allElements = element.querySelectorAll('*');
        
        allElements.forEach(el => {
            dangerousAttrs.forEach(attr => {
                if (el.hasAttribute(attr)) {
                    el.removeAttribute(attr);
                }
            });

            // Remove javascript: URLs
            ['href', 'src', 'action'].forEach(attr => {
                if (el.hasAttribute(attr) && el.getAttribute(attr).toLowerCase().startsWith('javascript:')) {
                    el.removeAttribute(attr);
                }
            });
        });
    }

    monitorXSSAttempts() {
        // Monitor for suspicious patterns in user input
        document.addEventListener('input', (event) => {
            const value = event.target.value;
            if (this.detectXSSPattern(value)) {
                this.handleSuspiciousInput(event.target, value);
            }
        });
    }

    detectXSSPattern(input) {
        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe/gi,
            /eval\s*\(/gi,
            /document\.cookie/gi
        ];

        return xssPatterns.some(pattern => pattern.test(input));
    }

    handleSuspiciousInput(element, value) {
        // Log the attempt
        this.suspiciousActivities.push({
            type: 'xss_attempt',
            element: element.tagName,
            value: value,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        });

        // Clear the input
        element.value = '';
        
        // Show warning to user
        this.showSecurityWarning('Potentially harmful content detected and removed.');
        
        // Report the incident
        this.reportSecurityIncident('xss_attempt', {
            element: element.tagName,
            value: value
        });
    }

    // ===== INPUT VALIDATION =====
    setupInputValidation() {
        // Validate all form inputs
        document.addEventListener('submit', (event) => {
            if (!this.validateForm(event.target)) {
                event.preventDefault();
                this.showSecurityWarning('Please check your input and try again.');
            }
        });
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
                this.highlightInvalidInput(input);
            }
        });

        return isValid;
    }

    validateInput(input) {
        const value = input.value;
        const type = input.type || 'text';

        // Basic validation rules
        switch (type) {
            case 'email':
                return this.validateEmail(value);
            case 'tel':
                return this.validatePhone(value);
            case 'url':
                return this.validateURL(value);
            default:
                return this.validateGeneral(value);
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    validateURL(url) {
        try {
            const urlObj = new URL(url);
            return this.trustedDomains.some(domain => 
                urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
            );
        } catch {
            return false;
        }
    }

    validateGeneral(value) {
        // Check for SQL injection patterns
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
            /(--|\/\*|\*\/|;)/g,
            /(\b(OR|AND)\b.*=.*)/gi
        ];

        return !sqlPatterns.some(pattern => pattern.test(value));
    }

    highlightInvalidInput(input) {
        input.style.borderColor = '#f56565';
        input.style.backgroundColor = '#fed7d7';
        
        setTimeout(() => {
            input.style.borderColor = '';
            input.style.backgroundColor = '';
        }, 3000);
    }

    // ===== RATE LIMITING =====
    setupRateLimiting() {
        this.rateLimitConfig = {
            api_calls: { limit: 100, window: 60000 }, // 100 calls per minute
            form_submissions: { limit: 10, window: 60000 }, // 10 submissions per minute
            search_queries: { limit: 50, window: 60000 } // 50 searches per minute
        };
    }

    checkRateLimit(action, identifier = 'default') {
        const key = `${action}_${identifier}`;
        const config = this.rateLimitConfig[action];
        
        if (!config) return true;

        const now = Date.now();
        const windowStart = now - config.window;
        
        // Get or create rate limit data
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, []);
        }
        
        const attempts = this.rateLimits.get(key);
        
        // Remove old attempts outside the window
        const recentAttempts = attempts.filter(time => time > windowStart);
        
        // Check if limit exceeded
        if (recentAttempts.length >= config.limit) {
            this.handleRateLimitExceeded(action, identifier);
            return false;
        }
        
        // Add current attempt
        recentAttempts.push(now);
        this.rateLimits.set(key, recentAttempts);
        
        return true;
    }

    handleRateLimitExceeded(action, identifier) {
        this.showSecurityWarning('Too many requests. Please wait before trying again.');
        
        this.reportSecurityIncident('rate_limit_exceeded', {
            action,
            identifier,
            timestamp: Date.now()
        });
    }

    // ===== SECURITY HEADERS =====
    initializeSecurityHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        };
    }

    setupSecurityHeaders() {
        // Add security headers to all fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            const secureOptions = {
                ...options,
                headers: {
                    ...this.securityHeaders,
                    ...options.headers
                }
            };
            
            return originalFetch(url, secureOptions);
        };
    }

    // ===== TRUSTED DOMAINS =====
    initializeTrustedDomains() {
        return [
            'localhost',
            'foodiebot.com',
            'api.foodiebot.com',
            'cdnjs.cloudflare.com',
            'fonts.googleapis.com',
            'fonts.gstatic.com'
        ];
    }

    addTrustedDomain(domain) {
        if (!this.trustedDomains.includes(domain)) {
            this.trustedDomains.push(domain);
        }
    }

    // ===== SUSPICIOUS ACTIVITY MONITORING =====
    monitorSuspiciousActivity() {
        // Monitor for rapid clicks (potential bot activity)
        let clickCount = 0;
        let clickTimer;
        
        document.addEventListener('click', () => {
            clickCount++;
            
            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 1000);
            } else if (clickCount > 10) {
                this.handleSuspiciousActivity('rapid_clicking');
                clickCount = 0;
                clearTimeout(clickTimer);
            }
        });

        // Monitor for console access (potential developer tools usage)
        this.monitorConsoleAccess();
        
        // Monitor for unusual navigation patterns
        this.monitorNavigationPatterns();
    }

    monitorConsoleAccess() {
        // Detect if developer tools are open
        let devtools = {
            open: false,
            orientation: null
        };

        const threshold = 160;

        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.handleSuspiciousActivity('devtools_opened');
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    monitorNavigationPatterns() {
        let navigationCount = 0;
        let navigationTimer;
        
        window.addEventListener('beforeunload', () => {
            navigationCount++;
            
            if (navigationCount === 1) {
                navigationTimer = setTimeout(() => {
                    navigationCount = 0;
                }, 5000);
            } else if (navigationCount > 5) {
                this.handleSuspiciousActivity('rapid_navigation');
                navigationCount = 0;
                clearTimeout(navigationTimer);
            }
        });
    }

    handleSuspiciousActivity(type) {
        this.suspiciousActivities.push({
            type,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });

        this.reportSecurityIncident('suspicious_activity', { type });
        
        // Implement progressive security measures
        this.implementSecurityMeasures(type);
    }

    implementSecurityMeasures(activityType) {
        switch (activityType) {
            case 'rapid_clicking':
                this.showSecurityWarning('Unusual activity detected. Please use the application normally.');
                break;
            case 'devtools_opened':
                console.clear();
                console.warn('This is a browser feature intended for developers. If someone told you to copy-paste something here, it is a scam and will give them access to your account.');
                break;
            case 'rapid_navigation':
                this.showSecurityWarning('Please slow down your navigation.');
                break;
        }
    }

    // ===== INCIDENT REPORTING =====
    reportSecurityIncident(type, details) {
        const incident = {
            type,
            details,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: this.getUserId(),
            sessionId: this.getSessionId()
        };

        // Send to security monitoring service
        this.sendSecurityReport(incident);
    }

    async sendSecurityReport(incident) {
        try {
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/security/incidents', JSON.stringify(incident));
            } else {
                fetch('/api/security/incidents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(incident)
                }).catch(() => {
                    // Silently fail if reporting fails
                });
            }
        } catch (error) {
            console.error('Failed to report security incident:', error);
        }
    }

    // ===== USER INTERFACE =====
    showSecurityWarning(message) {
        const warning = document.createElement('div');
        warning.className = 'security-warning';
        warning.innerHTML = `
            <div class="security-warning-content">
                <i class="fas fa-shield-alt"></i>
                <span>${message}</span>
                <button class="close-warning">&times;</button>
            </div>
        `;
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f56565;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(warning);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            warning.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => warning.remove(), 300);
        }, 5000);

        // Manual close
        warning.querySelector('.close-warning').addEventListener('click', () => {
            warning.remove();
        });
    }

    // ===== UTILITY METHODS =====
    getUserId() {
        return localStorage.getItem('foodiebot_user_id') || 'anonymous';
    }

    getSessionId() {
        return sessionStorage.getItem('foodiebot_session_id') || 'no_session';
    }

    // ===== PUBLIC API =====
    getSecurityReport() {
        return {
            cspViolations: this.cspViolations,
            suspiciousActivities: this.suspiciousActivities,
            rateLimitStatus: this.getRateLimitStatus(),
            trustedDomains: this.trustedDomains
        };
    }

    getRateLimitStatus() {
        const status = {};
        this.rateLimits.forEach((attempts, key) => {
            const [action] = key.split('_');
            const config = this.rateLimitConfig[action];
            if (config) {
                const now = Date.now();
                const recentAttempts = attempts.filter(time => time > now - config.window);
                status[key] = {
                    attempts: recentAttempts.length,
                    limit: config.limit,
                    remaining: Math.max(0, config.limit - recentAttempts.length)
                };
            }
        });
        return status;
    }

    // ===== CLEANUP =====
    destroy() {
        // Clear stored data
        this.cspViolations = [];
        this.suspiciousActivities = [];
        this.rateLimits.clear();
    }
}

// Initialize security manager
window.securityManager = new SecurityManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
}
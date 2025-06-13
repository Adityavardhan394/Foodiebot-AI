const config = {
    // App Information
    app: {
        name: "FoodieBot",
        version: "1.0.0",
        description: "AI-powered restaurant discovery and ordering platform"
    },

    // Feature Flags
    features: {
        offlineSupport: true,
        analytics: true,
        pushNotifications: false
    },

    // UI Configuration
    ui: {
        theme: {
            primary: "#ff6b35",
            secondary: "#4ecdc4",
            accent: "#ffd700",
            background: "#ffffff",
            text: "#333333"
        },
        animations: {
            enabled: true,
            duration: 300
        },
        responsive: {
            mobile: 480,
            tablet: 768,
            desktop: 1024
        }
    },

    // Analytics Configuration
    analytics: {
        enabled: true,
        events: {
            pageView: true,
            search: true,
            order: true,
            error: true
        }
    },

    // Cache Configuration
    cache: {
        enabled: true,
        duration: 3600, // 1 hour in seconds
        maxSize: 50 // Maximum number of items to cache
    },

    // Error Handling
    errorHandling: {
        showUserFriendlyErrors: true,
        logErrors: true
    },

    // Performance Monitoring
    performance: {
        enabled: true,
        sampleRate: 0.1 // 10% of users
    },

    // Security
    security: {
        encryption: true,
        sslRequired: true
    }
};

// Make config globally accessible
window.appConfig = config; 
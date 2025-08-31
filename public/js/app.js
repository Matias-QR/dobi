// Main Application for Dobi Protocol
class DobiApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 Initializing Dobi Protocol Application...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
            
        } catch (error) {
            console.error('Failed to initialize Dobi App:', error);
        }
    }
    
    async initializeApp() {
        try {
            // Initialize all modules
            await this.initializeModules();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Setup error handling
            this.setupErrorHandling();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ Dobi Protocol Application initialized successfully');
            
            // Emit ready event
            this.emit('ready');
            
        } catch (error) {
            console.error('Error during app initialization:', error);
            this.showFatalError('Failed to initialize application');
        }
    }
    
    async initializeModules() {
        // Initialize modules in order
        const moduleOrder = [
            'web3',
            'auth',
            'ui',
            'devices',
            'transactions'
        ];
        
        for (const moduleName of moduleOrder) {
            try {
                await this.initializeModule(moduleName);
            } catch (error) {
                console.error(`Failed to initialize module ${moduleName}:`, error);
                throw error;
            }
        }
    }
    
    async initializeModule(moduleName) {
        const moduleMap = {
            'web3': window.dobiWeb3,
            'auth': window.dobiAuth,
            'ui': window.dobiUI,
            'devices': window.dobiDevices,
            'transactions': window.dobiTransactions
        };
        
        const module = moduleMap[moduleName];
        if (!module) {
            throw new Error(`Module ${moduleName} not found`);
        }
        
        // Wait for module to be ready if it has an async init
        if (module.init && typeof module.init === 'function') {
            if (module.init.constructor.name === 'AsyncFunction') {
                await module.init();
            } else {
                module.init();
            }
        }
        
        this.modules[moduleName] = module;
        console.log(`✅ Module ${moduleName} initialized`);
    }
    
    setupGlobalEventListeners() {
        // Handle authentication events
        window.addEventListener('dobi:auth:authenticated', (event) => {
            console.log('User authenticated:', event.detail);
            this.onUserAuthenticated(event.detail);
        });
        
        window.addEventListener('dobi:auth:logout', () => {
            console.log('User logged out');
            this.onUserLogout();
        });
        
        // Handle page events
        window.addEventListener('dobi:page:show', (event) => {
            console.log('Page shown:', event.detail);
            this.onPageShow(event.detail);
        });
        
        // Handle Web3 events
        window.addEventListener('dobi:connected', (event) => {
            console.log('Wallet connected:', event.detail);
            this.onWalletConnected(event.detail);
        });
        
        window.addEventListener('dobi:disconnected', () => {
            console.log('Wallet disconnected');
            this.onWalletDisconnected();
        });
        
        // Handle errors
        window.addEventListener('dobi:error', (event) => {
            console.error('Dobi error:', event.detail);
            this.onError(event.detail);
        });
        
        // Handle window events
        window.addEventListener('resize', this.debounce(() => {
            this.onWindowResize();
        }, 250));
        
        window.addEventListener('online', () => {
            this.onNetworkStatusChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.onNetworkStatusChange(false);
        });
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHidden();
            } else {
                this.onPageVisible();
            }
        });
    }
    
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error);
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
        });
    }
    
    setupPerformanceMonitoring() {
        // Monitor page load performance
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.measurePagePerformance();
                }, 0);
            });
        }
        
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) { // Tasks longer than 50ms
                            console.warn('Long task detected:', entry);
                        }
                    }
                });
                observer.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                console.warn('PerformanceObserver not supported:', error);
            }
        }
    }
    
    // Event handlers
    
    onUserAuthenticated(user) {
        // Update UI for authenticated user
        this.updateUIForAuthenticatedUser(user);
        
        // Load user-specific data
        this.loadUserData();
        
        // Show welcome message
        this.showToast('success', 'Welcome!', `Authenticated as ${this.formatAddress(user.address)}`);
    }
    
    onUserLogout() {
        // Clear user-specific data
        this.clearUserData();
        
        // Update UI for logged out user
        this.updateUIForLoggedOutUser();
        
        // Show logout message
        this.showToast('info', 'Logged Out', 'You have been logged out successfully');
    }
    
    onPageShow(pageData) {
        // Update page title
        this.updatePageTitle(pageData.page);
        
        // Track page view
        this.trackPageView(pageData.page);
        
        // Load page-specific data
        this.loadPageData(pageData.page);
    }
    
    onWalletConnected(connectionData) {
        // Update connection status
        this.updateConnectionStatus(true, connectionData);
        
        // Show connection success
        this.showToast('success', 'Connected', `Connected to ${connectionData.network || 'blockchain'}`);
    }
    
    onWalletDisconnected() {
        // Update connection status
        this.updateConnectionStatus(false);
        
        // Show disconnection message
        this.showToast('info', 'Disconnected', 'Wallet disconnected');
    }
    
    onError(error) {
        // Log error
        console.error('Application error:', error);
        
        // Show error to user
        this.showToast('error', 'Error', error.message || 'An unexpected error occurred');
        
        // Report error to monitoring service (if configured)
        this.reportError(error);
    }
    
    onWindowResize() {
        // Handle responsive layout changes
        this.updateResponsiveLayout();
    }
    
    onNetworkStatusChange(isOnline) {
        if (isOnline) {
            this.showToast('success', 'Online', 'Internet connection restored');
            this.retryFailedRequests();
        } else {
            this.showToast('warning', 'Offline', 'Internet connection lost');
        }
    }
    
    onPageHidden() {
        // Pause non-essential operations
        this.pauseBackgroundOperations();
    }
    
    onPageVisible() {
        // Resume operations
        this.resumeBackgroundOperations();
        
        // Refresh data if needed
        this.refreshDataIfNeeded();
    }
    
    // Utility methods
    
    updateUIForAuthenticatedUser(user) {
        // Show authenticated-only navigation items
        const authRequiredLinks = document.querySelectorAll('.nav-link[data-page="create"], .nav-link[data-page="devices"]');
        authRequiredLinks.forEach(link => {
            link.style.display = 'block';
        });
        
        // Update user info display
        const userAddress = document.getElementById('user-address');
        if (userAddress) {
            userAddress.textContent = this.formatAddress(user.address);
        }
    }
    
    updateUIForLoggedOutUser() {
        // Hide authenticated-only navigation items
        const authRequiredLinks = document.querySelectorAll('.nav-link[data-page="create"], .nav-link[data-page="devices"]');
        authRequiredLinks.forEach(link => {
            link.style.display = 'none';
        });
        
        // Clear user info
        const userAddress = document.getElementById('user-address');
        if (userAddress) {
            userAddress.textContent = '';
        }
    }
    
    updateConnectionStatus(isConnected, connectionData = {}) {
        const statusIndicator = document.getElementById('connection-status');
        if (statusIndicator) {
            statusIndicator.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
            statusIndicator.textContent = isConnected ? 'Connected' : 'Disconnected';
        }
    }
    
    updatePageTitle(pageName) {
        const titles = {
            'home': 'Dobi Protocol - Home',
            'devices': 'Dobi Protocol - My Devices',
            'create': 'Dobi Protocol - Create Device',
            'transactions': 'Dobi Protocol - Transactions'
        };
        
        document.title = titles[pageName] || 'Dobi Protocol';
    }
    
    loadUserData() {
        // Load user's devices
        if (this.modules.devices) {
            this.modules.devices.loadDevices();
        }
        
        // Load user's transactions
        if (this.modules.transactions) {
            this.modules.transactions.loadTransactions();
        }
    }
    
    clearUserData() {
        // Clear devices
        if (this.modules.devices) {
            this.modules.devices.clearDevices();
        }
        
        // Clear transactions
        if (this.modules.transactions) {
            this.modules.transactions.clearTransactions();
        }
    }
    
    loadPageData(pageName) {
        switch (pageName) {
            case 'home':
                this.loadHomePageData();
                break;
            case 'devices':
                this.loadDevicesPageData();
                break;
            case 'create':
                this.loadCreatePageData();
                break;
            case 'transactions':
                this.loadTransactionsPageData();
                break;
        }
    }
    
    loadHomePageData() {
        // Load statistics and recent data
        this.loadStatistics();
        this.loadRecentData();
    }
    
    loadDevicesPageData() {
        // Devices are loaded by the devices module
    }
    
    loadCreatePageData() {
        // Reset form and prepare for new device creation
        const form = document.getElementById('create-device-form');
        if (form) {
            form.reset();
        }
    }
    
    loadTransactionsPageData() {
        // Transactions are loaded by the transactions module
    }
    
    async loadStatistics() {
        try {
            // Load overall statistics
            const statsResponse = await fetch('/api/stats');
            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                this.updateStatistics(stats);
            }
        } catch (error) {
            console.warn('Failed to load statistics:', error);
        }
    }
    
    async loadRecentData() {
        // Recent data is loaded by respective modules
    }
    
    updateStatistics(stats) {
        // Update statistics display
        const totalUsers = document.getElementById('total-users');
        if (totalUsers && stats.totalUsers !== undefined) {
            totalUsers.textContent = stats.totalUsers;
        }
    }
    
    updateResponsiveLayout() {
        // Handle responsive layout updates
        if (this.modules.ui) {
            this.modules.ui.updateResponsiveLayout();
        }
    }
    
    pauseBackgroundOperations() {
        // Pause any background operations
        console.log('Pausing background operations');
    }
    
    resumeBackgroundOperations() {
        // Resume background operations
        console.log('Resuming background operations');
    }
    
    refreshDataIfNeeded() {
        // Check if data needs refresh based on time since last update
        const lastUpdate = localStorage.getItem('dobi_last_update');
        const now = Date.now();
        const refreshThreshold = 5 * 60 * 1000; // 5 minutes
        
        if (!lastUpdate || (now - parseInt(lastUpdate)) > refreshThreshold) {
            this.refreshData();
            localStorage.setItem('dobi_last_update', now.toString());
        }
    }
    
    async refreshData() {
        // Refresh all data
        if (this.modules.devices) {
            await this.modules.devices.loadDevices();
        }
        
        if (this.modules.transactions) {
            await this.modules.transactions.loadTransactions();
        }
        
        await this.loadStatistics();
    }
    
    async retryFailedRequests() {
        // Retry any failed requests
        console.log('Retrying failed requests...');
    }
    
    measurePagePerformance() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                console.log('Page load performance:', {
                    'DOM Content Loaded': navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    'Load Complete': navigation.loadEventEnd - navigation.loadEventStart,
                    'Total Time': navigation.loadEventEnd - navigation.navigationStart
                });
            }
        }
    }
    
    trackPageView(pageName) {
        // Track page view for analytics
        console.log(`Page view: ${pageName}`);
        
        // You can integrate with Google Analytics, Mixpanel, etc. here
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_title: pageName,
                page_location: window.location.href
            });
        }
    }
    
    reportError(error) {
        // Report error to monitoring service
        console.log('Reporting error:', error);
        
        // You can integrate with Sentry, LogRocket, etc. here
    }
    
    showFatalError(message) {
        // Show fatal error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fatal-error';
        errorDiv.innerHTML = `
            <div class="fatal-error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Application Error</h2>
                <p>${message}</p>
                <button onclick="window.location.reload()">Reload Page</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    // Utility functions
    
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    showToast(type, title, message, duration = 5000) {
        if (this.modules.ui) {
            this.modules.ui.showToast(type, title, message, duration);
        }
    }
    
    // Event emitter
    emit(event, data) {
        const customEvent = new CustomEvent(`dobi:app:${event}`, { detail: data });
        window.dispatchEvent(customEvent);
    }
    
    // Public API methods
    
    getModule(moduleName) {
        return this.modules[moduleName];
    }
    
    isModuleReady(moduleName) {
        return this.modules[moduleName] !== undefined;
    }
    
    getCurrentUser() {
        if (this.modules.auth) {
            return this.modules.auth.getCurrentUser();
        }
        return null;
    }
    
    isUserAuthenticated() {
        if (this.modules.auth) {
            return this.modules.auth.isUserAuthenticated();
        }
        return false;
    }
    
    getCurrentPage() {
        if (this.modules.ui) {
            return this.modules.ui.currentPage;
        }
        return 'home';
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.dobiApp = new DobiApp();
    
    // Add some global utility functions
    window.showPage = (pageName) => {
        if (window.dobiApp && window.dobiApp.modules.ui) {
            window.dobiApp.modules.ui.navigateToPage(pageName);
        }
    };
    
    window.showToast = (type, title, message) => {
        if (window.dobiApp) {
            window.dobiApp.showToast(type, title, message);
        }
    };
    
    window.showLoading = (message) => {
        if (window.dobiApp && window.dobiApp.modules.ui) {
            window.dobiApp.modules.ui.showLoading(message);
        }
    };
    
    window.hideLoading = () => {
        if (window.dobiApp && window.dobiApp.modules.ui) {
            window.dobiApp.modules.ui.hideLoading();
        }
    };
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DobiApp;
}

// Main Application Module for Dobi Protocol
class DobiApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeModules());
            } else {
                this.initializeModules();
            }
            
        } catch (error) {
            console.error('Error initializing DobiApp:', error);
        }
    }
    
    initializeModules() {
        try {
            // Initialize Web3 module first
            this.modules.web3 = new DobiWeb3();
            
            // Initialize UI module
            this.modules.ui = new DobiUI();
            
            // Initialize authentication module
            this.modules.auth = new DobiAuth();
            
            // Initialize devices module
            this.modules.devices = new DobiDevices();
            
            // Initialize transactions module
            this.modules.transactions = new DobiTransactions();
            
            // Set global references
            window.dobiWeb3 = this.modules.web3;
            window.dobiUI = this.modules.ui;
            window.dobiAuth = this.modules.auth;
            window.dobiDevices = this.modules.devices;
            window.dobiTransactions = this.modules.transactions;
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Load initial data
            this.loadInitialData();
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Emit ready event
            this.emitReadyEvent();
            
            console.log('Dobi Protocol initialized successfully');
            
        } catch (error) {
            console.error('Error initializing modules:', error);
        }
    }
    
    setupGlobalEventListeners() {
        // Authentication events
        window.addEventListener('dobi:auth:authenticated', (event) => {
            this.handleAuthentication(event.detail);
        });
        
        window.addEventListener('dobi:auth:logout', (event) => {
            this.handleLogout(event.detail);
        });
        
        // Page change events
        window.addEventListener('dobi:page:changed', (event) => {
            this.handlePageChange(event.detail);
        });
        
        // Web3 events
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountsChanged(accounts);
            });
            
            window.ethereum.on('chainChanged', (chainId) => {
                this.handleChainChanged(chainId);
            });
        }
        
        // Error handling
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledRejection(event);
        });
        
        // Window events
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
        
        window.addEventListener('online', () => {
            this.handleNetworkStatusChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.handleNetworkStatusChange(false);
        });
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }
    
    async loadInitialData() {
        try {
            // Load devices if user is authenticated
            if (this.modules.auth && this.modules.auth.isUserAuthenticated()) {
                await this.modules.devices.loadDevices();
                await this.modules.transactions.loadTransactions();
            }
            
            // Update UI
            this.updateUI();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }
    
    handleAuthentication(authData) {
        try {
            console.log('User authenticated:', authData);
            
            // Load user-specific data
            this.modules.devices.loadDevices();
            this.modules.transactions.loadTransactions();
            
            // Update UI
            this.updateUI();
            
        } catch (error) {
            console.error('Error handling authentication:', error);
        }
    }
    
    handleLogout(authData) {
        try {
            console.log('User logged out:', authData);
            
            // Clear user-specific data
            this.modules.devices.clearDevices();
            this.modules.transactions.clearTransactions();
            
            // Update UI
            this.updateUI();
            
        } catch (error) {
            console.error('Error handling logout:', error);
        }
    }
    
    handlePageChange(pageData) {
        try {
            console.log('Page changed:', pageData);
            
            // Load page-specific data
            switch (pageData.page) {
                case 'devices':
                    if (this.modules.devices) {
                        this.modules.devices.loadDevices();
                    }
                    break;
                    
                case 'transactions':
                    if (this.modules.transactions) {
                        this.modules.transactions.loadTransactions();
                    }
                    break;
                    
                case 'home':
                    // Refresh home page data
                    if (this.modules.devices) {
                        this.modules.devices.loadDevices();
                    }
                    break;
            }
            
        } catch (error) {
            console.error('Error handling page change:', error);
        }
    }
    
    handleAccountsChanged(accounts) {
        try {
            console.log('Accounts changed:', accounts);
            
            // Handle account change in Web3 module
            if (this.modules.web3) {
                this.modules.web3.handleAccountsChanged(accounts);
            }
            
        } catch (error) {
            console.error('Error handling accounts change:', error);
        }
    }
    
    handleChainChanged(chainId) {
        try {
            console.log('Chain changed:', chainId);
            
            // Handle chain change in Web3 module
            if (this.modules.web3) {
                this.modules.web3.handleChainChanged(chainId);
            }
            
        } catch (error) {
            console.error('Error handling chain change:', error);
        }
    }
    
    handleGlobalError(errorEvent) {
        console.error('Global error:', errorEvent);
        
        // Show error notification
        if (this.modules.ui) {
            this.modules.ui.showError('Error del sistema', 'Ha ocurrido un error inesperado');
        }
    }
    
    handleUnhandledRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Show error notification
        if (this.modules.ui) {
            this.modules.ui.showError('Error de promesa', 'Una operación asíncrona ha fallado');
        }
    }
    
    handleWindowResize() {
        // Handle responsive design adjustments
        if (this.modules.ui && this.modules.ui.isMobileMenuOpen()) {
            // Close mobile menu on resize if switching to desktop
            if (window.innerWidth > 768) {
                this.modules.ui.closeMobileMenu();
            }
        }
    }
    
    handleNetworkStatusChange(isOnline) {
        if (isOnline) {
            console.log('Network connection restored');
            
            if (this.modules.ui) {
                this.modules.ui.showSuccess('Conexión restaurada', 'La conexión a internet se ha restaurado');
            }
        } else {
            console.log('Network connection lost');
            
            if (this.modules.ui) {
                this.modules.ui.showWarning('Sin conexión', 'La conexión a internet se ha perdido');
            }
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('Page hidden');
        } else {
            console.log('Page visible');
            
            // Refresh data when page becomes visible
            this.loadInitialData();
        }
    }
    
    updateUI() {
        try {
            // Update navigation
            if (this.modules.ui) {
                // Update active page
                const currentPage = this.modules.ui.getCurrentPage();
                this.modules.ui.navigateToPage(currentPage);
            }
            
            // Update authentication UI
            if (this.modules.auth) {
                this.modules.auth.updateUI();
            }
            
            // Update Web3 UI
            if (this.modules.web3) {
                this.modules.web3.updateUI();
            }
            
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }
    
    emitReadyEvent() {
        const event = new CustomEvent('dobi:app:ready', {
            detail: {
                modules: Object.keys(this.modules),
                timestamp: Date.now()
            }
        });
        
        window.dispatchEvent(event);
    }
    
    // Get module by name
    getModule(moduleName) {
        return this.modules[moduleName];
    }
    
    // Check if app is initialized
    isAppInitialized() {
        return this.isInitialized;
    }
    
    // Get app status
    getAppStatus() {
        return {
            isInitialized: this.isInitialized,
            modules: Object.keys(this.modules),
            currentPage: this.modules.ui ? this.modules.ui.getCurrentPage() : null,
            isAuthenticated: this.modules.auth ? this.modules.auth.isUserAuthenticated() : false
        };
    }
    
    // Refresh all data
    async refreshData() {
        try {
            if (this.modules.devices) {
                await this.modules.devices.loadDevices();
            }
            
            if (this.modules.transactions) {
                await this.modules.transactions.loadTransactions();
            }
            
            this.updateUI();
            
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }
}

// Initialize app after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dobiApp = new DobiApp();
});

// Export for use in other modules
window.DobiApp = DobiApp;

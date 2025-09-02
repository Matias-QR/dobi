// Main Application Entry Point
import { DobiWeb3 } from './web3.js';
import { DobiUI } from './ui.js';
import { DobiAuth } from './auth.js';
import { DobiDevices } from './devices.js';
import { DobiTransactions } from './transactions.js';
import { chargerService } from './services/chargerService.js';

class DobiApp {
    constructor() {
        this.web3 = null;
        this.ui = null;
        this.auth = null;
        this.devices = null;
        this.transactions = null;
        this.isInitialized = false;
    }

    async init() {
        try {

            
            // Initialize modules
            this.web3 = new DobiWeb3();
            this.ui = new DobiUI();
            this.auth = new DobiAuth();
            this.devices = new DobiDevices();
            this.transactions = new DobiTransactions();
            
            // Initialize each module
            await this.web3.init();
            this.ui.init();
            this.auth.init();
            this.devices.init();
            this.transactions.init();

            // Load real charger data from API
            this.loadChargersFromAPI();
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            this.isInitialized = true;

            
            // Load initial data
            this.loadInitialData();
            
        } catch (error) {
            console.error('❌ Failed to initialize Dobi Protocol Frontend:', error);
            this.ui.showError('Failed to initialize application');
        }
    }

    setupGlobalEventListeners() {
        // Authentication events
        document.addEventListener('auth:connected', (e) => {
            this.onUserAuthenticated(e.detail);
        });

        document.addEventListener('auth:disconnected', () => {
            this.onUserDisconnected();
        });

        // Page change events
        document.addEventListener('page:changed', (e) => {
            this.onPageChanged(e.detail.page);
        });

        // Web3 events
        document.addEventListener('web3:accountChanged', (e) => {
            this.onAccountChanged(e.detail);
        });

        document.addEventListener('web3:networkChanged', (e) => {
            this.onNetworkChanged(e.detail);
        });

        // Device events
        document.addEventListener('device:created', (e) => {
            this.onDeviceCreated(e.detail);
        });

        document.addEventListener('device:deleted', (e) => {
            this.onDeviceDeleted(e.detail);
        });

        // Error handling
        window.addEventListener('error', (e) => {
            console.error('🌍 Global error:', e.error);
            this.ui.showError('An unexpected error occurred');
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('🚫 Unhandled promise rejection:', e.reason);
            this.ui.showError('An unexpected error occurred');
        });
    }

    async loadInitialData() {
        try {
            // Check if user is already authenticated
            if (this.auth.isAuthenticated) {

                
                // Load user's devices
                await this.devices.loadDevices();
                
                // Load recent transactions
                await this.transactions.loadTransactions();
                
                // Update stats
                this.updateStats();
                
                // Update UI
                this.ui.updateUI();
                
            } else {

                this.ui.showInfo('Please connect your wallet to start using Dobi Protocol');
            }
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            this.ui.showError('Failed to load application data');
        }
    }

    onUserAuthenticated(userData) {
        // Update UI to show authenticated state
        this.ui.updateAuthUI(userData);
        
        // Load user-specific data
        this.devices.loadDevices();
        this.transactions.loadTransactions();
        
        // Update stats
        this.updateStats();
        
        // Show success message
        this.ui.showSuccess(`Welcome back, ${userData.address.slice(0, 6)}...${userData.address.slice(-4)}!`);
    }

    onUserDisconnected() {
        // Clear user data
        this.devices.clearDevices();
        this.transactions.clearTransactions();
        
        // Update UI to show unauthenticated state
        this.ui.updateAuthUI(null);
        
        // Reset stats
        this.resetStats();
        
        // Show info message
        this.ui.showInfo('You have been disconnected from your wallet');
    }

    onPageChanged(page) {
        // Load page-specific data
        switch (page) {
            case 'home':
                this.devices.loadRecentDevices();
                this.updateStats();
                break;
            case 'devices':
                this.devices.loadDevices();
                break;
            case 'transactions':
                this.transactions.loadTransactions();
                break;
            case 'create':
                // Form is already loaded
                break;
        }
    }

    onAccountChanged(accountData) {
        if (this.auth.isAuthenticated) {
            // Re-authenticate with new account
            this.auth.handleAccountChange(accountData);
        }
    }

    onNetworkChanged(networkData) {
        // Update network indicator
        this.ui.updateNetworkUI(networkData);
        
        // Show network change notification
        this.ui.showInfo(`Connected to ${networkData.name} network`);
    }

    onDeviceCreated(deviceData) {
        // Refresh devices list
        this.devices.loadDevices();
        this.devices.loadRecentDevices();
        
        // Update stats
        this.updateStats();
        
        // Show success message
        this.ui.showSuccess(`Device "${deviceData.name}" created successfully!`);
    }

    onDeviceDeleted(deviceData) {
        // Refresh devices list
        this.devices.loadDevices();
        this.devices.loadRecentDevices();
        
        // Update stats
        this.updateStats();
        
        // Show success message
        this.ui.showSuccess(`Device "${deviceData.name}" deleted successfully!`);
    }

    updateStats() {
        try {
            const totalDevices = this.devices.getTotalDevices();
            const activeConnections = this.devices.getActiveConnections();
            const totalTransactions = this.transactions.getTotalTransactions();
            const walletBalance = this.web3.getBalance();
            
            // Update stats in UI
            document.getElementById('total-devices').textContent = totalDevices;
            document.getElementById('active-connections').textContent = activeConnections;
            document.getElementById('total-transactions').textContent = totalTransactions;
            document.getElementById('wallet-balance').textContent = walletBalance;
            
        } catch (error) {
            console.error('❌ Failed to update stats:', error);
        }
    }

    resetStats() {
        // Reset all stats to 0
        document.getElementById('total-devices').textContent = '0';
        document.getElementById('active-connections').textContent = '0';
        document.getElementById('total-transactions').textContent = '0';
        document.getElementById('wallet-balance').textContent = '0 ETH';
    }

    // Public methods for global access
    getWeb3() {
        return this.web3;
    }

    getUI() {
        return this.ui;
    }

    getAuth() {
        return this.auth;
    }

    getDevices() {
        return this.devices;
    }

    getTransactions() {
        return this.transactions;
    }

    isReady() {
        return this.isInitialized;
    }

    /**
     * Load real charger data from Dobi API
     */
    async loadChargersFromAPI() {
        try {

            
            // Show loading message
            if (this.ui) {
                this.ui.showInfo('Loading real charger data from Dobi API...');
            }

            // Load chargers from API
            const chargersResponse = await chargerService.getDetailedChargers();
            
            if (chargersResponse.success) {

                
                // Update devices with real charger data
                await this.devices.loadDevices();
                
                if (this.ui) {
                    this.ui.showSuccess(`Loaded ${chargersResponse.data.length} chargers from Dobi API`);
                }
            } else {
                console.warn('⚠️ Failed to load chargers from API, using mock data:', chargersResponse.error);
                
                if (this.ui) {
                    this.ui.showWarning('Using mock data - API connection failed');
                }
            }
            
        } catch (error) {
            console.error('❌ Error loading chargers from API:', error);
            
            if (this.ui) {
                this.ui.showError('Failed to load chargers from API');
            }
        }
    }
}

// Global app instance
window.dobiApp = new DobiApp();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.dobiApp.init();
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
    }
});

// Global utility functions
window.showPage = (pageName) => {
    if (window.dobiApp && window.dobiApp.isReady()) {
        window.dobiApp.getUI().navigateToPage(pageName);
    } else {
        console.warn('⚠️ App not ready yet, cannot navigate to:', pageName);
    }
};

// Export for module usage
export default DobiApp;

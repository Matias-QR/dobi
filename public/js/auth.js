// Authentication Module for Dobi Protocol
class DobiAuth {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.nonce = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuthenticationStatus();
    }
    
    setupEventListeners() {
        // Connect wallet button
        const connectBtn = document.getElementById('connect-wallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }
        
        // Disconnect wallet button
        const disconnectBtn = document.getElementById('disconnect-wallet');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnectWallet());
        }
        
        // Listen for Web3 events
        window.addEventListener('dobi:connected', (event) => {
            this.handleWalletConnected(event.detail);
        });
        
        window.addEventListener('dobi:disconnected', () => {
            this.handleWalletDisconnected();
        });
        
        window.addEventListener('dobi:accountsChanged', (event) => {
            this.handleAccountChanged(event.detail);
        });
    }
    
    async connectWallet() {
        try {
            this.showLoading('Connecting to MetaMask...');
            
            const result = await window.dobiWeb3.connect();
            
            if (result.success) {
                await this.authenticateUser(result.address);
            } else {
                this.hideLoading();
                this.showToast('error', 'Connection Failed', result.error);
            }
        } catch (error) {
            this.hideLoading();
            console.error('Error connecting wallet:', error);
            this.showToast('error', 'Connection Error', 'Failed to connect to MetaMask');
        }
    }
    
    async disconnectWallet() {
        try {
            window.dobiWeb3.disconnect();
            this.logout();
            this.showToast('success', 'Disconnected', 'Wallet disconnected successfully');
        } catch (error) {
            console.error('Error disconnecting wallet:', error);
            this.showToast('error', 'Disconnect Error', 'Failed to disconnect wallet');
        }
    }
    
    async authenticateUser(address) {
        try {
            this.showLoading('Authenticating...');
            
            // Get nonce from server
            const nonceResponse = await fetch(`/api/auth/nonce/${address}`);
            if (!nonceResponse.ok) {
                throw new Error('Failed to get authentication nonce');
            }
            
            const nonceData = await nonceResponse.json();
            this.nonce = nonceData.nonce;
            
            // Create message to sign
            const message = `Sign this message to authenticate with Dobi: ${this.nonce}`;
            
            // Sign message with MetaMask
            const signature = await window.dobiWeb3.signMessage(message);
            
            // Verify signature with server
            const verifyResponse = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: address,
                    signature: signature,
                    nonce: this.nonce
                })
            });
            
            if (!verifyResponse.ok) {
                throw new Error('Authentication failed');
            }
            
            const verifyData = await verifyResponse.json();
            
            if (verifyData.authenticated) {
                this.isAuthenticated = true;
                this.user = verifyData.user;
                
                // Store authentication state
                localStorage.setItem('dobi_auth', JSON.stringify({
                    address: address,
                    timestamp: Date.now()
                }));
                
                this.hideLoading();
                this.showToast('success', 'Authenticated', 'Successfully authenticated with Dobi Protocol');
                
                // Update UI
                this.updateAuthenticationUI();
                
                // Emit authentication event
                this.emit('authenticated', this.user);
                
            } else {
                throw new Error('Invalid signature');
            }
            
        } catch (error) {
            this.hideLoading();
            console.error('Authentication error:', error);
            this.showToast('error', 'Authentication Failed', error.message);
            
            // Disconnect wallet on authentication failure
            window.dobiWeb3.disconnect();
        }
    }
    
    logout() {
        this.isAuthenticated = false;
        this.user = null;
        this.nonce = null;
        
        // Clear stored authentication
        localStorage.removeItem('dobi_auth');
        
        // Update UI
        this.updateAuthenticationUI();
        
        // Emit logout event
        this.emit('logout');
    }
    
    async checkAuthenticationStatus() {
        const storedAuth = localStorage.getItem('dobi_auth');
        
        if (storedAuth) {
            try {
                const authData = JSON.parse(storedAuth);
                const now = Date.now();
                const authAge = now - authData.timestamp;
                
                // Check if authentication is still valid (24 hours)
                if (authAge < 24 * 60 * 60 * 1000) {
                    // Check if wallet is still connected
                    if (window.dobiWeb3.isWalletConnected()) {
                        const currentAddress = window.dobiWeb3.getCurrentAddress();
                        
                        if (currentAddress === authData.address) {
                            // Re-authenticate silently
                            await this.authenticateUser(currentAddress);
                            return;
                        }
                    }
                }
                
                // Clear expired authentication
                localStorage.removeItem('dobi_auth');
                
            } catch (error) {
                console.error('Error checking authentication status:', error);
                localStorage.removeItem('dobi_auth');
            }
        }
        
        this.updateAuthenticationUI();
    }
    
    handleWalletConnected(address) {
        // Auto-authenticate when wallet connects
        if (address && !this.isAuthenticated) {
            this.authenticateUser(address);
        }
    }
    
    handleWalletDisconnected() {
        this.logout();
    }
    
    handleAccountChanged(newAddress) {
        if (this.isAuthenticated && this.user && this.user.address !== newAddress) {
            // Account changed, re-authenticate
            this.authenticateUser(newAddress);
        }
    }
    
    updateAuthenticationUI() {
        const connectBtn = document.getElementById('connect-wallet');
        const userInfo = document.getElementById('user-info');
        const userAddress = document.getElementById('user-address');
        
        if (this.isAuthenticated && this.user) {
            if (connectBtn) connectBtn.classList.add('hidden');
            if (userInfo) userInfo.classList.remove('hidden');
            if (userAddress) userAddress.textContent = window.dobiWeb3.formatAddress(this.user.address);
        } else {
            if (connectBtn) connectBtn.classList.remove('hidden');
            if (userInfo) userInfo.classList.add('hidden');
        }
        
        // Update navigation based on authentication status
        this.updateNavigationVisibility();
    }
    
    updateNavigationVisibility() {
        const authRequiredPages = ['create', 'devices'];
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (authRequiredPages.includes(page)) {
                if (this.isAuthenticated) {
                    link.style.display = 'block';
                } else {
                    link.style.display = 'none';
                }
            }
        });
    }
    
    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated && this.user !== null;
    }
    
    // Get current user
    getCurrentUser() {
        return this.user;
    }
    
    // Get current user address
    getCurrentUserAddress() {
        return this.user ? this.user.address : null;
    }
    
    // Require authentication for protected actions
    requireAuth() {
        if (!this.isUserAuthenticated()) {
            this.showToast('warning', 'Authentication Required', 'Please connect your wallet to continue');
            return false;
        }
        return true;
    }
    
    // Show loading spinner
    showLoading(message = 'Loading...') {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            const messageEl = spinner.querySelector('p');
            if (messageEl) messageEl.textContent = message;
            spinner.classList.remove('hidden');
        }
    }
    
    // Hide loading spinner
    hideLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.add('hidden');
        }
    }
    
    // Show toast notification
    showToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-title">${title}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="toast-message">${message}</div>
        `;
        
        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 5000);
        }
    }
    
    // Event emitter
    emit(event, data) {
        const customEvent = new CustomEvent(`dobi:auth:${event}`, { detail: data });
        window.dispatchEvent(customEvent);
    }
}

// Initialize Authentication
window.dobiAuth = new DobiAuth();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DobiAuth;
}

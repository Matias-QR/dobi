// Authentication Module for Dobi Protocol
class DobiAuth {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.authToken = null;
        
        this.setupEventListeners();
        this.loadStoredAuth();
    }
    
    setupEventListeners() {
        // Connect wallet button
        const connectBtn = document.getElementById('connect-wallet-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.handleConnectWallet());
        }
        
        // Disconnect button
        const disconnectBtn = document.getElementById('disconnect-btn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.handleDisconnect());
        }
    }
    
    async handleConnectWallet() {
        try {
            // Show loading
            if (window.dobiUI) {
                window.dobiUI.showLoading('Conectando wallet...');
            }
            
            // Connect wallet
            const account = await window.dobiWeb3.connectWallet();
            
            // Get nonce from backend
            const nonce = await this.getNonce(account);
            
            // Sign message
            const message = `Dobi Protocol Authentication\n\nAddress: ${account}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
            const signature = await window.dobiWeb3.signMessage(message);
            
            // Verify signature with backend
            const authResult = await this.verifySignature(account, message, signature);
            
            if (authResult.success) {
                this.user = {
                    address: account,
                    name: authResult.user?.name || 'Usuario',
                    email: authResult.user?.email || null
                };
                
                this.authToken = authResult.token;
                this.isAuthenticated = true;
                
                // Store auth data
                this.storeAuthData();
                
                // Update UI
                this.updateUI();
                
                // Emit event
                this.emitAuthEvent('authenticated');
                
                // Show success message
                if (window.dobiUI) {
                    window.dobiUI.showSuccess('Autenticación exitosa', 'Wallet conectada correctamente');
                    window.dobiUI.hideLoading();
                }
                
            } else {
                throw new Error(authResult.error || 'Error en la autenticación');
            }
            
        } catch (error) {
            console.error('Authentication error:', error);
            
            // Show error message
            if (window.dobiUI) {
                window.dobiUI.showError('Error de autenticación', error.message);
                window.dobiUI.hideLoading();
            }
        }
    }
    
    async handleDisconnect() {
        try {
            // Disconnect wallet
            await window.dobiWeb3.disconnectWallet();
            
            // Clear auth data
            this.clearAuthData();
            
            // Update UI
            this.updateUI();
            
            // Emit event
            this.emitAuthEvent('logout');
            
            // Show success message
            if (window.dobiUI) {
                window.dobiUI.showSuccess('Desconectado', 'Wallet desconectada correctamente');
            }
            
        } catch (error) {
            console.error('Disconnect error:', error);
            
            if (window.dobiUI) {
                window.dobiUI.showError('Error al desconectar', error.message);
            }
        }
    }
    
    async getNonce(address) {
        try {
            // For now, return a simple nonce
            // In production, this should come from your backend
            return `nonce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
        } catch (error) {
            console.error('Error getting nonce:', error);
            throw new Error('No se pudo obtener el nonce');
        }
    }
    
    async verifySignature(address, message, signature) {
        try {
            // For now, return success
            // In production, this should verify with your backend
            return {
                success: true,
                token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user: {
                    name: 'Usuario Dobi',
                    email: null
                }
            };
            
        } catch (error) {
            console.error('Error verifying signature:', error);
            return {
                success: false,
                error: 'Error al verificar la firma'
            };
        }
    }
    
    updateUI() {
        const connectBtn = document.getElementById('connect-wallet-btn');
        const userInfo = document.getElementById('user-info');
        const userAddress = document.getElementById('user-address');
        
        if (this.isAuthenticated && this.user) {
            // Hide connect button, show user info
            if (connectBtn) connectBtn.classList.add('hidden');
            if (userInfo) userInfo.classList.remove('hidden');
            if (userAddress) userAddress.textContent = this.formatAddress(this.user.address);
        } else {
            // Show connect button, hide user info
            if (connectBtn) connectBtn.classList.remove('hidden');
            if (userInfo) userInfo.classList.add('hidden');
        }
    }
    
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    storeAuthData() {
        try {
            const authData = {
                user: this.user,
                token: this.authToken,
                timestamp: Date.now()
            };
            
            localStorage.setItem('dobi_auth', JSON.stringify(authData));
            
        } catch (error) {
            console.error('Error storing auth data:', error);
        }
    }
    
    loadStoredAuth() {
        try {
            const stored = localStorage.getItem('dobi_auth');
            if (stored) {
                const authData = JSON.parse(stored);
                
                // Check if token is still valid (24 hours)
                const isValid = (Date.now() - authData.timestamp) < (24 * 60 * 60 * 1000);
                
                if (isValid) {
                    this.user = authData.user;
                    this.authToken = authData.token;
                    this.isAuthenticated = true;
                    
                    this.updateUI();
                } else {
                    // Token expired, clear it
                    this.clearAuthData();
                }
            }
            
        } catch (error) {
            console.error('Error loading stored auth:', error);
            this.clearAuthData();
        }
    }
    
    clearAuthData() {
        this.user = null;
        this.authToken = null;
        this.isAuthenticated = false;
        
        try {
            localStorage.removeItem('dobi_auth');
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
    }
    
    emitAuthEvent(eventType) {
        const event = new CustomEvent(`dobi:auth:${eventType}`, {
            detail: {
                user: this.user,
                isAuthenticated: this.isAuthenticated
            }
        });
        
        window.dispatchEvent(event);
    }
    
    // Get current auth status
    getAuthStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            user: this.user,
            token: this.authToken
        };
    }
    
    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated && this.user !== null;
    }
    
    // Get user info
    getUser() {
        return this.user;
    }
    
    // Get auth token
    getToken() {
        return this.authToken;
    }
}

// Export for use in other modules
window.DobiAuth = DobiAuth;

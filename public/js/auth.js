// Authentication Module for Dobi Protocol
export class DobiAuth {
    constructor() {
        this.isAuthenticated = false;
        this.userData = null;
        this.nonce = null;
        this.web3 = null;
    }

    init() {
        try {
            // Check for existing session
            this.loadSession();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('🔐 Authentication module initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize authentication:', error);
        }
    }

    setupEventListeners() {
        // Connect wallet button
        const connectBtn = document.getElementById('connect-wallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.handleConnectWallet());
        }
    }

    async handleConnectWallet() {
        try {
            if (this.isAuthenticated) {
                await this.handleDisconnect();
                return;
            }

            // Get Web3 instance from app
            if (window.dobiApp && window.dobiApp.getWeb3) {
                this.web3 = window.dobiApp.getWeb3();
            } else {
                throw new Error('Web3 module not available');
            }

            // Connect wallet
            await this.web3.connectWallet();
            
            // Get nonce from backend
            await this.getNonce();
            
            // Sign message
            const signature = await this.signMessage();
            
            // Verify signature
            const verified = await this.verifySignature(signature);
            
            if (verified) {
                // Store session
                this.userData = {
                    address: this.web3.getAccount(),
                    network: this.web3.getNetwork(),
                    signature: signature,
                    timestamp: Date.now()
                };
                
                this.isAuthenticated = true;
                this.saveSession();
                
                // Emit authentication event
                this.emitEvent('auth:connected', this.userData);
                
                // Update UI
                this.updateUI();
                
                console.log('🔐 User authenticated successfully');
                
            } else {
                throw new Error('Signature verification failed');
            }
            
        } catch (error) {
            console.error('❌ Authentication failed:', error);
            
            // Show error to user
            if (window.dobiApp && window.dobiApp.getUI) {
                window.dobiApp.getUI().showError('Authentication failed: ' + error.message);
            }
        }
    }

    async handleDisconnect() {
        try {
            // Disconnect wallet
            if (this.web3) {
                await this.web3.disconnectWallet();
            }
            
            // Clear session
            this.clearSession();
            
            // Emit disconnect event
            this.emitEvent('auth:disconnected', {});
            
            // Update UI
            this.updateUI();
            
            console.log('🔓 User disconnected successfully');
            
        } catch (error) {
            console.error('❌ Disconnect failed:', error);
        }
    }

    async handleAccountChange(accountData) {
        try {
            if (this.isAuthenticated) {
                // Re-authenticate with new account
                await this.handleConnectWallet();
            }
        } catch (error) {
            console.error('❌ Account change handling failed:', error);
        }
    }

    async getNonce() {
        try {
            // Mock nonce for development
            // In production, this would be a real API call
            this.nonce = `dobi-auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            console.log('🔑 Nonce generated:', this.nonce);
            
        } catch (error) {
            console.error('❌ Failed to get nonce:', error);
            throw error;
        }
    }

    async signMessage() {
        try {
            if (!this.web3 || !this.nonce) {
                throw new Error('Web3 or nonce not available');
            }

            const message = `Welcome to Dobi Protocol!\n\nPlease sign this message to authenticate.\n\nNonce: ${this.nonce}\n\nBy signing, you agree to our Terms of Service.`;
            
            const signature = await this.web3.signMessage(message);
            
            console.log('✍️ Message signed successfully');
            
            return signature;
            
        } catch (error) {
            console.error('❌ Failed to sign message:', error);
            throw error;
        }
    }

    async verifySignature(signature) {
        try {
            // Mock verification for development
            // In production, this would be verified on the backend
            const isValid = signature && signature.length > 0;
            
            console.log('✅ Signature verification:', isValid ? 'PASSED' : 'FAILED');
            
            return isValid;
            
        } catch (error) {
            console.error('❌ Signature verification failed:', error);
            return false;
        }
    }

    // Session management
    saveSession() {
        try {
            const sessionData = {
                isAuthenticated: this.isAuthenticated,
                userData: this.userData,
                timestamp: Date.now()
            };
            
            localStorage.setItem('dobi-session', JSON.stringify(sessionData));
            
        } catch (error) {
            console.error('❌ Failed to save session:', error);
        }
    }

    loadSession() {
        try {
            const sessionData = localStorage.getItem('dobi-session');
            
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                // Check if session is still valid (24 hours)
                const sessionAge = Date.now() - session.timestamp;
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                
                if (sessionAge < maxAge && session.isAuthenticated && session.userData) {
                    this.isAuthenticated = session.isAuthenticated;
                    this.userData = session.userData;
                    
                    console.log('🔄 Session restored from storage');
                    return true;
                } else {
                    // Session expired, clear it
                    this.clearSession();
                }
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Failed to load session:', error);
            this.clearSession();
            return false;
        }
    }

    clearSession() {
        try {
            this.isAuthenticated = false;
            this.userData = null;
            this.nonce = null;
            
            localStorage.removeItem('dobi-session');
            
        } catch (error) {
            console.error('❌ Failed to clear session:', error);
        }
    }

    // Utility methods
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    getUserData() {
        return this.userData;
    }

    getAddress() {
        return this.userData ? this.userData.address : null;
    }

    getNetwork() {
        return this.userData ? this.userData.network : null;
    }

    // Event emission
    emitEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    // Update UI
    updateUI() {
        // Update connect wallet button
        const connectBtn = document.getElementById('connect-wallet');
        if (connectBtn) {
            if (this.isAuthenticated) {
                connectBtn.innerHTML = `
                    <i class="fas fa-wallet"></i>
                    ${this.formatAddress(this.userData.address)}
                `;
                connectBtn.classList.remove('btn-primary');
                connectBtn.classList.add('btn-secondary');
                connectBtn.onclick = () => this.handleDisconnect();
            } else {
                connectBtn.innerHTML = `
                    <i class="fas fa-wallet"></i>
                    Connect Wallet
                `;
                connectBtn.classList.remove('btn-secondary');
                connectBtn.classList.add('btn-primary');
                connectBtn.onclick = () => this.handleConnectWallet();
            }
        }

        // Update navigation based on auth status
        this.updateNavigation();
    }

    updateNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(btn => {
            if (this.isAuthenticated) {
                btn.disabled = false;
                btn.classList.remove('disabled');
            } else {
                // Disable navigation buttons when not authenticated
                if (btn.id !== 'nav-home') {
                    btn.disabled = true;
                    btn.classList.add('disabled');
                }
            }
        });
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    // Public methods for external access
    async authenticate() {
        if (!this.isAuthenticated) {
            await this.handleConnectWallet();
        }
        return this.isAuthenticated;
    }

    async logout() {
        if (this.isAuthenticated) {
            await this.handleDisconnect();
        }
    }
}

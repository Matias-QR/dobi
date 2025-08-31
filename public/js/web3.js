// Web3 Integration for Dobi Protocol
class DobiWeb3 {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.isConnected = false;
        
        this.init();
    }
    
    async init() {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            this.provider = window.ethereum;
            this.setupEventListeners();
            
            // Check if already connected
            if (this.provider.selectedAddress) {
                await this.connect();
            }
        } else {
            console.warn('MetaMask not found. Please install MetaMask to use this application.');
            this.showMetaMaskInstallPrompt();
        }
    }
    
    setupEventListeners() {
        // Listen for account changes
        this.provider.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.address = accounts[0];
                this.updateUI();
                this.emit('accountsChanged', accounts[0]);
            }
        });
        
        // Listen for chain changes
        this.provider.on('chainChanged', (chainId) => {
            this.chainId = chainId;
            this.updateUI();
            this.emit('chainChanged', chainId);
        });
        
        // Listen for disconnect
        this.provider.on('disconnect', () => {
            this.disconnect();
        });
    }
    
    async connect() {
        try {
            // Request account access
            const accounts = await this.provider.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
                this.address = accounts[0];
                this.chainId = await this.provider.request({ method: 'eth_chainId' });
                this.isConnected = true;
                
                // Get signer
                this.signer = this.provider.getSigner();
                
                this.updateUI();
                this.emit('connected', this.address);
                
                return {
                    success: true,
                    address: this.address,
                    chainId: this.chainId
                };
            }
        } catch (error) {
            console.error('Error connecting to MetaMask:', error);
            this.emit('error', error);
            
            if (error.code === 4001) {
                return {
                    success: false,
                    error: 'User rejected the connection request'
                };
            } else {
                return {
                    success: false,
                    error: 'Failed to connect to MetaMask'
                };
            }
        }
    }
    
    async disconnect() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.isConnected = false;
        
        this.updateUI();
        this.emit('disconnected');
    }
    
    async signMessage(message) {
        if (!this.signer) {
            throw new Error('No signer available. Please connect your wallet first.');
        }
        
        try {
            const signature = await this.signer.signMessage(message);
            return signature;
        } catch (error) {
            console.error('Error signing message:', error);
            throw error;
        }
    }
    
    async getBalance() {
        if (!this.provider || !this.address) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const balance = await this.provider.request({
                method: 'eth_getBalance',
                params: [this.address, 'latest']
            });
            
            return this.formatEther(balance);
        } catch (error) {
            console.error('Error getting balance:', error);
            throw error;
        }
    }
    
    async getNetwork() {
        if (!this.provider) {
            throw new Error('Provider not available');
        }
        
        try {
            const chainId = await this.provider.request({ method: 'eth_chainId' });
            return this.getNetworkName(chainId);
        } catch (error) {
            console.error('Error getting network:', error);
            throw error;
        }
    }
    
    getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum Mainnet',
            '0x3': 'Ropsten Testnet',
            '0x4': 'Rinkeby Testnet',
            '0x5': 'Goerli Testnet',
            '0x2a': 'Kovan Testnet',
            '0x89': 'Polygon Mainnet',
            '0x13881': 'Mumbai Testnet',
            '0xa86a': 'Avalanche C-Chain',
            '0xa869': 'Avalanche Fuji Testnet',
            '0x38': 'Binance Smart Chain',
            '0x61': 'Binance Smart Chain Testnet'
        };
        
        return networks[chainId] || `Unknown Network (${chainId})`;
    }
    
    formatEther(wei) {
        if (typeof wei === 'string') {
            wei = parseInt(wei, 16);
        }
        
        const ether = wei / Math.pow(10, 18);
        return ether.toFixed(4);
    }
    
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    updateUI() {
        const connectBtn = document.getElementById('connect-wallet');
        const userInfo = document.getElementById('user-info');
        const userAddress = document.getElementById('user-address');
        
        if (this.isConnected && this.address) {
            if (connectBtn) connectBtn.classList.add('hidden');
            if (userInfo) userInfo.classList.remove('hidden');
            if (userAddress) userAddress.textContent = this.formatAddress(this.address);
        } else {
            if (connectBtn) connectBtn.classList.remove('hidden');
            if (userInfo) userInfo.classList.add('hidden');
        }
    }
    
    showMetaMaskInstallPrompt() {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-title">MetaMask Required</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="toast-message">
                Please install MetaMask to use this application. 
                <a href="https://metamask.io/download/" target="_blank" style="color: inherit; text-decoration: underline;">
                    Download MetaMask
                </a>
            </div>
        `;
        
        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 10000);
        }
    }
    
    // Event emitter
    emit(event, data) {
        const customEvent = new CustomEvent(`dobi:${event}`, { detail: data });
        window.dispatchEvent(customEvent);
    }
    
    // Check if wallet is connected
    isWalletConnected() {
        return this.isConnected && this.address !== null;
    }
    
    // Get current address
    getCurrentAddress() {
        return this.address;
    }
    
    // Get current signer
    getCurrentSigner() {
        return this.signer;
    }
}

// Initialize Web3
window.dobiWeb3 = new DobiWeb3();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DobiWeb3;
}

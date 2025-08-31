// Web3 Integration for Dobi Protocol
class DobiWeb3 {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.chainId = null;
        this.isConnected = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountsChanged(accounts);
            });
            
            window.ethereum.on('chainChanged', (chainId) => {
                this.handleChainChanged(chainId);
            });
        }
    }
    
    async connectWallet() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask no está instalado');
            }
            
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length === 0) {
                throw new Error('No se encontraron cuentas');
            }
            
            this.account = accounts[0];
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.chainId = await this.provider.getNetwork();
            this.isConnected = true;
            
            this.updateUI();
            return this.account;
            
        } catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        }
    }
    
    async disconnectWallet() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.chainId = null;
        this.isConnected = false;
        
        this.updateUI();
    }
    
    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            // User disconnected wallet
            this.disconnectWallet();
        } else if (accounts[0] !== this.account) {
            // User switched accounts
            this.account = accounts[0];
            this.updateUI();
        }
    }
    
    handleChainChanged(chainId) {
        this.chainId = chainId;
        this.updateUI();
        
        // Reload page on chain change (recommended by MetaMask)
        window.location.reload();
    }
    
    async signMessage(message) {
        try {
            if (!this.signer) {
                throw new Error('Wallet no conectada');
            }
            
            const signature = await this.signer.signMessage(message);
            return signature;
            
        } catch (error) {
            console.error('Error signing message:', error);
            throw error;
        }
    }
    
    async getBalance() {
        try {
            if (!this.provider || !this.account) {
                return '0';
            }
            
            const balance = await this.provider.getBalance(this.account);
            return ethers.utils.formatEther(balance);
            
        } catch (error) {
            console.error('Error getting balance:', error);
            return '0';
        }
    }
    
    async getNetwork() {
        try {
            if (!this.provider) {
                return null;
            }
            
            const network = await this.provider.getNetwork();
            return network;
            
        } catch (error) {
            console.error('Error getting network:', error);
            return null;
        }
    }
    
    updateUI() {
        const connectBtn = document.getElementById('connect-wallet-btn');
        const userInfo = document.getElementById('user-info');
        const userAddress = document.getElementById('user-address');
        
        if (this.isConnected && this.account) {
            // Hide connect button, show user info
            if (connectBtn) connectBtn.classList.add('hidden');
            if (userInfo) userInfo.classList.remove('hidden');
            if (userAddress) userAddress.textContent = this.formatAddress(this.account);
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
    
    formatEther(wei) {
        try {
            return ethers.utils.formatEther(wei);
        } catch (error) {
            return '0';
        }
    }
    
    parseEther(ether) {
        try {
            return ethers.utils.parseEther(ether);
        } catch (error) {
            return ethers.constants.Zero;
        }
    }
    
    isAddress(address) {
        try {
            return ethers.utils.isAddress(address);
        } catch (error) {
            return false;
        }
    }
    
    // Utility method to check if MetaMask is available
    isMetaMaskAvailable() {
        return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    }
    
    // Get current connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            account: this.account,
            chainId: this.chainId,
            provider: this.provider
        };
    }
}

// Export for use in other modules
window.DobiWeb3 = DobiWeb3;

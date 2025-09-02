// Web3 Integration Module for Dobi Protocol
export class DobiWeb3 {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.network = null;
        this.isConnected = false;
        this.ethers = null;
    }

    async init() {
        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum !== 'undefined') {
    
                this.provider = window.ethereum;
                
                // Try to load ethers.js dynamically
                try {
                    // For now, we'll use a mock implementation
                    // In production, you would import ethers properly
                    this.setupMockEthers();
                } catch (error) {
                    console.warn('⚠️ Ethers.js not available, using mock implementation');
                    this.setupMockEthers();
                }
                
                // Set up event listeners
                this.setupEventListeners();
                
                // Check if already connected
                const accounts = await this.provider.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await this.handleAccountsChanged(accounts);
                }
                
            } else {
                console.warn('⚠️ MetaMask not detected');
                this.setupMockEthers();
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize Web3:', error);
            this.setupMockEthers();
        }
    }

    setupMockEthers() {
        // Mock ethers implementation for development
        this.ethers = {
            providers: {
                Web3Provider: class MockWeb3Provider {
                    constructor(provider) {
                        this.provider = provider;
                    }
                    
                    async getSigner() {
                        return {
                            getAddress: () => '0x1234567890123456789012345678901234567890',
                            signMessage: async (message) => '0x' + '0'.repeat(130) + '1',
                            connect: async () => this
                        };
                    }
                }
            },
            utils: {
                formatEther: (wei) => (parseInt(wei) / 1e18).toFixed(4),
                parseEther: (ether) => (parseFloat(ether) * 1e18).toString(),
                formatAddress: (address) => `${address.slice(0, 6)}...${address.slice(-4)}`
            }
        };
    }

    setupEventListeners() {
        if (this.provider) {
            this.provider.on('accountsChanged', (accounts) => {
                this.handleAccountsChanged(accounts);
            });

            this.provider.on('chainChanged', (chainId) => {
                this.handleChainChanged(chainId);
            });

            this.provider.on('disconnect', () => {
                this.handleDisconnect();
            });
        }
    }

    async connectWallet() {
        try {
            if (!this.provider) {
                throw new Error('No Web3 provider available');
            }

            // Request account access
            const accounts = await this.provider.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                await this.handleAccountsChanged(accounts);
                return true;
            } else {
                throw new Error('No accounts found');
            }

        } catch (error) {
            console.error('❌ Failed to connect wallet:', error);
            throw error;
        }
    }

    async disconnectWallet() {
        try {
            this.account = null;
            this.network = null;
            this.isConnected = false;
            this.signer = null;

            // Emit disconnect event
            this.emitEvent('web3:disconnected', {});
            

            
        } catch (error) {
            console.error('❌ Failed to disconnect wallet:', error);
        }
    }

    async handleAccountsChanged(accounts) {
        try {
            if (accounts.length === 0) {
                // User disconnected
                await this.disconnectWallet();
                return;
            }

            const newAccount = accounts[0];
            
            if (this.account !== newAccount) {
                this.account = newAccount;
                
                // Get network info
                const chainId = await this.provider.request({ method: 'eth_chainId' });
                this.network = await this.getNetworkInfo(chainId);
                
                // Get signer
                if (this.ethers && this.ethers.providers.Web3Provider) {
                    const web3Provider = new this.ethers.providers.Web3Provider(this.provider);
                    this.signer = await web3Provider.getSigner();
                }
                
                this.isConnected = true;
                
                // Emit account change event
                this.emitEvent('web3:accountChanged', {
                    account: this.account,
                    network: this.network
                });
                
    
            }
            
        } catch (error) {
            console.error('❌ Failed to handle account change:', error);
        }
    }

    async handleChainChanged(chainId) {
        try {
            this.network = await this.getNetworkInfo(chainId);
            
            // Emit network change event
            this.emitEvent('web3:networkChanged', {
                network: this.network
            });
            

            
        } catch (error) {
            console.error('❌ Failed to handle chain change:', error);
        }
    }

    async handleDisconnect() {
        try {
            await this.disconnectWallet();
        } catch (error) {
            console.error('❌ Failed to handle disconnect:', error);
        }
    }

    async getNetworkInfo(chainId) {
        const networks = {
            '0x1': { name: 'Ethereum Mainnet', chainId: 1, currency: 'ETH' },
            '0x3': { name: 'Ropsten Testnet', chainId: 3, currency: 'ETH' },
            '0x4': { name: 'Rinkeby Testnet', chainId: 4, currency: 'ETH' },
            '0x5': { name: 'Goerli Testnet', chainId: 5, currency: 'ETH' },
            '0x2a': { name: 'Kovan Testnet', chainId: 42, currency: 'ETH' },
            '0x89': { name: 'Polygon Mainnet', chainId: 137, currency: 'MATIC' },
            '0x13881': { name: 'Mumbai Testnet', chainId: 80001, currency: 'MATIC' },
            '0xa': { name: 'Optimism', chainId: 10, currency: 'ETH' },
            '0xa4b1': { name: 'Arbitrum One', chainId: 42161, currency: 'ETH' }
        };

        return networks[chainId] || { 
            name: 'Unknown Network', 
            chainId: parseInt(chainId, 16), 
            currency: 'ETH' 
        };
    }

    async signMessage(message) {
        try {
            if (!this.signer) {
                throw new Error('No signer available');
            }

            const signature = await this.signer.signMessage(message);
            return signature;

        } catch (error) {
            console.error('❌ Failed to sign message:', error);
            throw error;
        }
    }

    async getBalance() {
        try {
            if (!this.account) {
                return '0 ETH';
            }

            const balance = await this.provider.request({
                method: 'eth_getBalance',
                params: [this.account, 'latest']
            });

            if (this.ethers && this.ethers.utils.formatEther) {
                return `${this.ethers.utils.formatEther(balance)} ETH`;
            } else {
                // Fallback formatting
                const ethBalance = (parseInt(balance, 16) / 1e18).toFixed(4);
                return `${ethBalance} ETH`;
            }

        } catch (error) {
            console.error('❌ Failed to get balance:', error);
            return '0 ETH';
        }
    }

    getNetwork() {
        return this.network;
    }

    getAccount() {
        return this.account;
    }

    isWalletConnected() {
        return this.isConnected && this.account !== null;
    }

    getProvider() {
        return this.provider;
    }

    getSigner() {
        return this.signer;
    }

    // Utility methods
    formatAddress(address) {
        if (!address) return '';
        
        if (this.ethers && this.ethers.utils.formatAddress) {
            return this.ethers.utils.formatAddress(address);
        } else {
            // Fallback formatting
            return `${address.slice(0, 6)}...${address.slice(-4)}`;
        }
    }

    formatEther(wei) {
        if (this.ethers && this.ethers.utils.formatEther) {
            return this.ethers.utils.formatEther(wei);
        } else {
            // Fallback formatting
            return (parseInt(wei) / 1e18).toFixed(4);
        }
    }

    parseEther(ether) {
        if (this.ethers && this.ethers.utils.parseEther) {
            return this.ethers.utils.parseEther(ether);
        } else {
            // Fallback parsing
            return (parseFloat(ether) * 1e18).toString();
        }
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
            if (this.isWalletConnected()) {
                connectBtn.innerHTML = `
                    <i class="fas fa-wallet"></i>
                    ${this.formatAddress(this.account)}
                `;
                connectBtn.classList.remove('btn-primary');
                connectBtn.classList.add('btn-secondary');
                connectBtn.onclick = () => this.disconnectWallet();
            } else {
                connectBtn.innerHTML = `
                    <i class="fas fa-wallet"></i>
                    Connect Wallet
                `;
                connectBtn.classList.remove('btn-secondary');
                connectBtn.classList.add('btn-primary');
                connectBtn.onclick = () => this.connectWallet();
            }
        }

        // Update wallet balance
        if (this.isWalletConnected()) {
            this.getBalance().then(balance => {
                const balanceElement = document.getElementById('wallet-balance');
                if (balanceElement) {
                    balanceElement.textContent = balance;
                }
            });
        }
    }
}

// Transactions Module for Dobi Protocol
class DobiTransactions {
    constructor() {
        this.transactions = [];
        this.currentPage = 1;
        this.pageSize = 20;
        this.hasMore = true;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadTransactions();
    }
    
    setupEventListeners() {
        // Listen for authentication events
        window.addEventListener('dobi:auth:authenticated', () => {
            this.loadTransactions();
        });
        
        window.addEventListener('dobi:auth:logout', () => {
            this.clearTransactions();
        });
    }
    
    async loadTransactions(page = 1, append = false) {
        try {
            if (page === 1) {
                this.showLoading('Loading transactions...');
            }
            
            const response = await fetch(`/api/transactions?page=${page}&limit=${this.pageSize}`);
            if (!response.ok) {
                throw new Error('Failed to load transactions');
            }
            
            const data = await response.json();
            
            if (append) {
                this.transactions = [...this.transactions, ...data.transactions];
            } else {
                this.transactions = data.transactions;
            }
            
            this.hasMore = data.hasMore || false;
            this.currentPage = page;
            
            this.renderTransactions();
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showToast('error', 'Load Error', 'Failed to load transactions');
        } finally {
            this.hideLoading();
        }
    }
    
    async loadMoreTransactions() {
        if (this.hasMore) {
            await this.loadTransactions(this.currentPage + 1, true);
        }
    }
    
    async addTransaction(transactionData) {
        try {
            this.showLoading('Recording transaction...');
            
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transactionData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to record transaction');
            }
            
            const result = await response.json();
            
            // Add new transaction to list
            this.transactions.unshift(result.transaction);
            this.renderTransactions();
            this.updateStats();
            
            this.showToast('success', 'Transaction Recorded', 'Transaction recorded successfully');
            
            return result;
            
        } catch (error) {
            console.error('Error recording transaction:', error);
            this.showToast('error', 'Recording Failed', error.message);
            throw error;
        } finally {
            this.hideLoading();
        }
    }
    
    renderTransactions() {
        const transactionsList = document.getElementById('transactions-list');
        
        if (transactionsList) {
            if (this.transactions.length > 0) {
                transactionsList.innerHTML = this.transactions.map(transaction => 
                    this.createTransactionItem(transaction)
                ).join('');
                
                // Add load more button if there are more transactions
                if (this.hasMore) {
                    const loadMoreBtn = document.createElement('div');
                    loadMoreBtn.className = 'text-center mt-3';
                    loadMoreBtn.innerHTML = `
                        <button class="btn btn-secondary" onclick="window.dobiTransactions.loadMoreTransactions()">
                            <i class="fas fa-plus"></i>
                            Cargar Más Transacciones
                        </button>
                    `;
                    transactionsList.appendChild(loadMoreBtn);
                }
            } else {
                transactionsList.innerHTML = this.createEmptyState();
            }
        }
    }
    
    createTransactionItem(transaction) {
        const status = this.getTransactionStatus(transaction);
        const deviceName = transaction.device_name || 'Unknown Device';
        
        return `
            <div class="transaction-item">
                <div class="transaction-header">
                    <div class="transaction-hash">${this.formatHash(transaction.tx_hash)}</div>
                    <div class="transaction-status ${status}">${this.getStatusText(status)}</div>
                </div>
                <div class="transaction-details">
                    <div class="transaction-detail">
                        <span class="transaction-detail-label">From:</span>
                        <span class="transaction-detail-value address">${this.formatAddress(transaction.from_address)}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="transaction-detail-label">To:</span>
                        <span class="transaction-detail-value address">${this.formatAddress(transaction.to_address)}</span>
                    </div>
                    <div class="transaction-detail">
                        <span class="transaction-detail-label">Device:</span>
                        <span class="transaction-detail-value">${deviceName}</span>
                    </div>
                    ${transaction.amount ? `
                        <div class="transaction-detail">
                            <span class="transaction-detail-label">Amount:</span>
                            <span class="transaction-detail-value">${this.formatAmount(transaction.amount)}</span>
                        </div>
                    ` : ''}
                    ${transaction.gas_used ? `
                        <div class="transaction-detail">
                            <span class="transaction-detail-label">Gas Used:</span>
                            <span class="transaction-detail-value">${this.formatGas(transaction.gas_used)}</span>
                        </div>
                    ` : ''}
                    ${transaction.block_number ? `
                        <div class="transaction-detail">
                            <span class="transaction-detail-label">Block:</span>
                            <span class="transaction-detail-value">${transaction.block_number}</span>
                        </div>
                    ` : ''}
                    <div class="transaction-detail">
                        <span class="transaction-detail-label">Time:</span>
                        <span class="transaction-detail-value">${this.formatDate(transaction.timestamp)}</span>
                    </div>
                </div>
                <div class="transaction-actions">
                    <button class="btn btn-small btn-primary" onclick="window.dobiTransactions.viewOnExplorer('${transaction.tx_hash}')">
                        <i class="fas fa-external-link-alt"></i>
                        Ver en Explorer
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="window.dobiTransactions.copyToClipboard('${transaction.tx_hash}')">
                        <i class="fas fa-copy"></i>
                        Copiar Hash
                    </button>
                </div>
            </div>
        `;
    }
    
    createEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-exchange-alt"></i>
                <h3>No Transactions Found</h3>
                <p>No blockchain transactions have been recorded yet.</p>
            </div>
        `;
    }
    
    getTransactionStatus(transaction) {
        // This is a simplified status check
        // In a real implementation, you would check the actual blockchain status
        if (transaction.block_number) {
            return 'success';
        } else if (transaction.tx_hash) {
            return 'pending';
        } else {
            return 'failed';
        }
    }
    
    getStatusText(status) {
        const statusTexts = {
            'success': 'Confirmed',
            'pending': 'Pending',
            'failed': 'Failed'
        };
        
        return statusTexts[status] || 'Unknown';
    }
    
    updateStats() {
        const totalTransactions = document.getElementById('total-transactions');
        if (totalTransactions) {
            totalTransactions.textContent = this.transactions.length;
        }
    }
    
    clearTransactions() {
        this.transactions = [];
        this.currentPage = 1;
        this.hasMore = true;
        this.renderTransactions();
        this.updateStats();
    }
    
    formatHash(hash) {
        if (!hash) return '';
        return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
    }
    
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    formatAmount(amount) {
        if (!amount) return '0';
        
        // Convert from wei to ether
        const ether = parseFloat(amount) / Math.pow(10, 18);
        return `${ether.toFixed(6)} ETH`;
    }
    
    formatGas(gas) {
        if (!gas) return '0';
        return `${parseInt(gas, 16)} units`;
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        // Show relative time for recent transactions
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    viewOnExplorer(txHash) {
        // Get current network from Web3
        const chainId = window.dobiWeb3?.chainId;
        let explorerUrl = '';
        
        // Map chain IDs to explorer URLs
        const explorers = {
            '0x1': `https://etherscan.io/tx/${txHash}`, // Ethereum Mainnet
            '0x3': `https://ropsten.etherscan.io/tx/${txHash}`, // Ropsten
            '0x4': `https://rinkeby.etherscan.io/tx/${txHash}`, // Rinkeby
            '0x5': `https://goerli.etherscan.io/tx/${txHash}`, // Goerli
            '0x2a': `https://kovan.etherscan.io/tx/${txHash}`, // Kovan
            '0x89': `https://polygonscan.com/tx/${txHash}`, // Polygon
            '0x13881': `https://mumbai.polygonscan.com/tx/${txHash}`, // Mumbai
            '0xa86a': `https://snowtrace.io/tx/${txHash}`, // Avalanche
            '0xa869': `https://testnet.snowtrace.io/tx/${txHash}`, // Avalanche Fuji
            '0x38': `https://bscscan.com/tx/${txHash}`, // BSC
            '0x61': `https://testnet.bscscan.com/tx/${txHash}` // BSC Testnet
        };
        
        explorerUrl = explorers[chainId] || `https://etherscan.io/tx/${txHash}`;
        
        // Open in new tab
        window.open(explorerUrl, '_blank');
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('success', 'Copied', 'Transaction hash copied to clipboard');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            this.showToast('success', 'Copied', 'Transaction hash copied to clipboard');
        }
    }
    
    // Mock function to simulate adding a transaction
    // In a real implementation, this would be called when a blockchain transaction is detected
    simulateTransaction(deviceId, txHash, fromAddress, toAddress, amount = null, gasUsed = null, blockNumber = null) {
        const transactionData = {
            device_id: deviceId,
            tx_hash: txHash,
            from_address: fromAddress,
            to_address: toAddress,
            amount: amount,
            gas_used: gasUsed,
            block_number: blockNumber
        };
        
        this.addTransaction(transactionData);
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
}

// Initialize Transactions
window.dobiTransactions = new DobiTransactions();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DobiTransactions;
}

// Transactions Module for Dobi Protocol
class DobiTransactions {
    constructor() {
        this.transactions = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.hasMore = true;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Load more transactions button
        const loadMoreBtn = document.getElementById('load-more-transactions');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreTransactions());
        }
        
        // Listen for authentication events
        window.addEventListener('dobi:auth:authenticated', () => {
            this.loadTransactions();
        });
        
        window.addEventListener('dobi:auth:logout', () => {
            this.clearTransactions();
        });
    }
    
    async loadTransactions() {
        try {
            // Mock API call - replace with real backend call
            const mockTransactions = [
                {
                    id: 'tx_001',
                    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                    from: '0x742d35Cc6634C0532925a3b8D56B4B8d3d73a9B1',
                    to: '0x8ba1f109551bD432803012645Hac136c772c7c8',
                    value: '0.001',
                    gas: '21000',
                    gasPrice: '20000000000',
                    status: 'success',
                    blockNumber: 12345678,
                    timestamp: '2025-08-30T15:30:00Z',
                    device_id: 'device_001'
                },
                {
                    id: 'tx_002',
                    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                    from: '0x8ba1f109551bD432803012645Hac136c772c7c8',
                    to: '0x742d35Cc6634C0532925a3b8D56B4B8d3d73a9B1',
                    value: '0.002',
                    gas: '21000',
                    gasPrice: '20000000000',
                    status: 'success',
                    blockNumber: 12345679,
                    timestamp: '2025-08-30T14:15:00Z',
                    device_id: 'device_002'
                },
                {
                    id: 'tx_003',
                    hash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
                    from: '0x742d35Cc6634C0532925a3b8D56B4B8d3d73a9B1',
                    to: '0x1234567890abcdef1234567890abcdef1234567890',
                    value: '0.0005',
                    gas: '21000',
                    gasPrice: '20000000000',
                    status: 'pending',
                    blockNumber: null,
                    timestamp: '2025-08-30T16:45:00Z',
                    device_id: 'device_001'
                }
            ];
            
            this.transactions = mockTransactions;
            this.updateTransactionsUI();
            
        } catch (error) {
            console.error('Error loading transactions:', error);
            
            if (window.dobiUI) {
                window.dobiUI.showError('Error al cargar transacciones', error.message);
            }
        }
    }
    
    async loadMoreTransactions() {
        try {
            // Mock API call for pagination - replace with real backend call
            const moreTransactions = [
                {
                    id: 'tx_004',
                    hash: '0x4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123',
                    from: '0x8ba1f109551bD432803012645Hac136c772c7c8',
                    to: '0x742d35Cc6634C0532925a3b8D56B4B8d3d73a9B1',
                    value: '0.003',
                    gas: '21000',
                    gasPrice: '20000000000',
                    status: 'success',
                    blockNumber: 12345680,
                    timestamp: '2025-08-30T13:20:00Z',
                    device_id: 'device_002'
                }
            ];
            
            this.transactions.push(...moreTransactions);
            this.currentPage++;
            
            // Check if we have more transactions
            if (this.currentPage >= 3) { // Mock limit
                this.hasMore = false;
            }
            
            this.updateTransactionsUI();
            
        } catch (error) {
            console.error('Error loading more transactions:', error);
            
            if (window.dobiUI) {
                window.dobiUI.showError('Error al cargar más transacciones', error.message);
            }
        }
    }
    
    updateTransactionsUI() {
        const container = document.getElementById('transactions-container');
        const loadMoreBtn = document.getElementById('load-more-transactions');
        
        if (container) {
            container.innerHTML = this.renderTransactionsList();
        }
        
        if (loadMoreBtn) {
            loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
        }
    }
    
    renderTransactionsList() {
        if (this.transactions.length === 0) {
            return this.createEmptyState();
        }
        
        return `
            <div class="transactions-list">
                ${this.transactions.map(tx => this.renderTransactionItem(tx)).join('')}
            </div>
        `;
    }
    
    renderTransactionItem(transaction) {
        const statusClass = transaction.status === 'success' ? 'success' : 
                           transaction.status === 'pending' ? 'pending' : 'failed';
        
        return `
            <div class="transaction-item">
                <div class="transaction-header">
                    <div class="transaction-hash" title="${transaction.hash}">
                        ${this.formatHash(transaction.hash)}
                    </div>
                    <div class="transaction-status ${statusClass}">
                        ${this.getStatusText(transaction.status)}
                    </div>
                </div>
                
                <div class="transaction-details">
                    <div class="transaction-detail">
                        <span class="transaction-detail-label">Desde:</span>
                        <span class="transaction-detail-value address" title="${transaction.from}">
                            ${this.formatAddress(transaction.from)}
                        </span>
                    </div>
                    
                    <div class="transaction-detail">
                        <span class="transaction-detail-label">Hacia:</span>
                        <span class="transaction-detail-value address" title="${transaction.to}">
                            ${this.formatAddress(transaction.to)}
                        </span>
                    </div>
                    
                    <div class="transaction-detail">
                        <span class="transaction-detail-label">Valor:</span>
                        <span class="transaction-detail-value">
                            ${transaction.value} ETH
                        </span>
                    </div>
                    
                    <div class="transaction-detail">
                        <span class="transaction-detail-label">Gas:</span>
                        <span class="transaction-detail-value">
                            ${this.formatGas(transaction.gas)}
                        </span>
                    </div>
                    
                    <div class="transaction-detail">
                        <span class="transaction-detail-label">Precio Gas:</span>
                        <span class="transaction-detail-value">
                            ${this.formatGasPrice(transaction.gasPrice)}
                        </span>
                    </div>
                    
                    <div class="transaction-detail">
                        <span class="transaction-detail-label">Fecha:</span>
                        <span class="transaction-detail-value">
                            ${this.formatDate(transaction.timestamp)}
                        </span>
                    </div>
                </div>
                
                <div class="transaction-actions">
                    <button class="btn btn-secondary btn-small" onclick="window.dobiTransactions.viewOnExplorer('${transaction.hash}')">
                        <i class="fas fa-external-link-alt"></i>
                        Ver en Explorer
                    </button>
                    
                    <button class="btn btn-secondary btn-small" onclick="window.dobiTransactions.copyHash('${transaction.hash}')">
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
                <h3>No hay transacciones</h3>
                <p>Aún no se han realizado transacciones en la blockchain.</p>
            </div>
        `;
    }
    
    viewOnExplorer(hash) {
        // Open transaction in block explorer
        const explorerUrl = `https://etherscan.io/tx/${hash}`;
        window.open(explorerUrl, '_blank');
    }
    
    async copyHash(hash) {
        try {
            await navigator.clipboard.writeText(hash);
            
            if (window.dobiUI) {
                window.dobiUI.showSuccess('Hash copiado', 'El hash se ha copiado al portapapeles');
            }
        } catch (error) {
            console.error('Error copying hash:', error);
            
            if (window.dobiUI) {
                window.dobiUI.showError('Error al copiar', 'No se pudo copiar el hash');
            }
        }
    }
    
    clearTransactions() {
        this.transactions = [];
        this.currentPage = 1;
        this.hasMore = true;
        this.updateTransactionsUI();
    }
    
    formatHash(hash) {
        if (!hash) return '';
        return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
    }
    
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    formatGas(gas) {
        if (!gas) return '0';
        return parseInt(gas).toLocaleString();
    }
    
    formatGasPrice(gasPrice) {
        if (!gasPrice) return '0';
        const gwei = parseInt(gasPrice) / 1000000000;
        return `${gwei} Gwei`;
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    getStatusText(status) {
        const statusMap = {
            'success': 'Confirmada',
            'pending': 'Pendiente',
            'failed': 'Fallida'
        };
        
        return statusMap[status] || status;
    }
    
    // Get transaction by ID
    getTransaction(id) {
        return this.transactions.find(tx => tx.id === id);
    }
    
    // Get transactions by device ID
    getTransactionsByDevice(deviceId) {
        return this.transactions.filter(tx => tx.device_id === deviceId);
    }
    
    // Get transaction statistics
    getTransactionStats() {
        const total = this.transactions.length;
        const successful = this.transactions.filter(tx => tx.status === 'success').length;
        const pending = this.transactions.filter(tx => tx.status === 'pending').length;
        const failed = this.transactions.filter(tx => tx.status === 'failed').length;
        
        const totalValue = this.transactions
            .filter(tx => tx.status === 'success')
            .reduce((sum, tx) => sum + parseFloat(tx.value || 0), 0);
        
        return {
            total,
            successful,
            pending,
            failed,
            totalValue: totalValue.toFixed(6)
        };
    }
}

// Export for use in other modules
window.DobiTransactions = DobiTransactions;

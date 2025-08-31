// Transactions Management Module for Dobi Protocol
export class DobiTransactions {
    constructor() {
        this.transactions = [];
        this.isLoading = false;
        this.hasMore = true;
        this.page = 1;
        this.pageSize = 10;
        this.ui = null;
    }

    init() {
        try {
            // Get UI reference
            if (window.dobiApp && window.dobiApp.getUI) {
                this.ui = window.dobiApp.getUI();
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('💰 Transactions module initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize transactions module:', error);
        }
    }

    setupEventListeners() {
        // Transaction item clicks (event delegation)
        document.addEventListener('click', (e) => {
            const transactionItem = e.target.closest('.transaction-item');
            if (transactionItem) {
                const transactionId = transactionItem.getAttribute('data-transaction-id');
                if (transactionId) {
                    this.openTransactionDetails(transactionId);
                }
            }
        });

        // Load more button
        const loadMoreBtn = document.getElementById('load-more-transactions');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreTransactions());
        }
    }

    async loadTransactions() {
        try {
            this.isLoading = true;
            
            // Show loading if UI is available
            if (this.ui) {
                this.ui.showLoading('Loading transactions...');
            }

            // Mock API call - in production this would be a real API
            const mockTransactions = await this.getMockTransactions();
            this.transactions = mockTransactions;

            // Update UI
            this.updateTransactionsUI();
            
            console.log('💰 Transactions loaded:', this.transactions.length);
            
        } catch (error) {
            console.error('❌ Failed to load transactions:', error);
            
            if (this.ui) {
                this.ui.showError('Failed to load transactions: ' + error.message);
            }
        } finally {
            this.isLoading = false;
            
            if (this.ui) {
                this.ui.hideLoading();
            }
        }
    }

    async loadMoreTransactions() {
        try {
            if (this.isLoading || !this.hasMore) return;

            this.isLoading = true;
            this.page++;

            // Show loading
            if (this.ui) {
                this.ui.showLoading('Loading more transactions...');
            }

            // Mock API call for more transactions
            const moreTransactions = await this.getMockTransactions(this.page);
            
            if (moreTransactions.length > 0) {
                this.transactions.push(...moreTransactions);
                this.updateTransactionsUI();
                
                if (this.ui) {
                    this.ui.showSuccess('More transactions loaded!');
                }
            } else {
                this.hasMore = false;
                if (this.ui) {
                    this.ui.showInfo('No more transactions to load');
                }
            }

        } catch (error) {
            console.error('❌ Failed to load more transactions:', error);
            
            if (this.ui) {
                this.ui.showError('Failed to load more transactions: ' + error.message);
            }
        } finally {
            this.isLoading = false;
            
            if (this.ui) {
                this.ui.hideLoading();
            }
        }
    }

    openTransactionDetails(transactionId) {
        try {
            const transaction = this.transactions.find(t => t.id === transactionId);
            
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            // For now, just show transaction info in a toast
            // In the future, this could open a detailed modal
            if (this.ui) {
                this.ui.showInfo(
                    `Transaction ${transaction.hash.slice(0, 8)}...`,
                    `Amount: ${transaction.amount} ${transaction.currency} | Status: ${transaction.status}`
                );
            }
            
        } catch (error) {
            console.error('❌ Failed to open transaction details:', error);
        }
    }

    updateTransactionsUI() {
        try {
            const transactionsList = document.getElementById('transactions-list');
            if (!transactionsList) return;

            if (this.transactions.length === 0) {
                transactionsList.innerHTML = this.createEmptyState();
            } else {
                transactionsList.innerHTML = this.transactions.map(transaction => 
                    this.createTransactionItem(transaction)
                ).join('');
            }

            // Update load more button
            this.updateLoadMoreButton();
            
        } catch (error) {
            console.error('❌ Failed to update transactions UI:', error);
        }
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('load-more-transactions');
        if (loadMoreBtn) {
            if (this.hasMore && this.transactions.length > 0) {
                loadMoreBtn.style.display = 'block';
                loadMoreBtn.disabled = this.isLoading;
                loadMoreBtn.innerHTML = this.isLoading ? 
                    '<i class="fas fa-spinner fa-spin"></i> Loading...' :
                    '<i class="fas fa-sync"></i> Load More';
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    }

    createTransactionItem(transaction) {
        const statusClass = this.getStatusClass(transaction.status);
        const statusIcon = this.getStatusIcon(transaction.status);
        const amountClass = transaction.type === 'incoming' ? 'positive' : 'negative';
        const amountPrefix = transaction.type === 'incoming' ? '+' : '-';

        return `
            <div class="transaction-item" data-transaction-id="${transaction.id}">
                <div class="transaction-icon ${statusClass}">
                    <i class="fas fa-${statusIcon}"></i>
                </div>
                <div class="transaction-details">
                    <h4>${transaction.description}</h4>
                    <p>${this.formatDate(transaction.timestamp)} • ${transaction.hash}</p>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${amountPrefix}${transaction.amount} ${transaction.currency}
                </div>
            </div>
        `;
    }

    createEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-coins"></i>
                <h3>No Transactions Found</h3>
                <p>You haven't made any transactions yet. Start by creating your first Dobi device.</p>
                <button class="btn btn-primary empty-state-btn" data-page="create">
                    <i class="fas fa-plus"></i>
                    <span>Create Device</span>
                </button>
            </div>
        `;
    }

    // Utility methods
    getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'confirmed':
            case 'success':
                return 'success';
            case 'pending':
            case 'processing':
                return 'pending';
            case 'failed':
            case 'error':
                return 'failed';
            default:
                return 'pending';
        }
    }

    getStatusIcon(status) {
        switch (status.toLowerCase()) {
            case 'confirmed':
            case 'success':
                return 'check-circle';
            case 'pending':
            case 'processing':
                return 'clock';
            case 'failed':
            case 'error':
                return 'exclamation-circle';
            default:
                return 'question-circle';
        }
    }

    formatDate(timestamp) {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffInHours = (now - date) / (1000 * 60 * 60);

            if (diffInHours < 1) {
                return 'Just now';
            } else if (diffInHours < 24) {
                return `${Math.floor(diffInHours)}h ago`;
            } else if (diffInHours < 168) { // 7 days
                return `${Math.floor(diffInHours / 24)}d ago`;
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            return 'Unknown date';
        }
    }

    getTransactionById(transactionId) {
        return this.transactions.find(t => t.id === transactionId);
    }

    getTotalTransactions() {
        return this.transactions.length;
    }

    clearTransactions() {
        this.transactions = [];
        this.page = 1;
        this.hasMore = true;
        this.updateTransactionsUI();
    }

    // Mock data for development
    async getMockTransactions(page = 1) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const baseTransactions = [
            {
                id: 'tx_1',
                hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                description: 'Device registration fee',
                amount: '0.001',
                currency: 'ETH',
                type: 'outgoing',
                status: 'confirmed',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                from: '0x1234567890123456789012345678901234567890',
                to: '0x0987654321098765432109876543210987654321'
            },
            {
                id: 'tx_2',
                hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                description: 'IoT data reward',
                amount: '0.0005',
                currency: 'ETH',
                type: 'incoming',
                status: 'confirmed',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
                from: '0x0987654321098765432109876543210987654321',
                to: '0x1234567890123456789012345678901234567890'
            },
            {
                id: 'tx_3',
                hash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
                description: 'Smart contract interaction',
                amount: '0.002',
                currency: 'ETH',
                type: 'outgoing',
                status: 'pending',
                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
                from: '0x1234567890123456789012345678901234567890',
                to: '0x1111111111111111111111111111111111111111'
            },
            {
                id: 'tx_4',
                hash: '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
                description: 'Device monitoring fee',
                amount: '0.0003',
                currency: 'ETH',
                type: 'outgoing',
                status: 'confirmed',
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
                from: '0x1234567890123456789012345678901234567890',
                to: '0x2222222222222222222222222222222222222222'
            },
            {
                id: 'tx_5',
                hash: '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567',
                description: 'Data validation reward',
                amount: '0.0008',
                currency: 'ETH',
                type: 'incoming',
                status: 'confirmed',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                from: '0x3333333333333333333333333333333333333333',
                to: '0x1234567890123456789012345678901234567890'
            }
        ];

        // For pagination, return different sets based on page
        if (page === 1) {
            return baseTransactions;
        } else if (page === 2) {
            // Return additional mock transactions for page 2
            return [
                {
                    id: 'tx_6',
                    hash: '0x4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123',
                    description: 'Network participation bonus',
                    amount: '0.0012',
                    currency: 'ETH',
                    type: 'incoming',
                    status: 'confirmed',
                    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
                    from: '0x4444444444444444444444444444444444444444',
                    to: '0x1234567890123456789012345678901234567890'
                }
            ];
        } else {
            // No more transactions
            this.hasMore = false;
            return [];
        }
    }

    // Event emission
    emitEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }
}

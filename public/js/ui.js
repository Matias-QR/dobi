// UI Management Module for Dobi Protocol
export class DobiUI {
    constructor() {
        this.currentPage = 'home';
        this.isLoading = false;
        this.toastTimeout = null;
    }

    init() {
        try {
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up keyboard navigation
            this.setupKeyboardNavigation();
            
            // Initialize navigation
            this.updateNavigationUI();
            
            console.log('🎨 UI module initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize UI:', error);
        }
    }

    setupEventListeners() {
        // Navigation buttons
        const navHome = document.getElementById('nav-home');
        const navDevices = document.getElementById('nav-devices');
        const navTransactions = document.getElementById('nav-transactions');

        if (navHome) navHome.addEventListener('click', () => this.navigateToPage('home'));
        if (navDevices) navDevices.addEventListener('click', () => this.navigateToPage('devices'));
        if (navTransactions) navTransactions.addEventListener('click', () => this.navigateToPage('transactions'));

        // Hero section buttons
        const heroCreateBtn = document.getElementById('hero-create-btn');
        const heroDevicesBtn = document.getElementById('hero-devices-btn');

        if (heroCreateBtn) heroCreateBtn.addEventListener('click', () => this.navigateToPage('create'));
        if (heroDevicesBtn) heroDevicesBtn.addEventListener('click', () => this.navigateToPage('devices'));

        // Recent devices section
        const recentCreateBtn = document.getElementById('recent-create-btn');
        if (recentCreateBtn) recentCreateBtn.addEventListener('click', () => this.navigateToPage('create'));

        // Devices page
        const devicesCreateBtn = document.getElementById('devices-create-btn');
        if (devicesCreateBtn) devicesCreateBtn.addEventListener('click', () => this.navigateToPage('create'));

        // Create page
        const createBackBtn = document.getElementById('create-back-btn');
        if (createBackBtn) createBackBtn.addEventListener('click', () => this.navigateToPage('home'));

        // Transactions page
        const transactionsBackBtn = document.getElementById('transactions-back-btn');
        if (transactionsBackBtn) transactionsBackBtn.addEventListener('click', () => this.navigateToPage('home'));

        // Modal close button
        const modalCloseBtn = document.getElementById('modal-close-btn');
        if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => this.closeDeviceModal());

        // Load more transactions
        const loadMoreBtn = document.getElementById('load-more-transactions');
        if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => this.loadMoreTransactions());

        // Device form submission
        const createDeviceForm = document.getElementById('create-device-form');
        if (createDeviceForm) {
            createDeviceForm.addEventListener('submit', (e) => this.handleCreateDevice(e));
        }

        // Empty state button clicks (event delegation)
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.empty-state-btn');
            if (target) {
                const page = target.getAttribute('data-page');
                if (page) {
                    this.navigateToPage(page);
                }
            }
        });
    }

    setupKeyboardNavigation() {
        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDeviceModal();
            }
        });

        // Arrow keys for navigation
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.navigateBack();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.navigateForward();
                        break;
                    case 'h':
                        e.preventDefault();
                        this.navigateToPage('home');
                        break;
                    case 'd':
                        e.preventDefault();
                        this.navigateToPage('devices');
                        break;
                    case 't':
                        e.preventDefault();
                        this.navigateToPage('transactions');
                        break;
                }
            }
        });
    }

    navigateToPage(pageName) {
        try {
            // Hide all pages
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => page.classList.remove('active'));

            // Show target page
            const targetPage = document.getElementById(`${pageName}-page`);
            if (targetPage) {
                targetPage.classList.add('active');
                this.currentPage = pageName;
            } else {
                console.warn('⚠️ Page not found:', pageName);
                return;
            }

            // Update navigation UI
            this.updateNavigationUI();

            // Emit page change event
            this.emitEvent('page:changed', { page: pageName });

            console.log('📄 Navigated to:', pageName);

        } catch (error) {
            console.error('❌ Navigation failed:', error);
        }
    }

    navigateBack() {
        const pageHistory = ['home', 'devices', 'transactions', 'create'];
        const currentIndex = pageHistory.indexOf(this.currentPage);
        
        if (currentIndex > 0) {
            const previousPage = pageHistory[currentIndex - 1];
            this.navigateToPage(previousPage);
        }
    }

    navigateForward() {
        const pageHistory = ['home', 'devices', 'transactions', 'create'];
        const currentIndex = pageHistory.indexOf(this.currentPage);
        
        if (currentIndex < pageHistory.length - 1) {
            const nextPage = pageHistory[currentIndex + 1];
            this.navigateToPage(nextPage);
        }
    }

    updateNavigationUI() {
        // Update active navigation button
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.id === `nav-${this.currentPage}`) {
                btn.classList.add('active');
            }
        });
    }

    closeDeviceModal() {
        const modal = document.getElementById('device-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    openDeviceModal(deviceData) {
        try {
            const modal = document.getElementById('device-modal');
            if (!modal) return;

            // Populate modal with device data
            const nameElement = document.getElementById('modal-device-name');
            const photoElement = document.getElementById('modal-device-photo');
            const descriptionElement = document.getElementById('modal-device-description');
            const monitoringElement = document.getElementById('modal-monitoring-endpoint');
            const actionElement = document.getElementById('modal-action-endpoint');
            const addressElement = document.getElementById('modal-device-address');

            if (nameElement) nameElement.textContent = deviceData.name;
            if (photoElement) {
                if (deviceData.photo) {
                    photoElement.src = deviceData.photo;
                    photoElement.style.display = 'block';
                } else {
                    photoElement.style.display = 'none';
                }
            }
            if (descriptionElement) descriptionElement.textContent = deviceData.description;
            if (monitoringElement) monitoringElement.textContent = deviceData.monitoringEndpoint;
            if (actionElement) actionElement.textContent = deviceData.actionEndpoint;
            if (addressElement) addressElement.textContent = deviceData.address;

            // Show modal
            modal.classList.add('active');

        } catch (error) {
            console.error('❌ Failed to open device modal:', error);
        }
    }

    async handleCreateDevice(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const deviceData = {
                name: formData.get('name'),
                description: formData.get('description'),
                photo: formData.get('photo') || null,
                monitoringEndpoint: formData.get('monitoringEndpoint'),
                actionEndpoint: formData.get('actionEndpoint'),
                address: '0x' + Math.random().toString(16).substr(2, 40), // Mock address
                createdAt: new Date().toISOString()
            };

            // Show loading
            this.showLoading('Creating device...');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Emit device created event
            this.emitEvent('device:created', deviceData);

            // Show success message
            this.showSuccess('Device created successfully!');

            // Navigate back to devices page
            this.navigateToPage('devices');

            // Reset form
            e.target.reset();

        } catch (error) {
            console.error('❌ Failed to create device:', error);
            this.showError('Failed to create device: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async loadMoreTransactions() {
        try {
            // Show loading
            this.showLoading('Loading more transactions...');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Emit load more event
            this.emitEvent('transactions:loadMore', {});

            // Show success message
            this.showSuccess('More transactions loaded!');

        } catch (error) {
            console.error('❌ Failed to load more transactions:', error);
            this.showError('Failed to load more transactions: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    // Loading spinner
    showLoading(message = 'Loading...', maxDuration = 10000) {
        try {
            this.isLoading = true;
            const spinner = document.getElementById('loading-spinner');
            if (spinner) {
                const messageElement = spinner.querySelector('p');
                if (messageElement) messageElement.textContent = message;
                spinner.classList.remove('hidden');
            }

            // Auto-hide after max duration
            if (maxDuration > 0) {
                setTimeout(() => {
                    if (this.isLoading) {
                        this.hideLoading();
                    }
                }, maxDuration);
            }

        } catch (error) {
            console.error('❌ Failed to show loading:', error);
        }
    }

    hideLoading() {
        try {
            this.isLoading = false;
            const spinner = document.getElementById('loading-spinner');
            if (spinner) {
                spinner.classList.add('hidden');
            }
        } catch (error) {
            console.error('❌ Failed to hide loading:', error);
        }
    }

    // Toast notifications
    showToast(type, title, message, duration = null) {
        try {
            const container = document.getElementById('toast-container');
            if (!container) return;

            // Set default duration based on type
            if (!duration) {
                switch (type) {
                    case 'error': duration = 8000; break;
                    case 'warning': duration = 6000; break;
                    case 'success': duration = 5000; break;
                    case 'info': duration = 5000; break;
                    default: duration = 5000;
                }
            }

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <div class="toast-icon">
                    <i class="fas fa-${this.getToastIcon(type)}"></i>
                </div>
                <div class="toast-content">
                    <div class="toast-title">${title}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close">
                    <i class="fas fa-times"></i>
                </button>
                <div class="toast-progress"></div>
            `;

            // Add close functionality
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.hideToast(toast));

            // Add to container
            container.appendChild(toast);

            // Auto-hide after duration
            setTimeout(() => {
                this.hideToast(toast);
            }, duration);

            // Store reference for manual hiding
            this.toastTimeout = toast;

        } catch (error) {
            console.error('❌ Failed to show toast:', error);
        }
    }

    hideToast(toast) {
        try {
            if (toast) {
                toast.classList.add('hiding');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        } catch (error) {
            console.error('❌ Failed to hide toast:', error);
        }
    }

    getToastIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            case 'info': return 'info-circle';
            default: return 'info-circle';
        }
    }

    // Convenience methods
    showSuccess(title, message = '') {
        this.showToast('success', title, message);
    }

    showError(title, message = '') {
        this.showToast('error', title, message);
    }

    showWarning(title, message = '') {
        this.showToast('warning', title, message);
    }

    showInfo(title, message = '') {
        this.showToast('info', title, message);
    }

    // Event emission
    emitEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    // Public methods
    getCurrentPage() {
        return this.currentPage;
    }

    updateUI() {
        this.updateNavigationUI();
    }

    updateAuthUI(userData) {
        // Update UI based on authentication status
        if (userData) {
            // User is authenticated
            this.showSuccess('Wallet connected successfully!');
        } else {
            // User is not authenticated
            this.showInfo('Please connect your wallet to continue');
        }
    }

    updateNetworkUI(networkData) {
        // Update network indicator if needed
        console.log('🌐 Network UI updated:', networkData);
    }
}

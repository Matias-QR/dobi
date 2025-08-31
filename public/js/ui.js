// UI Management Module for Dobi Protocol
class DobiUI {
    constructor() {
        this.currentPage = 'home';
        this.isMobileMenuOpen = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupMobileNavigation();
        this.setupKeyboardNavigation();
    }
    
    setupEventListeners() {
        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });
        
        // Mobile navigation toggle
        const navToggle = document.getElementById('nav-toggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Hero section buttons
        const heroCreateBtn = document.getElementById('hero-create-btn');
        if (heroCreateBtn) {
            heroCreateBtn.addEventListener('click', () => this.navigateToPage('create'));
        }
        
        const heroDevicesBtn = document.getElementById('hero-devices-btn');
        if (heroDevicesBtn) {
            heroDevicesBtn.addEventListener('click', () => this.navigateToPage('devices'));
        }
        
        // Page navigation buttons
        const devicesCreateBtn = document.getElementById('devices-create-btn');
        if (devicesCreateBtn) {
            devicesCreateBtn.addEventListener('click', () => this.navigateToPage('create'));
        }
        
        const createBackBtn = document.getElementById('create-back-btn');
        if (createBackBtn) {
            createBackBtn.addEventListener('click', () => this.navigateToPage('devices'));
        }
        
        const transactionsBackBtn = document.getElementById('transactions-back-btn');
        if (transactionsBackBtn) {
            transactionsBackBtn.addEventListener('click', () => this.navigateToPage('home'));
        }
        
        // Modal close button
        const modalCloseBtn = document.getElementById('modal-close-btn');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.closeDeviceModal());
        }
        
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    setupMobileNavigation() {
        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });
    }
    
    setupKeyboardNavigation() {
        // Keyboard navigation support
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search (if implemented)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                // Focus search input if exists
                const searchInput = document.querySelector('input[type="search"]');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }
    
    navigateToPage(pageName) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) {
                link.classList.add('active');
            }
        });
        
        // Update current page
        this.currentPage = pageName;
        
        // Update browser history
        this.updateBrowserHistory(pageName);
        
        // Close mobile menu if open
        if (this.isMobileMenuOpen) {
            this.closeMobileMenu();
        }
        
        // Emit page change event
        this.emitPageChangeEvent(pageName);
    }
    
    updateBrowserHistory(pageName) {
        const url = new URL(window.location);
        url.hash = `#${pageName}`;
        window.history.pushState({ page: pageName }, '', url);
    }
    
    toggleMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            this.isMobileMenuOpen = !this.isMobileMenuOpen;
            navMenu.classList.toggle('active', this.isMobileMenuOpen);
        }
    }
    
    closeMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            this.isMobileMenuOpen = false;
            navMenu.classList.remove('active');
        }
    }
    
    showModal(modalId, content = '') {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Set content if provided
            if (content && modal.querySelector('.modal-body')) {
                modal.querySelector('.modal-body').innerHTML = content;
            }
            
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
    
    closeDeviceModal() {
        const modal = document.getElementById('device-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
    
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
        document.body.style.overflow = '';
    }
    
    showLoading(message = 'Loading...', maxDuration = 30000) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            const messageEl = spinner.querySelector('p');
            if (messageEl) messageEl.textContent = message;
            spinner.classList.remove('hidden');
            
            // Auto-hide after max duration to prevent infinite loading
            if (maxDuration > 0) {
                setTimeout(() => {
                    if (spinner && !spinner.classList.contains('hidden')) {
                        this.hideLoading();
                    }
                }, maxDuration);
            }
        }
    }
    
    hideLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.add('hidden');
        }
    }
    
    showToast(type, title, message, duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-title">${title}</span>
                <button class="toast-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="toast-message">${message}</div>
            <div class="toast-progress"></div>
        `;
        
        // Add event listener to close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideToast(toast);
            });
        }
        
        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
            
            // Animate progress bar
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.transition = `width ${duration}ms linear`;
                setTimeout(() => {
                    progressBar.style.width = '0%';
                }, 100);
            }
            
            // Auto-hide after specified duration
            setTimeout(() => {
                this.hideToast(toast);
            }, duration);
        }
    }
    
    hideToast(toast) {
        if (toast && toast.parentElement) {
            toast.classList.add('toast-hiding');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300); // Wait for fade out animation
        }
    }
    
    // Convenience methods for different toast types
    showSuccess(title, message) {
        this.showToast('success', title, message);
    }
    
    showError(title, message) {
        this.showToast('error', title, message, 8000); // Errors stay longer
    }
    
    showWarning(title, message) {
        this.showToast('warning', title, message, 6000); // Warnings stay medium
    }
    
    showInfo(title, message) {
        this.showToast('info', title, message);
    }
    
    emitPageChangeEvent(pageName) {
        const event = new CustomEvent('dobi:page:changed', {
            detail: {
                page: pageName,
                previousPage: this.currentPage
            }
        });
        
        window.dispatchEvent(event);
    }
    
    // Get current page
    getCurrentPage() {
        return this.currentPage;
    }
    
    // Check if mobile menu is open
    isMobileMenuOpen() {
        return this.isMobileMenuOpen;
    }
    
    // Utility method to check if element is visible
    isElementVisible(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && 
               rect.bottom <= window.innerHeight && 
               rect.right <= window.innerWidth;
    }
    
    // Scroll to element with smooth animation
    scrollToElement(element, offset = 0) {
        if (!element) return;
        
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

// Export for use in other modules
window.DobiUI = DobiUI;

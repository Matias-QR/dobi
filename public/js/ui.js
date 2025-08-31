// UI Module for Dobi Protocol
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
        
        // Hero section buttons
        const heroCreateBtn = document.getElementById('hero-create-btn');
        if (heroCreateBtn) {
            heroCreateBtn.addEventListener('click', () => this.navigateToPage('create'));
        }
        
        const heroDevicesBtn = document.getElementById('hero-devices-btn');
        if (heroDevicesBtn) {
            heroDevicesBtn.addEventListener('click', () => this.navigateToPage('devices'));
        }
        
        // Page header buttons
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
        
        // Mobile navigation toggle
        const navToggle = document.getElementById('nav-toggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMobileMenuOpen && !e.target.closest('.navbar')) {
                this.closeMobileMenu();
            }
        });
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.showPage(e.state.page, false);
            }
        });
        
        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1);
            if (hash) {
                this.navigateToPage(hash);
            }
        });
        
        // Initialize page from URL hash
        this.initializeFromHash();
    }
    
    setupMobileNavigation() {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        
        if (navMenu && navToggle) {
            // Add touch/swipe support for mobile
            let startX = 0;
            let startY = 0;
            
            navMenu.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            });
            
            navMenu.addEventListener('touchend', (e) => {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = startX - endX;
                const diffY = startY - endY;
                
                // Swipe left to close menu
                if (diffX > 50 && Math.abs(diffY) < 50) {
                    this.closeMobileMenu();
                }
            });
        }
    }
    
    initializeFromHash() {
        const hash = window.location.hash.slice(1);
        if (hash && this.isValidPage(hash)) {
            this.navigateToPage(hash, false);
        } else {
            this.navigateToPage('home', false);
        }
    }
    
    navigateToPage(page, updateHistory = true) {
        if (!this.isValidPage(page)) {
            console.warn(`Invalid page: ${page}`);
            return;
        }
        
        this.showPage(page);
        
        if (updateHistory) {
            // Update URL hash
            window.location.hash = page;
            
            // Update browser history
            const state = { page: page };
            const url = `#${page}`;
            window.history.pushState(state, '', url);
        }
        
        // Update active navigation link
        this.updateActiveNavigation(page);
        
        // Close mobile menu if open
        if (this.isMobileMenuOpen) {
            this.closeMobileMenu();
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    showPage(pageName) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(pageName);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            
            // Trigger page-specific events
            this.triggerPageEvent(pageName, 'show');
        }
    }
    
    updateActiveNavigation(pageName) {
        // Remove active class from all nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current page link
        const activeLink = document.querySelector(`[data-page="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    toggleMobileMenu() {
        if (this.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }
    
    openMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        
        if (navMenu && navToggle) {
            navMenu.classList.add('active');
            navToggle.classList.add('active');
            this.isMobileMenuOpen = true;
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        
        if (navMenu && navToggle) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            this.isMobileMenuOpen = false;
            
            // Restore body scroll
            document.body.style.overflow = '';
        }
    }
    
    isValidPage(pageName) {
        const validPages = ['home', 'devices', 'create', 'transactions'];
        return validPages.includes(pageName);
    }
    
    triggerPageEvent(pageName, event) {
        // Emit custom event for page changes
        const customEvent = new CustomEvent(`dobi:page:${event}`, { 
            detail: { page: pageName, previousPage: this.currentPage } 
        });
        window.dispatchEvent(customEvent);
        
        // Call page-specific functions if they exist
        switch (pageName) {
            case 'home':
                this.handleHomePageShow();
                break;
            case 'devices':
                this.handleDevicesPageShow();
                break;
            case 'create':
                this.handleCreatePageShow();
                break;
            case 'transactions':
                this.handleTransactionsPageShow();
                break;
        }
    }
    
    handleHomePageShow() {
        // Refresh stats and recent devices
        if (window.dobiDevices) {
            window.dobiDevices.loadDevices();
        }
        if (window.dobiTransactions) {
            window.dobiTransactions.loadTransactions();
        }
    }
    
    handleDevicesPageShow() {
        // Refresh devices list
        if (window.dobiDevices) {
            window.dobiDevices.loadDevices();
        }
    }
    
    handleCreatePageShow() {
        // Reset form if exists
        const form = document.getElementById('create-device-form');
        if (form) {
            form.reset();
        }
    }
    
    handleTransactionsPageShow() {
        // Refresh transactions list
        if (window.dobiTransactions) {
            window.dobiTransactions.loadTransactions();
        }
    }
    
    // Utility functions for UI interactions
    
    showLoading(message = 'Loading...', maxDuration = 30000) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            const messageEl = spinner.querySelector('p');
            if (messageEl) messageEl.textContent = message;
            spinner.classList.remove('hidden');
            
            // Auto-hide after max duration to prevent infinite loading
            if (maxDuration > 0) {
                setTimeout(() => {
                    this.hideLoading();
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
    
    showToast(type, title, message, duration = null) {
        // Set default duration based on type
        if (duration === null) {
            switch (type) {
                case 'error':
                    duration = 8000; // 8 seconds for errors
                    break;
                case 'warning':
                    duration = 6000; // 6 seconds for warnings
                    break;
                case 'success':
                default:
                    duration = 5000; // 5 seconds for success/info
                    break;
            }
        }
        
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
            
            // Start progress bar animation
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.transition = `width ${duration}ms linear`;
                setTimeout(() => {
                    progressBar.style.width = '0%';
                }, 100);
            }
            
            // Auto-remove after specified duration
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
        this.showToast('error', title, message);
    }
    
    showWarning(title, message) {
        this.showToast('warning', title, message);
    }
    
    showInfo(title, message) {
        this.showToast('info', title, message);
    }
    
    // Modal management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
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
    
    // Form validation helpers
    validateRequiredField(field, fieldName) {
        if (!field.value.trim()) {
            this.showFieldError(field, `${fieldName} es requerido`);
            return false;
        }
        this.clearFieldError(field);
        return true;
    }
    
    validateEmailField(field) {
        const email = field.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            this.showFieldError(field, 'Formato de email inválido');
            return false;
        }
        this.clearFieldError(field);
        return true;
    }
    
    validateUrlField(field) {
        const url = field.value.trim();
        if (url) {
            try {
                new URL(url);
            } catch {
                this.showFieldError(field, 'URL inválida');
                return false;
            }
        }
        this.clearFieldError(field);
        return true;
    }
    
    showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('error');
            
            // Remove existing error message
            const existingError = formGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Add new error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            formGroup.appendChild(errorDiv);
        }
    }
    
    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('error');
            const errorMessage = formGroup.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        }
    }
    
    // Responsive utilities
    isMobile() {
        return window.innerWidth <= 768;
    }
    
    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }
    
    isDesktop() {
        return window.innerWidth > 1024;
    }
    
    // Animation helpers
    fadeIn(element, duration = 300) {
        if (element) {
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms ease-in-out`;
            element.style.display = 'block';
            
            setTimeout(() => {
                element.style.opacity = '1';
            }, 10);
        }
    }
    
    fadeOut(element, duration = 300) {
        if (element) {
            element.style.transition = `opacity ${duration}ms ease-in-out`;
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.style.display = 'none';
            }, duration);
        }
    }
    
    // Keyboard navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Escape key closes modals and mobile menu
            if (e.key === 'Escape') {
                if (this.isMobileMenuOpen) {
                    this.closeMobileMenu();
                }
                
                const openModal = document.querySelector('.modal:not(.hidden)');
                if (openModal) {
                    const modalId = openModal.id;
                    this.hideModal(modalId);
                }
            }
            
            // Enter key on form fields
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                const form = e.target.closest('form');
                if (form) {
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.click();
                    }
                }
            }
        });
    }
}

// Initialize UI after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dobiUI = new DobiUI();
});

// Global function for navigation (used in HTML onclick handlers)
window.showPage = (pageName) => {
    if (window.dobiUI) {
        window.dobiUI.navigateToPage(pageName);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DobiUI;
}

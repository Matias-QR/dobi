// Devices Module for Dobi Protocol
class DobiDevices {
    constructor() {
        this.devices = [];
        this.currentDevice = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadDevices();
    }
    
    setupEventListeners() {
        // Create device form
        const createForm = document.getElementById('create-device-form');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateDevice(e));
        }
        
        // Empty state buttons (delegated event handling)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.empty-state-btn')) {
                const btn = e.target.closest('.empty-state-btn');
                const page = btn.getAttribute('data-page');
                if (page && window.dobiUI) {
                    window.dobiUI.navigateToPage(page);
                }
            }
        });
        
        // Listen for authentication events
        window.addEventListener('dobi:auth:authenticated', () => {
            this.loadDevices();
        });
        
        window.addEventListener('dobi:auth:logout', () => {
            this.clearDevices();
        });
    }
    
    async loadDevices() {
        try {
            this.showLoading('Loading devices...');
            
            const response = await fetch('/api/devices');
            if (!response.ok) {
                throw new Error('Failed to load devices');
            }
            
            this.devices = await response.json();
            this.renderDevices();
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading devices:', error);
            this.showToast('error', 'Load Error', 'Failed to load devices');
        } finally {
            this.hideLoading();
        }
    }
    
    async createDevice(deviceData) {
        try {
            this.showLoading('Creating device...');
            
            const response = await fetch('/api/devices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(deviceData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create device');
            }
            
            const result = await response.json();
            
            // Add new device to list
            this.devices.unshift(result.device);
            this.renderDevices();
            this.updateStats();
            
            this.showToast('success', 'Device Created', 'Device created successfully');
            
            // Reset form
            const form = document.getElementById('create-device-form');
            if (form) form.reset();
            
            // Navigate to devices page
            showPage('devices');
            
            return result;
            
        } catch (error) {
            console.error('Error creating device:', error);
            this.showToast('error', 'Creation Failed', error.message);
            throw error;
        } finally {
            this.hideLoading();
        }
    }
    
    async getDevice(id) {
        try {
            const response = await fetch(`/api/devices/${id}`);
            if (!response.ok) {
                throw new Error('Device not found');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error getting device:', error);
            throw error;
        }
    }
    
    async deleteDevice(id) {
        if (!confirm('Are you sure you want to delete this device?')) {
            return false;
        }
        
        try {
            this.showLoading('Deleting device...');
            
            const response = await fetch(`/api/devices/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete device');
            }
            
            // Remove device from list
            this.devices = this.devices.filter(device => device.id !== id);
            this.renderDevices();
            this.updateStats();
            
            this.showToast('success', 'Device Deleted', 'Device deleted successfully');
            
            return true;
            
        } catch (error) {
            console.error('Error deleting device:', error);
            this.showToast('error', 'Deletion Failed', error.message);
            return false;
        } finally {
            this.hideLoading();
        }
    }
    
    handleCreateDevice(event) {
        event.preventDefault();
        
        // Check authentication
        if (!window.dobiAuth.requireAuth()) {
            return;
        }
        
        const formData = new FormData(event.target);
        const deviceData = {
            name: formData.get('name'),
            description: formData.get('description'),
            photo_url: formData.get('photo_url'),
            address: formData.get('address'),
            monitoring_endpoint: formData.get('monitoring_endpoint'),
            actions_endpoint: formData.get('actions_endpoint'),
            owner_address: window.dobiAuth.getCurrentUserAddress()
        };
        
        // Validate required fields
        if (!deviceData.name || !deviceData.address) {
            this.showToast('error', 'Validation Error', 'Name and address are required');
            return;
        }
        
        // Validate Ethereum address format
        if (!this.isValidEthereumAddress(deviceData.address)) {
            this.showToast('error', 'Validation Error', 'Invalid Ethereum address format');
            return;
        }
        
        this.createDevice(deviceData);
    }
    
    renderDevices() {
        const devicesList = document.getElementById('devices-list');
        const recentDevices = document.getElementById('recent-devices');
        
        if (devicesList) {
            devicesList.innerHTML = this.devices.length > 0 
                ? this.devices.map(device => this.createDeviceCard(device)).join('')
                : this.createEmptyState('devices');
        }
        
        if (recentDevices) {
            const recent = this.devices.slice(0, 6); // Show only 6 recent devices
            recentDevices.innerHTML = recent.length > 0 
                ? recent.map(device => this.createDeviceCard(device, true)).join('')
                : this.createEmptyState('recent');
        }
    }
    
    createDeviceCard(device, isCompact = false) {
        const photoUrl = device.photo_url || '';
        const photoElement = photoUrl 
            ? `<img src="${photoUrl}" alt="${device.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
            : '';
        
        const photoFallback = `<i class="fas fa-robot"></i>`;
        
        return `
            <div class="device-card" onclick="showDeviceDetail(${device.id})">
                <div class="device-card-photo">
                    ${photoElement}
                    ${photoFallback}
                </div>
                <div class="device-card-content">
                    <h3 class="device-card-title">${device.name}</h3>
                    ${device.description ? `<p class="device-card-description">${device.description}</p>` : ''}
                    <div class="device-card-address">${this.formatAddress(device.address)}</div>
                </div>
                ${!isCompact ? `
                    <div class="device-card-footer">
                        <span class="device-info">
                            <i class="fas fa-calendar"></i>
                            ${this.formatDate(device.created_at)}
                        </span>
                        <div class="device-card-actions">
                            <button class="btn btn-small btn-primary" onclick="event.stopPropagation(); showDeviceDetail(${device.id})">
                                <i class="fas fa-eye"></i>
                                Ver
                            </button>
                            <button class="btn btn-small btn-error" onclick="event.stopPropagation(); deleteDevice(${device.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    createEmptyState(type) {
        const messages = {
            devices: {
                icon: 'fas fa-robot',
                title: 'No Devices Found',
                message: 'You haven\'t created any devices yet. Create your first Dobi device to get started.',
                action: 'Create',
                actionPage: 'create'
            },
            recent: {
                icon: 'fas fa-clock',
                title: 'No Recent Devices',
                message: 'No devices have been created yet.',
                action: 'Create',
                actionPage: 'create'
            }
        };
        
        const config = messages[type];
        
        return `
            <div class="empty-state">
                <i class="${config.icon}"></i>
                <h3>${config.title}</h3>
                <p>${config.message}</p>
                <button class="btn btn-primary empty-state-btn" data-page="${config.actionPage}">
                    <i class="fas fa-plus"></i>
                    <span>${config.action}</span>
                </button>
            </div>
        `;
    }
    
    updateStats() {
        const totalDevices = document.getElementById('total-devices');
        if (totalDevices) {
            totalDevices.textContent = this.devices.length;
        }
    }
    
    clearDevices() {
        this.devices = [];
        this.renderDevices();
        this.updateStats();
    }
    
    isValidEthereumAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    showDeviceDetail(id) {
        this.getDevice(id).then(device => {
            this.currentDevice = device;
            this.showDeviceModal(device);
        }).catch(error => {
            this.showToast('error', 'Error', 'Failed to load device details');
        });
    }
    
    showDeviceModal(device) {
        const modal = document.getElementById('device-modal');
        const modalName = document.getElementById('modal-device-name');
        const modalContent = document.getElementById('modal-device-content');
        
        if (modal && modalName && modalContent) {
            modalName.textContent = device.name;
            
            const photoUrl = device.photo_url || '';
            const photoElement = photoUrl 
                ? `<img src="${photoUrl}" alt="${device.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">`
                : '';
            
            modalContent.innerHTML = `
                ${photoElement}
                <div class="device-details">
                    <div class="detail-group">
                        <label>Descripción:</label>
                        <p>${device.description || 'Sin descripción'}</p>
                    </div>
                    <div class="detail-group">
                        <label>Dirección del Dispositivo:</label>
                        <code class="device-address">${device.address}</code>
                    </div>
                    <div class="detail-group">
                        <label>Endpoint de Monitoreo:</label>
                        <p>${device.monitoring_endpoint || 'No configurado'}</p>
                    </div>
                    <div class="detail-group">
                        <label>Endpoint de Acciones:</label>
                        <p>${device.actions_endpoint || 'No configurado'}</p>
                    </div>
                    <div class="detail-group">
                        <label>Propietario:</label>
                        <code class="owner-address">${this.formatAddress(device.owner_address)}</code>
                    </div>
                    <div class="detail-group">
                        <label>Creado:</label>
                        <p>${this.formatDate(device.created_at)}</p>
                    </div>
                </div>
            `;
            
            modal.classList.remove('hidden');
        }
    }
    
    closeDeviceModal() {
        const modal = document.getElementById('device-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.currentDevice = null;
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

// Initialize Devices
window.dobiDevices = new DobiDevices();

// Global functions for HTML onclick handlers
window.showDeviceDetail = (id) => {
    window.dobiDevices.showDeviceDetail(id);
};

window.deleteDevice = (id) => {
    window.dobiDevices.deleteDevice(id);
};

window.closeDeviceModal = () => {
    window.dobiDevices.closeDeviceModal();
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DobiDevices;
}

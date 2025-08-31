import { chargerService } from './services/chargerService.js';

// Devices Management Module for Dobi Protocol
export class DobiDevices {
    constructor() {
        this.devices = [];
        this.recentDevices = [];
        this.isLoading = false;
        this.ui = null;
        this.chargers = []; // Store real charger data from API
    }

    init() {
        try {
            // Get UI reference
            if (window.dobiApp && window.dobiApp.getUI) {
                this.ui = window.dobiApp.getUI();
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('📱 Devices module initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize devices module:', error);
        }
    }

    setupEventListeners() {
        // Device card clicks (event delegation)
        document.addEventListener('click', (e) => {
            const deviceCard = e.target.closest('.device-card');
            if (deviceCard) {
                const deviceId = deviceCard.getAttribute('data-device-id');
                if (deviceId) {
                    this.openDeviceDetails(deviceId);
                }
            }
        });

        // Device action buttons (event delegation)
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.device-action-btn');
            if (actionBtn) {
                const action = actionBtn.getAttribute('data-action');
                const deviceId = actionBtn.closest('.device-card').getAttribute('data-device-id');
                
                if (action && deviceId) {
                    this.handleDeviceAction(action, deviceId);
                }
            }
        });
    }

    async loadDevices() {
        try {
            this.isLoading = true;
            
            // Show loading if UI is available
            if (this.ui) {
                this.ui.showLoading('Loading chargers from API...');
            }

            // Load real chargers from Dobi API
            const chargersResponse = await chargerService.getDetailedChargers();
            
            if (chargersResponse.success) {
                // Transform API data to device format
                this.chargers = chargersResponse.data;
                this.devices = chargerService.transformChargersToDevices(this.chargers);
                
                console.log('🔌 Real chargers loaded from API:', this.chargers.length);
                console.log('📱 Transformed devices:', this.devices.length);
                
                // Update UI with real data
                this.updateDevicesUI();
                
                // Update dashboard stats
                this.updateDashboardStats();
                
                if (this.ui) {
                    this.ui.showSuccess(`Loaded ${this.devices.length} chargers from API`);
                }
            } else {
                console.error('❌ Failed to load chargers from API:', chargersResponse.error);
                
                // Fallback to mock data if API fails
                console.log('🔄 Falling back to mock data...');
                const mockDevices = await this.getMockDevices();
                this.devices = mockDevices;
                this.updateDevicesUI();
                
                if (this.ui) {
                    this.ui.showError('Failed to load chargers from API. Using mock data instead.');
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to load devices:', error);
            
            // Fallback to mock data
            console.log('🔄 Falling back to mock data due to error...');
            const mockDevices = await this.getMockDevices();
            this.devices = mockDevices;
            this.updateDevicesUI();
            
            if (this.ui) {
                this.ui.showError('Failed to load devices: ' + error.message);
            }
        } finally {
            this.isLoading = false;
            
            if (this.ui) {
                this.ui.hideLoading();
            }
        }
    }

    async loadRecentDevices() {
        try {
            // Get recent devices (last 3 created)
            this.recentDevices = this.devices.slice(0, 3);
            
            // Update recent devices UI
            this.updateRecentDevicesUI();
            
        } catch (error) {
            console.error('❌ Failed to load recent devices:', error);
        }
    }

    async createDevice(deviceData) {
        try {
            console.log('🔌 Creating new charger with data:', deviceData);
            
            // Use the charger service to create the charger via API
            const createResult = await chargerService.createCharger(deviceData);
            
            if (createResult.success) {
                console.log('✅ Charger created via API:', createResult.data);
                
                // Transform the API response to device format
                const newDevice = chargerService.transformChargerToDevice(createResult.data);
                
                // Add to devices array
                this.devices.unshift(newDevice);
                
                // Update UI
                this.updateDevicesUI();
                this.updateRecentDevicesUI();
                
                // Emit device created event
                this.emitEvent('device:created', newDevice);
                
                console.log('📱 Device created and added to UI:', newDevice);
                
                return newDevice;
                
            } else {
                throw new Error(createResult.error || 'Failed to create charger via API');
            }
            
        } catch (error) {
            console.error('❌ Failed to create device:', error);
            throw error;
        }
    }

    async updateDevice(deviceId, updates) {
        try {
            const deviceIndex = this.devices.findIndex(d => d.id === deviceId);
            
            if (deviceIndex === -1) {
                throw new Error('Device not found');
            }

            // Update device
            this.devices[deviceIndex] = {
                ...this.devices[deviceIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            // Update UI
            this.updateDevicesUI();
            this.updateRecentDevicesUI();
            
            // Emit device updated event
            this.emitEvent('device:updated', this.devices[deviceIndex]);
            
            console.log('📱 Device updated:', deviceId);
            
            return this.devices[deviceIndex];
            
        } catch (error) {
            console.error('❌ Failed to update device:', error);
            throw error;
        }
    }

    async deleteDevice(deviceId) {
        try {
            const deviceIndex = this.devices.findIndex(d => d.id === deviceId);
            
            if (deviceIndex === -1) {
                throw new Error('Device not found');
            }

            const deletedDevice = this.devices[deviceIndex];
            
            // Remove from devices array
            this.devices.splice(deviceIndex, 1);

            // Update UI
            this.updateDevicesUI();
            this.updateRecentDevicesUI();
            
            // Emit device deleted event
            this.emitEvent('device:deleted', deletedDevice);
            
            console.log('📱 Device deleted:', deviceId);
            
            return deletedDevice;
            
        } catch (error) {
            console.error('❌ Failed to delete device:', error);
            throw error;
        }
    }

    openDeviceDetails(deviceId) {
        try {
            const device = this.devices.find(d => d.id === deviceId);
            
            if (!device) {
                throw new Error('Device not found');
            }

            // Open modal with device details
            if (this.ui && this.ui.openDeviceModal) {
                this.ui.openDeviceModal(device);
            }
            
        } catch (error) {
            console.error('❌ Failed to open device details:', error);
        }
    }

    async handleDeviceAction(action, deviceId) {
        try {
            const device = this.devices.find(d => d.id === deviceId);
            
            if (!device) {
                throw new Error('Device not found');
            }

            switch (action) {
                case 'view':
                    this.openDeviceDetails(deviceId);
                    break;
                    
                case 'edit':
                    // Navigate to edit page (not implemented yet)
                    if (this.ui) {
                        this.ui.showInfo('Edit functionality coming soon');
                    }
                    break;
                    
                case 'delete':
                    if (confirm(`Are you sure you want to delete "${device.name}"?`)) {
                        await this.deleteDevice(deviceId);
                        
                        if (this.ui) {
                            this.ui.showSuccess(`Device "${device.name}" deleted successfully`);
                        }
                    }
                    break;
                    
                case 'monitor':
                    // Open monitoring endpoint
                    if (device.monitoringEndpoint) {
                        window.open(device.monitoringEndpoint, '_blank');
                    } else {
                        if (this.ui) {
                            this.ui.showWarning('No monitoring endpoint configured');
                        }
                    }
                    break;
                    
                default:
                    console.warn('⚠️ Unknown device action:', action);
            }
            
        } catch (error) {
            console.error('❌ Failed to handle device action:', error);
            
            if (this.ui) {
                this.ui.showError('Action failed: ' + error.message);
            }
        }
    }

    updateDevicesUI() {
        try {
            const devicesList = document.getElementById('devices-list');
            if (!devicesList) return;

            if (this.devices.length === 0) {
                devicesList.innerHTML = this.createEmptyState('devices');
            } else {
                devicesList.innerHTML = this.devices.map(device => 
                    this.createDeviceCard(device)
                ).join('');
            }
            
        } catch (error) {
            console.error('❌ Failed to update devices UI:', error);
        }
    }

    /**
     * Update dashboard statistics with real charger data
     */
    updateDashboardStats() {
        if (!this.chargers || this.chargers.length === 0) return;

        try {
            const stats = chargerService.getChargerStats(this.chargers);
            
            // Update total devices count
            const totalDevicesElement = document.getElementById('total-devices');
            if (totalDevicesElement) {
                totalDevicesElement.textContent = stats.total || 0;
            }

            // Update active connections (active chargers)
            const activeConnectionsElement = document.getElementById('active-connections');
            if (activeConnectionsElement) {
                activeConnectionsElement.textContent = stats.active || 0;
            }

            // Update total transactions (placeholder for now)
            const totalTransactionsElement = document.getElementById('total-transactions');
            if (totalTransactionsElement) {
                totalTransactionsElement.textContent = '0'; // Will be updated when transactions API is implemented
            }

            console.log('📊 Dashboard stats updated:', stats);
            
        } catch (error) {
            console.error('❌ Failed to update dashboard stats:', error);
        }
    }

    updateRecentDevicesUI() {
        try {
            const recentDevices = document.getElementById('recent-devices');
            if (!recentDevices) return;

            if (this.recentDevices.length === 0) {
                recentDevices.innerHTML = this.createEmptyState('create');
            } else {
                recentDevices.innerHTML = this.recentDevices.map(device => 
                    this.createDeviceCard(device, true)
                ).join('');
            }
            
        } catch (error) {
            console.error('❌ Failed to update recent devices UI:', error);
        }
    }

    createDeviceCard(device, isRecent = false) {
        const photoUrl = device.photo || '';
        const photoDisplay = photoUrl ? 
            `<img src="${photoUrl}" alt="${device.name}" onerror="this.style.display='none'">` :
            `<i class="fas fa-charging-station"></i>`;

        // Get charger-specific information
        const status = device.status || 'unknown';
        const power = device.power || 'Unknown';
        const location = device.location || 'Unknown';
        
        // Status badge
        const statusBadge = this.getStatusBadge(status);
        
        // Power and location info
        const additionalInfo = device.type === 'charger' ? `
            <div class="device-details">
                <span class="device-power"><i class="fas fa-bolt"></i> ${power}</span>
                <span class="device-location"><i class="fas fa-map-marker-alt"></i> ${location}</span>
            </div>
        ` : '';

        return `
            <div class="device-card" data-device-id="${device.id}">
                <div class="device-card-header">
                    <div class="device-photo">
                        ${photoDisplay}
                    </div>
                    <div class="device-info">
                        <h3>${device.name}</h3>
                        <p>${device.description}</p>
                        ${additionalInfo}
                        ${statusBadge}
                    </div>
                </div>
                <div class="device-actions">
                    <button class="btn btn-primary device-action-btn" data-action="view">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button class="btn btn-secondary device-action-btn" data-action="monitor">
                        <i class="fas fa-chart-line"></i>
                        Monitor
                    </button>
                    ${!isRecent ? `
                        <button class="btn btn-secondary device-action-btn" data-action="edit">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="btn btn-secondary device-action-btn" data-action="delete">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Create status badge for charger devices
     * @param {string} status - Charger status
     * @returns {string} - HTML for status badge
     */
    getStatusBadge(status) {
        const statusConfig = {
            'active': { class: 'status-active', icon: 'check-circle', text: 'Active' },
            'charging': { class: 'status-charging', icon: 'bolt', text: 'Charging' },
            'available': { class: 'status-available', icon: 'circle', text: 'Available' },
            'offline': { class: 'status-offline', icon: 'times-circle', text: 'Offline' },
            'maintenance': { class: 'status-maintenance', icon: 'wrench', text: 'Maintenance' },
            'error': { class: 'status-error', icon: 'exclamation-triangle', text: 'Error' },
            'unknown': { class: 'status-unknown', icon: 'question-circle', text: 'Unknown' }
        };

        const config = statusConfig[status.toLowerCase()] || statusConfig['unknown'];

        return `
            <div class="device-status-badge ${config.class}">
                <i class="fas fa-${config.icon}"></i>
                <span>${config.text}</span>
            </div>
        `;
    }

    createEmptyState(page) {
        const messages = {
            'devices': {
                title: 'No Devices Found',
                message: 'You haven\'t created any devices yet. Start by creating your first Dobi device.',
                buttonText: 'Create Device',
                icon: 'cube'
            },
            'create': {
                title: 'No Recent Devices',
                message: 'Create your first Dobi device to get started with IoT monitoring.',
                buttonText: 'Create',
                icon: 'plus'
            }
        };

        const config = messages[page] || messages['devices'];

        return `
            <div class="empty-state">
                <i class="fas fa-${config.icon}"></i>
                <h3>${config.title}</h3>
                <p>${config.message}</p>
                <button class="btn btn-primary empty-state-btn" data-page="${page === 'create' ? 'create' : 'create'}">
                    <i class="fas fa-plus"></i>
                    <span>${config.buttonText}</span>
                </button>
            </div>
        `;
    }

    // Utility methods
    validateDeviceData(deviceData) {
        const required = ['id_charger', 'owner_address', 'description', 'location', 'power'];
        
        for (const field of required) {
            if (!deviceData[field] || deviceData[field].trim() === '') {
                throw new Error(`${field} is required`);
            }
        }

        // Validate power is a positive number
        if (isNaN(deviceData.power) || deviceData.power <= 0) {
            throw new Error('Power must be a positive number');
        }

        // Validate battery level if provided
        if (deviceData.battery !== undefined && (isNaN(deviceData.battery) || deviceData.battery < 0 || deviceData.battery > 100)) {
            throw new Error('Battery level must be between 0 and 100');
        }
    }

    generateDeviceId() {
        return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateDeviceAddress() {
        return '0x' + Math.random().toString(16).substr(2, 40);
    }

    getDeviceById(deviceId) {
        return this.devices.find(d => d.id === deviceId);
    }

    getTotalDevices() {
        return this.devices.length;
    }

    getActiveConnections() {
        return this.devices.filter(d => d.status === 'active').length;
    }

    clearDevices() {
        this.devices = [];
        this.recentDevices = [];
        this.updateDevicesUI();
        this.updateRecentDevicesUI();
    }

    // Mock data for development
    async getMockDevices() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return [
            {
                id: 'device_1',
                name: 'Smart Thermostat',
                description: 'IoT thermostat for home temperature control',
                photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
                monitoringEndpoint: 'https://api.example.com/thermostat/monitor',
                actionEndpoint: 'https://api.example.com/thermostat/control',
                address: '0x1234567890123456789012345678901234567890',
                status: 'active',
                createdAt: '2024-01-15T10:30:00Z',
                updatedAt: '2024-01-15T10:30:00Z'
            },
            {
                id: 'device_2',
                name: 'Security Camera',
                description: 'Smart security camera with motion detection',
                photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
                monitoringEndpoint: 'https://api.example.com/camera/status',
                actionEndpoint: 'https://api.example.com/camera/control',
                address: '0x2345678901234567890123456789012345678901',
                status: 'active',
                createdAt: '2024-01-14T15:45:00Z',
                updatedAt: '2024-01-14T15:45:00Z'
            }
        ];
    }

    // Event emission
    emitEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }
}

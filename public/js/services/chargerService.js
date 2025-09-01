import { httpService } from './httpService.js';
import { API_CONFIG } from '../config.js';

/**
 * Charger Service for Dobi API
 * Handles all charger-related API calls
 */
export class ChargerService {
    constructor() {
        this.endpoints = API_CONFIG.ENDPOINTS.CHARGERS;
    }

    /**
     * Get all detailed charger information
     * @returns {Promise} - Detailed chargers data
     */
    async getDetailedChargers() {
        try {
            console.log('🔌 Fetching detailed chargers from API...');
            
            const response = await httpService.get(this.endpoints.DETAILED);
            
            if (response.success) {
                console.log('✅ Detailed chargers fetched successfully:', response.data);
                
                // Handle the actual API response structure
                let chargersData = response.data;
                
                // If the API returns an object with a 'chargers' property, extract it
                if (chargersData && typeof chargersData === 'object' && chargersData.chargers) {
                    console.log('📊 API returned object with chargers property, extracting...');
                    chargersData = chargersData.chargers;
                }
                
                // Ensure we have an array
                if (!Array.isArray(chargersData)) {
                    console.warn('⚠️ chargersData is not an array:', chargersData);
                    return {
                        success: false,
                        error: 'Invalid data format from API',
                        message: 'API returned unexpected data structure'
                    };
                }
                
                return {
                    success: true,
                    data: chargersData,
                    message: `Chargers loaded successfully (${chargersData.length} found)`
                };
            } else {
                console.error('❌ Failed to fetch detailed chargers:', response.error);
                return {
                    success: false,
                    error: response.error,
                    message: response.message
                };
            }
        } catch (error) {
            console.error('❌ Error in getDetailedChargers:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to fetch chargers'
            };
        }
    }

    /**
     * Get all chargers (basic list)
     * @returns {Promise} - Basic chargers data
     */
    async getAllChargers() {
        try {
            console.log('🔌 Fetching all chargers from API...');
            
            const response = await httpService.get(this.endpoints.LIST);
            
            if (response.success) {
                console.log('✅ All chargers fetched successfully:', response.data);
                return {
                    success: true,
                    data: response.data,
                    message: 'Chargers loaded successfully'
                };
            } else {
                console.error('❌ Failed to fetch all chargers:', response.error);
                return {
                    success: false,
                    error: response.error,
                    message: response.message
                };
            }
        } catch (error) {
            console.error('❌ Error in getAllChargers:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to fetch chargers'
            };
        }
    }

    /**
     * Get charger by ID
     * @param {string} id - Charger ID
     * @returns {Promise} - Charger data
     */
    async getChargerById(id) {
        try {
            if (!id) {
                throw new Error('Charger ID is required');
            }

            console.log(`🔌 Fetching charger ${id} from API...`);
            
            const endpoint = this.endpoints.BY_ID.replace('{id}', id);
            const response = await httpService.get(endpoint);
            
            if (response.success) {
                console.log(`✅ Charger ${id} fetched successfully:`, response.data);
                return {
                    success: true,
                    data: response.data,
                    message: 'Charger loaded successfully'
                };
            } else {
                console.error(`❌ Failed to fetch charger ${id}:`, response.error);
                return {
                    success: false,
                    error: response.error,
                    message: response.message
                };
            }
        } catch (error) {
            console.error(`❌ Error in getChargerById for ${id}:`, error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to fetch charger'
            };
        }
    }

    /**
     * Transform charger data to device format for UI compatibility
     * @param {Object} chargerData - Raw charger data from API
     * @returns {Object} - Transformed charger data
     */
    transformChargerToDevice(chargerData) {
        // This method transforms the API charger data to match our device format
        // Adjust the mapping based on the actual API response structure
        
        return {
            id: chargerData.id_charger || chargerData.id || `charger_${Date.now()}`,
            name: chargerData.id_charger || chargerData.name || 'Unknown Charger',
            description: chargerData.description || 'Charger device',
            photo: chargerData.photo || chargerData.image_url || chargerData.photo_url || '',
            monitoringEndpoint: chargerData.monitoring_endpoint || chargerData.status_url || '',
            actionEndpoint: chargerData.action_endpoint || chargerData.control_url || '',
            address: chargerData.owner_address || chargerData.address || 'Unknown',
            status: chargerData.status || 'active',
            type: 'charger',
            power: chargerData.power || 'Unknown',
            location: chargerData.location || 'Unknown',
            battery: chargerData.battery || 0,
            createdAt: chargerData.created_at || chargerData.created || new Date().toISOString(),
            updatedAt: chargerData.updated_at || chargerData.updated || new Date().toISOString(),
            // Add any other charger-specific fields here
            ...chargerData
        };
    }

    /**
     * Transform multiple chargers to device format
     * @param {Array} chargersData - Array of raw charger data
     * @returns {Array} - Array of transformed charger data
     */
    transformChargersToDevices(chargersData) {
        if (!Array.isArray(chargersData)) {
            console.warn('⚠️ chargersData is not an array:', chargersData);
            
            // Try to extract chargers from object structure
            if (chargersData && typeof chargersData === 'object' && chargersData.chargers) {
                console.log('🔄 Attempting to extract chargers from object structure...');
                return this.transformChargersToDevices(chargersData.chargers);
            }
            
            return [];
        }

        console.log(`🔄 Transforming ${chargersData.length} chargers to devices...`);
        return chargersData.map(charger => this.transformChargerToDevice(charger));
    }

    /**
     * Get charger statistics for dashboard
     * @param {Array} chargers - Array of chargers
     * @returns {Object} - Statistics object
     */
    getChargerStats(chargers) {
        if (!Array.isArray(chargers)) return {};

        const totalChargers = chargers.length;
        const activeChargers = chargers.filter(c => c.status === 'active').length;
        const chargingChargers = chargers.filter(c => c.status === 'charging').length;
        const availableChargers = chargers.filter(c => c.status === 'available').length;
        const offlineChargers = chargers.filter(c => c.status === 'offline').length;

        return {
            total: totalChargers,
            active: activeChargers,
            charging: chargingChargers,
            available: availableChargers,
            offline: offlineChargers
        };
    }

    /**
     * Filter chargers by status
     * @param {Array} chargers - Array of chargers
     * @param {string} status - Status to filter by
     * @returns {Array} - Filtered chargers
     */
    filterChargersByStatus(chargers, status) {
        if (!Array.isArray(chargers)) return [];
        if (!status) return chargers;

        return chargers.filter(charger => charger.status === status);
    }

    /**
     * Search chargers by name or description
     * @param {Array} chargers - Array of chargers
     * @param {string} query - Search query
     * @returns {Array} - Filtered chargers
     */
    searchChargers(chargers, query) {
        if (!Array.isArray(chargers)) return [];
        if (!query || query.trim() === '') return chargers;

        const searchTerm = query.toLowerCase().trim();
        
        return chargers.filter(charger => {
            const name = (charger.name || '').toLowerCase();
            const description = (charger.description || '').toLowerCase();
            const location = (charger.location || '').toLowerCase();
            
            return name.includes(searchTerm) || 
                   description.includes(searchTerm) || 
                   location.includes(searchTerm);
        });
    }

    /**
     * Create a new charger
     * @param {Object} chargerData - Charger data to create
     * @returns {Promise} - Creation result
     */
    async createCharger(chargerData) {
        try {
            console.log('🔌 Creating new charger:', chargerData);
            
            // Validate required fields
            const requiredFields = ['id_charger', 'owner_address', 'location', 'description', 'power'];
            for (const field of requiredFields) {
                if (!chargerData[field] || chargerData[field].trim() === '') {
                    throw new Error(`Field '${field}' is required`);
                }
            }

            // Prepare charger data according to API structure
            const newCharger = {
                id_charger: chargerData.id_charger,
                owner_address: chargerData.owner_address,
                status: chargerData.status || 'active',
                location: chargerData.location,
                description: chargerData.description,
                battery: chargerData.battery || 100,
                power: chargerData.power
            };

            console.log('📤 Sending charger data to API:', newCharger);
            
            const response = await httpService.post(this.endpoints.CREATE, newCharger);
            
            if (response.success) {
                console.log('✅ Charger created successfully:', response.data);
                return {
                    success: true,
                    data: response.data,
                    message: 'Charger created successfully'
                };
            } else {
                console.error('❌ Failed to create charger:', response.error);
                return {
                    success: false,
                    error: response.error,
                    message: response.message
                };
            }
        } catch (error) {
            console.error('❌ Error in createCharger:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to create charger'
            };
        }
    }

    /**
     * Update an existing charger
     * @param {string} id - Charger ID
     * @param {Object} updates - Fields to update
     * @returns {Promise} - Update result
     */
    async updateCharger(id, updates) {
        try {
            console.log(`🔌 Updating charger ${id}:`, updates);
            
            const response = await httpService.put(this.endpoints.UPDATE.replace('{id}', id), updates);
            
            if (response.success) {
                console.log(`✅ Charger ${id} updated successfully:`, response.data);
                return {
                    success: true,
                    data: response.data,
                    message: 'Charger updated successfully'
                };
            } else {
                console.error(`❌ Failed to update charger ${id}:`, response.error);
                return {
                    success: false,
                    error: response.error,
                    message: response.message
                };
            }
        } catch (error) {
            console.error(`❌ Error in updateCharger for ${id}:`, error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to update charger'
            };
        }
    }

    /**
     * Delete a charger
     * @param {string} id - Charger ID
     * @returns {Promise} - Deletion result
     */
    async deleteCharger(id) {
        try {
            console.log(`🔌 Deleting charger ${id}...`);
            
            const response = await httpService.delete(this.endpoints.DELETE.replace('{id}', id));
            
            if (response.success) {
                console.log(`✅ Charger ${id} deleted successfully`);
                return {
                    success: true,
                    message: 'Charger deleted successfully'
                };
            } else {
                console.error(`❌ Failed to delete charger ${id}:`, response.error);
                return {
                    success: false,
                    error: response.error,
                    message: response.message
                };
            }
        } catch (error) {
            console.error(`❌ Error in deleteCharger for ${id}:`, error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to delete charger'
            };
        }
    }
}

// Export singleton instance
export const chargerService = new ChargerService();

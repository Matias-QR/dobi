import { API_CONFIG, API_STATUS, ERROR_MESSAGES } from '../config.js';

/**
 * HTTP Service for Dobi API
 * Handles all API calls with proper error handling and retries
 */
export class HttpService {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
        this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
    }

    /**
     * Make HTTP request with retry logic
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @param {number} attempt - Current attempt number
     * @returns {Promise} - API response
     */
    async request(endpoint, options = {}, attempt = 1) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const requestOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                },
                ...options
            };

            // Add timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            requestOptions.signal = controller.signal;

            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);

            // Handle different response statuses
            if (response.ok) {
                return await this.handleSuccessResponse(response);
            } else {
                return await this.handleErrorResponse(response, attempt);
            }

        } catch (error) {
            return await this.handleRequestError(error, endpoint, attempt);
        }
    }

    /**
     * Handle successful API response
     * @param {Response} response - Fetch response
     * @returns {Object} - Parsed response data
     */
    async handleSuccessResponse(response) {
        try {
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return {
                    success: true,
                    status: response.status,
                    data: data,
                    message: 'Request successful'
                };
            } else {
                const text = await response.text();
                return {
                    success: true,
                    status: response.status,
                    data: text,
                    message: 'Request successful'
                };
            }
        } catch (error) {
            return {
                success: false,
                status: response.status,
                error: 'Failed to parse response',
                message: ERROR_MESSAGES.UNKNOWN_ERROR
            };
        }
    }

    /**
     * Handle error API response
     * @param {Response} response - Fetch response
     * @param {number} attempt - Current attempt number
     * @returns {Object} - Error response
     */
    async handleErrorResponse(response, attempt) {
        let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
        
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
            // If we can't parse the error response, use status-based messages
            switch (response.status) {
                case API_STATUS.BAD_REQUEST:
                    errorMessage = ERROR_MESSAGES.VALIDATION_ERROR;
                    break;
                case API_STATUS.UNAUTHORIZED:
                    errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
                    break;
                case API_STATUS.FORBIDDEN:
                    errorMessage = ERROR_MESSAGES.FORBIDDEN;
                    break;
                case API_STATUS.NOT_FOUND:
                    errorMessage = ERROR_MESSAGES.NOT_FOUND;
                    break;
                case API_STATUS.INTERNAL_ERROR:
                    errorMessage = ERROR_MESSAGES.SERVER_ERROR;
                    break;
            }
        }

        // Retry logic for certain errors
        if (this.shouldRetry(response.status, attempt)) {
            return await this.retryRequest(response.url, attempt);
        }

        return {
            success: false,
            status: response.status,
            error: errorMessage,
            message: errorMessage
        };
    }

    /**
     * Handle request errors (network, timeout, etc.)
     * @param {Error} error - Request error
     * @param {string} endpoint - API endpoint
     * @param {number} attempt - Current attempt number
     * @returns {Object} - Error response
     */
    async handleRequestError(error, endpoint, attempt) {
        let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
        
        if (error.name === 'AbortError') {
            errorMessage = ERROR_MESSAGES.TIMEOUT_ERROR;
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
        }

        // Retry logic for network errors
        if (this.shouldRetry(null, attempt)) {
            return await this.retryRequest(endpoint, attempt);
        }

        return {
            success: false,
            status: 0,
            error: errorMessage,
            message: errorMessage
        };
    }

    /**
     * Determine if request should be retried
     * @param {number} status - HTTP status code
     * @param {number} attempt - Current attempt number
     * @returns {boolean} - Whether to retry
     */
    shouldRetry(status, attempt) {
        if (attempt >= this.retryAttempts) return false;
        
        // Retry on network errors or server errors (5xx)
        if (!status) return true;
        if (status >= 500 && status < 600) return true;
        
        return false;
    }

    /**
     * Retry failed request
     * @param {string} endpoint - API endpoint
     * @param {number} attempt - Current attempt number
     * @returns {Promise} - Retry response
     */
    async retryRequest(endpoint, attempt) {
        const nextAttempt = attempt + 1;
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        
        console.log(`🔄 Retrying request to ${endpoint} (attempt ${nextAttempt}/${this.retryAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return await this.request(endpoint, {}, nextAttempt);
    }

    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} headers - Additional headers
     * @returns {Promise} - API response
     */
    async get(endpoint, headers = {}) {
        return await this.request(endpoint, {
            method: 'GET',
            headers
        });
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     * @param {Object} headers - Additional headers
     * @returns {Promise} - API response
     */
    async post(endpoint, data = {}, headers = {}) {
        return await this.request(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     * @param {Object} headers - Additional headers
     * @returns {Promise} - API response
     */
    async put(endpoint, data = {}, headers = {}) {
        return await this.request(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @param {Object} headers - Additional headers
     * @returns {Promise} - API response
     */
    async delete(endpoint, headers = {}) {
        return await this.request(endpoint, {
            method: 'DELETE',
            headers
        });
    }
}

// Export singleton instance
export const httpService = new HttpService();

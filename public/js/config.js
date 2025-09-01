// Dobi API Configuration
export const API_CONFIG = {
    BASE_URL: '', // Use relative URLs to go through our proxy
    ENDPOINTS: {
        CHARGERS: {
            DETAILED: '/api/proxy/chargers/detailed',
            LIST: '/api/proxy/chargers',
            BY_ID: '/api/proxy/chargers/{id}',
            CREATE: '/api/proxy/chargers',
            UPDATE: '/api/proxy/chargers/{id}',
            DELETE: '/api/proxy/chargers/{id}'
        },
        DEVICES: {
            LIST: '/api/proxy/devices',
            BY_ID: '/api/proxy/devices/{id}',
            CREATE: '/api/proxy/devices',
            UPDATE: '/api/proxy/devices/{id}',
            DELETE: '/api/proxy/devices/{id}'
        },
        TRANSACTIONS: {
            LIST: '/api/proxy/transactions',
            BY_ID: '/api/proxy/transactions/{id}'
        },
        AUTH: {
            LOGIN: '/api/proxy/auth/login',
            VERIFY: '/api/proxy/auth/verify',
            LOGOUT: '/api/proxy/auth/logout'
        }
    },
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3
};

// API Response Status Codes
export const API_STATUS = {
    SUCCESS: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500
};

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
    TIMEOUT_ERROR: 'La solicitud tardó demasiado. Inténtalo de nuevo.',
    SERVER_ERROR: 'Error del servidor. Inténtalo más tarde.',
    NOT_FOUND: 'Recurso no encontrado.',
    UNAUTHORIZED: 'No autorizado. Inicia sesión nuevamente.',
    FORBIDDEN: 'Acceso denegado.',
    VALIDATION_ERROR: 'Datos inválidos. Verifica la información.',
    UNKNOWN_ERROR: 'Error desconocido. Inténtalo de nuevo.'
};

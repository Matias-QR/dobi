const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors({
    origin: true,
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Proxy API requests to Dobi API to avoid CORS issues
app.use('/api', createProxyMiddleware({
    target: 'https://api-aleph.dobi.guru',
    changeOrigin: true,
    secure: true,
    pathRewrite: {
        '^/api': '/api' // Keep the /api prefix
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxying request: ${req.method} ${req.url} -> https://api-aleph.dobi.guru${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`✅ Proxy response: ${proxyRes.statusCode} for ${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`❌ Proxy error for ${req.url}:`, err.message);
        res.status(500).json({ 
            error: 'Proxy error', 
            message: 'Failed to proxy request to Dobi API',
            details: err.message 
        });
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Dobi Frontend Server is running',
        timestamp: new Date().toISOString()
    });
});

// Catch-all route to serve index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Dobi Frontend Server running on http://localhost:${PORT}`);
    console.log(`🔌 API Proxy enabled: /api/* -> https://api-aleph.dobi.guru/api/*`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

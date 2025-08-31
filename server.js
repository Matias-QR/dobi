const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { ethers } = require('ethers');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./dobi.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    // Devices table
    db.run(`CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      photo_url TEXT,
      address TEXT UNIQUE NOT NULL,
      monitoring_endpoint TEXT,
      actions_endpoint TEXT,
      owner_address TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Transactions table
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER,
      tx_hash TEXT NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      amount TEXT,
      gas_used TEXT,
      block_number INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices (id)
    )`);

    // Users table for authentication
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT UNIQUE NOT NULL,
      nonce TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
}

// Routes

// Get nonce for authentication
app.get('/api/auth/nonce/:address', (req, res) => {
  const { address } = req.params;
  const nonce = Math.floor(Math.random() * 1000000).toString();
  
  db.run('INSERT OR REPLACE INTO users (wallet_address, nonce) VALUES (?, ?)', 
    [address, nonce], 
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ nonce, message: 'Nonce generated successfully' });
    });
});

// Verify signature and authenticate
app.post('/api/auth/verify', (req, res) => {
  const { address, signature, nonce } = req.body;
  
  try {
    const message = `Sign this message to authenticate with Dobi: ${nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
      res.json({ 
        authenticated: true, 
        message: 'Authentication successful',
        user: { address }
      });
    } else {
      res.status(401).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Invalid signature format' });
  }
});

// Create new device
app.post('/api/devices', (req, res) => {
  const { name, description, photo_url, address, monitoring_endpoint, actions_endpoint, owner_address } = req.body;
  
  if (!name || !address || !owner_address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.run(
    'INSERT INTO devices (name, description, photo_url, address, monitoring_endpoint, actions_endpoint, owner_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, description, photo_url, address, monitoring_endpoint, actions_endpoint, owner_address],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id: this.lastID, 
        message: 'Device created successfully',
        device: { id: this.lastID, name, description, photo_url, address, monitoring_endpoint, actions_endpoint, owner_address }
      });
    }
  );
});

// Get all devices
app.get('/api/devices', (req, res) => {
  db.all('SELECT * FROM devices ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get device by ID
app.get('/api/devices/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM devices WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.json(row);
  });
});

// Get recent transactions
app.get('/api/transactions', (req, res) => {
  db.all(`
    SELECT t.*, d.name as device_name 
    FROM transactions t 
    LEFT JOIN devices d ON t.device_id = d.id 
    ORDER BY t.timestamp DESC 
    LIMIT 50
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add transaction
app.post('/api/transactions', (req, res) => {
  const { device_id, tx_hash, from_address, to_address, amount, gas_used, block_number } = req.body;
  
  if (!tx_hash || !from_address || !to_address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.run(
    'INSERT INTO transactions (device_id, tx_hash, from_address, to_address, amount, gas_used, block_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [device_id, tx_hash, from_address, to_address, amount, gas_used, block_number],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id: this.lastID, 
        message: 'Transaction recorded successfully' 
      });
    }
  );
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Dobi Web3 Interface server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

# Dobi

# Electric Charger API - Blockchain & Simulation

Complete electric charger management system with Base Mainnet blockchain integration, automatic transaction simulation, and real-time monitoring.

## Key Features

### Blockchain Integration
- Unique wallets for each charger using ethers.js
- Real transactions on Base Mainnet (configurable)
- Automatic management of funds and operational costs
- Simulation mode for development and testing

### Intelligent Simulation
- Automatic transactions randomly scheduled
- Realistic operating hours (8 AM - 10 PM)
- Configurable daily limits per charger
- Realistic economics (costs = 40% of income)

### Complete Management
- SQLite database for persistence
- Detailed logging system
- Complete REST API with validation
- Real-time blockchain queries

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Internet access (for Base RPC)

# Clone or download the project
git clone <your-repository>
cd dobi-api

# Install dependencies
npm install express sqlite3 ethers dotenv

# Create configuration file
cp .env.example .env

# Edit environment variables
nano .env

# Create initial data (optional)
nano chargers.json

# Run the server
node server.js

## Configuration


### Installation Steps

### .env File

# Server
PORT=6139

# Blockchain
BASE_RPC=https://mainnet.base.org
SEND_ONCHAIN=false
MASTER_PRIVATE_KEY=your_private_key_here

# Simulation
MIN_TX_ETH=0.0001
MAX_TX_ETH=0.0002

# Security
API_KEY=your_secure_api_key_here

### chargers.json File (optional)

[
  {
    "id_charger": "CHARGER_001",
    "owner_address": "0x742d35Cc6634C0532925a3b8D56B4B8d3d73a9B1",
    "status": "active",
    "transactions": 0,
    "income_generated": 0,
    "cost_generated": 0,
    "balance_total": 0
  }
]

## Project Structure

dobi-api/
├── server.js              # Main server
├── test.js               # Test script
├── .env                  # Environment variables (DO NOT commit)
├── .gitignore           # Files to ignore
├── chargers.json        # Initial data (optional)
├── chargers.db          # SQLite database (auto-generated)
├── package.json         # Project dependencies
└── README.md           # This file

## API Endpoints

### Charger Management

#### POST /api/chargers
Creates a new charger with unique wallet.

JSON
{
  "id_charger": "CHARGER_001",
  "owner_address": "0x742d35Cc6634C0532925a3b8D56B4B8d3d73a9B1",
  "status": "active"
}

#### GET /api/chargers/detailed
Gets complete information for all chargers.

JSON
{
  "summary": {
    "total_chargers": 3,
    "active_chargers": 2,
    "total_transactions": 15
  },
  "chargers": [...],
  "system_info": {...}
}

### Charger Actions

#### POST /api/chargers/:id/action
Executes actions on a specific charger.

Available actions:
- turn_on - Activates charger and schedules transactions
- turn_off - Deactivates charger
- restart - Restarts (off for 3s, then on)
- create_ticket - Creates simulated support ticket
- pay_costs - Pays operational costs (40% of balance)
- send_to_owner - Transfers funds to owner

JSON
{
  "action": "turn_on"
}

### Transaction Simulation

#### POST /api/chargers/:id/simulate_transaction
Simulates a manual transaction.

JSON
{
  "amount_eth": 0.001
}

### Logs and Monitoring

#### GET /api/logs
Gets system logs with filtering options.

Query parameters:
- include_blockchain=true/false - Include blockchain transactions
- charger_id=ID - Filter by specific charger

#### POST /api/logs
Creates manual log entry (requires API Key).

JSON
{
  "charger_id": "CHARGER_001",
  "message": "Manual maintenance completed",
  "transactions": 5,
  "income_generated": 50.25,
  "cost_generated": 20.10,
  "balance_total": 30.15
}

## Operation Modes

### Simulation Mode (Recommended for development)

END_ONCHAIN=false
- Simulates all blockchain transactions
- Doesn't spend real ETH
- Perfect for development and testing
- Maintains all economic logic

###
nomic logic

### Real Blockchain Mode (Production)

SEND_ONCHAIN=true
- Executes real transactions on Base Mainnet
- Requires real ETH in master wallet
- For production use only
- WARNING! - Spends real ETH

## Automatic Simulation

### How It Works
- Active chargers generate 0-4 daily transactions
- Random times between 8 AM - 10 PM
- Amounts between MIN_TX_ETH and MAX_TX_ETH
- Automatic costs = 40% of income

### Scheduling
- Scheduled when creating active chargers
- Scheduled when activating chargers
- Scheduled when restarting chargers
- Daily reset at midnight

## Testing

### Automated Script
Bash

# Run complete tests
node test.js

# Tests with detailed information
VERBOSE=1 node test.js

### Postman Collection
Import the included Postman collection for interactive manual testing.

### Included Tests
- Charger creation and management
- All available actions
- Transaction simulation
- Log and blockchain queries
- Error handling
- Security validation

## Security Considerations

### CRITICAL - Never commit:
- .env file (contains private keys)
- chargers.db database (contains wallets)
- .wallet files or similar
- Production configurations

### Recommendations:
1. Change MASTER_PRIVATE_KEY before production
2. Use a unique and secure API_KEY
3. Never expose private keys in logs or responses
4. Use HTTPS in production
5. Limit access to sensitive endpoints

## Troubleshooting

### Server won't start
Bash

# Check dependencies
npm install

# Check .env file
cat .env

# Check available port
lsof -i :6139

### Blockchain errors
Bash

# Check RPC connectivity
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://mainnet.base.org

# Check master wallet balance
# (use blockchain tools or explorers)

### Corrupted database
Bash

# Delete and recreate DB
rm chargers.db
node server.js  # Auto-recreated

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Server port | 6139 | No |
| BASE_RPC | Base RPC URL | https://mainnet.base.org | Yes |
| SEND_ONCHAIN | Real transactions | false | No |
| MASTER_PRIVATE_KEY | Master wallet key | - | Yes |
| MIN_TX_ETH | Min ETH per tx | 0.0001 | No |
| MAX_TX_ETH | Max ETH per tx | 0.0002 | No |
| API_KEY | API key for logs | - | Yes |

## Architecture

### Main Components
- Express Server - REST API
- SQLite Database - Data persistence
- Ethers.js - Blockchain integration
- Scheduler - Automatic transaction system

### Data Flow
1. Charger created → Unique wallet generated
2. If active → Transactions automatically scheduled
3. Transactions → Update DB and blockchain (optional)
4. Logs → Record all activity
5. Daily reset → New scheduling

## Development

### Data Structure

#### chargers table
SQL

CREATE TABLE chargers (
  id_charger TEXT PRIMARY KEY,
  owner_address TEXT,
  wallet_address TEXT,
  wallet_privateKey TEXT,
  status TEXT,
  transactions INTEGER,
  income_generated REAL,
  cost_generated REAL,
  balance_total REAL
);

#### logs table
SQL

CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  charger_id TEXT,
  message TEXT,
  timestamp TEXT,
  transactions INTEGER,
  income_generated REAL,
  cost_generated REAL,
  balance_total REAL
);

### Future Improvements
- [ ] Real-time web dashboard
- [ ] Integration with specialized blockchain APIs
- [ ] Alert and notification system
- [ ] Advanced metrics and analytics
- [ ] User authentication
- [ ] Advanced rate limiting

## Support and Contributing

### Reporting Issues
1. Check that the issue isn't in the logs
2. Include environment information (.env without keys)
3. Provide steps to reproduce the problem

### Local Development
Bash

# Development mode with auto-restart
npm install -g nodemon
nodemon server.js

# Detailed logs
DEBUG=* node server.js

## License

[Specify your license here]

## Author

[Your contact information]

---

Warning: This system handles private keys and blockchain transactions. Always use simulation mode during development and take all necessary security precautions in production.

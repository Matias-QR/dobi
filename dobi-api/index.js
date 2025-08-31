// server.js
require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 6139;

app.use(express.json());

// =================== CONFIG ===================
const API_KEY = process.env.API_KEY
const BASE_RPC = process.env.BASE_RPC
const provider = new ethers.JsonRpcProvider(BASE_RPC);

// Toggle real on-chain sends (default false: simulate only)
const SEND_ONCHAIN = process.env.SEND_ONCHAIN;

// Master wallet (sender of simulated deposits to chargers)
const MASTER_PRIVATE_KEY = process.env.MASTER_PRIVATE_KEY;
const masterWallet = new ethers.Wallet(MASTER_PRIVATE_KEY, provider);

// Simulation parameters
const MAX_DAILY_CHARGES = 4;
const SIMULATION_HOURS = { start: 8, end: 22 }; // local server time window
const MIN_TX_ETH = Number(process.env.MIN_TX_ETH || '0.0001'); // min 0.001 ETH
const MAX_TX_ETH = Number(process.env.MAX_TX_ETH || '0.0002');  // max 0.01 ETH

// =================== SQLITE ===================
const db = new sqlite3.Database('./chargers.db', (err) => {
  if (err) console.error('Error connecting to SQLite:', err);
  else console.log('Connected to SQLite');
});

// Create tables if not exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS chargers (
      id_charger TEXT PRIMARY KEY,
      owner_address TEXT,
      wallet_address TEXT,
      wallet_privateKey TEXT,
      status TEXT,
      transactions INTEGER,
      income_generated REAL,
      cost_generated REAL,
      balance_total REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      charger_id TEXT,
      message TEXT,
      timestamp TEXT,
      transactions INTEGER,
      income_generated REAL,
      cost_generated REAL,
      balance_total REAL
    )
  `);
});

// =================== INITIAL DATA LOADING ===================
async function loadInitialChargers() {
  try {
    const chargerJsonPath = path.join(__dirname, 'chargers.json');
    if (fs.existsSync(chargerJsonPath)) {
      const chargerData = JSON.parse(fs.readFileSync(chargerJsonPath, 'utf8'));
      console.log('Loading initial chargers from charger.json...');
      
      for (const charger of chargerData) {
        // Check if charger already exists
        await new Promise((resolve) => {
          db.get("SELECT id_charger FROM chargers WHERE id_charger = ?", [charger.id_charger], (err, row) => {
            if (!row) {
              // Create new wallet for charger
              const newWallet = ethers.Wallet.createRandom();
              
              db.run(
                `INSERT INTO chargers (id_charger, owner_address, wallet_address, wallet_privateKey, status, transactions, income_generated, cost_generated, balance_total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  charger.id_charger,
                  charger.owner_address || "0x0000000000000000000000000000000000000000",
                  newWallet.address,
                  newWallet.privateKey,
                  charger.status || "inactive",
                  charger.transactions || 0,
                  charger.income_generated || 0,
                  charger.cost_generated || 0,
                  charger.balance_total || 0
                ],
                function (err) {
                  if (err) {
                    console.error(`Error creating charger ${charger.id_charger}:`, err.message);
                  } else {
                    console.log(`Charger ${charger.id_charger} loaded successfully`);
                    // Schedule transactions for this charger if active
                    if (charger.status === 'active') {
                      scheduleChargerTransactions(charger.id_charger);
                    }
                  }
                  resolve();
                }
              );
            } else {
              console.log(`Charger ${charger.id_charger} already exists, skipping...`);
              resolve();
            }
          });
        });
      }
    } else {
      console.log('No charger.json found, starting with empty database');
    }
  } catch (error) {
    console.error('Error loading initial chargers:', error.message);
  }
}

// =================== HELPERS ===================
let scheduledCharges = {};        // id_charger -> charges done today
let scheduledTimeouts = [];       // timeouts references to clear on daily reset

function clearScheduledTimeouts() {
  scheduledTimeouts.forEach(clearTimeout);
  scheduledTimeouts = [];
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function nowISO() {
  return new Date().toISOString();
}

function addLog({ charger_id, message, transactions, income_generated, cost_generated, balance_total }) {
  db.run(
    `INSERT INTO logs (charger_id, message, timestamp, transactions, income_generated, cost_generated, balance_total)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [charger_id, message, nowISO(), transactions, income_generated, cost_generated, balance_total]
  );
}

function initializeScheduledCharges() {
  db.all("SELECT id_charger FROM chargers", [], (err, rows) => {
    if (err) return console.error(err);
    scheduledCharges = rows.reduce((acc, row) => {
      acc[row.id_charger] = 0;
      return acc;
    }, {});
  });
}

function scheduleChargerTransactions(chargerId) {
  // Schedule transactions for a specific charger
  db.get("SELECT * FROM chargers WHERE id_charger = ? AND status = 'active'", [chargerId], (err, charger) => {
    if (err || !charger) return;

    const totalDailyCharges = Math.floor(Math.random() * 5); // 0..4 per day
    let scheduledTimes = [];

    for (let i = 0; i < totalDailyCharges; i++) {
      const hour = Math.floor(Math.random() * (SIMULATION_HOURS.end - SIMULATION_HOURS.start) + SIMULATION_HOURS.start);
      const minute = Math.floor(Math.random() * 60);
      scheduledTimes.push({ hour, minute });
    }

    scheduledTimes
      .sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute))
      .forEach(time => {
        const now = new Date();
        const scheduledTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          time.hour,
          time.minute,
          0, 0
        );
        const delay = scheduledTime.getTime() - now.getTime();
        if (delay > 0) {
          const t = setTimeout(async () => {
            // Fetch fresh charger row and only simulate if still active
            db.get("SELECT * FROM chargers WHERE id_charger = ?", [chargerId], async (e, fresh) => {
              if (e || !fresh) return;
              if (fresh.status === 'active') {
                await performSimulatedTransaction(fresh);
              }
            });
          }, delay);
          scheduledTimeouts.push(t);
        }
      });

    console.log(`Scheduled ${totalDailyCharges} transactions for charger ${chargerId}`);
  });
}

function scheduleDailyTransactions() {
  // Schedule transactions for all active chargers
  db.all("SELECT id_charger FROM chargers WHERE status = 'active'", [], (err, rows) => {
    if (err) return console.error(err);
    rows.forEach(row => {
      scheduleChargerTransactions(row.id_charger);
    });
  });
}

function resetDailySchedule() {
  console.log("[Scheduler] Daily reset: clearing timeouts, zeroing counters, and rescheduling.");
  clearScheduledTimeouts();
  initializeScheduledCharges();
  scheduleDailyTransactions();
}

// =================== CORE: Simulate a transaction ===================
async function performSimulatedTransaction(charger) {
  try {
    const id = charger.id_charger;

    // Rate limit per day
    if ((scheduledCharges[id] || 0) >= MAX_DAILY_CHARGES) {
      return; // silently skip
    }

    // Random deposit between MIN_TX_ETH and MAX_TX_ETH
    const amountEth = randomFloat(MIN_TX_ETH, MAX_TX_ETH);
    const amountWei = ethers.parseEther(amountEth.toFixed(6)); // 6 decimals precision

    let txHash = "simulated";
    if (SEND_ONCHAIN) {
      // Send real tx from master wallet to charger wallet
      const tx = await masterWallet.sendTransaction({
        to: charger.wallet_address,
        value: amountWei
      });
      const receipt = await tx.wait();
      txHash = receipt?.hash || tx.hash;
    }

    // Economics (same logic as your original code: cost = 40% of income)
    const income = Number(ethers.formatEther(amountWei)); // ETH
    const cost = income * 0.4;
    const delta = income - cost;

    // Update charger aggregates
    const newTransactions = (charger.transactions || 0) + 1;
    const newIncome = Number(charger.income_generated || 0) + income;
    const newCost = Number(charger.cost_generated || 0) + cost;
    const newBalance = Number(charger.balance_total || 0) + delta;

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE chargers 
         SET transactions = ?, income_generated = ?, cost_generated = ?, balance_total = ?
         WHERE id_charger = ?`,
        [newTransactions, newIncome, newCost, newBalance, id],
        (err) => err ? reject(err) : resolve()
      );
    });

    // Log entry (store txHash in message)
    addLog({
      charger_id: id,
      message: `completed deposit (${txHash})`,
      transactions: newTransactions,
      income_generated: newIncome,
      cost_generated: newCost,
      balance_total: newBalance
    });

    scheduledCharges[id] = (scheduledCharges[id] || 0) + 1;
    console.log(`Simulated charge for ${id} -> +${amountEth.toFixed(6)} ETH | tx: ${txHash}`);
  } catch (error) {
    console.error(`[performSimulatedTransaction] ${charger.id_charger} error:`, error.message);
  }
}

// =================== ENDPOINTS ===================

// Create charger
app.post('/api/chargers', async (req, res) => {
  const { id_charger, owner_address, status } = req.body;
  if (!id_charger || !owner_address) {
    return res.status(400).json({ error: "id_charger and owner_address are required" });
  }

  try {
    // Create new wallet for charger
    const newWallet = ethers.Wallet.createRandom();
    const chargerStatus = status || "inactive";

    db.run(
      `INSERT INTO chargers (id_charger, owner_address, wallet_address, wallet_privateKey, status, transactions, income_generated, cost_generated, balance_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_charger,
        owner_address,
        newWallet.address,
        newWallet.privateKey,
        chargerStatus,
        0,
        0,
        0,
        0
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Initialize in scheduledCharges
        scheduledCharges[id_charger] = 0;
        
        // Schedule transactions if charger is created as active
        if (chargerStatus === 'active') {
          scheduleChargerTransactions(id_charger);
          console.log(`Transaction schedule created for new active charger: ${id_charger}`);
        }
        
        res.status(201).json({
          message: "Charger created",
          id_charger,
          wallet: newWallet.address,
          status: chargerStatus
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Error creating charger", details: error.message });
  }
});

// Execute action on a charger
app.post('/api/chargers/:id/action', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  db.get("SELECT * FROM chargers WHERE id_charger = ?", [id], async (err, charger) => {
    if (err || !charger) return res.status(404).json({ error: "Charger not found" });

    try {
      let message = "";

      switch (action) {
        case "turn_off":
          db.run("UPDATE chargers SET status = ? WHERE id_charger = ?", ["inactive", id]);
          message = "Charger turned off";
          break;

        case "turn_on":
          db.run("UPDATE chargers SET status = ? WHERE id_charger = ?", ["active", id], (err) => {
            if (!err) {
              // Schedule transactions for newly activated charger
              scheduleChargerTransactions(id);
              console.log(`Charger ${id} activated and transactions scheduled`);
            }
          });
          message = "Charger turned on";
          break;

        case "restart":
          db.run("UPDATE chargers SET status = ? WHERE id_charger = ?", ["inactive", id], (e) => {
            if (!e) {
              setTimeout(() => {
                db.run("UPDATE chargers SET status = ? WHERE id_charger = ?", ["active", id], (err) => {
                  if (!err) {
                    // Schedule transactions for restarted charger
                    scheduleChargerTransactions(id);
                    console.log(`Charger ${id} restarted and transactions scheduled`);
                  }
                });
              }, 3000);
            }
          });
          message = "Charger restarted";
          break;

        case "create_ticket":
          // Simulated POST to external support service
          message = "Support ticket created (simulated)";
          break;

        case "pay_costs": {
          const chargerWallet = new ethers.Wallet(charger.wallet_privateKey, provider);
          const balance = await provider.getBalance(chargerWallet.address);
          const toPay = (balance * 40n) / 100n; // 40%

          if (!SEND_ONCHAIN) {
            message = `Simulated costs payment: ${ethers.formatEther(toPay)} ETH`;
            break;
          }

          if (toPay > 0n) {
            const tx = await chargerWallet.sendTransaction({
              to: "0x57e56B49dcF7540a991ac6B4C9597eBa892A7168",
              value: toPay
            });
            await tx.wait();
            message = `Paid costs: ${ethers.formatEther(toPay)} ETH`;
          } else {
            message = "Not enough balance to pay costs";
          }
          break;
        }

        case "send_to_owner": {
          const chargerWallet = new ethers.Wallet(charger.wallet_privateKey, provider);
          const balance = await provider.getBalance(chargerWallet.address);
          const gasBuffer = ethers.parseEther("0.001"); // keep a small buffer

          if (!SEND_ONCHAIN) {
            message = `Simulated transfer to owner: ${ethers.formatEther(balance)} ETH`;
            break;
          }

          if (balance > gasBuffer) {
            const value = balance - gasBuffer;
            const tx = await chargerWallet.sendTransaction({
              to: charger.owner_address,
              value
            });
            await tx.wait();
            message = `Sent ${ethers.formatEther(value)} ETH to owner`;
          } else {
            message = "Not enough balance";
          }
          break;
        }

        default:
          return res.status(400).json({ error: "Invalid action" });
      }

      // Log the action (no economic changes here)
      addLog({
        charger_id: id,
        message,
        transactions: charger.transactions,
        income_generated: charger.income_generated,
        cost_generated: charger.cost_generated,
        balance_total: charger.balance_total
      });

      return res.json({ message });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
});

// Manually trigger a simulated transaction (optionally specify amount)
app.post('/api/chargers/:id/simulate_transaction', async (req, res) => {
  const { id } = req.params;
  const { amount_eth } = req.body || {};

  db.get("SELECT * FROM chargers WHERE id_charger = ?", [id], async (err, charger) => {
    if (err || !charger) return res.status(404).json({ error: "Charger not found" });
    
    // If a specific amount is provided, override MIN/MAX bounds
    if (amount_eth && typeof amount_eth === 'number' && amount_eth > 0) {
      try {
        const amountWei = ethers.parseEther(amount_eth.toFixed(6));
        let txHash = "simulated";
        if (SEND_ONCHAIN) {
          const tx = await masterWallet.sendTransaction({
            to: charger.wallet_address,
            value: amountWei
          });
          const receipt = await tx.wait();
          txHash = receipt?.hash || tx.hash;
        }

        const income = Number(ethers.formatEther(amountWei));
        const cost = income * 0.4;
        const delta = income - cost;

        const newTransactions = (charger.transactions || 0) + 1;
        const newIncome = Number(charger.income_generated || 0) + income;
        const newCost = Number(charger.cost_generated || 0) + cost;
        const newBalance = Number(charger.balance_total || 0) + delta;

        db.run(
          `UPDATE chargers 
           SET transactions = ?, income_generated = ?, cost_generated = ?, balance_total = ?
           WHERE id_charger = ?`,
          [newTransactions, newIncome, newCost, newBalance, id]
        );

        addLog({
          charger_id: id,
          message: `manual simulated deposit (${txHash})`,
          transactions: newTransactions,
          income_generated: newIncome,
          cost_generated: newCost,
          balance_total: newBalance
        });

        return res.json({ message: `Simulated ${amount_eth} ETH deposit`, txHash });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    } else {
      // Use the regular randomized simulator
      await performSimulatedTransaction(charger);
      return res.json({ message: "Simulated transaction executed" });
    }
  });
});



// Get detailed chargers info (without private keys) + transaction schedules
app.get('/api/chargers/detailed', async (req, res) => {
  try {
    // Get all chargers from database (excluding private keys)
    const chargers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id_charger, 
          owner_address, 
          wallet_address, 
          status, 
          transactions, 
          income_generated, 
          cost_generated, 
          balance_total 
        FROM chargers
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Enhance each charger with schedule information
    const detailedChargers = await Promise.all(chargers.map(async (charger) => {
      // Get schedule info
      const scheduledToday = scheduledCharges[charger.id_charger] || 0;
      const remainingCharges = Math.max(0, MAX_DAILY_CHARGES - scheduledToday);
      
      // Get recent logs for this charger
      const recentLogs = await new Promise((resolve, reject) => {
        db.all(
          "SELECT message, timestamp FROM logs WHERE charger_id = ? ORDER BY id DESC LIMIT 5",
          [charger.id_charger],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });

      // Get next scheduled transaction time (if any)
      const nextScheduledTime = getNextScheduledTransaction(charger.id_charger);
      
      // Get blockchain balance (if wallet exists)
      let blockchainBalance = "0";
      try {
        if (charger.wallet_address) {
          const balance = await provider.getBalance(charger.wallet_address);
          blockchainBalance = ethers.formatEther(balance);
        }
      } catch (error) {
        console.warn(`Could not fetch balance for ${charger.id_charger}:`, error.message);
      }

      return {
        ...charger,
        schedule_info: {
          charges_today: scheduledToday,
          remaining_charges: remainingCharges,
          max_daily_charges: MAX_DAILY_CHARGES,
          next_scheduled: nextScheduledTime,
          simulation_window: SIMULATION_HOURS
        },
        blockchain_info: {
          wallet_balance_eth: blockchainBalance,
          send_onchain_enabled: SEND_ONCHAIN
        },
        recent_activity: recentLogs,
        last_updated: new Date().toISOString()
      };
    }));

    // Summary statistics
    const summary = {
      total_chargers: detailedChargers.length,
      active_chargers: detailedChargers.filter(c => c.status === 'active').length,
      inactive_chargers: detailedChargers.filter(c => c.status === 'inactive').length,
      total_transactions: detailedChargers.reduce((sum, c) => sum + (c.transactions || 0), 0),
      total_income: detailedChargers.reduce((sum, c) => sum + (c.income_generated || 0), 0),
      total_costs: detailedChargers.reduce((sum, c) => sum + (c.cost_generated || 0), 0),
      total_balance: detailedChargers.reduce((sum, c) => sum + (c.balance_total || 0), 0),
      charges_scheduled_today: Object.values(scheduledCharges).reduce((sum, count) => sum + count, 0)
    };

    res.json({
      summary,
      chargers: detailedChargers,
      system_info: {
        simulation_mode: !SEND_ONCHAIN,
        min_tx_eth: MIN_TX_ETH,
        max_tx_eth: MAX_TX_ETH,
        simulation_hours: SIMULATION_HOURS,
        server_time: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get next scheduled transaction time for a charger
function getNextScheduledTransaction(chargerId) {
  // This is a simplified version - in a more advanced implementation
  // you'd track the actual scheduled times
  
  db.get("SELECT status FROM chargers WHERE id_charger = ?", [chargerId], (err, row) => {
    if (err || !row || row.status !== 'active') return null;
  });

  const now = new Date();
  const currentHour = now.getHours();
  
  // If we're within simulation hours and charger is active
  if (currentHour >= SIMULATION_HOURS.start && currentHour < SIMULATION_HOURS.end) {
    // Estimate next transaction (this is approximate)
    const remainingHours = SIMULATION_HOURS.end - currentHour;
    const chargesLeft = Math.max(0, MAX_DAILY_CHARGES - (scheduledCharges[chargerId] || 0));
    
    if (chargesLeft > 0 && remainingHours > 0) {
      // Rough estimate: spread remaining charges across remaining hours
      const avgInterval = (remainingHours * 60) / chargesLeft; // minutes
      const nextTime = new Date(now.getTime() + (avgInterval * 60 * 1000));
      return nextTime.toISOString();
    }
  }
  
  // Next day at start of simulation window
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(SIMULATION_HOURS.start, 0, 0, 0);
  return tomorrow.toISOString();
}

// Get logs with blockchain transactions
app.get('/api/logs', async (req, res) => {
  const { include_blockchain = 'false', charger_id } = req.query;
  
  try {
    // Get logs from database
    let dbQuery = "SELECT * FROM logs";
    let queryParams = [];
    
    if (charger_id) {
      dbQuery += " WHERE charger_id = ?";
      queryParams.push(charger_id);
    }
    
    dbQuery += " ORDER BY id DESC LIMIT 500";
    
    const dbLogs = await new Promise((resolve, reject) => {
      db.all(dbQuery, queryParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    let response = {
      database_logs: dbLogs,
      blockchain_transactions: []
    };

    // If blockchain data is requested
    if (include_blockchain === 'true') {
      console.log('Fetching blockchain transactions...');
      
      // Get all chargers or specific charger
      let chargersQuery = "SELECT id_charger, wallet_address FROM chargers";
      let chargersParams = [];
      
      if (charger_id) {
        chargersQuery += " WHERE id_charger = ?";
        chargersParams.push(charger_id);
      }

      const chargers = await new Promise((resolve, reject) => {
        db.all(chargersQuery, chargersParams, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      // Fetch blockchain transactions for each charger
      const blockchainTransactions = [];
      
      for (const charger of chargers) {
        try {
          // Get transaction history for this wallet
          const history = await getWalletTransactionHistory(charger.wallet_address);
          
          history.forEach(tx => {
            blockchainTransactions.push({
              charger_id: charger.id_charger,
              wallet_address: charger.wallet_address,
              tx_hash: tx.hash,
              block_number: tx.blockNumber,
              timestamp: new Date(tx.timestamp * 1000).toISOString(),
              from: tx.from,
              to: tx.to,
              value_eth: ethers.formatEther(tx.value),
              gas_used: tx.gasUsed ? tx.gasUsed.toString() : null,
              status: tx.status === 1 ? 'success' : 'failed',
              type: tx.to.toLowerCase() === charger.wallet_address.toLowerCase() ? 'incoming' : 'outgoing'
            });
          });
        } catch (error) {
          console.error(`Error fetching transactions for ${charger.id_charger}:`, error.message);
        }
      }

      // Sort blockchain transactions by timestamp (newest first)
      blockchainTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      response.blockchain_transactions = blockchainTransactions;
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get transaction history for a wallet
async function getWalletTransactionHistory(walletAddress, limit = 100) {
  try {
    // Get latest block number
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 10000); // Last ~10k blocks (adjust as needed)
    
    const transactions = [];
    
    // Get incoming transactions
    const incomingFilter = {
      address: null,
      topics: null,
      fromBlock: fromBlock,
      toBlock: 'latest'
    };
    
    // For Base/Ethereum, we need to scan blocks or use external APIs
    // This is a simplified version - in production you'd use APIs like Alchemy/Infura
    try {
      // Get recent blocks and scan for transactions
      const recentBlocks = 50; // Scan last 50 blocks for demo
      const startBlock = Math.max(0, latestBlock - recentBlocks);
      
      for (let blockNum = startBlock; blockNum <= latestBlock; blockNum++) {
        try {
          const block = await provider.getBlock(blockNum, true);
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              // Check if transaction involves our wallet
              if (tx.to && tx.to.toLowerCase() === walletAddress.toLowerCase() || 
                  tx.from && tx.from.toLowerCase() === walletAddress.toLowerCase()) {
                
                // Get transaction receipt for status and gas info
                const receipt = await provider.getTransactionReceipt(tx.hash);
                
                transactions.push({
                  hash: tx.hash,
                  blockNumber: blockNum,
                  timestamp: block.timestamp,
                  from: tx.from,
                  to: tx.to,
                  value: tx.value,
                  gasUsed: receipt ? receipt.gasUsed : null,
                  status: receipt ? receipt.status : null
                });
              }
            }
          }
        } catch (blockError) {
          // Skip blocks that might not exist or have issues
          continue;
        }
      }
    } catch (scanError) {
      console.warn('Block scanning failed, using alternative method:', scanError.message);
    }
    
    // Limit results
    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Error fetching wallet history:', error.message);
    return [];
  }
}

// =================== AUTOMATED TASKS ===================
// Every 1 hour: randomly toggle status
setInterval(() => {
  db.all("SELECT id_charger FROM chargers", [], (err, rows) => {
    if (err) return console.error(err);
    rows.forEach(row => {
      const newStatus = Math.random() > 0.5 ? "active" : "inactive";
      db.run("UPDATE chargers SET status = ? WHERE id_charger = ?", [newStatus, row.id_charger], (err) => {
        if (!err) {
          console.log(`Charger ${row.id_charger} status changed to ${newStatus}`);
          // If charger becomes active, schedule new transactions
          if (newStatus === 'active') {
            scheduleChargerTransactions(row.id_charger);
          }
        }
      });
    });
  });
}, 60 * 60 * 1000);

// Daily: reset counters and re-schedule transactions
setInterval(resetDailySchedule, 24 * 60 * 60 * 1000);

app.get('/', (req, res) => {
  res.send('API Aleph Dobi is running!');
});
// =================== RUN ===================
app.listen(port, "0.0.0.0", async () => {
  console.log(`Server running on port ${port}`);
  console.log(`Blockchain mode: ${SEND_ONCHAIN ? 'REAL TRANSACTIONS' : 'SIMULATION ONLY'}`);
  
  initializeScheduledCharges();
  await loadInitialChargers();
  scheduleDailyTransactions();
});
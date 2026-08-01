const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_trades,
        COALESCE(SUM(pnl), 0) as net_pnl,
        COALESCE(AVG(CASE WHEN pnl > 0 THEN 1.0 ELSE 0.0 END) * 100, 0) as win_rate
      FROM trades
    `);
    const row = result.rows[0];
    res.json({
      net_pnl: parseFloat(row.net_pnl).toFixed(2),
      win_rate: parseFloat(row.win_rate).toFixed(1),
      total_trades: parseInt(row.total_trades),
      emotional_stability: 88,
      exit_discipline: "85%"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/trades', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trades ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trades', async (req, res) => {
  const { symbol, pnl, emotion, exit_discipline, playbook_strategy } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO trades (symbol, pnl, emotion, exit_discipline, playbook_strategy) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [symbol, pnl, emotion, exit_discipline, playbook_strategy]
    );
    res.json({ message: "Trade saved!", trade: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
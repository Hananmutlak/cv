require('dotenv').config();

// Importera nödvändiga paket
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

// Skapa en Express-applikation
const app = express();

// Middleware för att hantera CORS
app.use(cors());

// Middleware för att hantera JSON-förfrågningar
app.use(express.json());

// Skapa en databasanslutning med hjälp av Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

//----------------------- API-endpoints -----------------------

// GET - Hämta all arbetslivserfarenhet
app.get('/api/work', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM workexperience');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Lägg till ny arbetslivserfarenhet
app.post('/api/work', async (req, res) => {
  const { companyname, jobtitle, location, startdate } = req.body;
  
  // Kontrollera obligatoriska fält
  if (!companyname || !jobtitle || !location || !startdate) {
    return res.status(400).json({ error: 'Följande fält krävs: companyname, jobtitle, location, startdate' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO workexperience SET ?',
      { 
        companyname,
        jobtitle,
        location,
        startdate,
        enddate: req.body.enddate || null,
        description: req.body.description || null
      }
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Uppdatera befintlig arbetslivserfarenhet
app.put('/api/work/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Kontrollera om posten finns
    const [check] = await pool.query('SELECT * FROM workexperience WHERE id = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ error: 'Posten finns inte' });
    }

    // Uppdatera posten
    const [result] = await pool.query(
      'UPDATE workexperience SET ? WHERE id = ?',
      [updates, id]
    );
    
    res.json({ message: 'Uppdatering lyckades' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Ta bort arbetslivserfarenhet
app.delete('/api/work/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM workexperience WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Posten finns inte' });
    }
    
    res.json({ message: 'Borttagning lyckades' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servern körs på port ${port}`);
  console.log(`Testlänk: http://localhost:${port}/api/work`);
});

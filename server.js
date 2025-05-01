require('dotenv').config();

// Importera nödvändiga paket
const express = require('express');
const { Pool } = require('pg'); 
const cors = require('cors');

// Skapa en Express-applikation
const app = express();

// Middleware för att hantera CORS
app.use(cors());

// Middleware för att hantera JSON-förfrågningar
app.use(express.json());

// Skapa en databasanslutning med PostgreSQL Pool
const pool = new Pool({
  user: process.env.DB_USERNAME, 
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});



// GET - Hämta all arbetslivserfarenhet
app.get('/api/work', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM workexperience');
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
    const { rows } = await pool.query(
      `INSERT INTO workexperience 
      (companyname, jobtitle, location, startdate, enddate, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        companyname,
        jobtitle,
        location,
        startdate,
        req.body.enddate || null,
        req.body.description || null
      ]
    );
    res.status(201).json({ id: rows[0].id, ...req.body });
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
    const check = await pool.query('SELECT * FROM workexperience WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Posten finns inte' });
    }


    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');

    const values = Object.values(updates);
    values.push(id);

    const query = {
      text: `UPDATE workexperience SET ${setClause} WHERE id = $${values.length}`,
      values: values
    };

    await pool.query(query);
    res.json({ message: 'Uppdatering lyckades' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Ta bort arbetslivserfarenhet
app.delete('/api/work/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM workexperience WHERE id = $1',
      [id]
    );
    
    if (result.rowCount === 0) {
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
// Test database connection on startup
pool.connect((err, client, release) => {
    if (err) {
      console.error(' Database connection failed:', err);
    } else {
      console.log('Database connected successfully!');
      client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
          console.error(' Database query failed:', err);
        } else {
          console.log(' Current database time:', result.rows[0].now);
        }
      });
    }
  });
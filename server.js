require('dotenv').config();

// Importera nödvändiga paket
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// Initiera Express-applikationen
const app = express();

// Middleware för att hantera CORS och JSON
app.use(cors());
app.use(express.json());

// Inställningar för databasanslutning
const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Nödvändigt för Render-säkra anslutningar
  }
});

// Testa databasanslutning vid start
const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Lyckades ansluta till databasen');
    
    // Skapa tabell om den inte redan finns
    await client.query(`
      CREATE TABLE IF NOT EXISTS workexperience (
        id SERIAL PRIMARY KEY,
        companyname VARCHAR(255) NOT NULL,
        jobtitle VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        startdate DATE NOT NULL,
        enddate DATE,
        description TEXT
      );
    `);
    console.log(' Tabellkontroll utförd');
    
    client.release();
  } catch (error) {
    console.error(' Misslyckades med att ansluta till databasen:', error.message);
    process.exit(1); // Stäng applikationen vid misslyckad anslutning
  }
};

// Huvudväg för att testa om servern fungerar
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Hej! Servern fungerar korrekt ',
    endpoints: {
      getData: 'GET /api/work',
      addData: 'POST /api/work',
      updateData: 'PUT /api/work/:id',
      deleteData: 'DELETE /api/work/:id'
    }
  });
});



// GET - Hämta alla arbetslivserfarenheter
app.get('/api/work', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM workexperience ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    handleServerError(res, error);
  }
});

// POST - Lägg till en ny arbetslivserfarenhet
app.post('/api/work', async (req, res) => {
  const requiredFields = ['companyname', 'jobtitle', 'location', 'startdate'];
  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Obligatoriska fält: ${missingFields.join(', ')}`
    });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO workexperience 
      (companyname, jobtitle, location, startdate, enddate, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        req.body.companyname,
        req.body.jobtitle,
        req.body.location,
        req.body.startdate,
        req.body.enddate || null,
        req.body.description || null
      ]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    handleServerError(res, error);
  }
});

// PUT - Uppdatera arbetslivserfarenhet
app.put('/api/work/:id', async (req, res) => {
  try {
    const check = await pool.query('SELECT * FROM workexperience WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Posten finns inte' });
    }

    const updates = Object.entries(req.body)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => `${key} = '${value}'`)
      .join(', ');

    const query = `UPDATE workexperience SET ${updates} WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(query, [req.params.id]);
    
    res.json(rows[0]);
  } catch (error) {
    handleServerError(res, error);
  }
});

// DELETE - Ta bort arbetslivserfarenhet
app.delete('/api/work/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM workexperience WHERE id = $1', [req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Posten finns inte' });
    }
    
    res.json({ message: 'Posten raderad framgångsrikt' });
  } catch (error) {
    handleServerError(res, error);
  }
});

// Hantera serverfel
const handleServerError = (res, error) => {
  console.error(' Fel:', error.message);
  res.status(500).json({
    error: 'Ett fel inträffade på servern',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// Starta servern
const startServer = async () => {
  await initializeDatabase();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`\n Servern körs på port ${port}`);
    console.log(`Lokal länk: http://localhost:${port}`);

  });
};

startServer();

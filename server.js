const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Conexión automática a tu base de datos de Railway usando la variable de entorno
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Ruta de prueba para saber si la API está viva
app.get('/', (req, res) => {
  res.send('¡La API de Mi Lugar Seguro está funcionando correctamente! 💜');
});

// 1. ENDPOINT PARA CREAR/REGISTRAR LA PAREJA
app.post('/api/pareja/crear', async (req, res) => {
  const { codigo_vinculacion, nombre_persona1 } = req.body;
  try {
    const query = `
      INSERT INTO parejas (codigo_vinculacion, nombre_persona1, fecha_inicio) 
      VALUES ($1, $2, NOW()) 
      RETURNING *;
    `;
    const values = [codigo_vinculacion, nombre_persona1];
    const nuevo = await pool.query(query, values);
    res.status(201).json({ success: true, data: nuevo.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. ENDPOINT PARA VINCULAR A LA SEGUNDA PERSONA
app.post('/api/pareja/vincular', async (req, res) => {
  const { codigo_vinculacion, nombre_persona2 } = req.body;
  try {
    const queryUpdate = `
      UPDATE parejas 
      SET nombre_persona2 = $1 
      WHERE codigo_vinculacion = $2 
      RETURNING *;
    `;
    const actualizado = await pool.query(queryUpdate, [nombre_persona2, codigo_vinculacion]);
    
    if (actualizado.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Código no encontrado' });
    }

    res.status(200).json({ success: true, data: actualizado.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
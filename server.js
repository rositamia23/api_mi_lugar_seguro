const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Conexión automática a tu base de datos MySQL en Railway
const pool = mysql.createPool(process.env.DATABASE_URL);

// Ruta de prueba para saber si la API está viva
app.get('/', (req, res) => {
  res.send('¡La API de Mi Lugar Seguro está funcionando correctamente! 💜');
});

// 1. ENDPOINT PARA CREAR/REGISTRAR LA PAREJA
app.post('/api/pareja/crear', async (req, res) => {
  const { codigo_vinculacion, nombre_persona1 } = req.body;
  try {
    // MySQL usa '?' en lugar de '$1, $2'
    const query = `
      INSERT INTO parejas (codigo_vinculacion, nombre_persona1, fecha_inicio) 
      VALUES (?, ?, NOW());
    `;
    const values = [codigo_vinculacion, nombre_persona1];
    await pool.query(query, values);
    
    // MySQL no usa "RETURNING *", así que buscamos la fila recién creada
    const [nuevo] = await pool.query('SELECT * FROM parejas WHERE codigo_vinculacion = ?', [codigo_vinculacion]);
    
    res.status(201).json({ success: true, data: nuevo[0] });
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
      SET nombre_persona2 = ? 
      WHERE codigo_vinculacion = ?;
    `;
    const [actualizado] = await pool.query(queryUpdate, [nombre_persona2, codigo_vinculacion]);
    
    if (actualizado.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Código no encontrado' });
    }

    // Buscamos los datos de la pareja ya actualizada
    const [parejaActualizada] = await pool.query('SELECT * FROM parejas WHERE codigo_vinculacion = ?', [codigo_vinculacion]);

    res.status(200).json({ success: true, data: parejaActualizada[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: false
});

pool.connect()
    .then(() => console.log('✅ Conexión a la base de datos exitosa'))
    .catch(err => console.error('❌ Error conectando a la base:', err));

module.exports = pool;

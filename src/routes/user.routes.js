const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');

// Obtener todos los usuarios con rol 'customer'
router.get('/customers', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email FROM users WHERE role = 'customer'"
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener clientes:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');
// ✅ Listar todos los productos
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, description, price FROM products');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
});

// ✅ Crear un producto (solo admin)
router.post('/', authMiddleware, async (req, res) => {
    const { name, description, price } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden crear productos' });
    }

    try {
        await pool.query(
            'INSERT INTO products (name, description, price, created_at) VALUES ($1, $2, $3, NOW())',
            [name, description, price]
        );
        res.status(201).json({ message: 'Producto creado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el producto' });
    }
});

module.exports = router;

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

// DELETE /api/users/:id (solo admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden eliminar usuarios' });
    }

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error interno al eliminar usuario' });
    }
});


module.exports = router;

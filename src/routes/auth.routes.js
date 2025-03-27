const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middlewares/authMiddleware');



// ✅ LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            'mi_clave_secreta',
            { expiresIn: '1h' }
        );

        res.json({ token, user: { role: user.role, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// ✅ RUTA PROTEGIDA
router.get('/profile', authMiddleware, (req, res) => {
    res.json({
        message: 'Perfil accedido correctamente',
        user: req.user
    });
});

// ✅ REGISTRO
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Hasheamos la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Guardamos en la base
        await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
            [name, email, hashedPassword, 'customer']
        );

        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// ✅ OBTENER USUARIOS CON ROL CUSTOMER
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

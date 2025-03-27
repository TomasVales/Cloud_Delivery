const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');

// Crear un pedido
router.post('/', authMiddleware, async (req, res) => {
    const { items, payment_method } = req.body; // recibimos método de pago
    const userId = req.user.id;

    try {
        await pool.query('BEGIN');

        const orderResult = await pool.query(
            'INSERT INTO orders (user_id, status, payment_method) VALUES ($1, $2, $3) RETURNING *',
            [userId, 'pending', payment_method]
        );
        const orderId = orderResult.rows[0].id;

        let total = 0;
        for (const item of items) {
            const product = await pool.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
            const price = product.rows[0].price * item.quantity;
            total += price;

            await pool.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.product_id, item.quantity, price]
            );
        }

        await pool.query('UPDATE orders SET total_price = $1 WHERE id = $2', [total, orderId]);

        await pool.query('COMMIT');
        res.status(201).json({ message: 'Pedido creado', orderId });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Error al crear el pedido' });
    }
});

// Obtener un pedido por ID
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Traemos el pedido
        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const order = orderResult.rows[0];

        // Traemos los items de ese pedido
        const itemsResult = await pool.query(
            `SELECT oi.product_id, p.name, oi.quantity, oi.price
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = $1`,
            [id]
        );

        order.items = itemsResult.rows;

        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener el pedido' });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        // Traemos todos los pedidos del usuario
        const ordersResult = await pool.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
        const orders = ordersResult.rows;

        // Recorremos cada pedido para traerle los items
        for (const order of orders) {
            const itemsResult = await pool.query(
                `SELECT oi.product_id, p.name, oi.quantity, oi.price
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = $1`,
                [order.id]
            );
            order.items = itemsResult.rows;
        }

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener los pedidos' });
    }
});

// Obtener todos los pedidos del usuario logueado
router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        // Traemos todos los pedidos del usuario
        const ordersResult = await pool.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
        const orders = ordersResult.rows;

        // Recorremos cada pedido para traerle los items
        for (const order of orders) {
            const itemsResult = await pool.query(
                `SELECT oi.product_id, p.name, oi.quantity, oi.price
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = $1`,
                [order.id]
            );
            order.items = itemsResult.rows;
        }

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener los pedidos' });
    }
});

// Cambiar el estado de un pedido
router.patch('/:id/status', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'delivered'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
    }

    try {
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({ message: 'Estado actualizado', pedido: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar el estado' });
    }
});

router.get('/admin/all', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: solo admin' });
    }

    try {
        // Traer todos los pedidos de todos los usuarios
        const ordersResult = await pool.query(`
            SELECT o.*, u.name AS user_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
        `);
        const orders = ordersResult.rows;

        // Agregar los items a cada pedido
        for (const order of orders) {
            const itemsResult = await pool.query(
                `SELECT oi.product_id, p.name, oi.quantity, oi.price
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = $1`,
                [order.id]
            );
            order.items = itemsResult.rows;
        }

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener todos los pedidos' });
    }
});

router.get('/my-orders', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT o.id, o.status, o.created_at, u.name AS user_name,
                oi.product_id, oi.name, oi.quantity, oi.price
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1
            ORDER BY o.created_at DESC
        `, [req.user.id]);

        // Agrupamos por pedido
        const orders = {};
        result.rows.forEach(row => {
            if (!orders[row.id]) {
                orders[row.id] = {
                    id: row.id,
                    status: row.status,
                    created_at: row.created_at,
                    user_name: row.user_name,
                    items: []
                };
            }
            orders[row.id].items.push({
                product_id: row.product_id,
                name: row.name,
                quantity: row.quantity,
                price: row.price
            });
        });

        res.json(Object.values(orders));
    } catch (err) {
        console.error('Error al obtener pedidos del usuario:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});



module.exports = router;

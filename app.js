const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors()); // Permite peticiones desde otros orígenes (como React)
app.use(express.json()); // Permite leer JSON en las peticiones

// Rutas
const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');
const orderRoutes = require('./src/routes/order.routes');
const userRoutes = require('./src/routes/user.routes');

// Usar rutas con prefijo
app.use('/api/auth', authRoutes);          // Login, registro, etc.
app.use('/api/products', productRoutes);   // Productos
app.use('/api/orders', orderRoutes);       // Pedidos
app.use('/api/users', userRoutes);

// Ruta base
app.get('/', (req, res) => {
    res.send('🌩️ CloudDelivery API está corriendo...');
});

module.exports = app;

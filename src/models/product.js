const pool = require('../config/database');

// Obtener todos los productos
const getAllProducts = () => {
    return pool.query('SELECT * FROM products');
};

// Crear un producto
const createProduct = (name, description, price) => {
    return pool.query(
        'INSERT INTO products (name, description, price) VALUES ($1, $2, $3) RETURNING *',
        [name, description, price]
    );
};

module.exports = {
    getAllProducts,
    createProduct
};

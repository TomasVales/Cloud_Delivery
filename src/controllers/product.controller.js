// 📦 Importamos el modelo de Product
const Product = require('../models/product');

// ✅ Obtener todos los productos
exports.getAll = async (req, res) => {
    try {
        const result = await Product.getAllProducts();
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener productos:', err);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
};

// ✅ Crear un nuevo producto
exports.create = async (req, res) => {
    const { name, description, price } = req.body;

    // Validación básica
    if (!name || !description || !price) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        const result = await Product.createProduct(name, description, price);
        res.status(201).json({
            message: '✅ Producto creado con éxito',
            product: result.rows[0]
        });
    } catch (err) {
        console.error('❌ Error al crear producto:', err);
        res.status(500).json({ error: 'Error al crear producto' });
    }
};

// ✅ (Opcional) Eliminar un producto por ID
exports.delete = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Product.deleteProduct(id);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.status(200).json({ message: '✅ Producto eliminado con éxito' });
    } catch (err) {
        console.error('❌ Error al eliminar producto:', err);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
};

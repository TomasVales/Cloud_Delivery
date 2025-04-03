const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/products/';
        const fs = require('fs'); // 🔴 Esto falta en la parte superior del archivo

        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});



const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Error: Solo se permiten imágenes (JPEG, JPG, PNG, WEBP)'));
};


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Middleware para parsear FormData
router.use(express.json());
router.use(express.urlencoded({ extended: true }));


// ✅ Listar todos los productos
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, description, price, image_url, category 
            FROM products
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
});

// ✅ Obtener un producto por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, name, description, price, image_url, category FROM products WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
});

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    // Verificar autenticación y rol
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Solo los administradores pueden crear productos'
        });
    }

    // Extraer datos del formulario
    const { name, description, price, category } = req.body;

    // Validar campos obligatorios
    if (!name || !description || !price || !category) {
        return res.status(400).json({
            success: false,
            error: 'Todos los campos son obligatorios'
        });
    }

    try {
        // Procesar imagen
        const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;

        // Insertar en la base de datos
        const result = await pool.query(
            `INSERT INTO products 
             (name, description, price, category, image_url) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, name, description, price, category, image_url`,
            [name, description, parseFloat(price), category, imageUrl]
        );

        // Respuesta exitosa
        res.status(201).json({
            success: true,
            product: result.rows[0]
        });

    } catch (error) {
        console.error('Error al crear producto:', error);

        // Eliminar imagen si hubo error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: 'Error al crear el producto',
            details: error.message
        });
    }
});


// ✅ Actualizar un producto (solo admin)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden actualizar productos' });
    }

    try {
        // Primero obtener el producto actual para manejar la imagen anterior
        const currentProduct = await pool.query(
            'SELECT image_url FROM products WHERE id = $1',
            [id]
        );

        if (currentProduct.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Determinar la nueva URL de la imagen
        let imageUrl = currentProduct.rows[0].image_url;
        if (req.file) {
            imageUrl = `/uploads/products/${req.file.filename}`;

            // Eliminar la imagen anterior si existe
            if (currentProduct.rows[0].image_url) {
                const fs = require('fs');
                const oldImagePath = path.join(__dirname, '../..', currentProduct.rows[0].image_url);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        const result = await pool.query(
            `UPDATE products 
             SET name = $1, description = $2, price = $3, category = $4, image_url = $5, updated_at = NOW()
             WHERE id = $6
             RETURNING id, name, description, price, category, image_url`,
            [name, description, price, category, imageUrl, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        // Eliminar la nueva imagen subida si hubo un error
        if (req.file) {
            const fs = require('fs');
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

// ✅ Eliminar un producto (solo admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden eliminar productos' });
    }

    try {
        // Primero obtener el producto para eliminar su imagen
        const currentProduct = await pool.query(
            'SELECT image_url FROM products WHERE id = $1',
            [id]
        );

        if (currentProduct.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Eliminar la imagen si existe
        if (currentProduct.rows[0].image_url) {
            const fs = require('fs');
            const imagePath = path.join(__dirname, '../..', currentProduct.rows[0].image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Eliminar el producto de la base de datos
        await pool.query('DELETE FROM products WHERE id = $1', [id]);

        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

module.exports = router;
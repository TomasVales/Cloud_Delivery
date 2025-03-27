const pool = require('../config/database');

const createUser = async (name, email, passwordHash, role = 'customer') => {
    const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, passwordHash, role]
    );
    return result.rows[0];
};

module.exports = { createUser };

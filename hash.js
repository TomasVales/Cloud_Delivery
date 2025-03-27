const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'tomi123';  // 🔐 Cambia acá si querés otra pass
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash generado:', hash);
}

generateHash();

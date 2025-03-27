const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 3001;

console.log('💻 El archivo server.js se está ejecutando');

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

# CloudDelivery ✨

Aplicación web fullstack para realizar pedidos de comida, con panel de administración, login/register, carrito, historial de pedidos y selector de método de pago.

---

## 📁 Estructura del proyecto

```
CloudDelivery/
├── src/
│   ├── components/          # Componentes de React (frontend)
│   ├── context/             # Context API para autenticación
│   ├── middlewares/         # Middlewares como authMiddleware.js
│   ├── models/              # Modelos de base de datos (opcional)
│   ├── routes/              # Rutas Express (auth, users, orders, etc.)
│   ├── config/              # Configuración de base de datos
├── .env.example               # Archivo de ejemplo para variables de entorno
├── package.json
├── README.md
```

---

## ⚖️ Requisitos previos

- Node.js (v18+)
- PostgreSQL corriendo localmente

---

## 🌐 Configuración del entorno

Crea un archivo `.env` en la raíz del proyecto y completalo así:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_clave
DB_NAME=clouddelivery
JWT_SECRET=mi_clave_secreta
```

---

## ⚡ Instalación y ejecución

1. Cloná o descargá este repositorio

```bash
cd CloudDelivery
npm install
```

2. Corré el proyecto

```bash
npm run dev
```

Esto inicia tanto el backend (Express) como el frontend (React) si está todo junto con Vite, o solo el backend si estás usando otro setup.

---

## 🔢 Base de datos

1. Creá la base de datos en PostgreSQL:
```sql
CREATE DATABASE clouddelivery;
```

2. Importá las tablas necesarias (`users`, `products`, `orders`, `order_items`, etc.)
   > (Podés usar un archivo .sql exportado o crearla manualmente)

---

## 🚀 Características principales

### Cliente (usuario)
- Registro e inicio de sesión
- Ver productos y agregarlos al carrito
- Confirmar pedidos con método de pago (efectivo, tarjeta, QR)
- Ver historial de pedidos

### Admin
- Ver todos los pedidos de todos los usuarios
- Cambiar estado de pedidos (pending, preparing, delivered)
- Ver nombres de clientes y productos
- (Opcional) Agregar / eliminar productos

---

## 🌐 Tecnologías usadas
- Frontend: React, Axios, SweetAlert2, Context API
- Backend: Node.js, Express, JWT, Bcrypt, PostgreSQL

---

## ✨ A futuro podés agregar:
- Dirección de entrega y notas del pedido
- Filtro por estado en historial
- Websockets para pedidos en tiempo real
- Dashboard con gráficos

---

## ✅ Autenticación
Los tokens JWT se almacenan en `localStorage` y se envían con cada request autenticado:

```http
Authorization: Bearer tu_token
```

---

## ✉️ Contacto
Este proyecto fue desarrollado por Tomas.

---

Si tenés dudas para correrlo, escribime y lo vemos 🙌
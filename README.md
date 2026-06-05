# 🌍 Diana Tours — Sistema de Gestión Turística

Plataforma web de turismo con Gemelo Digital 360° y autenticación segura con JWT + 2FA.

---

## 🏗️ Arquitectura

```
Usuario (Browser)
      │
      ▼
┌─────────────────────────┐
│  Frontend (React+NGINX) │  :80  → https://diana-tours-frontend.onrender.com
└────────────┬────────────┘
             │ HTTPS
             ▼
┌─────────────────────────┐
│  Backend (Laravel 11)   │  :8000 → https://diana-tours-backend.onrender.com
└────────────┬────────────┘
             │ PostgreSQL interno
             ▼
┌─────────────────────────┐
│  Base de Datos          │  PostgreSQL 16 (Render)
│  (PostgreSQL)           │
└─────────────────────────┘
```

**Redes Docker (desarrollo local):**
- `diana-network` — red bridge interna
- Puerto BD (5432) NO expuesto al host
- Frontend → Backend → BD por red interna

---

## 🚀 Levantar en local

### Requisitos
- Docker Desktop instalado
- Git

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Daner199/diana-tours.git
cd diana-tours

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# 3. Levantar todos los servicios
docker compose up --build

# 4. Generar APP_KEY (primera vez)
docker compose exec backend php artisan key:generate

# 5. Generar JWT_SECRET (primera vez)
docker compose exec backend php artisan jwt:secret

# 6. Ejecutar migraciones
docker compose exec backend php artisan migrate

# 7. Abrir en el navegador
# Frontend: http://localhost
# API:      http://localhost:8000/api
```

---

## 👥 Usuarios de prueba

| Rol | Email | Contraseña | Secreto TOTP |
|-----|-------|------------|--------------|
| Administrador | admin@prueba.com | Admin123! | `JBSWY3DPEHPK3PXP` |
| Turista | user@prueba.com | User123! | `KNRW24TMMJQXEZLJ` |

> **Para el 2FA:** Escanear el secreto TOTP con Google Authenticator, Authy o FreeOTP.
> Si el correo de verificación tarda, revisar los logs del backend en Render.

---

## 🌐 URLs del sistema

| Servicio | URL |
|---------|-----|
| Frontend (producción) | https://diana-tours-frontend.onrender.com |
| Backend API (producción) | https://diana-tours-backend.onrender.com |
| Sistema local (Docker) | http://localhost |

> ⚠️ El plan gratuito de Render puede tardar hasta 60 segundos en despertar tras inactividad.

---

## 📦 Versiones y tags

| Tag | Estado | Cambios |
|-----|--------|---------|
| v1.2.0 | ✅ Producción | 2FA + Equipo de confianza + despliegue en nube |
| v1.1.0 | ✅ Estable | Login en dos pasos (TOTP) implementado |
| v1.0.0 | ✅ Estable | JWT + CRUD básico |

```bash
# Desplegar versión específica
git checkout v1.2.0
docker compose up --build
```

---

## ✅ Checklist de funcionalidades

- [x] Registro de usuario
- [x] Login con email y contraseña
- [x] Solicitud de código 2FA tras login correcto
- [x] Verificación de código TOTP (enviado al correo)
- [x] Checkbox "Confiar en este equipo" (30 días)
- [x] Acceso a rutas protegidas solo con JWT válido
- [x] Diferentes vistas según rol (Admin, Guía, Turista, Oficinista)
- [x] Cierre de sesión
- [x] Gestión de sitios turísticos con mapa interactivo
- [x] Gestión de paquetes turísticos
- [x] Reservas y procesamiento de pagos
- [x] Grupos operativos y logística
- [x] Caja diaria (apertura, cierre, ingresos, egresos)
- [x] Dashboard con KPIs y gráficas de ventas
- [x] Gemelo Digital 360° con Pannellum y Google Street View
- [x] Panel del guía turístico
- [x] Panel del oficinista
- [x] Despliegue en la nube con HTTPS (Render)

---

## 🏢 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 + TypeScript + Tailwind CSS + Vite |
| Backend | Laravel 11 + JWT (tymon/jwt-auth) |
| Base de datos | PostgreSQL 16 |
| Contenerización | Docker + Docker Compose |
| Despliegue | Render (cloud) + VirtualBox Ubuntu (local) |
| Mapas | Leaflet.js + Nominatim |
| Visor 360° | Pannellum.js (CDN) + Google Street View |

---

## 📁 Estructura del repositorio

```
diana-tours/                    ← Raíz del mono-repo
├── app/                        ← Backend Laravel (controladores, modelos)
├── config/                     ← Configuración Laravel
├── database/                   ← Migraciones
├── routes/                     ← Rutas API
├── frontend/                   ← Frontend React
│   ├── src/
│   │   ├── routes/             ← Páginas y componentes
│   │   └── api.ts              ← Cliente HTTP (usa VITE_API_URL)
│   ├── Dockerfile              ← Multi-stage build
│   ├── nginx.conf              ← Configuración NGINX
│   └── .env.example
├── Dockerfile                  ← Backend Docker
├── docker-compose.yml          ← Orquestación 3 servicios
├── .env.example                ← Variables de entorno
└── README.md
```

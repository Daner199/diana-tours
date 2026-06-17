#  Diana Tours — Sistema Web Inmersivo de Gestión Turística

> 
> Estudiante: Daner Escobar  Ingeniería en Sistemas 2026

---

##  URLs de Producción

| Servicio | URL |
|---------|-----|
|  Frontend | https://diana-tours-frontend.onrender.com |
|  Backend API | https://diana-tours-backend.onrender.com/api |
|  Repositorio | https://github.com/Daner199/diana-tours |

>  **Nota Render Plan Gratuito:** El servicio se duerme tras 15 min de inactividad. Esperar 50 segundos en la primera carga o entrar 5 minutos antes de la revisión.

---

##  Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET / HTTPS                      │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
    ┌──────────▼──────────┐  ┌────────▼────────────┐
    │  FRONTEND (React)   │  │  BACKEND (Laravel)  │
    │  Puerto: 80 (NGINX) │  │  Puerto: 8000       │
    │  Vite + TypeScript  │◄─┤  JWT Auth + 2FA     │
    │  Tailwind CSS       │  │  REST API           │
    └─────────────────────┘  └────────┬────────────┘
                                       │
                           ┌──────────▼───────────┐
                           │   PostgreSQL 15       │
                           │   Render Database     │
                           └──────────────────────┘

    Docker: Frontend (NGINX) + Backend (PHP) + PostgreSQL
    Red interna Docker: diana-network
    BD NO expuesta al exterior
```

---

##  Usuarios de Prueba (Producción)

>  **Flujo 2FA:** Tras ingresar email y contraseña, el sistema envía un **código de 6 dígitos**. El docente debe solicitar el código al estudiante quien lo recibirá en su correo y lo comunicará en el momento de la revisión.

| Rol | Email | Contraseña |
|-----|-------|-----------|
| **Administrador** | escobardaner48@gmail.com | `Admin2026!` |
| **Guía Turístico** | escobardaner47@gmail.com | `Guia2026!` |
| **Turista** | escobardaner49@gmail.com | `Turista2026!` |
| **Oficinista** | lpze.daner.escobar.co@unifranz.edu.bo | `Oficina2026!` |

### Flujo completo de Login con 2FA

```
1. Ir a: https://diana-tours-frontend.onrender.com
2. Ingresar email y contraseña
3. El sistema responde: "Código enviado a tu correo"
4. El estudiante recibe el código y lo comunica al docente
5. Ingresar el código de 6 dígitos
6. Acceso concedido 
```

### Dispositivo de Confianza
En el paso del 2FA, marcar **"Recordar este dispositivo"** para omitir el 2FA por 30 días en próximos logins.

---

## Despliegue Local con Docker

### Prerequisitos
- Docker Desktop instalado
- Git instalado

```bash
# 1. Clonar el repositorio
git clone https://github.com/Daner199/diana-tours.git
cd diana-tours

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con credenciales de mail (Resend API Key)

# 3. Levantar todos los servicios
docker compose up --build

# Frontend: http://localhost
# Backend:  http://localhost:8000/api


### Detener
```bash
docker compose down
```

---

##  Desarrollo Local (Windows + XAMPP)

```bash
# 1. Clonar
git clone https://github.com/Daner199/diana-tours.git
cd diana-tours

# 2. Instalar dependencias PHP
composer install

# 3. Configurar .env
cp .env.example .env
# Editar DB_DATABASE, DB_USERNAME, DB_PASSWORD

# 4. Migrar BD
php artisan migrate
php artisan db:seed --class=UsuariosPruebaSeeder

# Terminal 1 — Backend
php artisan serve

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
```

---

##  Módulos Implementados

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| M1 | Auth JWT + 2FA + Equipo de confianza 
| M2 | Catálogo sitios turísticos 
| M3 | Paquetes turísticos
| M4 | Reservas y pagos 
| M5 | Caja diaria (Oficinista) 
| M6 | Dashboard Admin + KPIs + Mapa 
| M7 | Gemelo Digital 360° (Pannellum) 


---

##  Versiones y Tags

| Tag | Estado | Cambios |
|-----|--------|---------|
| **v1.2.1** |  Producción | SMTP Resend + M8 RA + Docker completo |
| v1.2.0 |  Estable | Equipo de confianza + despliegue cloud |
| v1.1.0 |  Estable | Login 2FA implementado |
| v1.0.0 |  Estable | JWT + CRUD básico |

```bash
# Clonar versión específica
git clone https://github.com/Daner199/diana-tours.git
cd diana-tours
git checkout v1.2.1
docker compose up --build
```

---

##  Checklist de Funcionalidades

- Registro de usuario con verificación por correo
- Login con email y contraseña
- Código 2FA enviado al correo tras login correcto
-  Verificación del código 2FA (expira en 10 min)
- "Confiar en este equipo" — omite 2FA por 30 días
- Bloqueo automático tras 5 intentos fallidos
- Acceso a rutas protegidas solo con JWT válido
- Vistas diferenciadas por rol (Admin / Guía / Turista / Oficinista)
- Catálogo de sitios y paquetes turísticos
- Sistema de reservas y pagos
-  Caja diaria para oficinistas
-  Dashboard con KPIs y mapa para administrador
-  Gemelo Digital 360° con Pannellum
- Cierre de sesión
- Despliegue en la nube con HTTPS (Render)
-  Docker multi-stage (frontend NGINX + backend Laravel)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS + Vite |
| Backend | Laravel 11 + JWT (tymon/jwt-auth) |
| Base de datos | PostgreSQL 15 |
| Correo | Resend API |
| Contenedores | Docker + Docker Compose |
| Producción | Render (cloud) |

---

##  Desarrollado por

**Daner Escobar**  
Ingeniería en Sistemas — UNIFRANZ La Paz — 2026  
GitHub: [@Daner199](https://github.com/Daner199)
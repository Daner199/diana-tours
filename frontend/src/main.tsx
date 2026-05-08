import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

// Importamos todas tus pantallas
import { Layout } from './routes/layout'
import { Home } from './routes/home'
import { Login } from './routes/login'
import { Admin } from './routes/admin'
import { PaqueteDetalle } from './routes/PaqueteDetalle'

// ✅ 1. IMPORTAMOS TU PANEL TURISTA CON EL NOMBRE EXACTO DE TU ARCHIVO
import { Turista } from './routes/turista'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>

        {/* ===================================================
            1. ZONA DEL TURISTA (Todo lo que va dentro del Layout)
            =================================================== */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/paquete/:cod" element={<PaqueteDetalle />} />
        </Route>

        {/* ===================================================
            2. ZONA INDEPENDIENTE (Pantallas completas SIN el Layout)
            =================================================== */}
        {/* El Login se dibuja solo en toda la pantalla */}
        <Route path="/login" element={<Login />} />

        {/* El Admin tiene su propio diseño y menú lateral */}
        <Route path="/admin" element={<Admin />} />

        {/* ✅ 2. AGREGAMOS LA RUTA DEL PANEL DEL TURISTA AQUÍ */}
        <Route path="/turista" element={<Turista />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

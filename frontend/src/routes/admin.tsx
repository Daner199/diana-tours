import React, { useState, useEffect } from "react";
import {  useNavigate } from "react-router-dom";
import { MapPin, Package, LogOut, Camera, Users, DollarSign, FileText, LayoutDashboard, Calendar, Globe } from "lucide-react";
import ModalPerfil from "../components/ModalPerfil";
import SitiosGestor from "./admin/SitiosGestor";
import PaquetesGestor from "./admin/PaquetesGestor";
import UsuariosGestor from "./admin/UsuariosGestor";
import DashboardGestor from "./admin/DashboardGestor";
import ReservasAdmin from "./admin/ReservasAdmin";
import GruposGestor from "./admin/GruposGestor";
import CajaGestor from "./admin/CajaGestor";
import GemeloGestor from "./admin/GemeloGestor";

// Interface para TypeScript
interface AdminUserData {
  cod: number;
  nombre?: string;
  apellido_paterno?: string;
  foto_perfil?: string;
  rol?: { nombre: string };
}

export function Admin() {
  const navigate = useNavigate();

  // Estado del usuario autenticado
  const [adminUser, setAdminUser] = useState<AdminUserData | null>(() => {
    try {
      const u = localStorage.getItem("usuario");
      if (!u || u === "undefined" || u === "null") return null;
      return JSON.parse(u) as AdminUserData;
    } catch { return null; }
  });

  // Control de Vistas y Modales
  type Vista = "dashboard" | "sitios" | "paquetes" | "usuarios" | "reservas" | "grupos" | "pagos" | "reportes" | "gemelo";
  const [vistaActiva, setVistaActiva] = useState<Vista>("dashboard");
  const [modalPerfil, setModalPerfil] = useState(false);

  // Proteger ruta
  useEffect(() => { if (!adminUser) navigate("/"); }, [adminUser, navigate]);

  const getIniciales = () => {
    const n = adminUser?.nombre?.charAt(0) ?? "";
    const a = adminUser?.apellido_paterno?.charAt(0) ?? "";
    return (n + a).toUpperCase() || "AD";
  };

  // Motor de renderizado dinámico del panel central
  const renderizarVistaActiva = () => {
  switch (vistaActiva) {
    case "dashboard": return <DashboardGestor />;
    case "sitios":    return <SitiosGestor />;
    case "paquetes":  return <PaquetesGestor />;
    case "usuarios":  return <UsuariosGestor />;
    case "reservas":  return <ReservasAdmin />;
    case "grupos": return <GruposGestor />;
    case "pagos":   return <CajaGestor />;
    case "gemelo":  return <GemeloGestor />;
    default: return <div className="p-8 text-gray-500 font-medium">Módulo en construcción...</div>;
  }
};

  if (!adminUser) return null;

  return (
    <div className="flex h-screen bg-[#F4F6F8] font-['Inter'] overflow-hidden">

      {/* MODAL FOTO DE PERFIL (Importado) */}
      {modalPerfil && (
        <ModalPerfil
          usuario={adminUser}
          onCerrar={() => setModalPerfil(false)}
          onFotoActualizada={(foto) => {
            // Sincronizar foto en el layout principal
            setAdminUser(p => p ? { ...p, foto_perfil: foto } : null);
          }}
        />
      )}

      {/* SIDEBAR DE NAVEGACIÓN PRINCIPAL */}
      <aside className="w-[260px] bg-[#1A1A2E] flex flex-col shrink-0 text-white shadow-2xl z-20">
        {/* Logo */}
        <div className="h-[80px] px-6 flex items-center border-b border-white/10 shrink-0">
         <img src="/logo.webp" alt="Diana Tours" className="h-10 w-auto rounded-md" />
        </div>

        {/* Menú de Navegación */}
        <div className="flex-1 overflow-y-auto py-8 space-y-7">
          {/* Sección Datos */}
          <div>
            <div className="px-6 mb-3"><span className="text-[#D4A017] text-[11px] font-black uppercase tracking-widest opacity-80">Gestión de Datos</span></div>
<nav className="space-y-1">
  <MenuBoton activa={vistaActiva === "dashboard"} onClick={() => setVistaActiva("dashboard")} icono={<LayoutDashboard size={20} />} texto="Dashboard" />
  <MenuBoton activa={vistaActiva === "sitios"} onClick={() => setVistaActiva("sitios")} icono={<MapPin size={20} />} texto="Sitios Turísticos" />
  <MenuBoton activa={vistaActiva === "paquetes"} onClick={() => setVistaActiva("paquetes")} icono={<Package size={20} />} texto="Paquetes Turísticos" />
</nav>
          </div>

          {/* Sección Administración (Próximos módulos) */}
          <div>
            <div className="px-6 mb-3"><span className="text-[#D4A017] text-[11px] font-black uppercase tracking-widest opacity-80">Administración</span></div>
            <nav className="space-y-1">
              <MenuBoton activa={vistaActiva === "usuarios"} onClick={() => setVistaActiva("usuarios")} icono={<Users size={20} />} texto="Usuarios y Guías" />
              <MenuBoton activa={vistaActiva === "reservas"} onClick={() => setVistaActiva("reservas")} icono={<Calendar size={20} />} texto="Reservas" />
              <MenuBoton
  activa={vistaActiva === "grupos"}
  onClick={() => setVistaActiva("grupos")}
  icono={<Users size={20} />}
  texto="Grupos Operativos"
/>
              <MenuBoton activa={vistaActiva === "pagos"} onClick={() => setVistaActiva("pagos")} icono={<DollarSign size={20} />} texto="Control de Pagos" />
             
              <MenuBoton activa={vistaActiva === "gemelo"} onClick={() => setVistaActiva("gemelo")} icono={<Globe size={20} />} texto="Gemelo 360°" />

            </nav>
          </div>
        </div>

        {/* Panel Inferior de Usuario */}
        <div className="p-5 bg-white/5 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setModalPerfil(true)}
              className="w-10 h-10 rounded-full bg-[#D4A017] flex items-center justify-center text-[#1A1A2E] font-bold text-[14px] relative overflow-hidden group border-2 border-transparent hover:border-white transition-all shrink-0 cursor-pointer">
              {adminUser.foto_perfil ? <img src={adminUser.foto_perfil} className="w-full h-full object-cover" alt="Perfil" /> : getIniciales()}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={14} className="text-white" />
              </div>
            </button>
            <div className="flex-1 overflow-hidden">
              <p className="text-[13px] font-bold truncate text-white">{adminUser.nombre} {adminUser.apellido_paterno}</p>
              <p className="text-[11px] text-[#D4A017] font-medium truncate">{adminUser.rol?.nombre ?? "Administrador"}</p>
            </div>
            <button onClick={() => { localStorage.clear(); navigate("/"); }} className="text-gray-400 hover:text-white cursor-pointer transition-colors"><LogOut size={20} /></button>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL (Renderizado Dinámico) */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {renderizarVistaActiva()}
      </main>
    </div>
  );
}

// === Componente Auxiliar para Botones del Menú ===
interface MenuBotonProps {
  activa: boolean;
  onClick: () => void;
  icono: React.ReactNode;
  texto: string;
}

function MenuBoton({ activa, onClick, icono, texto }: MenuBotonProps) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-6 h-[50px] border-l-4 transition-all text-left cursor-pointer ${activa ? "border-[#D4A017] bg-white/10 text-white font-bold shadow-inner" : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"}`}>
      <div className={`${activa ? "text-[#D4A017]" : "text-gray-500"}`}>{icono}</div>
      <span className="text-[14px] flex-1 truncate">{texto}</span>
    </button>
  );
}

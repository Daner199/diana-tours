// Panel Oficinista — Diana Tours v1.2.0
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut, Camera, DollarSign, Calendar,
  Users, BarChart2, Briefcase
} from "lucide-react";
import ModalPerfil from "../components/ModalPerfil";
import ReservasAdmin from "./admin/ReservasAdmin";
import CajaGestor from "./admin/CajaGestor";
import GruposGestor from "./admin/GruposGestor";
import DashboardGestor from "./admin/DashboardGestor";

// ── Interface ─────────────────────────────────────────────────────────────────
interface OficinstaUserData {
  cod: number;
  nombre?: string;
  apellido_paterno?: string;
  foto_perfil?: string;
  rol?: { nombre: string };
}

// ── Componente principal ──────────────────────────────────────────────────────
export function Oficinista() {
  const navigate = useNavigate();

  const [user, setUser] = useState<OficinstaUserData | null>(() => {
    try {
      const u = localStorage.getItem("usuario");
      if (!u || u === "undefined" || u === "null") return null;
      return JSON.parse(u) as OficinstaUserData;
    } catch { return null; }
  });

  type Vista = "reservas" | "caja" | "grupos" | "reportes";
  const [vistaActiva, setVistaActiva] = useState<Vista>("reservas");
  const [modalPerfil, setModalPerfil] = useState(false);

  // Proteger ruta — solo oficinista (cod_rol=4)
  useEffect(() => {
    if (!user) { navigate("/"); return; }
    const cod_rol = (user as unknown as { cod_rol?: number }).cod_rol;
    if (cod_rol !== 4) { navigate("/"); }
  }, [user, navigate]);

  const getIniciales = () => {
    const n = (user?.nombre ?? "").charAt(0);
    const a = (user?.apellido_paterno ?? "").charAt(0);
    return (n + a).toUpperCase() || "OF";
  };

  const renderVista = () => {
    switch (vistaActiva) {
      case "reservas": return <ReservasAdmin />;
      case "caja":     return <CajaGestor />;
      case "grupos":   return <GruposGestorReadOnly />;
      case "reportes": return <ReportesBasicos />;
      default:         return <ReservasAdmin />;
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#F4F6F8] font-['Inter'] overflow-hidden">

      {/* Modal perfil */}
      {modalPerfil && (
        <ModalPerfil
          usuario={user}
          onCerrar={() => setModalPerfil(false)}
          onFotoActualizada={(foto) => setUser(p => p ? { ...p, foto_perfil: foto } : null)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className="w-[260px] bg-[#1A1A2E] flex flex-col shrink-0 text-white shadow-2xl z-20">

        {/* Logo */}
        <div className="h-[80px] px-6 flex items-center border-b border-white/10 shrink-0">
          <img src="/logo.webp" alt="Diana Tours" className="h-10 w-auto rounded-md" />
        </div>

        {/* Badge de rol */}
        <div className="px-6 py-3 bg-[#D4A017]/10 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Briefcase size={14} className="text-[#D4A017]" />
            <span className="text-[#D4A017] text-[11px] font-black uppercase tracking-widest">
              Panel Oficinista
            </span>
          </div>
        </div>

        {/* Menú */}
        <div className="flex-1 overflow-y-auto py-8 space-y-7">

          <div>
            <div className="px-6 mb-3">
              <span className="text-[#D4A017] text-[11px] font-black uppercase tracking-widest opacity-80">
                Ventas y Caja
              </span>
            </div>
            <nav className="space-y-1">
              <MenuBoton
                activa={vistaActiva === "reservas"}
                onClick={() => setVistaActiva("reservas")}
                icono={<Calendar size={20} />}
                texto="Reservas"
              />
              <MenuBoton
                activa={vistaActiva === "caja"}
                onClick={() => setVistaActiva("caja")}
                icono={<DollarSign size={20} />}
                texto="Caja Diaria"
              />
            </nav>
          </div>

          <div>
            <div className="px-6 mb-3">
              <span className="text-[#D4A017] text-[11px] font-black uppercase tracking-widest opacity-80">
                Operaciones
              </span>
            </div>
            <nav className="space-y-1">
              <MenuBoton
                activa={vistaActiva === "grupos"}
                onClick={() => setVistaActiva("grupos")}
                icono={<Users size={20} />}
                texto="Grupos Operativos"
              />
              <MenuBoton
                activa={vistaActiva === "reportes"}
                onClick={() => setVistaActiva("reportes")}
                icono={<BarChart2 size={20} />}
                texto="Reportes"
              />
            </nav>
          </div>
        </div>

        {/* Panel usuario */}
        <div className="p-5 bg-white/5 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalPerfil(true)}
              className="w-10 h-10 rounded-full bg-[#D4A017] flex items-center justify-center text-[#1A1A2E] font-bold text-[14px] relative overflow-hidden group border-2 border-transparent hover:border-white transition-all shrink-0 cursor-pointer"
            >
              {user.foto_perfil
                ? <img src={user.foto_perfil} className="w-full h-full object-cover" alt="Perfil" />
                : getIniciales()
              }
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={14} className="text-white" />
              </div>
            </button>
            <div className="flex-1 overflow-hidden">
              <p className="text-[13px] font-bold truncate text-white">
                {user.nombre} {user.apellido_paterno}
              </p>
              <p className="text-[11px] text-[#D4A017] font-medium truncate">
                {user.rol?.nombre ?? "Oficinista"}
              </p>
            </div>
            <button
              onClick={() => { localStorage.clear(); navigate("/"); }}
              className="text-gray-400 hover:text-white cursor-pointer transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {renderVista()}
      </main>
    </div>
  );
}

// ── GruposGestor en modo solo lectura ─────────────────────────────────────────
// Reutiliza el componente pero lo envuelve en un overlay que bloquea edición
function GruposGestorReadOnly() {
  return (
    <div className="flex flex-col h-full relative">
      {/* Banner de solo lectura */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 shrink-0">
        <Users size={14} className="text-amber-600" />
        <p className="text-amber-700 text-[12px] font-bold">
          Vista de solo lectura — El oficinista puede consultar grupos pero no modificarlos.
        </p>
      </div>
      <div className="flex-1 overflow-hidden pointer-events-none opacity-90">
        <GruposGestor />
      </div>
    </div>
  );
}

// ── Reportes básicos ──────────────────────────────────────────────────────────
function ReportesBasicos() {
  return (
    <div className="flex flex-col h-full">
      <header className="h-[80px] bg-white flex items-center px-8 shadow-sm border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <BarChart2 size={26} className="text-[#D4A017]" />
          <div>
            <h1 className="text-[22px] font-black text-[#1A1A2E]">Reportes</h1>
            <p className="text-[12px] text-gray-400">Resumen de ventas y caja</p>
          </div>
        </div>
      </header>
      {/* El dashboard ya tiene los KPIs y gráficas de ventas */}
      <div className="flex-1 overflow-hidden">
        <DashboardGestor />
      </div>
    </div>
  );
}

// ── MenuBoton (mismo que admin) ───────────────────────────────────────────────
interface MenuBotonProps {
  activa: boolean;
  onClick: () => void;
  icono: React.ReactNode;
  texto: string;
}

function MenuBoton({ activa, onClick, icono, texto }: MenuBotonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-6 h-[50px] border-l-4 transition-all text-left cursor-pointer ${
        activa
          ? "border-[#D4A017] bg-white/10 text-white font-bold shadow-inner"
          : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <div className={activa ? "text-[#D4A017]" : "text-gray-500"}>{icono}</div>
      <span className="text-[14px] flex-1 truncate">{texto}</span>
    </button>
  );
}

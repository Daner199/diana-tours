import React, { useState, useEffect } from "react";
import {
  Users, UserCheck,
  Loader2, Shield, Briefcase,
  RefreshCw, Activity
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import api from "../../api";

interface Stats {
  total_usuarios:    number;
  total_admins:      number;
  total_guias:       number;
  total_turistas:    number;
  total_oficinistas: number;
  total_sitios:      number;
  total_paquetes:    number;
}

// ── Tooltip tipado correctamente, FUERA del componente ──
interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function TooltipPersonalizado({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg">
        <p className="text-[13px] font-bold text-[#1A1A2E]">{label}</p>
        <p className="text-[13px] text-[#D4A017] font-black">{payload[0].value} usuarios</p>
      </div>
    );
  }
  return null;
}

export default function DashboardGestor() {
  const [stats, setStats]         = useState<Stats | null>(null);
  const [cargando, setCargando]   = useState(true);
  const [recargando, setRecargando] = useState(false);

  const cargarStats = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    else setRecargando(true);
    try {
      const res = await api.get("/admin/estadisticas");
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => cargarStats(), 0);
    return () => clearTimeout(t);
  }, []);

  if (cargando) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#F4F6F8]">
        <Loader2 size={40} className="animate-spin text-[#D4A017] mb-4" />
        <p className="text-gray-500 font-medium">Cargando dashboard...</p>
      </div>
    );
  }

  // ── Datos para las gráficas ──
  const datosRoles = [
    { nombre: "Admins",      valor: stats?.total_admins      ?? 0, color: "#D4A017" },
    { nombre: "Guías",       valor: stats?.total_guias       ?? 0, color: "#1B4332" },
    { nombre: "Oficinistas", valor: stats?.total_oficinistas ?? 0, color: "#1e3a5f" },
    { nombre: "Turistas",    valor: stats?.total_turistas    ?? 0, color: "#7C2D12" },
  ];

  const datosCatalogo = [
    { name: "Sitios Turísticos", value: stats?.total_sitios   ?? 0 },
    { name: "Paquetes",          value: stats?.total_paquetes ?? 0 },
  ];
  const COLORES_PIE = ["#4A1D96", "#064E3B"];

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8]">
      {/* Header */}
      <header className="h-[80px] bg-white flex items-center justify-between px-8 shadow-sm border-b border-gray-200 shrink-0">
        <div>
          <h1 className="text-[24px] font-black text-[#1A1A2E]">Dashboard</h1>

        </div>
        <button
          onClick={() => cargarStats(true)}
          disabled={recargando}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={15} className={recargando ? "animate-spin" : ""} />
          Actualizar
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">

        {/* ── SECCIÓN 1: KPIs de Usuarios ── */}
        <div>
          <p className="text-[11px] font-black text-[#D4A017] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity size={12} /> Resumen de Usuarios
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              titulo="Total Usuarios"
              valor={stats?.total_usuarios ?? 0}
              icono={<Users size={22} className="text-white" />}
              color="bg-[#1A1A2E]"
              sub="Registrados en el sistema"
              tendencia={null}
            />
            <StatCard
              titulo="Administradores"
              valor={stats?.total_admins ?? 0}
              icono={<Shield size={22} className="text-white" />}
              color="bg-[#D4A017]"
              sub="Con acceso total"
              tendencia={null}
            />
            <StatCard
              titulo="Guías Turísticos"
              valor={stats?.total_guias ?? 0}
              icono={<UserCheck size={22} className="text-white" />}
              color="bg-[#1B4332]"
              sub="Activos en el sistema"
              tendencia={null}
            />
            <StatCard
              titulo="Oficinistas"
              valor={stats?.total_oficinistas ?? 0}
              icono={<Briefcase size={22} className="text-white" />}
              color="bg-[#1e3a5f]"
              sub="Gestión de ventas"
              tendencia={null}
            />
          </div>
        </div>

        {/* ── SECCIÓN 2: Gráficas ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Gráfica de barras — distribución por rol (ocupa 3/5) */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <p className="text-[14px] font-black text-[#1A1A2E] mb-1">Distribución por Rol</p>
            <p className="text-[12px] text-gray-400 mb-6">Cantidad de usuarios por tipo de rol</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={datosRoles} barSize={44} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis
                  dataKey="nombre"
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: "#F9FAFB" }} />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                  {datosRoles.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica de dona — catálogo turístico (ocupa 2/5) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <p className="text-[14px] font-black text-[#1A1A2E] mb-1">Catálogo Turístico</p>
            <p className="text-[12px] text-gray-400 mb-4">Sitios y paquetes activos</p>

            <div className="flex-1 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={datosCatalogo}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {datosCatalogo.map((_, i) => (
                      <Cell key={i} fill={COLORES_PIE[i]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "13px" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex gap-6 mt-2">
                <div className="text-center">
                  <div className="flex items-center gap-1.5 justify-center mb-1">
                    <div className="w-3 h-3 rounded-full bg-[#4A1D96]"></div>
                    <span className="text-[11px] text-gray-500 font-medium">Sitios</span>
                  </div>
                  <p className="text-[28px] font-black text-[#4A1D96]">{stats?.total_sitios ?? 0}</p>
                </div>
                <div className="w-px bg-gray-100"></div>
                <div className="text-center">
                  <div className="flex items-center gap-1.5 justify-center mb-1">
                    <div className="w-3 h-3 rounded-full bg-[#064E3B]"></div>
                    <span className="text-[11px] text-gray-500 font-medium">Paquetes</span>
                  </div>
                  <p className="text-[28px] font-black text-[#064E3B]">{stats?.total_paquetes ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECCIÓN 3: Turistas + Estado del sistema ── */}

      </div>
    </div>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────

interface StatCardProps {
  titulo: string;
  valor: number;
  icono: React.ReactNode;
  color: string;
  sub: string;
  tendencia: number | null;
}

function StatCard({ titulo, valor, icono, color, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
        {icono}
      </div>
      <div>
        <p className="text-gray-500 text-[12px] font-bold uppercase tracking-wide mb-1">{titulo}</p>
        <p className="text-[32px] font-black text-[#1A1A2E] leading-none mb-1">{valor}</p>
        <p className="text-gray-400 text-[12px]">{sub}</p>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2, RefreshCw, Activity, TrendingUp, Calendar,
  MapPin, Package, Wallet, Map
} from "lucide-react";
import {
   XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../api";

// Fix Leaflet icons con Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Stats {
  total_usuarios: number;
  total_admins: number;
  total_guias: number;
  total_turistas: number;
  total_oficinistas: number;
  total_sitios: number;
  total_paquetes: number;
  total_reservas: number;
  reservas_por_estado: Record<string, number>;
  ventas_por_mes: { mes: string; mes_orden: string; total_bs: number; cantidad: number }[];
  ingresos_hoy: number;
  saldo_caja_hoy: number;
  caja_abierta: boolean;
  grupos_hoy: number;
  paquetes_populares: { cod: number; nombre: string; total_reservas: number; total_pasajeros: number }[];
  metodos_pago: { metodo: string; total: number }[];
}

interface SitioMapa {
  cod: number;
  nombre: string;
  latitud: number;
  longitud: number;
  foto: string | null;
}

interface GrupoHoy {
  cod: number;
  paquete: string | null;
  estado: string;
  fecha_salida: string;
}



// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtBs = (n: number) =>
  "Bs. " + Number(n ?? 0).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const COLORES_ESTADO: Record<string, string> = {
  pendiente:  "#F59E0B",
  confirmada: "#10B981",
  completada: "#3B82F6",
  cancelada:  "#EF4444",
};

const COLORES_METODO = ["#1A1A2E", "#D4A017", "#1B4332"];

// ── Tooltip personalizado para gráficas ───────────────────────────────────────
interface TipProps { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string; }

function TipVentas({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-[13px]">
      <p className="font-bold text-[#1A1A2E] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-black">
          {p.name === "total_bs" ? fmtBs(p.value) : p.value + " reservas"}
        </p>
      ))}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DashboardGestor() {
  const [stats, setStats]           = useState<Stats | null>(null);
  const [mapa, setMapa]             = useState<{ sitios: SitioMapa[]; grupos_hoy: GrupoHoy[] } | null>(null);

  const [cargando, setCargando]     = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [tabActivo, setTabActivo]   = useState<"ventas" | "reservas" | "metodos">("ventas");

  const cargarTodo = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    else setRecargando(true);
    try {
      const [resStats, resMapa] = await Promise.all([
        api.get<Stats>("/admin/estadisticas"),
        api.get<{ sitios: SitioMapa[]; grupos_hoy: GrupoHoy[] }>("/admin/mapa-operaciones"),
      ]);
      setStats(resStats.data);
      setMapa(resMapa.data);



    } catch (e) {
      console.error("Error cargando dashboard:", e);
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, []);

  useEffect(() => {
    const init = setTimeout(() => cargarTodo(), 0);
    const poll = setInterval(() => cargarTodo(true), 30_000);
    return () => { clearTimeout(init); clearInterval(poll); };
  }, [cargarTodo]);

  if (cargando) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#F4F6F8]">
        <Loader2 size={40} className="animate-spin text-[#D4A017] mb-4" />
        <p className="text-gray-500 font-medium">Cargando dashboard...</p>
      </div>
    );
  }

  // Datos procesados para gráficas
  const datosVentas = (stats?.ventas_por_mes ?? []).map(v => ({
    mes: v.mes,
    total_bs: Number(v.total_bs ?? 0),
    cantidad: Number(v.cantidad ?? 0),
  }));

  const datosEstado = Object.entries(stats?.reservas_por_estado ?? {}).map(([estado, total]) => ({
    name: estado.charAt(0).toUpperCase() + estado.slice(1),
    value: total,
    color: COLORES_ESTADO[estado] ?? "#9CA3AF",
  }));

  const datosMetodos = (stats?.metodos_pago ?? []).map((m, i) => ({
    name: m.metodo,
    value: Number(m.total),
    color: COLORES_METODO[i] ?? "#9CA3AF",
  }));



  const sitiosConCoordenadas = mapa?.sitios ?? [];
  const tieneMapa = sitiosConCoordenadas.length > 0;
  const centroMapa: [number, number] = tieneMapa
    ? [sitiosConCoordenadas[0].latitud, sitiosConCoordenadas[0].longitud]
    : [-16.4897, -68.1193];

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8]">

      {/* Header */}
      <header className="h-[80px] bg-white flex items-center justify-between px-8 shadow-sm border-b border-gray-200 shrink-0">
        <div>
          <h1 className="text-[24px] font-black text-[#1A1A2E]">Dashboard</h1>
          <p className="text-[12px] text-gray-400 font-medium">
            {new Date().toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">

          <button
            onClick={() => cargarTodo(true)}
            disabled={recargando}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={recargando ? "animate-spin" : ""} />
            <span>Actualizar</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">



        {/* ── KPIs fila 1: Operaciones del día ── */}
        <div>
          <p className="text-[11px] font-black text-[#D4A017] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Activity size={12} />
            <span>Operaciones de Hoy</span>
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard titulo="Saldo Caja Hoy" valor={fmtBs(stats?.saldo_caja_hoy ?? 0)} icono={<Wallet size={20} className="text-white" />} color="bg-[#1B4332]" sub={stats?.caja_abierta ? "Caja abierta" : "Caja cerrada"} />
            <KpiCard titulo="Ingresos Hoy"   valor={fmtBs(stats?.ingresos_hoy ?? 0)}   icono={<TrendingUp size={20} className="text-white" />} color="bg-[#D4A017]" sub="Registrados en caja" />
            <KpiCard titulo="Grupos Hoy"     valor={String(stats?.grupos_hoy ?? 0)}    icono={<Calendar size={20} className="text-white" />}  color="bg-[#1e3a5f]" sub="Confirmados / en curso" />
            <KpiCard titulo="Total Reservas" valor={String(stats?.total_reservas ?? 0)} icono={<Package size={20} className="text-white" />}  color="bg-[#1A1A2E]" sub="Historial completo" />
          </div>
        </div>



        {/* ── Gráficas principales ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Gráfica principal con tabs */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[14px] font-black text-[#1A1A2E]">
                  {tabActivo === "ventas" ? "Ventas por Mes" : tabActivo === "reservas" ? "Reservas por Estado" : "Métodos de Pago"}
                </p>
                <p className="text-[12px] text-gray-400">
                  {tabActivo === "ventas" ? "Últimos 6 meses" : "Distribución actual"}
                </p>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {(["ventas", "reservas", "metodos"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTabActivo(t)}
                    className={"px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all " + (tabActivo === t ? "bg-white text-[#1A1A2E] shadow-sm" : "text-gray-400 hover:text-gray-600")}
                  >
                    {t === "ventas" ? "Ventas" : t === "reservas" ? "Reservas" : "Pagos"}
                  </button>
                ))}
              </div>
            </div>

            {tabActivo === "ventas" && (
              datosVentas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[220px] text-gray-400">
                  <TrendingUp size={36} className="mb-2 text-gray-200" />
                  <p className="text-[13px] font-medium">Sin ventas confirmadas en los últimos 6 meses</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={datosVentas} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#D4A017" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#D4A017" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<TipVentas />} />
                    <Area type="monotone" dataKey="total_bs" name="total_bs" stroke="#D4A017" strokeWidth={2.5} fill="url(#gradVentas)" />
                  </AreaChart>
                </ResponsiveContainer>
              )
            )}

            {tabActivo === "reservas" && (
              <div className="flex items-center justify-center gap-8 h-[220px]">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={datosEstado} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {datosEstado.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [v + " reservas"]} contentStyle={{ borderRadius: "12px", border: "none", fontSize: "13px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {datosEstado.map((e) => (
                    <div key={e.name} className="flex items-center gap-2 text-[13px]">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: e.color }}></div>
                      <span className="text-gray-600 font-medium">{e.name}</span>
                      <span className="font-black text-[#1A1A2E] ml-auto pl-4">{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tabActivo === "metodos" && (
              <div className="flex items-center justify-center gap-8 h-[220px]">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={datosMetodos} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {datosMetodos.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [v + " pagos"]} contentStyle={{ borderRadius: "12px", border: "none", fontSize: "13px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {datosMetodos.map((e) => (
                    <div key={e.name} className="flex items-center gap-2 text-[13px]">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: e.color }}></div>
                      <span className="text-gray-600 font-medium">{e.name}</span>
                      <span className="font-black text-[#1A1A2E] ml-auto pl-4">{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Paquetes populares */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <p className="text-[14px] font-black text-[#1A1A2E] mb-1">Paquetes Populares</p>
            <p className="text-[12px] text-gray-400 mb-4">Top 5 por reservas</p>
            <div className="space-y-3">
              {(stats?.paquetes_populares ?? []).length === 0 ? (
                <p className="text-[13px] text-gray-400 text-center py-8">Sin datos aún</p>
              ) : (stats?.paquetes_populares ?? []).map((p, i) => (
                <div key={p.cod} className="flex items-center gap-3">
                  <div className={"w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black text-white shrink-0 " + (i === 0 ? "bg-[#D4A017]" : i === 1 ? "bg-[#1A1A2E]" : "bg-gray-300")}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1A1A2E] truncate">{p.nombre}</p>
                    <p className="text-[11px] text-gray-400">{p.total_reservas + " reservas · " + p.total_pasajeros + " pasajeros"}</p>
                  </div>
                  <div className="w-16 bg-gray-100 rounded-full h-1.5 shrink-0">
                    <div
                      className="bg-[#D4A017] h-1.5 rounded-full"
                      style={{ width: ((p.total_reservas / ((stats?.paquetes_populares?.[0]?.total_reservas) || 1)) * 100) + "%" }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Mapa + Grupos del día ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Mapa Leaflet */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-black text-[#1A1A2E]">Sitios Turísticos Activos</p>
                <p className="text-[12px] text-gray-400">{sitiosConCoordenadas.length + " sitios con ubicación registrada"}</p>
              </div>
              <MapPin size={18} className="text-[#D4A017]" />
            </div>
            {!tieneMapa ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-gray-400">
                <Map size={40} className="mb-3 text-gray-200" />
                <p className="font-bold text-[#1A1A2E] text-[14px]">Sin coordenadas registradas</p>
                <p className="text-[12px] mt-1 text-center px-8">Agrega coordenadas a los sitios turísticos desde Gestión de Sitios para verlos aquí.</p>
              </div>
            ) : (
              <div style={{ height: "280px" }}>
                <MapContainer center={centroMapa} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {sitiosConCoordenadas.map((s) => (
                    <Marker key={s.cod} position={[s.latitud, s.longitud]}>
                      <Popup>
                        <div className="text-[13px]">
                          <p className="font-black text-[#1A1A2E]">{s.nombre}</p>
                          <p className="text-gray-400 text-[11px]">{s.latitud.toFixed(4) + ", " + s.longitud.toFixed(4)}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>

          {/* Panel lateral derecho */}
          <div className="space-y-4">



            {/* Catálogo */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <p className="text-[13px] font-black text-[#1A1A2E] mb-3">Catálogo Turístico</p>
              <div className="flex gap-4">
                <div className="flex-1 text-center">
                  <p className="text-[28px] font-black text-[#4A1D96]">{stats?.total_sitios ?? 0}</p>
                  <p className="text-[11px] text-gray-400 font-medium">Sitios</p>
                </div>
                <div className="w-px bg-gray-100"></div>
                <div className="flex-1 text-center">
                  <p className="text-[28px] font-black text-[#064E3B]">{stats?.total_paquetes ?? 0}</p>
                  <p className="text-[11px] text-gray-400 font-medium">Paquetes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Grupos del día ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-[14px] font-black text-[#1A1A2E]">Grupos Operativos Hoy</p>
            <span className="text-[12px] text-gray-400">{(mapa?.grupos_hoy?.length ?? 0) + " grupos"}</span>
          </div>
          {(mapa?.grupos_hoy?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <Calendar size={32} className="mb-2 text-gray-200" />
              <p className="font-bold text-[#1A1A2E] text-[13px]">Sin grupos programados hoy</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(mapa?.grupos_hoy ?? []).map((g) => (
                <div key={g.cod} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1A1A2E] rounded-lg flex items-center justify-center">
                      <Calendar size={14} className="text-[#D4A017]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#1A1A2E]">{g.paquete ?? "Paquete sin nombre"}</p>
                      <p className="text-[11px] text-gray-400">{"Grupo #" + g.cod}</p>
                    </div>
                  </div>
                  <EstadoBadge estado={g.estado} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function KpiCard({ titulo, valor, icono, color, sub }: {
  titulo: string; valor: string; icono: React.ReactNode; color: string; sub: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={"w-11 h-11 " + color + " rounded-xl flex items-center justify-center shrink-0 shadow-sm"}>
        {icono}
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wide mb-0.5 truncate">{titulo}</p>
        <p className="text-[24px] font-black text-[#1A1A2E] leading-none">{valor}</p>
        <p className="text-gray-400 text-[11px] mt-1">{sub}</p>
      </div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    planificacion: "bg-gray-100 text-gray-600",
    confirmado:    "bg-green-100 text-green-700",
    en_curso:      "bg-blue-100 text-blue-700",
    completado:    "bg-purple-100 text-purple-700",
    cancelado:     "bg-red-100 text-red-700",
  };
  return (
    <span className={"px-3 py-1 rounded-full text-[11px] font-bold " + (map[estado] ?? "bg-gray-100 text-gray-600")}>
      {estado.replace("_", " ").toUpperCase()}
    </span>
  );
}

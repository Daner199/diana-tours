import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Loader2, Users, Calendar, Truck, AlertTriangle,
  CheckCircle, LogOut, MapPin, Phone, X, Save,
  ChevronDown, Menu, Clock, Shield
} from "lucide-react";
import api from "../api";

// ── Interfaces ────────────────────────────────────────────────
interface Turista {
  nombre_completo: string;
  telefono: string | null;
  foto_perfil: string | null;
  cantidad: number;
}

interface Transporte {
  placa: string;
  capacidad: number;
}

interface PaqueteGuia {
  cod: number;
  nombre: string;
  foto_principal: string | null;
  duracion_horas: number;
}

interface TourHoy {
  cod: number;
  estado: string;
  fecha_salida: string;
  es_hoy: boolean;
  paquete: PaqueteGuia | null;
  transporte: Transporte | null;
  pasajeros: Turista[];
  total_pasajeros: number;
  incidencias_hoy: number;
}

interface GuiaData {
  cod: number;
  nombre: string;
  apellido_paterno: string;
  foto_perfil: string | null;
  cod_rol: number;
}

type Vista = "tours" | "hoy";

// ── Helpers ───────────────────────────────────────────────────
const COLORES_ESTADO: Record<string, string> = {
  planificacion: "bg-gray-500/20 text-gray-300 border border-gray-500/30",
  confirmado:    "bg-green-500/20 text-green-400 border border-green-500/30",
  en_curso:      "bg-blue-500/20 text-blue-400 border border-blue-500/30",
};

const LABELS_ESTADO: Record<string, string> = {
  planificacion: "Planificación",
  confirmado:    "Confirmado",
  en_curso:      "En Curso",
};

function formatearFecha(fecha: string): string {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-BO", {
    weekday: "short", day: "numeric", month: "short"
  });
}

// ── Componente principal ──────────────────────────────────────
export function Guia() {
  const navigate = useNavigate();

  const [guia] = useState<GuiaData | null>(() => {
    try {
      const u = localStorage.getItem("usuario");
      if (!u) return null;
      const parsed = JSON.parse(u) as GuiaData;
      if (parsed.cod_rol !== 2) return null;
      return parsed;
    } catch { return null; }
  });

  const [tours, setTours]           = useState<TourHoy[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [tourSel, setTourSel]       = useState<TourHoy | null>(null);
  const [vistaActiva, setVistaActiva] = useState<Vista>("hoy");
  const [modalIncid, setModalIncid] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => { if (!guia) navigate("/login"); }, [guia, navigate]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/guia/mis-tours-hoy");
        const data: TourHoy[] = Array.isArray(res.data) ? res.data : [];
        setTours(data);
        // Seleccionar el tour de hoy por defecto, si no el primero
        const hoy = data.find(t => t.es_hoy) ?? data[0] ?? null;
        setTourSel(hoy);
      } catch { /* sin tours */ }
      finally { setCargando(false); }
    };
    if (guia) setTimeout(fetch, 0);
  }, [guia]);

  if (!guia) return null;

  const toursHoy    = tours.filter(t => t.es_hoy);
  const toursFuturos = tours.filter(t => !t.es_hoy);
  const iniciales   = `${guia.nombre?.[0] ?? "G"}${guia.apellido_paterno?.[0] ?? ""}`;

  const sidebarItems = [
    { id: "hoy",   ico: <Clock size={20} />,    lbl: "Tours de Hoy"     },
    { id: "tours", ico: <Calendar size={20} />, lbl: "Próximos 30 días" },
  ];

  const renderVista = () => {
    if (cargando) return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 size={48} className="animate-spin text-[#D4A017] mb-4" />
        <p className="text-white/40 text-[15px]">Cargando tus tours...</p>
      </div>
    );

    switch (vistaActiva) {
      case "hoy":   return <VistaHoy tours={toursHoy} tourSel={tourSel} setTourSel={setTourSel} onIncidencia={() => setModalIncid(true)} />;
      case "tours": return <VistaProximos tours={toursFuturos} setTourSel={(t) => { setTourSel(t); setVistaActiva("hoy"); }} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] font-['Inter'] overflow-hidden text-white w-full">

      {/* SIDEBAR */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-[280px] bg-[#0A0A0F] border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-50 transform ${menuAbierto ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 flex flex-col shrink-0`}>

        {/* Logo */}
        <div className="h-[80px] px-8 flex items-center border-b border-white/5 shrink-0 justify-between">
          <Link to="/" onClick={() => setMenuAbierto(false)}>
            <img src="/logo.webp" alt="Diana Tours" className="h-10 w-auto" />
          </Link>
          <button className="lg:hidden text-white/50" onClick={() => setMenuAbierto(false)}>
            <X size={24} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-8 space-y-2">
          <div className="px-8 mb-4">
            <span className="text-[#D4A017] text-[11px] font-black uppercase tracking-widest opacity-80">
              Panel del Guía
            </span>
          </div>
          {sidebarItems.map(item => (
            <button key={item.id}
              onClick={() => { setVistaActiva(item.id as Vista); setMenuAbierto(false); }}
              className={`w-full flex items-center gap-4 px-6 h-[54px] border-l-4 transition-all text-left cursor-pointer ${
                vistaActiva === item.id
                  ? "border-[#D4A017] bg-gradient-to-r from-[#D4A017]/10 to-transparent text-white font-bold"
                  : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
              }`}>
              <div className={vistaActiva === item.id ? "text-[#D4A017]" : "text-gray-500"}>
                {item.ico}
              </div>
              <span className="text-[15px]">{item.lbl}</span>
              {item.id === "hoy" && toursHoy.length > 0 && (
                <span className="ml-auto bg-[#D4A017] text-[#1A1A2E] text-[11px] font-black px-2 py-0.5 rounded-full">
                  {toursHoy.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Usuario */}
        <div className="p-6 border-t border-white/5 shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#D4A017] flex items-center justify-center text-[#1A1A2E] font-black text-[14px] overflow-hidden shrink-0">
              {guia.foto_perfil
                ? <img src={guia.foto_perfil} className="w-full h-full object-cover" alt="foto" />
                : iniciales
              }
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[13px] font-bold truncate text-white">{guia.nombre} {guia.apellido_paterno}</p>
              <p className="text-[11px] text-[#D4A017] truncate flex items-center gap-1">
                <Shield size={10} /> Guía Turístico
              </p>
            </div>
            <button onClick={() => { localStorage.clear(); navigate("/"); }}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {menuAbierto && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMenuAbierto(false)} />
      )}

      {/* MAIN */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative"
        style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(212,160,23,0.03) 0%, transparent 60%)" }}>

        {/* Header */}
        <header className="h-[80px] px-6 lg:px-10 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-white/70 hover:text-white"
              onClick={() => setMenuAbierto(true)}>
              <Menu size={26} />
            </button>
            <div>
              <h2 className="text-white text-[18px] md:text-[20px] font-black hidden sm:block">
                {vistaActiva === "hoy" ? "Tours de Hoy" : "Próximos 30 días"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-white/60 text-[13px]">
                {new Date().toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#D4A017] flex items-center justify-center text-[#1A1A2E] font-black text-[14px] overflow-hidden">
              {guia.foto_perfil
                ? <img src={guia.foto_perfil} className="w-full h-full object-cover" alt="foto" />
                : iniciales
              }
            </div>
          </div>
        </header>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 py-8">
          {renderVista()}
        </div>
      </main>

      {/* Modal incidencia */}
      {modalIncid && tourSel && (
        <ModalIncidencia
          codGrupo={tourSel.cod}
          onCerrar={() => setModalIncid(false)}
          onGuardado={() => setModalIncid(false)}
        />
      )}
    </div>
  );
}

// ── Vista: Tours de hoy ───────────────────────────────────────
function VistaHoy({ tours, tourSel, setTourSel, onIncidencia }: {
  tours: TourHoy[];
  tourSel: TourHoy | null;
  setTourSel: (t: TourHoy) => void;
  onIncidencia: () => void;
}) {
  if (tours.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
        <Calendar size={36} className="text-white/20" />
      </div>
      <p className="text-white/60 font-bold text-[18px]">Sin tours para hoy</p>
      <p className="text-white/30 text-[14px] mt-2">El administrador aún no te ha asignado grupos para hoy.</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Selector si hay más de 1 tour hoy */}
      {tours.length > 1 && (
        <div className="relative">
          <select
            value={tourSel?.cod ?? ""}
            onChange={e => {
              const t = tours.find(t => t.cod === Number(e.target.value));
              if (t) setTourSel(t);
            }}
            className="w-full h-[48px] px-4 pr-10 bg-white/5 border border-white/10 text-white rounded-xl text-[14px] appearance-none outline-none focus:border-[#D4A017]/50"
          >
            {tours.map(t => (
              <option key={t.cod} value={t.cod} className="bg-[#0A0A0F]">
                {t.paquete?.nombre ?? `Grupo #${t.cod}`}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
      )}

      {tourSel && <TarjetaTourDetalle tour={tourSel} onIncidencia={onIncidencia} />}
    </div>
  );
}

// ── Vista: Próximos tours ─────────────────────────────────────
function VistaProximos({ tours, setTourSel }: {
  tours: TourHoy[];
  setTourSel: (t: TourHoy) => void;
}) {
  if (tours.length === 0) return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
        <Calendar size={36} className="text-white/20" />
      </div>
      <p className="text-white/60 font-bold text-[18px]">Sin tours próximos</p>
      <p className="text-white/30 text-[14px] mt-2">No tienes tours asignados en los próximos 30 días.</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <p className="text-white/40 text-[13px] font-bold uppercase tracking-widest mb-6">
        {tours.length} tour(s) en los próximos 30 días
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tours.map(t => (
          <button key={t.cod} onClick={() => setTourSel(t)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4A017]/30 rounded-2xl overflow-hidden text-left transition-all group">
            {t.paquete?.foto_principal && (
              <div className="h-[120px] relative overflow-hidden">
                <img src={t.paquete.foto_principal} alt={t.paquete.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <p className="text-white font-black text-[16px] leading-tight pr-2">{t.paquete.nombre}</p>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black shrink-0 ${COLORES_ESTADO[t.estado] ?? COLORES_ESTADO.planificacion}`}>
                    {LABELS_ESTADO[t.estado] ?? t.estado}
                  </span>
                </div>
              </div>
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-[13px]">
                <Calendar size={14} className="text-[#D4A017]" />
                <span className="text-white/80 font-medium">{formatearFecha(t.fecha_salida)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2 text-white/50">
                  <Users size={14} />
                  <span>{t.total_pasajeros} pasajero(s)</span>
                </div>
                {t.transporte?.placa ? (
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Truck size={14} />
                    <span className="font-mono">{t.transporte.placa}</span>
                  </div>
                ) : (
                  <span className="text-yellow-400/70 text-[12px]">Sin transporte</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Tarjeta detalle del tour ──────────────────────────────────
function TarjetaTourDetalle({ tour, onIncidencia }: { tour: TourHoy; onIncidencia: () => void }) {
  const [verPasajeros, setVerPasajeros] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Columna izquierda: info del tour */}
      <div className="lg:col-span-2 space-y-5">

        {/* Card foto + info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {tour.paquete?.foto_principal && (
            <div className="h-[200px] relative">
              <img src={tour.paquete.foto_principal} alt={tour.paquete.nombre}
                className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                <h3 className="text-white font-black text-[24px] leading-tight pr-4">{tour.paquete.nombre}</h3>
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-black shrink-0 ${COLORES_ESTADO[tour.estado] ?? COLORES_ESTADO.planificacion}`}>
                  {LABELS_ESTADO[tour.estado] ?? tour.estado}
                </span>
              </div>
            </div>
          )}
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoItem icono={<Calendar size={16} className="text-[#D4A017]" />}
              label="Fecha" valor={formatearFecha(tour.fecha_salida)} />
            <InfoItem icono={<Clock size={16} className="text-[#D4A017]" />}
              label="Duración" valor={`${tour.paquete?.duracion_horas ?? "—"}h`} />
            <InfoItem icono={<Users size={16} className="text-[#D4A017]" />}
              label="Pasajeros" valor={`${tour.total_pasajeros} persona(s)`} />
            <InfoItem
              icono={<Truck size={16} className={tour.transporte ? "text-[#D4A017]" : "text-yellow-400"} />}
              label="Transporte"
              valor={tour.transporte?.placa ?? "Pendiente"}
              className={!tour.transporte ? "text-yellow-400" : ""}
            />
            {tour.transporte && (
              <InfoItem icono={<Shield size={16} className="text-[#D4A017]" />}
                label="Capacidad" valor={`${tour.transporte.capacidad} asientos`} />
            )}
            <InfoItem
              icono={<AlertTriangle size={16} className={tour.incidencias_hoy > 0 ? "text-red-400" : "text-green-400"} />}
              label="Incidencias"
              valor={tour.incidencias_hoy === 0 ? "Sin incidencias" : `${tour.incidencias_hoy} reportada(s)`}
              className={tour.incidencias_hoy > 0 ? "text-red-400" : "text-green-400"}
            />
          </div>
        </div>

        {/* Lista de pasajeros */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <button onClick={() => setVerPasajeros(p => !p)}
            className="w-full flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors">
            <span className="text-white font-bold text-[16px] flex items-center gap-2">
              <Users size={18} className="text-[#D4A017]" />
              Lista de pasajeros
              <span className="bg-[#D4A017]/20 text-[#D4A017] text-[11px] font-black px-2 py-0.5 rounded-full">
                {tour.total_pasajeros}
              </span>
            </span>
            <ChevronDown size={18} className={`text-white/40 transition-transform ${verPasajeros ? "rotate-180" : ""}`} />
          </button>

          {verPasajeros && (
            <div className="px-6 pb-5 space-y-3 border-t border-white/5 pt-4">
              {tour.pasajeros.length === 0 ? (
                <p className="text-white/30 text-[14px] text-center py-6">Sin pasajeros confirmados</p>
              ) : (
                tour.pasajeros.map((p, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-11 h-11 rounded-full bg-[#D4A017] flex items-center justify-center text-[#1A1A2E] font-black text-[15px] shrink-0 overflow-hidden">
                      {p.foto_perfil
                        ? <img src={p.foto_perfil} className="w-full h-full object-cover" alt="foto" />
                        : (p.nombre_completo ?? "?").charAt(0)
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-[15px] truncate">{p.nombre_completo}</p>
                      {p.telefono && (
                        <p className="text-white/40 text-[13px] flex items-center gap-1 mt-0.5">
                          <Phone size={12} /> {p.telefono}
                        </p>
                      )}
                    </div>
                    <span className="text-white/40 text-[13px] shrink-0 bg-white/5 px-2 py-1 rounded-lg">
                      {p.cantidad} pax
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Columna derecha: instrucciones + acciones */}
      <div className="space-y-5">

        {/* Instrucciones */}
        <div className="bg-[#1A1A2E]/60 border border-white/10 rounded-2xl p-6">
          <p className="text-[#D4A017] text-[12px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin size={13} /> Instrucciones
          </p>
          <ol className="space-y-3">
            {[
              "Confirma la asistencia de cada pasajero al abordar.",
              "Verifica el vehículo antes de la salida.",
              "Mantén comunicación con la oficina.",
              "Registra cualquier incidencia.",
              "Confirma el regreso de todos al finalizar.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px] text-white/70">
                <span className="w-5 h-5 rounded-full bg-[#D4A017]/20 text-[#D4A017] text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>

        {/* Acciones */}
        <div className="space-y-3">
          <div className={`flex items-center justify-center gap-2 py-4 rounded-xl text-[14px] font-bold border ${
            tour.incidencias_hoy === 0
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            <CheckCircle size={18} />
            {tour.incidencias_hoy === 0 ? "Sin incidencias hoy" : `${tour.incidencias_hoy} incidencia(s)`}
          </div>
          <button onClick={onIncidencia}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-4 rounded-xl text-[14px] font-bold transition-colors cursor-pointer">
            <AlertTriangle size={18} /> Reportar incidencia
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente info item ──────────────────────────────────────
function InfoItem({ icono, label, valor, className = "" }: {
  icono: React.ReactNode; label: string; valor: string; className?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icono}</div>
      <div>
        <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider">{label}</p>
        <p className={`text-white font-bold text-[14px] mt-0.5 ${className}`}>{valor}</p>
      </div>
    </div>
  );
}

// ── Modal Incidencia ──────────────────────────────────────────
function ModalIncidencia({ codGrupo, onCerrar, onGuardado }: {
  codGrupo: number; onCerrar: () => void; onGuardado: () => void;
}) {
  const [descripcion, setDescripcion] = useState("");
  const [gravedad, setGravedad]       = useState<"leve" | "moderado" | "grave">("leve");
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState("");

  const guardar = async () => {
    if (!descripcion.trim()) return setError("Describe la incidencia.");
    setGuardando(true); setError("");
    try {
      await api.post("/guia/incidencias", {
        cod_grupo: codGrupo, descripcion, nivel_gravedad: gravedad,
      });
      onGuardado();
    } catch {
      setError("Error al registrar la incidencia.");
    } finally { setGuardando(false); }
  };

  const GRAVEDADES: { key: "leve" | "moderado" | "grave"; label: string; color: string }[] = [
    { key: "leve",     label: "Leve",     color: "bg-green-500/10 border-green-500/30 text-green-400" },
    { key: "moderado", label: "Moderado", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
    { key: "grave",    label: "Grave",    color: "bg-red-500/10 border-red-500/30 text-red-400" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0D1117] border border-white/10 rounded-3xl w-full max-w-lg p-6 pb-8 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-black text-[18px] flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-400" /> Reportar Incidencia
          </h3>
          <button onClick={onCerrar}
            className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider block mb-2">
              Nivel de gravedad
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GRAVEDADES.map(g => (
                <button key={g.key} onClick={() => setGravedad(g.key)}
                  className={`py-3 rounded-xl text-[13px] font-bold border transition-all cursor-pointer ${
                    gravedad === g.key ? g.color : "bg-white/5 border-white/10 text-white/40"
                  }`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider block mb-2">
              Descripción *
            </label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
              placeholder="Describe brevemente lo ocurrido..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#D4A017]/50 resize-none" />
          </div>
        </div>
        {error && (
          <p className="mt-3 text-red-400 text-[13px] bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            {error}
          </p>
        )}
        <button onClick={guardar} disabled={guardando}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-black py-3.5 rounded-xl transition-all cursor-pointer">
          {guardando ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Registrar Incidencia</>}
        </button>
      </div>
    </div>
  );
}

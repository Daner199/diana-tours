import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Loader2, RefreshCw, Users, Calendar,
  Truck, UserCheck, AlertTriangle, X, Save,
  ChevronDown, Eye
} from "lucide-react";
import api from "../../api";

// ── Interfaces ────────────────────────────────────────────────
interface Paquete { cod: number; nombre: string; foto_principal: string | null; }
interface Guia    { cod: number; nombre: string; apellido_paterno: string; }

interface Asignacion {
  cod_guia: number | null;
  nombre_guia: string | null;
  placa_transporte: string | null;
  capacidad_transporte: number | null;
}

interface Grupo {
  cod: number;
  fecha_salida: string;
  aforo_minimo: number;
  aforo_maximo: number;
  estado: string;
  paquete: Paquete | null;
  asignacion: Asignacion | null;
}

interface Pasajero {
  nombre_completo: string;
  telefono: string | null;
  foto_perfil: string | null;
  cantidad: number;
}

interface PasajerosData {
  grupo: { cod: number; fecha_salida: string; paquete: string };
  pasajeros: Pasajero[];
  total: number;
}

type ModalTipo = "crear" | "guia" | "transporte" | "pasajeros" | null;

// ── Helpers ───────────────────────────────────────────────────
const COLORES_ESTADO: Record<string, string> = {
  planificacion: "bg-gray-100    text-gray-700",
  confirmado:    "bg-green-100   text-green-700",
  en_curso:      "bg-blue-100    text-blue-700",
  completado:    "bg-[#1A1A2E]   text-white",
  cancelado:     "bg-red-100     text-red-700",
};

const LABELS_ESTADO: Record<string, string> = {
  planificacion: "Planificación",
  confirmado:    "Confirmado",
  en_curso:      "En Curso",
  completado:    "Completado",
  cancelado:     "Cancelado",
};

// ── Componente principal ──────────────────────────────────────
export default function GruposGestor() {
  const [grupos, setGrupos]       = useState<Grupo[]>([]);
  const [paquetes, setPaquetes]   = useState<Paquete[]>([]);
  const [guias, setGuias]         = useState<Guia[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [modal, setModal]         = useState<ModalTipo>(null);
  const [grupoSel, setGrupoSel]   = useState<Grupo | null>(null);
  const [pasajerosData, setPasajerosData] = useState<PasajerosData | null>(null);
  const [error, setError]         = useState("");

  const cargarDatos = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const [rGrupos, rPaquetes, rUsuarios] = await Promise.all([
        api.get("/admin/grupos"),
        api.get("/admin/paquetes"),
        api.get("/admin/usuarios"),
      ]);
      setGrupos(Array.isArray(rGrupos.data) ? rGrupos.data : []);
      setPaquetes(Array.isArray(rPaquetes.data) ? rPaquetes.data : []);
      setGuias((Array.isArray(rUsuarios.data) ? rUsuarios.data : [])
      .filter((u: { rol: string }) =>
  u.rol === "Guía Turístico" ||
  u.rol === "Guia Turistico" ||
  u.rol?.toLowerCase().includes("guía") ||
  u.rol?.toLowerCase().includes("guia")
));
    } catch { setError("Error al cargar los datos."); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => cargarDatos(), 0); return () => clearTimeout(t); }, [cargarDatos]);

  const abrirModal = (tipo: ModalTipo, grupo?: Grupo) => {
    setError("");
    setGrupoSel(grupo ?? null);
    setModal(tipo);
  };

  const verPasajeros = async (grupo: Grupo) => {
    setGrupoSel(grupo);
    setModal("pasajeros");
    try {
      const res = await api.get(`/admin/grupos/${grupo.cod}/pasajeros`);
      setPasajerosData(res.data);
    } catch { setError("Error al cargar pasajeros."); }
  };

  const cerrarModal = () => { setModal(null); setGrupoSel(null); setPasajerosData(null); setError(""); };

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8]">

      <header className="h-[80px] bg-white flex items-center justify-between px-8 shadow-sm border-b border-gray-200 shrink-0">
        <h1 className="text-[24px] font-black text-[#1A1A2E]">Grupos Operativos</h1>
        <div className="flex gap-3">
          <button onClick={() => cargarDatos(true)} disabled={cargando}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50">
            <RefreshCw size={15} className={cargando ? "animate-spin" : ""} /> Actualizar
          </button>
          <button onClick={() => abrirModal("crear")}
            className="bg-[#1A1A2E] hover:bg-[#D4A017] text-white px-5 py-2.5 rounded-xl font-bold text-[14px] flex items-center gap-2 shadow-md transition-colors cursor-pointer">
            <Plus size={18} /> Nuevo Grupo
          </button>
        </div>
      </header>
{error && (
  <div className="mx-8 mt-4 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-[13px] shrink-0 flex items-center gap-2">
    <AlertTriangle size={16} className="shrink-0" />
    <span>{error}</span>
  </div>
)}

      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin mb-4 text-[#D4A017]" />
              <p className="text-gray-500 font-medium">Cargando grupos...</p>
            </div>
          ) : grupos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Users size={48} className="text-gray-300 mb-3" />
              <p className="font-bold text-[#1A1A2E]">No hay grupos creados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[12px] uppercase tracking-wider border-b border-gray-200">

                    <th className="px-6 py-4 font-bold">Paquete</th>
                    <th className="px-6 py-4 font-bold">Fecha Salida</th>
                    <th className="px-6 py-4 font-bold">Aforo</th>
                    <th className="px-6 py-4 font-bold">Guía</th>
                    <th className="px-6 py-4 font-bold">Transporte</th>
                    <th className="px-6 py-4 font-bold">Estado</th>
                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-[14px]">
                  {grupos.map(g => (
                    <tr key={g.cod} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">

                      <td className="px-6 py-4">
                        <p className="font-bold text-[#1A1A2E]">{g.paquete?.nombre ?? "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={14} className="text-[#D4A017]" />
                          {g.fecha_salida}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {g.aforo_minimo}–{g.aforo_maximo} pax
                      </td>
                      <td className="px-6 py-4">
                        {g.asignacion?.nombre_guia ? (
                          <span className="flex items-center gap-1.5 text-green-700 font-medium text-[13px]">
                            <UserCheck size={14} /> {g.asignacion.nombre_guia}
                          </span>
                        ) : (
                          <button onClick={() => abrirModal("guia", g)}
                            className="text-[#D4A017] text-[12px] font-bold hover:underline cursor-pointer flex items-center gap-1">
                            <Plus size={12} /> Asignar
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {g.asignacion?.placa_transporte ? (
                          <span className="flex items-center gap-1.5 text-gray-700 font-medium text-[13px]">
                            <Truck size={14} /> {g.asignacion.placa_transporte}
                          </span>
                        ) : (
                          <button onClick={() => abrirModal("transporte", g)}
                            className="text-[#D4A017] text-[12px] font-bold hover:underline cursor-pointer flex items-center gap-1">
                            <Plus size={12} /> Asignar
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${COLORES_ESTADO[g.estado] ?? COLORES_ESTADO.planificacion}`}>
                          {LABELS_ESTADO[g.estado] ?? g.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => verPasajeros(g)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Ver pasajeros">
                            <Eye size={17} />
                          </button>
                          {g.asignacion?.nombre_guia && (
                            <button onClick={() => abrirModal("guia", g)}
                              className="p-2 text-[#D4A017] hover:bg-yellow-50 rounded-lg transition-colors cursor-pointer" title="Cambiar guía">
                              <UserCheck size={17} />
                            </button>
                          )}
                          {g.asignacion?.placa_transporte && (
                            <button onClick={() => abrirModal("transporte", g)}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Cambiar transporte">
                              <Truck size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODALES */}
      {modal === "crear" && (
        <ModalCrearGrupo paquetes={paquetes} onCerrar={cerrarModal} onGuardado={() => { cerrarModal(); cargarDatos(true); }} />
      )}
      {modal === "guia" && grupoSel && (
        <ModalAsignarGuia grupo={grupoSel} guias={guias} onCerrar={cerrarModal} onGuardado={() => { cerrarModal(); cargarDatos(true); }} />
      )}
      {modal === "transporte" && grupoSel && (
        <ModalAsignarTransporte grupo={grupoSel} onCerrar={cerrarModal} onGuardado={() => { cerrarModal(); cargarDatos(true); }} />
      )}
      {modal === "pasajeros" && grupoSel && (
        <ModalPasajeros data={pasajerosData} onCerrar={cerrarModal} />
      )}
    </div>
  );
}

// ── Modal Crear Grupo ─────────────────────────────────────────
function ModalCrearGrupo({ paquetes, onCerrar, onGuardado }: {
  paquetes: Paquete[]; onCerrar: () => void; onGuardado: () => void;
}) {
  const [codPaquete, setCodPaquete] = useState("");
  const [fecha, setFecha]           = useState("");
  const [aforoMin, setAforoMin]     = useState("5");
  const [aforoMax, setAforoMax]     = useState("20");
  const [guardando, setGuardando]   = useState(false);
  const [error, setError]           = useState("");

  const guardar = async () => {
    if (!codPaquete || !fecha) return setError("Selecciona un paquete y una fecha.");
    setGuardando(true); setError("");
    try {
      await api.post("/admin/grupos", {
        cod_paquete: codPaquete, fecha_salida: fecha,
        aforo_minimo: aforoMin, aforo_maximo: aforoMax,
      });
      onGuardado();
    } catch (e) {
      const err = e as { response?: { data?: { mensaje?: string } } };
      setError(err?.response?.data?.mensaje ?? "Error al crear el grupo.");
    } finally { setGuardando(false); }
  };

  return (
    <ModalBase titulo="Nuevo Grupo Operativo" onCerrar={onCerrar}>
     {error && (
  <p className="mb-4 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] flex items-center gap-2">
    <AlertTriangle size={16} className="shrink-0" />
    <span>{error}</span>
  </p>
)}
      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Paquete Turístico *</label>
          <div className="relative">
            <select value={codPaquete} onChange={e => setCodPaquete(e.target.value)}
              className="w-full h-[48px] px-4 pr-10 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px] bg-white appearance-none">
              <option value="">Seleccionar paquete</option>
              {paquetes.map(p => <option key={p.cod} value={p.cod}>{p.nombre}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Fecha de Salida *</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Aforo Mínimo</label>
            <input type="number" value={aforoMin} onChange={e => setAforoMin(e.target.value)} min="1"
              className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Aforo Máximo</label>
            <input type="number" value={aforoMax} onChange={e => setAforoMax(e.target.value)} min="1"
              className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
          </div>
        </div>
      </div>
      <BotonesModal onCerrar={onCerrar} onGuardar={guardar} guardando={guardando} textoGuardar="Crear Grupo" />
    </ModalBase>
  );
}

// ── Modal Asignar Guía ────────────────────────────────────────
function ModalAsignarGuia({ grupo, guias, onCerrar, onGuardado }: {
  grupo: Grupo; guias: Guia[]; onCerrar: () => void; onGuardado: () => void;
}) {
  const [codGuia, setCodGuia]     = useState(grupo.asignacion?.cod_guia?.toString() ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState("");

  const guardar = async () => {
    if (!codGuia) return setError("Selecciona un guía.");
    setGuardando(true); setError("");
    try {
      await api.post(`/admin/grupos/${grupo.cod}/asignar-guia`, { cod_guia: codGuia });
      onGuardado();
    } catch (e) {
      const err = e as { response?: { data?: { mensaje?: string } } };
      setError(err?.response?.data?.mensaje ?? "Error al asignar el guía.");
    } finally { setGuardando(false); }
  };

  return (
    <ModalBase titulo="Asignar Guía" onCerrar={onCerrar}>
      {error && (
  <p className="mb-4 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] flex items-center gap-2">
    <AlertTriangle size={16} className="shrink-0" />
    <span>{error}</span>
  </p>
)}
      <p className="text-gray-500 text-[13px] mb-4">Grupo: <strong className="text-[#1A1A2E]">{grupo.paquete?.nombre}</strong> — {grupo.fecha_salida}</p>
      <div>
        <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Guía disponible *</label>
        <div className="relative">
          <select value={codGuia} onChange={e => setCodGuia(e.target.value)}
            className="w-full h-[48px] px-4 pr-10 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px] bg-white appearance-none">
            <option value="">Seleccionar guía</option>
            {guias.map(g => <option key={g.cod} value={g.cod}>{g.nombre} {g.apellido_paterno}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <BotonesModal onCerrar={onCerrar} onGuardar={guardar} guardando={guardando} textoGuardar="Asignar Guía" />
    </ModalBase>
  );
}

// ── Modal Asignar Transporte ──────────────────────────────────
function ModalAsignarTransporte({ grupo, onCerrar, onGuardado }: {
  grupo: Grupo; onCerrar: () => void; onGuardado: () => void;
}) {
  const [placa, setPlaca]           = useState(grupo.asignacion?.placa_transporte ?? "");
  const [capacidad, setCapacidad]   = useState(grupo.asignacion?.capacidad_transporte?.toString() ?? "");
  const [guardando, setGuardando]   = useState(false);
  const [error, setError]           = useState("");

  const guardar = async () => {
    if (!placa || !capacidad) return setError("Completa todos los campos.");
    setGuardando(true); setError("");
    try {
      await api.post(`/admin/grupos/${grupo.cod}/asignar-transporte`, {
        placa_transporte: placa, capacidad_transporte: capacidad,
      });
      onGuardado();
    } catch (e) {
      const err = e as { response?: { data?: { mensaje?: string } } };
      setError(err?.response?.data?.mensaje ?? "Error al asignar el transporte.");
    } finally { setGuardando(false); }
  };

  return (
    <ModalBase titulo="Asignar Transporte" onCerrar={onCerrar}>
      {error && (
  <p className="mb-4 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-[13px] flex items-center gap-2">
    <AlertTriangle size={16} className="shrink-0" />
    <span>{error}</span>
  </p>
)}
      <p className="text-gray-500 text-[13px] mb-4">
        Aforo máximo del grupo: <strong className="text-[#1A1A2E]">{grupo.aforo_maximo} personas</strong>
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Placa del vehículo *</label>
          <input value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="Ej: 2345-ABC"
            className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px] font-mono" />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">
            Capacidad *
            <span className="text-gray-400 font-normal ml-1">(mín. {grupo.aforo_maximo} personas)</span>
          </label>
          <input type="number" value={capacidad} onChange={e => setCapacidad(e.target.value)} min={grupo.aforo_maximo}
            className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
        </div>
      </div>
      <BotonesModal onCerrar={onCerrar} onGuardar={guardar} guardando={guardando} textoGuardar="Asignar Transporte" />
    </ModalBase>
  );
}

// ── Modal Pasajeros ───────────────────────────────────────────
function ModalPasajeros({ data, onCerrar }: { data: PasajerosData | null; onCerrar: () => void }) {
  return (
    <ModalBase titulo="Pasajeros del Grupo" onCerrar={onCerrar}>
      {!data ? (
        <div className="flex justify-center py-8"><Loader2 size={32} className="animate-spin text-[#D4A017]" /></div>
      ) : (
        <>
          <p className="text-gray-500 text-[13px] mb-4">
            {data.grupo.paquete} — {data.grupo.fecha_salida} ·
            <strong className="text-[#1A1A2E] ml-1">{data.total} pasajero(s) confirmado(s)</strong>
          </p>
          {data.pasajeros.length === 0 ? (
            <div className="text-center py-8">
              <Users size={40} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-[13px]">Sin pasajeros confirmados aún</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {data.pasajeros.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A2E] flex items-center justify-center text-white font-bold text-[13px] shrink-0 overflow-hidden">
                    {p.foto_perfil
                      ? <img src={p.foto_perfil} className="w-full h-full object-cover" alt="foto" />
                      : (p.nombre_completo ?? "?").charAt(0)
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1A1A2E] text-[14px]">{p.nombre_completo}</p>
                    <p className="text-gray-400 text-[12px]">{p.telefono ?? "Sin teléfono"} · {p.cantidad} pasajero(s)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <div className="mt-6">
        <button onClick={onCerrar}
          className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 cursor-pointer">
          Cerrar
        </button>
      </div>
    </ModalBase>
  );
}

// ── Componentes base reutilizables ────────────────────────────
function ModalBase({ titulo, onCerrar, children }: {
  titulo: string; onCerrar: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between shrink-0 rounded-t-3xl">
          <h2 className="text-white font-black text-[18px]">{titulo}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white cursor-pointer"><X size={22} /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function BotonesModal({ onCerrar, onGuardar, guardando, textoGuardar }: {
  onCerrar: () => void; onGuardar: () => void; guardando: boolean; textoGuardar: string;
}) {
  return (
    <div className="flex gap-3 mt-6">
      <button onClick={onCerrar}
        className="flex-1 border border-gray-200 bg-white text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-100 cursor-pointer">
        Cancelar
      </button>
      <button onClick={onGuardar} disabled={guardando}
        className="flex-1 bg-[#1A1A2E] hover:bg-[#D4A017] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60">
        {guardando ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {textoGuardar}</>}
      </button>
    </div>
  );
}

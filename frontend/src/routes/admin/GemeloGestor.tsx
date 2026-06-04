import React, { useState, useEffect, useCallback } from "react";
import {
  Globe, Plus, Trash2, Loader2, X, Save,
  Info, Navigation, Eye, ChevronDown, ChevronUp, AlertCircle, RefreshCw
} from "lucide-react";
import api from "../../api";

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Sitio { cod: number; nombre: string; }

interface Hotspot {
  cod: number;
  tipo_interaccion: "informacion" | "navegacion";
  posicion_x: number;
  posicion_y: number;
  texto_informativo: string | null;
  cod_escena_destino: number | null;
}

interface Escena {
  cod: number;
  nombre: string;
  archivo_imagen_url: string;
  es_inicio: boolean;
  total_hotspots: number;
  hotspots: Hotspot[];
}

// ── Helper: detectar tipo de URL para evitar previews rotas ───────────────────
function esMapsEmbed(url: string): boolean {
  if (!url) return false;
  const u = url.trim();
  return u.startsWith("<iframe") || u.includes("googleusercontent.com") || u.includes("google.com/maps") || u.includes("maps.google.com");
}

// ── URLs panorámicas 360° de ejemplo ──────────────────────────────────────────
const URLS_EJEMPLO = [
  { label: "Montaña nevada (demo oficial Pannellum)", url: "https://pannellum.org/images/alma.jpg" },
  { label: "Aeropuerto JFK interior (demo Pannellum)", url: "https://pannellum.org/images/jfk.jpg" },
  { label: "Basílica San Pedro interior (Wikimedia)", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Photosphere_of_St_Peter%27s_Basilica%2C_Vatican_City.jpg/2560px-Photosphere_of_St_Peter%27s_Basilica%2C_Vatican_City.jpg" },
  { label: "Paisaje cielo estrellado (Wikimedia)", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Stereographic_projection_SW.jpg/2560px-Stereographic_projection_SW.jpg" },
];

// ── Componente principal ──────────────────────────────────────────────────────
export default function GemeloGestor() {
  const [sitios, setSitios]         = useState<Sitio[]>([]);
  const [sitioSel, setSitioSel]     = useState<number | null>(null);
  const [escenas, setEscenas]       = useState<Escena[]>([]);
  const [cargando, setCargando]     = useState(false);
  const [cargandoSitios, setCargandoSitios] = useState(true);
  const [expandida, setExpandida]   = useState<number | null>(null);

  // Modales
  const [modalEscena, setModalEscena]   = useState(false);
  const [modalHotspot, setModalHotspot] = useState<number | null>(null); // cod_escena
  const [escenaEditar, setEscenaEditar] = useState<Escena | null>(null);

  // Cargar sitios al montar
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await api.get<Sitio[]>("/sitios");
        setSitios(res.data);
      } catch (e) { console.error(e); }
      finally { setCargandoSitios(false); }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Cargar escenas cuando cambia el sitio
  const cargarEscenas = useCallback(async (silencioso = false) => {
    if (!sitioSel) return;
    if (!silencioso) setCargando(true);
    try {
      const res = await api.get<Escena[]>("/admin/gemelo/" + sitioSel + "/escenas");
      setEscenas(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }, [sitioSel]);

  useEffect(() => {
    if (sitioSel) {
      const t = setTimeout(() => {
        setEscenas([]);
        setExpandida(null);
        cargarEscenas();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [sitioSel, cargarEscenas]);

  const eliminarEscena = async (cod: number) => {
    if (!window.confirm("¿Eliminar esta escena y todos sus hotspots?")) return;
    try {
      await api.delete("/admin/gemelo/escenas/" + cod);
      cargarEscenas(true);
    } catch (e) { console.error(e); }
  };

  const eliminarHotspot = async (cod: number) => {
    if (!window.confirm("¿Eliminar este hotspot?")) return;
    try {
      await api.delete("/admin/gemelo/hotspots/" + cod);
      cargarEscenas(true);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-[80px] bg-white flex items-center justify-between px-8 shadow-sm border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <Globe size={26} className="text-[#D4A017]" />
          <div>
            <h1 className="text-[22px] font-black text-[#1A1A2E]">Gemelo Digital 360°</h1>
            <p className="text-[12px] text-gray-400">Gestión de escenas panorámicas e hotspots</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sitioSel && (
            <button
              onClick={() => cargarEscenas(true)}
              className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-xl"
            >
              <RefreshCw size={16} />
            </button>
          )}
          {sitioSel && (
            <button
              onClick={() => { setEscenaEditar(null); setModalEscena(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A2E] hover:bg-[#D4A017] text-white rounded-xl font-bold text-[13px]"
            >
              <Plus size={16} />
              <span>Nueva Escena</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">

        {/* Selector de sitio */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">
            Selecciona un Sitio Turístico
          </label>
          {cargandoSitios ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[13px]">Cargando sitios...</span>
            </div>
          ) : (
            <select
              value={sitioSel ?? ""}
              onChange={(e) => setSitioSel(e.target.value ? Number(e.target.value) : null)}
              className="w-full max-w-[400px] h-[48px] px-4 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#D4A017] bg-white"
            >
              <option value="">-- Elige un sitio --</option>
              {sitios.map((s) => (
                <option key={s.cod} value={s.cod}>{s.nombre}</option>
              ))}
            </select>
          )}
        </div>

        {/* Escenas */}
        {sitioSel && (
          <>
            {cargando ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <Loader2 size={36} className="animate-spin mb-3 text-[#D4A017]" />
                <p className="font-medium">Cargando escenas...</p>
              </div>
            ) : escenas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 flex flex-col items-center text-gray-400">
                <Globe size={48} className="mb-3 text-gray-200" />
                <p className="font-bold text-[#1A1A2E] text-[15px]">Sin escenas registradas</p>
                <p className="text-[13px] mt-1">Agrega la primera escena panorámica para este sitio.</p>
                <button
                  onClick={() => setModalEscena(true)}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[#1A1A2E] hover:bg-[#D4A017] text-white rounded-xl font-bold text-[13px]"
                >
                  <Plus size={16} />
                  <span>Agregar Escena</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[12px] text-gray-400 font-medium">{escenas.length + " escenas registradas"}</p>
                {escenas.map((esc) => (
                  <div key={esc.cod} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Cabecera escena */}
                    <div className="flex items-center gap-4 px-5 py-4">
                      {/* Preview imagen */}
                      <div className="w-20 h-14 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-gray-100 flex items-center justify-center">
                        {esMapsEmbed(esc.archivo_imagen_url) ? (
                          <Globe size={20} className="text-blue-500" />
                        ) : (
                          <img
                            src={esc.archivo_imagen_url}
                            alt={esc.nombre}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-[#1A1A2E] text-[15px] truncate">{esc.nombre}</p>
                          {esc.es_inicio && (
                            <span className="px-2 py-0.5 bg-[#D4A017] text-white text-[10px] font-black rounded-full shrink-0">
                              INICIO
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-gray-400 mt-0.5 truncate max-w-[400px]">{esc.archivo_imagen_url}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{esc.total_hotspots + " hotspots"}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={"/viewer?sitio=" + sitioSel + "&escena=" + esc.cod}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                          title="Ver en 360°"
                        >
                          <Eye size={18} />
                        </a>
                        <button
                          onClick={() => setModalHotspot(esc.cod)}
                          className="p-2 text-[#1B4332] hover:bg-green-50 rounded-lg"
                          title="Agregar hotspot"
                        >
                          <Plus size={18} />
                        </button>
                        <button
                          onClick={() => { setEscenaEditar(esc); setModalEscena(true); }}
                          className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"
                          title="Editar escena"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={() => eliminarEscena(esc.cod)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                          title="Eliminar escena"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => setExpandida(expandida === esc.cod ? null : esc.cod)}
                          className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"
                        >
                          {expandida === esc.cod ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Hotspots expandidos */}
                    {expandida === esc.cod && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                        <p className="text-[12px] font-black text-gray-500 uppercase tracking-wide mb-3">Hotspots</p>
                        {esc.hotspots.length === 0 ? (
                          <p className="text-[13px] text-gray-400">Sin hotspots. Usa el botón + para agregar uno.</p>
                        ) : (
                          <div className="space-y-2">
                            {esc.hotspots.map((h) => (
                              <div key={h.cod} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-200">
                                <div className={"w-8 h-8 rounded-lg flex items-center justify-center shrink-0 " + (h.tipo_interaccion === "informacion" ? "bg-blue-100" : "bg-green-100")}>
                                  {h.tipo_interaccion === "informacion"
                                    ? <Info size={14} className="text-blue-600" />
                                    : <Navigation size={14} className="text-green-600" />
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-bold text-[#1A1A2E]">
                                    {h.tipo_interaccion === "informacion" ? "Información" : "Navegación"}
                                    <span className="text-gray-400 font-normal ml-2">
                                      {"X:" + h.posicion_x.toFixed(1) + " Y:" + h.posicion_y.toFixed(1)}
                                    </span>
                                  </p>
                                  {h.texto_informativo && (
                                    <p className="text-[11px] text-gray-500 truncate">{h.texto_informativo}</p>
                                  )}
                                  {h.cod_escena_destino && (
                                    <p className="text-[11px] text-green-600">
                                      {"→ Escena #" + h.cod_escena_destino}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => eliminarHotspot(h.cod)}
                                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg shrink-0"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => setModalHotspot(esc.cod)}
                          className="mt-3 flex items-center gap-2 text-[12px] text-[#1A1A2E] font-bold hover:text-[#D4A017]"
                        >
                          <Plus size={14} />
                          <span>Agregar hotspot</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!sitioSel && !cargandoSitios && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start gap-4">
            <AlertCircle size={22} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-blue-800 text-[14px]">Selecciona un sitio para comenzar</p>
              <p className="text-blue-600 text-[13px] mt-1">
                Elige un sitio turístico del selector para ver y gestionar sus escenas 360°.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {modalEscena && (
        <ModalEscena
          sitioSel={sitioSel!}
          escena={escenaEditar}
          onCerrar={() => { setModalEscena(false); setEscenaEditar(null); }}
          onGuardado={() => cargarEscenas(true)}
        />
      )}
      {modalHotspot !== null && (
        <ModalHotspot
          codEscena={modalHotspot}
          escenas={escenas}
          onCerrar={() => setModalHotspot(null)}
          onGuardado={() => cargarEscenas(true)}
        />
      )}
    </div>
  );
}

// ── Modal Crear/Editar Escena ─────────────────────────────────────────────────
function ModalEscena({ sitioSel, escena, onCerrar, onGuardado }: {
  sitioSel: number;
  escena: Escena | null;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [nombre, setNombre]       = useState(escena?.nombre ?? "");
  const [url, setUrl]             = useState(escena?.archivo_imagen_url ?? "");
  const [esInicio, setEsInicio]   = useState(escena?.es_inicio ?? false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState("");

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!url.trim())    { setError("La URL de la imagen es obligatoria."); return; }
    setGuardando(true); setError("");
    try {
      const datos = { cod_sitio: sitioSel, nombre, archivo_imagen_url: url, es_inicio: esInicio };
      if (escena) await api.put("/admin/gemelo/escenas/" + escena.cod, datos);
      else        await api.post("/admin/gemelo/escenas", datos);
      onGuardado(); onCerrar();
    } catch (err) {
      const e = err as { response?: { data?: { mensaje?: string } } };
      setError(e.response?.data?.mensaje ?? "Error al guardar.");
    } finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[520px]">
        <div className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-white font-black text-[17px]">{escena ? "Editar Escena" : "Nueva Escena 360°"}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white"><X size={22} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-[13px] flex gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Nombre de la escena</label>
            <input
              value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Entrada principal"
              className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4A017] text-[14px]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">
              URL de imagen panorámica 360° o iFrame incrustado
            </label>
            <input
              value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ejemplo.com/panoramica.jpg o iFrame externo"
              className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4A017] text-[14px]"
            />
            <div className="mt-2 space-y-1">
              <p className="text-[11px] text-gray-400 font-medium">URLs de ejemplo gratuitas:</p>
              {URLS_EJEMPLO.map((ej, i) => (
                <button
                  key={i}
                  onClick={() => setUrl(ej.url)}
                  className={"w-full text-left px-3 py-2 rounded-lg text-[12px] transition-all " + (url === ej.url ? "bg-[#D4A017]/10 text-[#D4A017] font-bold border border-[#D4A017]/30" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100")}
                >
                  {ej.label}
                </button>
              ))}
            </div>
          </div>
          {url && (
            <div className="rounded-xl overflow-hidden border border-gray-200 h-[140px] bg-gray-100 flex items-center justify-center">
              {esMapsEmbed(url) ? (
                <div className="flex flex-col items-center gap-1 text-blue-500">
                  <Globe size={32} className="animate-pulse" />
                  <span className="text-[12px] font-bold">Integración de Recorrido Externo</span>
                </div>
              ) : (
                <img src={url} alt="preview" className="w-full h-full object-cover" />
              )}
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox" checked={esInicio} onChange={(e) => setEsInicio(e.target.checked)}
              className="w-4 h-4 accent-[#D4A017]"
            />
            <span className="text-[13px] font-medium text-[#1A1A2E]">
              Escena de inicio (primera que ve el turista)
            </span>
          </label>
          <div className="flex gap-3 pt-1">
            <button onClick={onCerrar} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-[13px]">
              Cancelar
            </button>
            <button
              onClick={handleGuardar} disabled={guardando}
              className="flex-1 bg-[#1A1A2E] hover:bg-[#D4A017] text-white py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2"
            >
              {guardando ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /><span>Guardar</span></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Crear Hotspot ───────────────────────────────────────────────────────
function ModalHotspot({ codEscena, escenas, onCerrar, onGuardado }: {
  codEscena: number;
  escenas: Escena[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [tipo, setTipo]           = useState<"informacion" | "navegacion">("informacion");
  const [posX, setPosX]           = useState("");
  const [posY, setPosY]           = useState("");
  const [texto, setTexto]         = useState("");
  const [destino, setDestino]     = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState("");

  const handleGuardar = async () => {
    if (!posX || !posY) { setError("La posición X e Y son obligatorias."); return; }
    if (tipo === "informacion" && !texto.trim()) { setError("El texto informativo es obligatorio."); return; }
    if (tipo === "navegacion" && !destino) { setError("Selecciona la escena destino."); return; }
    setGuardando(true); setError("");
    try {
      await api.post("/admin/gemelo/hotspots", {
        cod_escena:          codEscena,
        tipo_interaccion:    tipo,
        posicion_x:          parseFloat(posX),
        posicion_y:          parseFloat(posY),
        texto_informativo:   tipo === "informacion" ? texto : null,
        cod_escena_destino:  tipo === "navegacion" ? Number(destino) : null,
      });
      onGuardado(); onCerrar();
    } catch (err) {
      const e = err as { response?: { data?: { mensaje?: string } } };
      setError(e.response?.data?.mensaje ?? "Error al guardar el hotspot.");
    } finally { setGuardando(false); }
  };

  const otrasEscenas = escenas.filter((e) => e.cod !== codEscena);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[460px]">
        <div className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-white font-black text-[17px]">Agregar Hotspot</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white"><X size={22} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-[13px] flex gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tipo */}
          <div>
            <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">Tipo de hotspot</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTipo("informacion")}
                className={"flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-[13px] font-bold transition-all " + (tipo === "informacion" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300")}
              >
                <Info size={16} />
                <span>Información</span>
              </button>
              <button
                onClick={() => setTipo("navegacion")}
                className={"flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-[13px] font-bold transition-all " + (tipo === "navegacion" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500 hover:border-gray-300")}
              >
                <Navigation size={16} />
                <span>Navegación</span>
              </button>
            </div>
          </div>

          {/* Posición */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Posición X (Yaw)</label>
              <input
                type="number" step="0.1" value={posX} onChange={(e) => setPosX(e.target.value)}
                placeholder="Ej: 45.0"
                className="w-full h-[44px] px-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4A017] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Posición Y (Pitch)</label>
              <input
                type="number" step="0.1" value={posY} onChange={(e) => setPosY(e.target.value)}
                placeholder="Ej: -10.0"
                className="w-full h-[44px] px-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4A017] text-[13px]"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400">Yaw: -180 a 180 (horizontal) · Pitch: -90 a 90 (vertical)</p>

          {/* Campos según tipo */}
          {tipo === "informacion" && (
            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Texto informativo</label>
              <textarea
                value={texto} onChange={(e) => setTexto(e.target.value)}
                rows={3} placeholder="Descripción que verá el turista al hacer clic..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4A017] text-[13px] resize-none"
              />
            </div>
          )}
          {tipo === "navegacion" && (
            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Escena destino</label>
              {otrasEscenas.length === 0 ? (
                <p className="text-[13px] text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
                  No hay otras escenas para navegar. Crea más escenas primero.
                </p>
              ) : (
                <select
                  value={destino} onChange={(e) => setDestino(e.target.value)}
                  className="w-full h-[44px] px-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4A017] text-[13px] bg-white"
                >
                  <option value="">-- Selecciona escena --</option>
                  {otrasEscenas.map((e) => (
                    <option key={e.cod} value={e.cod}>{e.nombre}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onCerrar} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-[13px]">
              Cancelar
            </button>
            <button
              onClick={handleGuardar} disabled={guardando}
              className="flex-1 bg-[#1B4332] hover:bg-[#1B4332]/80 text-white py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2"
            >
              {guardando ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /><span>Agregar Hotspot</span></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

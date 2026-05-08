import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Loader2, Package, Save, X, Search, MapPin, CheckSquare, Image as ImageIcon, PlusCircle, MinusCircle } from "lucide-react";
import api from "../../api";

interface Sitio {
  cod: number;
  nombre: string;
  tipo: string | null;
}

interface Paquete {
  cod: number;
  nombre: string;
  precio_bs: number;
  duracion_horas: number;
  estado: string;
  foto_principal: string | null;
  acerca_de: string | null;
  que_esperar: string | null;
  itinerario: { dia: number; titulo: string; descripcion: string }[] | null;
  incluye: string[] | null;
  no_incluye: string[] | null;
  sitios?: Sitio[];
}

export default function PaquetesGestor() {
  const [datosPaquetes, setDatosPaquetes] = useState<Paquete[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalPaquete, setModalPaquete] = useState(false);
  const [paqueteEditar, setPaqueteEditar] = useState<Paquete | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get("/admin/paquetes");
      setDatosPaquetes(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cargarDatos(), 0);
    return () => clearTimeout(t);
  }, [cargarDatos]);

  const eliminarPaquete = async (cod: number, nombre: string) => {
    if (window.confirm(`¿Eliminar "${nombre}"?`)) {
      try { await api.delete(`/admin/paquetes/${cod}`); cargarDatos(); }
      catch (e) { console.error(e); }
    }
  };

  const paquetesFiltrados = datosPaquetes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8]">
      <header className="h-[80px] bg-white flex items-center justify-between px-8 shadow-sm border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-[24px] font-black text-[#1A1A2E]">Paquetes Turísticos</h1>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar paquete..." value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full h-[40px] pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] focus:border-[#D4A017] focus:outline-none" />
          </div>
        </div>
        <button onClick={() => setModalPaquete(true)}
          className="bg-[#1A1A2E] hover:bg-[#D4A017] text-white px-5 py-2.5 rounded-xl font-bold text-[14px] flex items-center gap-2 shadow-md transition-colors cursor-pointer">
          <Plus size={18} /> Nuevo Paquete
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin mb-4 text-[#D4A017]" />
              <p className="text-gray-500 font-medium">Cargando catálogo...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[12px] uppercase tracking-wider border-b border-gray-200">
                    <th className="px-6 py-4 font-bold">Paquete</th>
                    <th className="px-6 py-4 font-bold">Sitios</th>
                    <th className="px-6 py-4 font-bold">Precio</th>
                    <th className="px-6 py-4 font-bold">Duración</th>
                    <th className="px-6 py-4 font-bold">Estado</th>
                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-[14px]">
                  {paquetesFiltrados.map(p => (
                    <tr key={p.cod} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.foto_principal
                            ? <img src={p.foto_principal} className="w-12 h-12 rounded-xl object-cover border border-gray-200" alt="paquete" />
                            : <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center"><Package size={18} className="text-gray-400" /></div>
                          }
                          <div>
                            <p className="font-bold text-[#1A1A2E]">{p.nombre}</p>

                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {p.sitios && p.sitios.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.sitios.slice(0, 2).map(s => (
                              <span key={s.cod} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-medium flex items-center gap-1">
                                <MapPin size={9} />{s.nombre}
                              </span>
                            ))}
                            {p.sitios.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[11px]">+{p.sitios.length - 2}</span>
                            )}
                          </div>
                        ) : <span className="text-gray-300 text-[12px]">Sin sitios</span>}
                      </td>
                      <td className="px-6 py-4 text-green-600 font-bold">Bs. {Number(p.precio_bs).toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-600">{Number(p.duracion_horas).toFixed(1)} hrs</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${p.estado === "activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {p.estado.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5">
                        <button onClick={() => setPaqueteEditar(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit size={18} /></button>
                        <button onClick={() => eliminarPaquete(p.cod, p.nombre)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {paquetesFiltrados.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                      <Package size={48} className="mx-auto mb-3 text-gray-300" />
                      <p className="font-bold text-[#1A1A2E]">No hay paquetes registrados</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(modalPaquete || paqueteEditar) && (
        <ModalPaquete
          paquete={paqueteEditar}
          onCerrar={() => { setModalPaquete(false); setPaqueteEditar(null); }}
          onGuardado={cargarDatos}
        />
      )}
    </div>
  );
}

// ============================================================
// MODAL PAQUETE COMPLETO
// ============================================================
function ModalPaquete({ paquete, onCerrar, onGuardado }: {
  paquete?: Paquete | null;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [tabActiva, setTabActiva] = useState<"basico" | "detalle" | "sitios">("basico");

  // Campos básicos
  const [nombre, setNombre] = useState(paquete?.nombre ?? "");
  const [precio, setPrecio] = useState(paquete?.precio_bs?.toString() ?? "");
  const [duracion, setDuracion] = useState(paquete?.duracion_horas?.toString() ?? "");
  const [estado, setEstado] = useState(paquete?.estado ?? "activo");
  const [fotoPrincipal, setFotoPrincipal] = useState(paquete?.foto_principal ?? "");

  // Campos detalle
  const [acercaDe, setAcercaDe] = useState(paquete?.acerca_de ?? "");
  const [queEsperar, setQueEsperar] = useState(paquete?.que_esperar ?? "");
  const [incluye, setIncluye] = useState<string[]>(paquete?.incluye ?? [""]);
  const [noIncluye, setNoIncluye] = useState<string[]>(paquete?.no_incluye ?? [""]);
  const [itinerario, setItinerario] = useState<{ dia: number; titulo: string; descripcion: string }[]>(
    paquete?.itinerario ?? [{ dia: 1, titulo: "", descripcion: "" }]
  );

  // Sitios
  const [sitiosDisponibles, setSitiosDisponibles] = useState<Sitio[]>([]);
  const [cargandoSitios, setCargandoSitios] = useState(true);
  const [sitiosSeleccionados, setSitiosSeleccionados] = useState<number[]>(
    paquete?.sitios?.map(s => s.cod) ?? []
  );

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const r = await api.get("/admin/sitios");
        setSitiosDisponibles(Array.isArray(r.data) ? r.data : []);
      } catch (e) { console.error(e); }
      finally { setCargandoSitios(false); }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError("Imagen máx. 3MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => setFotoPrincipal(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleSitio = (cod: number) => {
    setSitiosSeleccionados(prev =>
      prev.includes(cod) ? prev.filter(c => c !== cod) : [...prev, cod]
    );
  };

  const handleGuardar = async () => {
    if (!nombre.trim() || !precio || !duracion) {
      setError("Nombre, precio y duración son obligatorios.");
      setTabActiva("basico");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const datos = {
        nombre,
        precio_bs: parseFloat(precio),
        duracion_horas: parseFloat(duracion),
        estado,
        foto_principal: fotoPrincipal || null,
        acerca_de: acercaDe || null,
        que_esperar: queEsperar || null,
        itinerario: itinerario.filter(i => i.titulo.trim()),
        incluye: incluye.filter(i => i.trim()),
        no_incluye: noIncluye.filter(i => i.trim()),
        sitios: sitiosSeleccionados,
      };
      if (paquete) await api.put(`/admin/paquetes/${paquete.cod}`, datos);
      else await api.post("/admin/paquetes", datos);
      onGuardado();
      onCerrar();
    } catch (err) {
      const e = err as { response?: { data?: { mensaje?: string } } };
      setError(e.response?.data?.mensaje || "Error al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const tabs = [
    { id: "basico", label: "Información Básica" },
    { id: "detalle", label: "Detalle del Tour" },
    { id: "sitios", label: `Sitios (${sitiosSeleccionados.length})` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[680px] max-h-[92vh] flex flex-col overflow-hidden">

        <div className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between rounded-t-3xl shrink-0">
          <div>
            <h2 className="text-white font-black text-[18px]">{paquete ? "Editar Paquete" : "Nuevo Paquete Turístico"}</h2>
            <p className="text-gray-400 text-[12px]">Completa la información del tour</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white cursor-pointer"><X size={22} /></button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-200 shrink-0 bg-white">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTabActiva(t.id as typeof tabActiva)}
              className={`flex-1 py-3 text-[13px] font-bold transition-colors ${tabActiva === t.id ? "border-b-2 border-[#D4A017] text-[#1A1A2E]" : "text-gray-400 hover:text-gray-600"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-[13px] mb-4">{error}</div>}

          {/* TAB BÁSICO */}
          {tabActiva === "basico" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Nombre del paquete *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. City Tour La Paz"
                  className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Precio (Bs.) *</label>
                  <input type="number" min="0" step="0.50" value={precio} onChange={e => setPrecio(e.target.value)}
                    placeholder="0.00" className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Duración (horas) *</label>
                  <input type="number" min="0.5" step="0.5" value={duracion} onChange={e => setDuracion(e.target.value)}
                    placeholder="3.0" className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Estado</label>
                <select value={estado} onChange={e => setEstado(e.target.value)}
                  className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px] bg-white">
                  <option value="activo">✅ Activo — Visible para turistas</option>
                  <option value="inactivo">❌ Inactivo — Oculto</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Foto principal del paquete</label>
                <div onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[140px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-[#D4A017] cursor-pointer overflow-hidden transition-colors">
                  {fotoPrincipal
                    ? <img src={fotoPrincipal} className="w-full h-full object-cover" alt="Paquete" />
                    : <><ImageIcon size={28} className="mb-2 text-gray-300" /><span className="text-[13px]">Clic para subir foto</span><span className="text-[11px] text-gray-300 mt-1">JPG, PNG — máx. 3MB</span></>
                  }
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFoto} className="hidden" />
                {fotoPrincipal && <button onClick={() => setFotoPrincipal("")} className="mt-1.5 text-[12px] text-red-500 cursor-pointer">✕ Quitar imagen</button>}
              </div>
            </div>
          )}

          {/* TAB DETALLE */}
          {tabActiva === "detalle" && (
            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Acerca del tour</label>
                <textarea value={acercaDe} onChange={e => setAcercaDe(e.target.value)} rows={3}
                  placeholder="Describe el tour en detalle..."
                  className="w-full p-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px] resize-none" />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">¿Qué esperar?</label>
                <textarea value={queEsperar} onChange={e => setQueEsperar(e.target.value)} rows={3}
                  placeholder="Describe la experiencia que vivirá el turista..."
                  className="w-full p-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px] resize-none" />
              </div>

              {/* INCLUYE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-bold text-[#1A1A2E]">✅ Incluye</label>
                  <button onClick={() => setIncluye([...incluye, ""])} className="text-[12px] text-[#D4A017] font-bold flex items-center gap-1 cursor-pointer hover:underline">
                    <PlusCircle size={14} /> Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {incluye.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={item} onChange={e => { const n = [...incluye]; n[i] = e.target.value; setIncluye(n); }}
                        placeholder="Ej. Guía bilingüe"
                        className="flex-1 h-[40px] px-3 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[13px]" />
                      <button onClick={() => setIncluye(incluye.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 cursor-pointer">
                        <MinusCircle size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* NO INCLUYE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-bold text-[#1A1A2E]">❌ No incluye</label>
                  <button onClick={() => setNoIncluye([...noIncluye, ""])} className="text-[12px] text-[#D4A017] font-bold flex items-center gap-1 cursor-pointer hover:underline">
                    <PlusCircle size={14} /> Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {noIncluye.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={item} onChange={e => { const n = [...noIncluye]; n[i] = e.target.value; setNoIncluye(n); }}
                        placeholder="Ej. Vuelos internacionales"
                        className="flex-1 h-[40px] px-3 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[13px]" />
                      <button onClick={() => setNoIncluye(noIncluye.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 cursor-pointer">
                        <MinusCircle size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ITINERARIO */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-bold text-[#1A1A2E]">🗓️ Itinerario</label>
                  <button onClick={() => setItinerario([...itinerario, { dia: itinerario.length + 1, titulo: "", descripcion: "" }])}
                    className="text-[12px] text-[#D4A017] font-bold flex items-center gap-1 cursor-pointer hover:underline">
                    <PlusCircle size={14} /> Agregar día
                  </button>
                </div>
                <div className="space-y-3">
                  {itinerario.map((item, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-black text-[#D4A017] uppercase">Día {item.dia}</span>
                        <button onClick={() => setItinerario(itinerario.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 cursor-pointer">
                          <MinusCircle size={16} />
                        </button>
                      </div>
                      <input value={item.titulo} onChange={e => { const n = [...itinerario]; n[i].titulo = e.target.value; setItinerario(n); }}
                        placeholder="Título del día" className="w-full h-[40px] px-3 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[13px]" />
                      <textarea value={item.descripcion} onChange={e => { const n = [...itinerario]; n[i].descripcion = e.target.value; setItinerario(n); }}
                        placeholder="Descripción de actividades..." rows={2}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[13px] resize-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB SITIOS */}
          {tabActiva === "sitios" && (
            <div>
              <p className="text-[13px] text-gray-500 mb-4">Selecciona los sitios turísticos que forman parte de este paquete.</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {cargandoSitios ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                    <Loader2 size={18} className="animate-spin text-[#D4A017]" />
                    <span className="text-[13px]">Cargando sitios...</span>
                  </div>
                ) : sitiosDisponibles.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <MapPin size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-[13px]">No hay sitios disponibles</p>
                  </div>
                ) : (
                  <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-100">
                    {sitiosDisponibles.map(s => {
                      const sel = sitiosSeleccionados.includes(s.cod);
                      return (
                        <label key={s.cod} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${sel ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                          <input type="checkbox" checked={sel} onChange={() => toggleSitio(s.cod)} className="w-4 h-4 accent-[#D4A017] cursor-pointer" />
                          <span className={`text-[13px] font-medium flex-1 ${sel ? "text-[#1A1A2E]" : "text-gray-600"}`}>{s.nombre}</span>
                          {sel && <CheckSquare size={16} className="text-[#D4A017] shrink-0" />}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              {sitiosSeleccionados.length > 0 && (
                <p className="mt-3 text-[12px] text-gray-400">✓ {sitiosSeleccionados.length} sitio(s) seleccionado(s) — se guardarán en paquete_sitio</p>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0 bg-gray-50 rounded-b-3xl">
          <button onClick={onCerrar} className="flex-1 border border-gray-200 bg-white text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-100 cursor-pointer">Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando}
            className="flex-1 bg-[#1A1A2E] hover:bg-[#D4A017] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60">
            {guardando ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {paquete ? "Actualizar" : "Guardar Paquete"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

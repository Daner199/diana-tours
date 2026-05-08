import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Edit, Trash2, Loader2, Save, X, Image as ImageIcon, MapPin, Map as MapIcon, Search } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../api";

// Fix del icono de Leaflet con Vite/Webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Sitio {
  cod: number;
  nombre: string;
  descripcion: string | null;
  foto: string | null;
  latitud: number | null;
  longitud: number | null;
  estado: string;
}

// FUERA del componente para evitar "cannot create component during render"
function CapturadorClic({ onClic }: { onClic: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onClic(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

// Nuevo componente auxiliar para hacer el "Vuelo" suave en el mapa
function AnimacionVuelo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

const LAT_DEFAULT = -16.4897;
const LNG_DEFAULT = -68.1193;

export default function SitiosGestor() {
  const [datosSitios, setDatosSitios] = useState<Sitio[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [modalSitio, setModalSitio]   = useState(false);
  const [sitioEditar, setSitioEditar] = useState<Sitio | null>(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get("/admin/sitios");
      setDatosSitios(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => cargarDatos(), 0);
    return () => clearTimeout(timer);
  }, [cargarDatos]);

  const eliminarSitio = async (cod: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este sitio?")) {
      try { await api.delete(`/admin/sitios/${cod}`); cargarDatos(); }
      catch (e) { console.error(e); }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8]">
      <header className="h-[80px] bg-white flex items-center justify-between px-8 shadow-sm shrink-0 border-b border-gray-200">
        <h1 className="text-[24px] font-black text-[#1A1A2E]">Gestión de Sitios Turísticos</h1>
        <button onClick={() => setModalSitio(true)} className="bg-[#1A1A2E] hover:bg-[#D4A017] transition-colors text-white px-5 py-2.5 rounded-xl font-bold text-[14px] flex items-center gap-2 shadow-md cursor-pointer">
          <Plus size={18} /> Nuevo Sitio
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin mb-4 text-[#D4A017]" />
              <p className="text-gray-500 font-medium">Cargando sitios...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[12px] uppercase tracking-wider border-b border-gray-200">
                    {/* Se eliminó el <th> de Cod */}
                    <th className="px-6 py-4 font-bold">Nombre</th>
                    <th className="px-6 py-4 font-bold">Coordenadas</th>
                    <th className="px-6 py-4 font-bold">Estado</th>
                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-[14px]">
                  {datosSitios.map(s => (
                    <tr key={s.cod} className="hover:bg-gray-50 border-b border-gray-100 transition-colors">
                      {/* Se eliminó el <td> de #{s.cod} */}
                      <td className="px-6 py-4 font-bold text-[#1A1A2E]">
                        <div className="flex items-center gap-3">
                          {s.foto
                            ? <img src={s.foto} className="w-10 h-10 rounded-lg object-cover border border-gray-200" alt="sitio" />
                            : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><MapIcon size={16} className="text-gray-400" /></div>
                          }
                          <div>
                            <p>{s.nombre}</p>
                            {s.descripcion && <p className="text-gray-400 font-normal text-[12px] truncate max-w-[200px]">{s.descripcion}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-[12px]">
                        {s.latitud ? (
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-[#D4A017]" />{Number(s.latitud).toFixed(4)}, {Number(s.longitud).toFixed(4)}</span>
                        ) : <span className="text-gray-300">Sin ubicación</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${s.estado === "activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.estado.toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => setSitioEditar(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit size={18} /></button>
                        <button onClick={() => eliminarSitio(s.cod)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {datosSitios.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-400">
                      <MapIcon size={48} className="mx-auto mb-3 text-gray-300" />
                      <p className="font-bold text-[#1A1A2E]">No hay sitios registrados</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(modalSitio || sitioEditar) && (
        <ModalSitio sitio={sitioEditar} onCerrar={() => { setModalSitio(false); setSitioEditar(null); }} onGuardado={cargarDatos} />
      )}
    </div>
  );
}

function ModalSitio({ sitio, onCerrar, onGuardado }: { sitio?: Sitio | null; onCerrar: () => void; onGuardado: () => void }) {
  const [nombre, setNombre]           = useState(sitio?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(sitio?.descripcion ?? "");
  const [foto, setFoto]               = useState(sitio?.foto ?? "");
  const [estado, setEstado]           = useState(sitio?.estado ?? "activo");
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState("");

  const [latitud, setLatitud]   = useState<number>(sitio?.latitud ? Number(sitio.latitud) : LAT_DEFAULT);
  const [longitud, setLongitud] = useState<number>(sitio?.longitud ? Number(sitio.longitud) : LNG_DEFAULT);
  const [marcadorVisible, setMarcadorVisible] = useState(sitio?.latitud != null);

  // Estado para controlar el botón de la lupa
  const [buscandoMapa, setBuscandoMapa] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("La imagen no debe superar 2MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => setFoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleMapClic = (lat: number, lng: number) => {
    setLatitud(parseFloat(lat.toFixed(8)));
    setLongitud(parseFloat(lng.toFixed(8)));
    setMarcadorVisible(true);
  };

  // Función que busca el texto ingresado en el servidor de OpenStreetMap
  const buscarLugarEnMapa = async () => {
    if (!nombre.trim()) {
      setError("Primero escribe el nombre del sitio para buscarlo.");
      return;
    }
    setBuscandoMapa(true);
    setError("");
    try {
      const query = encodeURIComponent(`${nombre}, Bolivia`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        setLatitud(parseFloat(data[0].lat));
        setLongitud(parseFloat(data[0].lon));
        setMarcadorVisible(true);
      } else {
        setError("No se encontró el lugar en el mapa. Intenta ser más específico o pon un marcador manual.");
      }
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor de mapas.");
    } finally {
      setBuscandoMapa(false);
    }
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setGuardando(true);
    setError("");
    try {
      const datos = {
        nombre,
        descripcion: descripcion || null,
        foto:        foto        || null,
        latitud:  marcadorVisible ? latitud  : null,
        longitud: marcadorVisible ? longitud : null,
        estado,
      };
      if (sitio) await api.put(`/admin/sitios/${sitio.cod}`, datos);
      else       await api.post("/admin/sitios", datos);
      onGuardado();
      onCerrar();
    } catch (err) {
      const e = err as { response?: { data?: { mensaje?: string; errors?: Record<string, string[]> } } };
      const errores = e.response?.data?.errors;
      if (errores) {
        setError(Object.values(errores)[0]?.[0] ?? "Error de validación.");
      } else {
        setError(e.response?.data?.mensaje || "Error al guardar el sitio.");
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[860px] flex flex-col max-h-[92vh]">

        <div className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between rounded-t-3xl shrink-0">
          <div>
            <h2 className="text-white font-black text-[18px]">{sitio ? "Editar Sitio" : "Nuevo Sitio Turístico"}</h2>
            <p className="text-gray-400 text-[12px] mt-0.5">Completa la información del sitio</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white cursor-pointer"><X size={22} /></button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Columna izquierda */}
          <div className="space-y-4">
            {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-[13px]">{error}</div>}

            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Nombre del sitio *</label>
              <div className="flex gap-2">
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Plaza Murillo"
                  className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]"
                />
                <button
                  type="button"
                  onClick={buscarLugarEnMapa}
                  disabled={buscandoMapa}
                  title="Buscar en el mapa"
                  className="h-[48px] px-4 bg-[#1A1A2E] hover:bg-[#D4A017] text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                >
                  {buscandoMapa ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Descripción</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={5}
                placeholder="Describe el sitio turístico..."
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px] resize-none" />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Fotografía Principal</label>
              <div onClick={() => fileInputRef.current?.click()}
                className="w-full h-[130px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-[#D4A017] cursor-pointer overflow-hidden transition-colors">
                {foto
                  ? <img src={foto} className="w-full h-full object-cover" alt="Sitio" />
                  : <><ImageIcon size={28} className="mb-2 text-gray-300" /><span className="text-[13px] font-medium">Clic para subir imagen</span><span className="text-[11px] text-gray-300 mt-1">JPG, PNG — máx. 2MB</span></>
                }
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleSubirFoto} className="hidden" />
              {foto && <button onClick={() => setFoto("")} className="mt-1.5 text-[12px] text-red-500 hover:text-red-700 cursor-pointer">✕ Quitar imagen</button>}
            </div>
          </div>

          {/* Columna derecha — Mapa */}
          <div className="space-y-3 flex flex-col">
            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1">
                <MapPin size={13} className="inline mr-1 text-[#D4A017]" />Ubicación en el Mapa
              </label>
              <p className="text-[12px] text-gray-400 mb-2">Haz clic en el mapa para colocar el marcador</p>

              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: "240px" }}>
                <MapContainer center={[latitud, longitud]} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <CapturadorClic onClic={handleMapClic} />
                  {marcadorVisible && <Marker position={[latitud, longitud]} />}
                  <AnimacionVuelo lat={latitud} lng={longitud} />
                </MapContainer>
              </div>

              {!marcadorVisible && (
                <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-[12px] text-amber-700 flex items-center gap-2">
                  <MapPin size={14} className="text-amber-500 shrink-0" />
                  Haz clic en el mapa para seleccionar la ubicación
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-gray-500 mb-1">Latitud {marcadorVisible && <span className="text-green-500">✓</span>}</label>
                <input
                  value={marcadorVisible ? latitud.toFixed(6) : ""}
                  onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) { setLatitud(v); setMarcadorVisible(true); } }}
                  placeholder="-16.489700" type="number" step="any"
                  className="w-full h-[42px] px-3 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[13px] bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-500 mb-1">Longitud {marcadorVisible && <span className="text-green-500">✓</span>}</label>
                <input
                  value={marcadorVisible ? longitud.toFixed(6) : ""}
                  onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) { setLongitud(v); setMarcadorVisible(true); } }}
                  placeholder="-68.119300" type="number" step="any"
                  className="w-full h-[42px] px-3 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[13px] bg-gray-50"
                />
              </div>
            </div>

            {marcadorVisible && (
              <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-[12px] text-green-700 flex items-center justify-between">
                <span>📍 Ubicación seleccionada correctamente</span>
                <button onClick={() => setMarcadorVisible(false)} className="text-red-400 hover:text-red-600 cursor-pointer text-[11px]">Quitar</button>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Estado</label>
              <select value={estado} onChange={e => setEstado(e.target.value)}
                className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px] bg-white cursor-pointer">
                <option value="activo"> Activo </option>
                <option value="inactivo">Inactivo </option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0 bg-gray-50 rounded-b-3xl">
          <button onClick={onCerrar} className="flex-1 border border-gray-200 bg-white text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-100 cursor-pointer">Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando}
            className="flex-1 bg-[#1A1A2E] hover:bg-[#D4A017] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 cursor-pointer transition-colors disabled:opacity-60">
            {guardando ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {sitio ? "Actualizar Sitio" : "Guardar Sitio"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

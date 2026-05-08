import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Loader2, Package, Save, X } from "lucide-react";
import api from "../../api";

interface Paquete {
  cod: number;
  nombre: string;
  precio_bs: number;
  duracion_horas: number;
  estado: string;
}

export default function PaquetesGestor() {
  const [datosPaquetes, setDatosPaquetes] = useState<Paquete[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalPaquete, setModalPaquete] = useState(false);
  const [paqueteEditar, setPaqueteEditar] = useState<Paquete | null>(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get("/admin/paquetes");
      setDatosPaquetes(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => {
    // Retrasamos la ejecución 0 milisegundos para que React no detecte un render en cascada
    const timer = setTimeout(() => {
      cargarDatos();
    }, 0);

    return () => clearTimeout(timer);
  }, [cargarDatos]);

  const eliminarPaquete = async (cod: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este paquete?")) {
      try { await api.delete(`/admin/paquetes/${cod}`); cargarDatos(); }
      catch (error) { console.error("Error al eliminar", error); }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="h-[80px] bg-white flex items-center justify-between px-8 shadow-sm border-b border-gray-200 shrink-0">
        <h1 className="text-[24px] font-black text-[#1A1A2E]">Gestión de Paquetes Turísticos</h1>
        <button onClick={() => setModalPaquete(true)} className="bg-[#1A1A2E] hover:bg-[#D4A017] text-white px-5 py-2.5 rounded-xl font-bold text-[14px] flex items-center gap-2 shadow-md">
          <Plus size={18} /> Nuevo Paquete
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20"><Loader2 size={40} className="animate-spin mb-4 text-[#D4A017]" /><p className="text-gray-500 font-medium">Cargando paquetes...</p></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[12px] uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4 font-bold">Cod</th>
                  <th className="px-6 py-4 font-bold">Nombre del Paquete</th>
                  <th className="px-6 py-4 font-bold">Precio (Bs.)</th>
                  <th className="px-6 py-4 font-bold">Duración</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {datosPaquetes.map(p => (
                  <tr key={p.cod} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-6 py-4 text-gray-500 font-bold">#{p.cod}</td>
                    <td className="px-6 py-4 font-bold text-[#1A1A2E]">{p.nombre}</td>
                    <td className="px-6 py-4 text-green-600 font-bold">Bs. {p.precio_bs}</td>
                    <td className="px-6 py-4 text-gray-600">{p.duracion_horas} hrs</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${p.estado === "activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.estado.toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setPaqueteEditar(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                      <button onClick={() => eliminarPaquete(p.cod)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {datosPaquetes.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400"><Package size={48} className="mx-auto mb-3 text-gray-300" /><p className="font-bold text-[#1A1A2E]">No hay paquetes registrados</p></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {(modalPaquete || paqueteEditar) && (
        <ModalPaquete paquete={paqueteEditar} onCerrar={() => { setModalPaquete(false); setPaqueteEditar(null); }} onGuardado={cargarDatos} />
      )}
    </div>
  );
}

// === MODAL INTERNO DE PAQUETES ===
function ModalPaquete({ paquete, onCerrar, onGuardado }: { paquete?: Paquete | null, onCerrar: () => void, onGuardado: () => void }) {
  const [nombre, setNombre] = useState(paquete?.nombre ?? "");
  const [precio, setPrecio] = useState(paquete?.precio_bs?.toString() ?? "");
  const [duracion, setDuracion] = useState(paquete?.duracion_horas?.toString() ?? "");
  const [estado, setEstado] = useState(paquete?.estado ?? "activo");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const handleGuardar = async () => {
    if (!nombre.trim() || !precio || !duracion) { setError("Todos los campos son obligatorios."); return; }
    setGuardando(true); setError("");
    try {
      const datos = { nombre, precio_bs: parseFloat(precio), duracion_horas: parseFloat(duracion), estado };
      if (paquete) await api.put(`/admin/paquetes/${paquete.cod}`, datos);
      else await api.post("/admin/paquetes", datos);
      onGuardado(); onCerrar();
    } catch (err) {
      const e = err as { response?: { data?: { mensaje?: string } } };
      setError(e.response?.data?.mensaje || "Error al guardar el paquete.");
    } finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px]">
        <div className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-white font-black text-[18px]">{paquete ? "Editar Paquete" : "Nuevo Paquete Turístico"}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white"><X size={22} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-[13px]">{error}</div>}
          <div>
            <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Nombre del paquete *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full h-[48px] px-4 border rounded-xl focus:border-[#D4A017] text-[14px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Precio (Bs.) *</label>
              <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} className="w-full h-[48px] px-4 border rounded-xl focus:border-[#D4A017] text-[14px]" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Duración (Horas) *</label>
              <input type="number" value={duracion} onChange={e => setDuracion(e.target.value)} className="w-full h-[48px] px-4 border rounded-xl focus:border-[#D4A017] text-[14px]" />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full h-[48px] px-4 border rounded-xl focus:border-[#D4A017] text-[14px]">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onCerrar} className="flex-1 border text-gray-600 py-3 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button onClick={handleGuardar} disabled={guardando} className="flex-1 bg-[#1A1A2E] hover:bg-[#D4A017] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              {guardando ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Guardar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

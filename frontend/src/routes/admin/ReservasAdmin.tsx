import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2, RefreshCw, CheckCircle, XCircle,
  Clock, Filter, Calendar, Users, CreditCard
} from "lucide-react";
import api from "../../api";

// ── Interfaces estrictas ──────────────────────────────────────
interface TuristaReserva {
  cod: number;
  nombre_completo: string;
  email: string;
  telefono: string | null;
}

interface PaqueteReserva {
  cod: number;
  nombre: string;
  foto_principal: string | null;
  duracion_horas: number;
}

interface PagoReserva {
  monto_pagado: number;
  metodo_pago: string;
  fecha_pago: string;
  estado: string;
}

interface ReservaAdmin {
  cod: number;
  fecha_reserva: string;
  cantidad_pasajeros: number;
  estado: string;
  turista: TuristaReserva | null;
  paquete: PaqueteReserva | null;
  pago: PagoReserva | null;
}

type EstadoFiltro = "todos" | "pendiente" | "confirmada" | "completada" | "cancelada";

// ── Helpers visuales ─────────────────────────────────────────
const ESTILOS_ESTADO: Record<string, string> = {
  pendiente:  "bg-yellow-100 text-yellow-800 border border-yellow-200",
  confirmada: "bg-green-100  text-green-800  border border-green-200",
  completada: "bg-blue-100   text-blue-800   border border-blue-200",
  cancelada:  "bg-red-100    text-red-800    border border-red-200",
};

const ICONOS_ESTADO: Record<string, React.ReactNode> = {
  pendiente:  <Clock size={12} />,
  confirmada: <CheckCircle size={12} />,
  completada: <CheckCircle size={12} />,
  cancelada:  <XCircle size={12} />,
};

function BadgeEstado({ estado }: { estado: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${ESTILOS_ESTADO[estado] ?? ESTILOS_ESTADO.pendiente}`}>
      {ICONOS_ESTADO[estado] ?? ICONOS_ESTADO.pendiente}
      <span>{estado.charAt(0).toUpperCase() + estado.slice(1)}</span>
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function ReservasAdmin() {
  const [reservas, setReservas]       = useState<ReservaAdmin[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [filtro, setFiltro]           = useState<EstadoFiltro>("todos");
  const [actualizando, setActualizando] = useState<number | null>(null);
  const [error, setError]             = useState("");

  const cargarReservas = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setError("");
    try {
      const params = filtro !== "todos" ? { estado: filtro } : {};
      const res = await api.get("/admin/reservas", { params });
      setReservas(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("No se pudieron cargar las reservas.");
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    const t = setTimeout(() => cargarReservas(), 0);
    return () => clearTimeout(t);
  }, [cargarReservas]);

  const cambiarEstado = async (cod: number, nuevoEstado: "confirmada" | "completada" | "cancelada") => {
    setActualizando(cod);
    setError("");
    try {
      await api.patch(`/admin/reservas/${cod}/estado`, { estado: nuevoEstado });
      await cargarReservas(true);
    } catch (e) {
      const err = e as { response?: { data?: { mensaje?: string } } };
      setError(err?.response?.data?.mensaje ?? "Error al actualizar el estado.");
    } finally {
      setActualizando(null);
    }
  };

  // Contadores para las pestañas
  const contadores: Record<EstadoFiltro, number> = {
    todos:      reservas.length,
    pendiente:  reservas.filter(r => r.estado === "pendiente").length,
    confirmada: reservas.filter(r => r.estado === "confirmada").length,
    completada: reservas.filter(r => r.estado === "completada").length,
    cancelada:  reservas.filter(r => r.estado === "cancelada").length,
  };

  const TABS: { key: EstadoFiltro; label: string }[] = [
    { key: "todos",      label: "Todas"      },
    { key: "pendiente",  label: "Pendientes" },
    { key: "confirmada", label: "Confirmadas"},
    { key: "completada", label: "Completadas"},
    { key: "cancelada",  label: "Canceladas" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8]">

      {/* Header */}
      <header className="h-[80px] bg-white flex items-center justify-between px-8 shadow-sm border-b border-gray-200 shrink-0">
        <h1 className="text-[24px] font-black text-[#1A1A2E]">Gestión de Reservas</h1>
        <button
          onClick={() => cargarReservas(true)}
          disabled={cargando}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={15} className={cargando ? "animate-spin" : ""} />
          <span>Actualizar</span>
        </button>
      </header>

      {/* Tabs de filtro */}
      <div className="bg-white border-b border-gray-200 px-8 flex gap-1 shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFiltro(tab.key)}
            className={`px-4 py-3 text-[13px] font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              filtro === tab.key
                ? "border-[#D4A017] text-[#1A1A2E]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Filter size={13} />
            <span>{tab.label}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
              filtro === tab.key ? "bg-[#D4A017] text-[#1A1A2E]" : "bg-gray-100 text-gray-500"
            }`}>
              {contadores[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-8 mt-4 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-[13px] shrink-0">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin mb-4 text-[#D4A017]" />
              <p className="text-gray-500 font-medium">Cargando reservas...</p>
            </div>
          ) : reservas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Calendar size={48} className="text-gray-300 mb-3" />
              <p className="font-bold text-[#1A1A2E]">No hay reservas</p>
              <p className="text-gray-400 text-[13px] mt-1">
                {filtro !== "todos" ? `No hay reservas con estado "${filtro}"` : "Aún no se han creado reservas"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[12px] uppercase tracking-wider border-b border-gray-200">

                    <th className="px-6 py-4 font-bold">Turista</th>
                    <th className="px-6 py-4 font-bold">Paquete</th>
                    <th className="px-6 py-4 font-bold">Fecha Tour</th>
                    <th className="px-6 py-4 font-bold">Pasajeros</th>
                    <th className="px-6 py-4 font-bold">Monto</th>
                    <th className="px-6 py-4 font-bold">Estado</th>
                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-[14px]">
                  {reservas.map(r => (
                    <tr key={r.cod} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">

                      {/* Turista */}
                      <td className="px-6 py-4">
                        {r.turista ? (
                          <div>
                            <p className="font-bold text-[#1A1A2E]">{r.turista.nombre_completo}</p>
                            <p className="text-gray-400 text-[12px]">{r.turista.email}</p>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Paquete */}
                      <td className="px-6 py-4">
                        {r.paquete ? (
                          <div className="flex items-center gap-3">
                            {r.paquete.foto_principal && (
                              <img
                                src={r.paquete.foto_principal}
                                alt={r.paquete.nombre}
                                className="w-9 h-9 rounded-lg object-cover shrink-0"
                              />
                            )}
                            <div>
                              <p className="font-bold text-[#1A1A2E] max-w-[180px] truncate">{r.paquete.nombre}</p>
                              <p className="text-gray-400 text-[12px]">{r.paquete.duracion_horas}h</p>
                            </div>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={14} className="text-[#D4A017]" />
                          <span>{r.fecha_reserva}</span>
                        </div>
                      </td>

                      {/* Pasajeros */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users size={14} className="text-gray-400" />
                          <span>{r.cantidad_pasajeros}</span>
                        </div>
                      </td>

                      {/* Monto */}
                      <td className="px-6 py-4">
                        {r.pago ? (
                          <div>
                            <p className="font-bold text-[#1A1A2E]">Bs. {Number(r.pago.monto_pagado).toFixed(2)}</p>
                            <p className="text-gray-400 text-[12px] flex items-center gap-1">
                              <CreditCard size={11} />
                              <span>{r.pago.metodo_pago.split("_")[0].toUpperCase()}</span>
                            </p>
                          </div>
                        ) : <span className="text-gray-300">Sin pago</span>}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <BadgeEstado estado={r.estado} />
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {actualizando === r.cod ? (
                            <Loader2 size={18} className="animate-spin text-[#D4A017]" />
                          ) : (
                            <>
                              {r.estado === "pendiente" && (
                                <button
                                  onClick={() => cambiarEstado(r.cod, "confirmada")}
                                  className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[12px] font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                  <CheckCircle size={13} /><span>Confirmar</span>
                                </button>
                              )}
                              {r.estado === "confirmada" && (
                                <button
                                  onClick={() => cambiarEstado(r.cod, "completada")}
                                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[12px] font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                  <CheckCircle size={13} /><span>Completar</span>
                                </button>
                              )}
                              {(r.estado === "pendiente" || r.estado === "confirmada") && (
                                <button
                                  onClick={() => cambiarEstado(r.cod, "cancelada")}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[12px] font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                  <XCircle size={13} /><span>Cancelar</span>
                                </button>
                              )}
                            </>
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
    </div>
  );
}

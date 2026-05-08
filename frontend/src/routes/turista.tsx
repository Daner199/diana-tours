import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Home, Calendar, CreditCard, User, LogOut, Bell, AlertTriangle,
  Camera, Globe, Clock, MapPin, CheckCircle, XCircle, Loader2,
  ChevronRight, Download, X, Package, Shield, Eye
} from "lucide-react";
import api from "../api";

// ==================== INTERFACES ESTRICTAS ====================
interface SitioReserva {
  cod: number;
  nombre: string;
  tiene_360: boolean;
  tiene_ra: boolean;
}

interface PagoReserva {
  monto_pagado: number;
  metodo_pago: string;
  fecha_pago: string;
}

interface PaqueteReserva {
  cod: number;
  nombre: string;
  duracion_horas: number;
  foto_principal: string | null;
  sitios: SitioReserva[];
}

interface Reserva {
  cod: number;
  fecha_reserva: string;
  cantidad_pasajeros: number;
  estado: string;
  paquete: PaqueteReserva;
  pago: PagoReserva | null;
}

interface UsuarioData {
  cod: number;
  nombre: string;
  apellido_paterno: string;
  email: string;
  foto_perfil: string | null;
  cod_rol: number;
}

// ==================== TIPOS DE VISTA ====================
type Vista = "inicio" | "reservas" | "inmersion" | "pagos" | "perfil";

// ==================== MODAL CANCELAR ====================
function ModalCancelar({
  reserva,
  onConfirmar,
  onCerrar,
  cancelando,
}: {
  reserva: Reserva;
  onConfirmar: () => void;
  onCerrar: () => void;
  cancelando: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0D1117] border border-white/10 rounded-2xl w-full max-w-[380px] p-6 text-center">
        <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h3 className="text-white font-black text-[18px] mb-2">¿Cancelar reserva?</h3>
        <p className="text-white/50 text-[13px] mb-1">
          Paquete: <strong className="text-white">{reserva.paquete.nombre}</strong>
        </p>
        <p className="text-white/50 text-[13px] mb-6">
          Fecha: <strong className="text-white">{reserva.fecha_reserva}</strong>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCerrar}
            className="flex-1 border border-white/10 text-white/60 hover:text-white py-3 rounded-xl text-[14px] font-medium cursor-pointer transition-colors"
          >
            Mantener
          </button>
          <button
            onClick={onConfirmar}
            disabled={cancelando}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-[14px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {cancelando ? <Loader2 size={16} className="animate-spin" /> : "Sí, cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== COMPONENTE BADGE ESTADO ====================
function BadgeEstado({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    pendiente:  "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    confirmada: "bg-green-500/10 text-green-400 border border-green-500/20",
    completada: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    cancelada:  "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  const iconos: Record<string, React.ReactNode> = {
    pendiente:  <Clock size={12} />,
    confirmada: <CheckCircle size={12} />,
    completada: <CheckCircle size={12} />,
    cancelada:  <XCircle size={12} />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${estilos[estado] ?? estilos.pendiente}`}>
      {iconos[estado] ?? iconos.pendiente}
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
}

// ==================== VISTA INICIO ====================
function VistaInicio({
  reservas,
  usuario,
  onIrReservas,
  onIrInmersion,
}: {
  reservas: Reserva[];
  usuario: UsuarioData;
  onIrReservas: () => void;
  onIrInmersion: () => void;
}) {
  // AGREGA ESTA LÍNEA: Guardamos la fecha actual en un estado para no romper la pureza del render
  const [hoy] = useState(() => Date.now());

  const proximaReserva = reservas.find(r => r.estado === "confirmada" || r.estado === "pendiente");
  const tienePagoPendiente = reservas.some(r => r.pago?.metodo_pago && r.estado === "pendiente");

  // Días hasta la próxima reserva (USAMOS 'hoy' en lugar de 'Date.now()')
  const diasRestantes = proximaReserva
    ? Math.ceil((new Date(proximaReserva.fecha_reserva).getTime() - hoy) / (1000 * 60 * 60 * 24))
    : null;
  return (
    <div className="space-y-6">
      {/* SALUDO */}
      <div>
        <h1 className="text-[26px] font-black text-white">
          Hola, {usuario.nombre} 👋
        </h1>
        <p className="text-white/50 text-[14px]">Bienvenido a tu panel de viajero</p>
      </div>

      {/* ALERTA PAGO PENDIENTE */}
      {tienePagoPendiente && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-400 shrink-0" />
            <div>
              <p className="text-yellow-400 font-bold text-[14px]">Pago pendiente</p>
              <p className="text-yellow-400/70 text-[12px]">Confirma tu pago para asegurar tu tour</p>
            </div>
          </div>
          <button
            onClick={onIrReservas}
            className="bg-yellow-500 hover:bg-yellow-400 text-[#1A1A2E] text-[12px] font-black px-3 py-1.5 rounded-lg cursor-pointer transition-colors shrink-0"
          >
            Ver →
          </button>
        </div>
      )}

      {/* PRÓXIMO DESTINO */}
      {proximaReserva ? (
        <div className="relative rounded-3xl overflow-hidden h-[200px] border border-white/10">
          <img
            src={proximaReserva.paquete.foto_principal || "https://via.placeholder.com/600x200?text=Tour"}
            alt={proximaReserva.paquete.nombre}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="bg-[#D4A017] text-[#1A1A2E] text-[11px] font-black px-3 py-1 rounded-full">
                Próximo destino
              </span>
              <BadgeEstado estado={proximaReserva.estado} />
            </div>
            <div>
              <h3 className="text-white font-black text-[20px] mb-1">{proximaReserva.paquete.nombre}</h3>
              <div className="flex items-center gap-4 text-white/70 text-[13px]">
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-[#D4A017]" />
                  {proximaReserva.fecha_reserva}
                </span>
                {diasRestantes !== null && diasRestantes >= 0 && (
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-[#D4A017]" />
                    {diasRestantes === 0 ? "¡Hoy!" : `${diasRestantes} días`}
                  </span>
                )}
              </div>
              <button
                onClick={onIrReservas}
                className="mt-3 bg-[#D4A017] hover:bg-[#F0B429] text-[#1A1A2E] text-[13px] font-black px-4 py-2 rounded-xl cursor-pointer transition-colors"
              >
                Ver itinerario →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
          <Package size={48} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/60 font-bold text-[15px] mb-1">No tienes reservas activas</p>
          <p className="text-white/30 text-[13px] mb-4">Explora nuestros paquetes y vive Bolivia</p>
          <Link
            to="/#paquetes"
            className="inline-block bg-[#D4A017] text-[#1A1A2E] font-black text-[13px] px-5 py-2.5 rounded-xl cursor-pointer hover:bg-[#F0B429] transition-colors"
          >
            Ver paquetes →
          </Link>
        </div>
      )}

      {/* ACCESO RÁPIDO INMERSIÓN */}
      <div>
        <p className="text-white/50 text-[12px] font-bold uppercase tracking-widest mb-3">
          Experiencias inmersivas
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onIrInmersion}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 text-left cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Globe size={20} className="text-blue-400" />
            </div>
            <p className="text-white font-bold text-[14px]">Tour 360°</p>
            <p className="text-white/40 text-[12px]">Explora virtualmente</p>
          </button>
          <button
            onClick={onIrInmersion}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 text-left cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 bg-[#D4A017]/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Camera size={20} className="text-[#D4A017]" />
            </div>
            <p className="text-white font-bold text-[14px]">Realidad AR</p>
            <p className="text-white/40 text-[12px]">Activa la cámara</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== VISTA MIS RESERVAS ====================
function VistaReservas({
  reservas,
  onCancelar,
}: {
  reservas: Reserva[];
  onCancelar: (reserva: Reserva) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-[22px] font-black text-white">Mis Reservas</h2>

      {reservas.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
          <Calendar size={48} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/60 font-bold">No tienes reservas aún</p>
        </div>
      ) : (
        reservas.map(r => (
          <div key={r.cod} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {/* Foto del paquete */}
            <div className="h-[120px] relative">
              <img
                src={r.paquete.foto_principal || "https://via.placeholder.com/600x120?text=Tour"}
                alt={r.paquete.nombre}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <h3 className="text-white font-black text-[16px] leading-tight">{r.paquete.nombre}</h3>
                <BadgeEstado estado={r.estado} />
              </div>
            </div>

            {/* Detalles */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-black/20 rounded-xl p-2">
                  <p className="text-white/40 text-[10px] uppercase font-bold">Fecha</p>
                  <p className="text-white text-[12px] font-bold">{r.fecha_reserva}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-2">
                  <p className="text-white/40 text-[10px] uppercase font-bold">Pasajeros</p>
                  <p className="text-white text-[12px] font-bold">{r.cantidad_pasajeros}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-2">
                  <p className="text-white/40 text-[10px] uppercase font-bold">Reserva</p>
                  <p className="text-white text-[12px] font-bold">#{r.cod}</p>
                </div>
              </div>

              {/* Sitios con badges 360/RA */}
              {r.paquete.sitios.length > 0 && (
                <div>
                  <p className="text-white/40 text-[11px] uppercase font-bold mb-2">Sitios incluidos</p>
                  <div className="flex flex-wrap gap-2">
                    {r.paquete.sitios.map(s => (
                      <div key={s.cod} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                        <MapPin size={11} className="text-[#D4A017]" />
                        <span className="text-white/80 text-[11px] font-medium">{s.nombre}</span>
                        {s.tiene_360 && (
                          <span className="bg-blue-500/20 text-blue-400 text-[9px] font-black px-1.5 py-0.5 rounded-md">360°</span>
                        )}
                        {s.tiene_ra && (
                          <span className="bg-[#D4A017]/20 text-[#D4A017] text-[9px] font-black px-1.5 py-0.5 rounded-md">AR</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pago */}
              {r.pago && (
                <div className="bg-black/20 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-[11px] uppercase font-bold">Pago</p>
                    <p className="text-white font-bold text-[14px]">Bs. {Number(r.pago.monto_pagado).toFixed(2)}</p>
                    <p className="text-white/40 text-[11px]">{r.pago.metodo_pago.replace("_", " — ").toUpperCase()}</p>
                  </div>
                  <CreditCard size={20} className="text-white/20" />
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    const texto = `VOUCHER DIANA TOURS\nReserva #${r.cod}\nPaquete: ${r.paquete.nombre}\nFecha: ${r.fecha_reserva}\nPasajeros: ${r.cantidad_pasajeros}\nEstado: ${r.estado}\nMonto: Bs. ${r.pago ? Number(r.pago.monto_pagado).toFixed(2) : "—"}`;
                    const blob = new Blob([texto], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `voucher-reserva-${r.cod}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all"
                >
                  <Download size={15} /> Voucher
                </button>

                {(r.estado === "pendiente" || r.estado === "confirmada") && (
                  <button
                    onClick={() => onCancelar(r)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all"
                  >
                    <X size={15} /> Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ==================== VISTA INMERSIÓN ====================
function VistaInmersion({ reservas }: { reservas: Reserva[] }) {
  const sitiosConAcceso = reservas
    .filter(r => r.estado !== "cancelada")
    .flatMap(r => r.paquete.sitios)
    .filter((s, i, arr) => arr.findIndex(x => x.cod === s.cod) === i);

  const sitiosCon360 = sitiosConAcceso.filter(s => s.tiene_360);
  const sitiosConRA  = sitiosConAcceso.filter(s => s.tiene_ra);

  return (
    <div className="space-y-6">
      <h2 className="text-[22px] font-black text-white">Centro de Inmersión</h2>

      {sitiosConAcceso.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
          <Globe size={48} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/60 font-bold mb-1">Sin acceso inmersivo aún</p>
          <p className="text-white/30 text-[13px]">Reserva un paquete para desbloquear experiencias 360° y RA</p>
        </div>
      ) : (
        <>
          {/* TOUR 360° */}
          {sitiosCon360.length > 0 && (
            <div>
              <p className="text-blue-400 text-[12px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <Globe size={14} /> Tour Virtual 360°
              </p>
              <div className="space-y-3">
                {sitiosCon360.map(s => (
                  <Link
                    key={s.cod}
                    to={`/viewer?sitio=${s.cod}`}
                    className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-2xl p-4 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Globe size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-[14px]">{s.nombre}</p>
                        <p className="text-white/40 text-[12px]">Explorar en 360°</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-white/30 group-hover:text-blue-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* REALIDAD AUMENTADA */}
          {sitiosConRA.length > 0 && (
            <div>
              <p className="text-[#D4A017] text-[12px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <Camera size={14} /> Realidad Aumentada
              </p>
              <div className="space-y-3">
                {sitiosConRA.map(s => (
                  <Link
                    key={s.cod}
                    to={`/ar?sitio=${s.cod}`}
                    className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4A017]/30 rounded-2xl p-4 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#D4A017]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera size={20} className="text-[#D4A017]" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-[14px]">{s.nombre}</p>
                        <p className="text-white/40 text-[12px]">Activar cámara AR</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-white/30 group-hover:text-[#D4A017] transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* SITIOS SIN INMERSIÓN */}
          {sitiosConAcceso.filter(s => !s.tiene_360 && !s.tiene_ra).length > 0 && (
            <div>
              <p className="text-white/30 text-[12px] font-bold uppercase tracking-widest mb-3">
                Sin experiencia digital aún
              </p>
              <div className="space-y-2">
                {sitiosConAcceso.filter(s => !s.tiene_360 && !s.tiene_ra).map(s => (
                  <div key={s.cod} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-3 opacity-50">
                    <MapPin size={16} className="text-white/30" />
                    <p className="text-white/50 text-[13px]">{s.nombre}</p>
                    <span className="ml-auto text-[11px] text-white/20">Próximamente</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ==================== VISTA PAGOS ====================
function VistaPagos({ reservas }: { reservas: Reserva[] }) {
  const pagos = reservas.filter(r => r.pago !== null);
  const totalPagado = pagos.reduce((sum, r) => sum + Number(r.pago?.monto_pagado ?? 0), 0);

  return (
    <div className="space-y-4">
      <h2 className="text-[22px] font-black text-white">Mis Pagos</h2>

      <div className="bg-gradient-to-br from-[#D4A017]/20 to-[#1B4332]/20 border border-[#D4A017]/20 rounded-2xl p-5">
        <p className="text-white/50 text-[13px] font-bold uppercase tracking-wider mb-1">Total pagado</p>
        <p className="text-[#D4A017] font-black text-[36px] leading-none">Bs. {totalPagado.toFixed(2)}</p>
        <p className="text-white/30 text-[12px] mt-1">≈ USD ${(totalPagado / 6.96).toFixed(2)}</p>
      </div>

      {pagos.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
          <CreditCard size={48} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/60 font-bold">Sin historial de pagos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pagos.map(r => (
            <div key={r.cod} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-[15px]">{r.paquete.nombre}</p>
                  <p className="text-white/40 text-[12px]">Reserva #{r.cod}</p>
                </div>
                <BadgeEstado estado={r.estado} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] uppercase font-bold mb-1">Monto</p>
                  <p className="text-[#D4A017] font-black text-[16px]">Bs. {Number(r.pago!.monto_pagado).toFixed(2)}</p>
                  <p className="text-white/30 text-[10px]">≈ USD ${(Number(r.pago!.monto_pagado) / 6.96).toFixed(2)}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] uppercase font-bold mb-1">Método</p>
                  <p className="text-white font-bold text-[13px]">
                    {r.pago!.metodo_pago.split("_")[0].toUpperCase()}
                  </p>
                  <p className="text-white/30 text-[10px]">
                    {r.pago!.metodo_pago.split("_")[1] ?? "BOB"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== VISTA PERFIL ====================
function VistaPerfil({
  usuario,
  onCerrarSesion,
}: {
  usuario: UsuarioData;
  onCerrarSesion: () => void;
}) {
  const getIniciales = () =>
    `${usuario.nombre?.charAt(0) ?? ""}${usuario.apellido_paterno?.charAt(0) ?? ""}`.toUpperCase() || "TU";

  return (
    <div className="space-y-4">
      <h2 className="text-[22px] font-black text-white">Mi Perfil</h2>

      {/* Avatar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#D4A017] flex items-center justify-center text-[#1A1A2E] font-black text-[22px] shrink-0 overflow-hidden">
          {usuario.foto_perfil
            ? <img src={usuario.foto_perfil} className="w-full h-full object-cover" alt="Perfil" />
            : getIniciales()
          }
        </div>
        <div>
          <p className="text-white font-black text-[18px]">{usuario.nombre} {usuario.apellido_paterno}</p>
          <p className="text-white/50 text-[13px]">{usuario.email}</p>
          <span className="inline-block mt-1 bg-[#1B4332] text-green-400 text-[11px] font-bold px-2 py-0.5 rounded-md">
            Turista Verificado
          </span>
        </div>
      </div>

      {/* Opciones */}
      <div className="space-y-2">
        {[
          { icono: <User size={18} />, label: "Editar datos personales", desc: "Nombre, apellido, teléfono" },
          { icono: <Shield size={18} />, label: "Seguridad", desc: "Contraseña y verificación 2FA" },
          { icono: <Eye size={18} />, label: "Foto de perfil", desc: "Cambiar o capturar con cámara" },
        ].map((op, i) => (
          <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/60">
                {op.icono}
              </div>
              <div>
                <p className="text-white font-bold text-[14px]">{op.label}</p>
                <p className="text-white/40 text-[12px]">{op.desc}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-white/30" />
          </div>
        ))}
      </div>

      <button
        onClick={onCerrarSesion}
        className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-3.5 rounded-2xl font-bold cursor-pointer transition-all"
      >
        <LogOut size={18} /> Cerrar sesión
      </button>
    </div>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================
export function Turista() {
  const navigate = useNavigate();

  const [usuario] = useState<UsuarioData | null>(() => {
    try {
      const u = localStorage.getItem("usuario");
      if (!u || u === "null" || u === "undefined") return null;
      return JSON.parse(u) as UsuarioData;
    } catch { return null; }
  });

  const [vistaActiva, setVistaActiva] = useState<Vista>("inicio");
  const [reservas, setReservas]     = useState<Reserva[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [reservaCancelar, setReservaCancelar] = useState<Reserva | null>(null);
  const [cancelando, setCancelando] = useState(false);

  // Proteger ruta
  useEffect(() => {
    if (!usuario) navigate("/login");
  }, [usuario, navigate]);

  // Cargar reservas
  const cargarReservas = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get("/mis-reservas");
      setReservas(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (usuario) {
      // Usamos setTimeout para volverlo asíncrono y quitar el error del linter
      const timer = setTimeout(() => {
        cargarReservas();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [usuario, cargarReservas]);

  const handleCancelar = async () => {
    if (!reservaCancelar) return;
    setCancelando(true);
    try {
      await api.patch(`/reservas/${reservaCancelar.cod}/cancelar`);
      setReservaCancelar(null);
      cargarReservas();
    } catch (e) {
      console.error(e);
    } finally {
      setCancelando(false);
    }
  };

  const handleCerrarSesion = () => {
    localStorage.clear();
    navigate("/");
  };

  if (!usuario) return null;

  const navItems: { id: Vista; icono: React.ReactNode; label: string }[] = [
    { id: "inicio",    icono: <Home size={20} />,       label: "Inicio" },
    { id: "reservas",  icono: <Calendar size={20} />,   label: "Reservas" },
    { id: "inmersion", icono: <Globe size={20} />,      label: "Inmersión" },
    { id: "pagos",     icono: <CreditCard size={20} />, label: "Pagos" },
    { id: "perfil",    icono: <User size={20} />,       label: "Perfil" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] font-['Inter'] flex flex-col max-w-[480px] mx-auto relative">

      {/* MODAL CANCELAR */}
      {reservaCancelar && (
        <ModalCancelar
          reserva={reservaCancelar}
          onConfirmar={handleCancelar}
          onCerrar={() => setReservaCancelar(null)}
          cancelando={cancelando}
        />
      )}

      {/* TOPBAR */}
      <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-white/5 px-5 py-4 flex items-center justify-between shrink-0">
        <Link to="/">
          <img src="/logo.webp" alt="Diana Tours" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white relative cursor-pointer">
            <Bell size={16} />
            {reservas.some(r => r.estado === "pendiente") && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#D4A017] rounded-full border-2 border-[#050505]" />
            )}
          </button>
          <div className="w-9 h-9 rounded-full bg-[#D4A017] flex items-center justify-center text-[#1A1A2E] font-black text-[13px] overflow-hidden">
            {usuario.foto_perfil
              ? <img src={usuario.foto_perfil} className="w-full h-full object-cover" alt="foto" />
              : `${usuario.nombre?.charAt(0) ?? ""}${usuario.apellido_paterno?.charAt(0) ?? ""}`.toUpperCase()
            }
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 overflow-y-auto px-5 py-6 pb-24">
        {cargando ? (
          <div className="flex flex-col items-center justify-center h-60">
            <Loader2 size={36} className="animate-spin text-[#D4A017] mb-3" />
            <p className="text-white/40 text-[13px]">Cargando tu panel...</p>
          </div>
        ) : (
          <>
            {vistaActiva === "inicio" && (
              <VistaInicio
                reservas={reservas}
                usuario={usuario}
                onIrReservas={() => setVistaActiva("reservas")}
                onIrInmersion={() => setVistaActiva("inmersion")}
              />
            )}
            {vistaActiva === "reservas" && (
              <VistaReservas reservas={reservas} onCancelar={setReservaCancelar} />
            )}
            {vistaActiva === "inmersion" && (
              <VistaInmersion reservas={reservas} />
            )}
            {vistaActiva === "pagos" && (
              <VistaPagos reservas={reservas} />
            )}
            {vistaActiva === "perfil" && (
              <VistaPerfil usuario={usuario} onCerrarSesion={handleCerrarSesion} />
            )}
          </>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#0D1117]/95 backdrop-blur-md border-t border-white/10 px-2 py-2 z-40">
        <div className="flex items-center justify-around">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setVistaActiva(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                vistaActiva === item.id
                  ? "text-[#D4A017]"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              {item.icono}
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* FAB — REALIDAD AUMENTADA */}
      <button
        onClick={() => navigate("/ar")}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#D4A017] hover:bg-[#F0B429] rounded-full shadow-[0_0_20px_rgba(212,160,23,0.4)] flex items-center justify-center cursor-pointer transition-all hover:scale-110 z-50"
        title="Activar Realidad Aumentada"
      >
        <Camera size={24} className="text-[#1A1A2E]" />
      </button>
    </div>
  );
}

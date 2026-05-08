import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Home, Calendar, CreditCard, User, LogOut, Bell, AlertTriangle,
  Camera, Globe, Clock, MapPin, CheckCircle, XCircle, Loader2,
  ChevronRight, Download, X, Package, Eye, Save,
  Lock, EyeOff, Edit3, Upload, Check, Menu
} from "lucide-react";
import api from "../api";
import jsPDF from "jspdf";
import * as faceapi from 'face-api.js';

// ==================== INTERFACES PRINCIPALES ====================
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
  apellido_materno?: string;
  email: string;
  telefono?: string;
  foto_perfil: string | null;
  cod_rol: number;
}

interface Notificacion {
  id: string;
  tipo: "alerta" | "info" | "exito";
  titulo: string;
  mensaje: string;
  leida: boolean;
}

type Vista = "inicio" | "reservas" | "inmersion" | "pagos" | "perfil";

// ==================== INTERFACES DE PROPS ====================
interface PanelNotificacionesProps {
  notificaciones: Notificacion[];
  onCerrar: () => void;
  onMarcarLeidas: () => void;
}

interface ModalCancelarProps {
  reserva: Reserva;
  onConfirmar: () => void;
  onCerrar: () => void;
  cancelando: boolean;
}

interface ModalEditarDatosProps {
  usuario: UsuarioData;
  onCerrar: () => void;
  onActualizado: (u: UsuarioData) => void;
}

interface ModalFotoPerfilProps {
  usuario: UsuarioData;
  onCerrar: () => void;
  onActualizado: (foto: string) => void;
}

interface ModalCambiarPasswordProps {
  onCerrar: () => void;
}

interface VistaInicioProps {
  reservas: Reserva[];
  usuario: UsuarioData;
  onIrReservas: () => void;
  onIrInmersion: () => void;
}

interface VistaReservasProps {
  reservas: Reserva[];
  onCancelar: (r: Reserva) => void;
}

interface VistaInmersionProps {
  reservas: Reserva[];
}

interface VistaPagosProps {
  reservas: Reserva[];
}

interface VistaPerfilProps {
  usuario: UsuarioData;
  onCerrarSesion: () => void;
  onActualizarUsuario: (u: UsuarioData) => void;
}

// ==================== GENERAR NOTIFICACIONES ====================
function generarNotificaciones(reservas: Reserva[], idsLeidas: string[]): Notificacion[] {
  const notifs: Notificacion[] = [];
  reservas.forEach((r) => {
    if (r.estado === "pendiente") {
      const id = `pend-${r.cod}`;
      notifs.push({
        id, tipo: "alerta", titulo: "Pago pendiente",
        mensaje: `Tu reserva para el paquete "${r.paquete.nombre}" aún no está confirmada.`,
        leida: idsLeidas.includes(id),
      });
    }
    if (r.estado === "confirmada") {
      const id = `conf-${r.cod}`;
      notifs.push({
        id, tipo: "exito", titulo: "Reserva confirmada",
        mensaje: `¡Todo listo! Tu tour "${r.paquete.nombre}" está confirmado para el ${r.fecha_reserva}.`,
        leida: idsLeidas.includes(id),
      });
    }
  });
  return notifs;
}

// ==================== GENERAR PDF VOUCHER ====================
function generarVoucherPDF(reserva: Reserva) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ancho = 210; const margen = 20;

  doc.setFillColor(26, 26, 46); doc.rect(0, 0, ancho, 45, "F");
  doc.setFillColor(212, 160, 23); doc.rect(0, 45, ancho, 3, "F");

  doc.setTextColor(212, 160, 23); doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.text("DIANA TOURS SRL", margen, 18);
  doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text("Tours y Experiencias Turísticas • Bolivia", margen, 26);
  doc.text("Tel: +591 2 1234567  |  info@dianatours.bo", margen, 32);
  doc.text("www.dianatours.bo", margen, 38);

  doc.setTextColor(200, 200, 200); doc.setFontSize(9); doc.setFont("helvetica", "normal");
  const fechaEmision = new Date().toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Emitido: ${fechaEmision}`, ancho - margen, 30, { align: "right" });

  const coloresEstado: Record<string, [number, number, number]> = {
    confirmada: [27, 67, 50], pendiente: [92, 71, 0], completada: [13, 60, 100], cancelada: [80, 20, 20],
  };
  const colorEstado = coloresEstado[reserva.estado] ?? coloresEstado.pendiente;
  doc.setFillColor(...colorEstado); doc.roundedRect(ancho - margen - 30, 34, 32, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text(reserva.estado.toUpperCase(), ancho - margen - 14, 39.5, { align: "center" });

  let y = 60;
  doc.setTextColor(26, 26, 46); doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("VOUCHER DE RESERVA", margen, y);

  y += 12;
  doc.setFillColor(247, 248, 250); doc.roundedRect(margen, y, ancho - margen * 2, 38, 3, 3, "F");
  doc.setDrawColor(212, 160, 23); doc.setLineWidth(0.5); doc.roundedRect(margen, y, ancho - margen * 2, 38, 3, 3, "S");

  doc.setTextColor(100, 100, 120); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("PAQUETE TURÍSTICO", margen + 5, y + 7);
  doc.setTextColor(26, 26, 46); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text(reserva.paquete.nombre, margen + 5, y + 15);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 100);
  doc.text(`Duración: ${reserva.paquete.duracion_horas} horas`, margen + 5, y + 23);
  doc.text(`Fecha del tour: ${reserva.fecha_reserva}`, margen + 5, y + 30);

  y += 48;
  doc.setFillColor(247, 248, 250); doc.roundedRect(margen, y, ancho - margen * 2, 22, 2, 2, "F");
  doc.setDrawColor(220, 220, 230); doc.setLineWidth(0.3); doc.roundedRect(margen, y, ancho - margen * 2, 22, 2, 2, "S");
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(130, 130, 150);
  doc.text("CANTIDAD DE PASAJEROS", margen + 4, y + 7);
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(26, 26, 46);
  doc.text(`${reserva.cantidad_pasajeros} persona(s)`, margen + 4, y + 16);

  y += 30;
  if (reserva.paquete.sitios.length > 0) {
    doc.setTextColor(26, 26, 46); doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("SITIOS INCLUIDOS", margen, y); y += 6;
    doc.setDrawColor(212, 160, 23); doc.setLineWidth(0.8); doc.line(margen, y, margen + 40, y); y += 6;

    reserva.paquete.sitios.forEach((s) => {
      doc.setFillColor(250, 250, 252); doc.roundedRect(margen, y, ancho - margen * 2, 10, 1.5, 1.5, "F");
      doc.setTextColor(212, 160, 23); doc.setFontSize(9); doc.text("▸", margen + 3, y + 6.5);
      doc.setTextColor(50, 50, 70); doc.setFont("helvetica", "normal"); doc.text(s.nombre, margen + 9, y + 6.5);
      let badgeX = ancho - margen - 4;
      if (s.tiene_ra) {
        doc.setFillColor(212, 160, 23); doc.roundedRect(badgeX - 10, y + 2, 10, 6, 1, 1, "F");
        doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont("helvetica", "bold");
        doc.text("AR", badgeX - 5, y + 6.2, { align: "center" }); badgeX -= 13;
      }
      if (s.tiene_360) {
        doc.setFillColor(37, 99, 235); doc.roundedRect(badgeX - 12, y + 2, 12, 6, 1, 1, "F");
        doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont("helvetica", "bold");
        doc.text("360°", badgeX - 6, y + 6.2, { align: "center" });
      }
      y += 13;
    });
  }

  y += 4;
  if (reserva.pago) {
    doc.setFillColor(26, 26, 46); doc.roundedRect(margen, y, ancho - margen * 2, 40, 3, 3, "F");
    doc.setTextColor(212, 160, 23); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("RESUMEN DE PAGO", margen + 5, y + 9);
    doc.setDrawColor(212, 160, 23); doc.setLineWidth(0.3); doc.line(margen + 5, y + 11, ancho - margen - 5, y + 11);
    const metodoPago = reserva.pago.metodo_pago.replace(/_/g, " — ").toUpperCase();
    doc.setTextColor(160, 160, 180); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("Método de pago:", margen + 5, y + 19); doc.text("Fecha de pago:", margen + 5, y + 26); doc.text("TOTAL PAGADO:", margen + 5, y + 35);
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
    doc.text(metodoPago, ancho - margen - 5, y + 19, { align: "right" });
    doc.text(reserva.pago.fecha_pago, ancho - margen - 5, y + 26, { align: "right" });
    doc.setTextColor(212, 160, 23); doc.setFontSize(14);
    doc.text(`Bs. ${Number(reserva.pago.monto_pagado).toFixed(2)}`, ancho - margen - 5, y + 35, { align: "right" });
  }

  doc.setFillColor(247, 248, 250); doc.rect(0, 272, ancho, 25, "F");
  doc.setDrawColor(212, 160, 23); doc.setLineWidth(0.5); doc.line(0, 272, ancho, 272);
  doc.setTextColor(130, 130, 150); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
  doc.text("Este documento es un comprobante oficial de reserva emitido por Diana Tours SRL.", ancho / 2, 278, { align: "center" });
  doc.text("Preséntalo el día del tour. Válido únicamente con documento de identidad.", ancho / 2, 283, { align: "center" });
  doc.setTextColor(212, 160, 23); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("Diana Tours SRL © 2026 — Bolivia", ancho / 2, 290, { align: "center" });
  doc.save(`voucher-diana-tours.pdf`);
}

// ==================== COMPONENTES UI ====================
function BadgeEstado({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    pendiente:  "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    confirmada: "bg-green-500/10 text-green-400 border border-green-500/20",
    completada: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    cancelada:  "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  const iconos: Record<string, React.ReactNode> = {
    pendiente:  <Clock size={12} />, confirmada: <CheckCircle size={12} />, completada: <CheckCircle size={12} />, cancelada:  <XCircle size={12} />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${estilos[estado] ?? estilos.pendiente}`}>
      {iconos[estado] ?? iconos.pendiente} {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
}

function MenuBoton({ activa, onClick, icono, texto }: { activa: boolean; onClick: () => void; icono: React.ReactNode; texto: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 h-[54px] border-l-4 transition-all text-left cursor-pointer ${
        activa
        ? "border-[#D4A017] bg-gradient-to-r from-[#D4A017]/10 to-transparent text-white font-bold"
        : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
      }`}>
      <div className={`${activa ? "text-[#D4A017]" : "text-gray-500"}`}>{icono}</div>
      <span className="text-[15px]">{texto}</span>
    </button>
  );
}

// ==================== PANEL DE NOTIFICACIONES ====================
function PanelNotificaciones({ notificaciones, onCerrar, onMarcarLeidas }: PanelNotificacionesProps) {
  const iconos: Record<string, React.ReactNode> = {
    alerta: <AlertTriangle size={16} className="text-yellow-400" />,
    info:   <Bell size={16} className="text-blue-400" />,
    exito:  <CheckCircle size={16} className="text-green-400" />,
  };
  const fondos: Record<string, string> = {
    alerta: "bg-yellow-500/10 border-yellow-500/20",
    info:   "bg-blue-500/10 border-blue-500/20",
    exito:  "bg-green-500/10 border-green-500/20",
  };

  return (
    <div className="absolute top-14 right-0 z-50 w-[320px] bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden origin-top-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-white font-bold text-[14px]">Notificaciones</span>
        <div className="flex items-center gap-2">
          {notificaciones.some(n => !n.leida) && (
            <button type="button" onClick={onMarcarLeidas}
              className="text-[#D4A017] text-[11px] font-bold cursor-pointer hover:underline">
              Marcar leídas
            </button>
          )}
          <button type="button" onClick={onCerrar}
            className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 cursor-pointer transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>
      <div className="max-h-[340px] overflow-y-auto">
        {notificaciones.length === 0 ? (
          <div className="py-10 text-center">
            <Bell size={32} className="text-white/10 mx-auto mb-2" />
            <p className="text-white/30 text-[13px]">Sin notificaciones</p>
          </div>
        ) : (
          notificaciones.map((n) => (
            <div key={n.id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 transition-opacity ${n.leida ? "opacity-50" : ""}`}>
              <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${fondos[n.tipo]}`}>
                {iconos[n.tipo]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-[13px] leading-tight">{n.titulo}</p>
                <p className="text-white/50 text-[12px] mt-0.5 leading-snug">{n.mensaje}</p>
              </div>
              {!n.leida && (
                <div className="w-2 h-2 rounded-full bg-[#D4A017] mt-1.5 shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== MODALES ====================
function ModalCancelar({ reserva, onConfirmar, onCerrar, cancelando }: ModalCancelarProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onMouseDown={onCerrar}>
      <div className="bg-[#0D1117] border border-white/10 rounded-2xl w-full max-w-[380px] p-6 text-center shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h3 className="text-white font-black text-[18px] mb-2">¿Cancelar reserva?</h3>
        <p className="text-white/50 text-[13px] mb-6">Paquete: <strong className="text-white">{reserva.paquete.nombre}</strong></p>
        <div className="flex gap-3">
          <button type="button" onClick={onCerrar} className="flex-1 border border-white/10 text-white/60 hover:text-white hover:bg-white/5 py-3 rounded-xl text-[14px] font-medium transition-colors">Mantener</button>
          <button type="button" onClick={onConfirmar} disabled={cancelando} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
            {cancelando ? <Loader2 size={16} className="animate-spin" /> : "Sí, cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalEditarDatos({ usuario, onCerrar, onActualizado }: ModalEditarDatosProps) {
  const [form, setForm] = useState({
    nombre: usuario.nombre ?? "",
    apellido_paterno: usuario.apellido_paterno ?? "",
    apellido_materno: usuario.apellido_materno ?? "",
    telefono: usuario.telefono ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.apellido_paterno.trim()) return setError("Nombre y apellido paterno son obligatorios.");
    setGuardando(true); setError("");
    try {
      const res = await api.put("/auth/perfil", form);
      const usuarioActualizado = { ...usuario, ...res.data.usuario };
      localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
      onActualizado(usuarioActualizado);
      setOk(true); setTimeout(() => onCerrar(), 1200);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { mensaje?: string } } };
      setError(err?.response?.data?.mensaje ?? "Error al actualizar.");
    }
    finally { setGuardando(false); }
  };

  const campos: { label: string; key: keyof typeof form }[] = [
    { label: "Nombre", key: "nombre" },
    { label: "Apellido paterno", key: "apellido_paterno" },
    { label: "Apellido materno", key: "apellido_materno" },
    { label: "Teléfono", key: "telefono" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onMouseDown={onCerrar}>
      <div className="bg-[#0D1117] border border-white/10 rounded-3xl w-full max-w-[480px] p-6 pb-8 shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-black text-[18px]">Editar datos personales</h3>
          <button type="button" onClick={onCerrar} className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          {campos.map((c) => (
            <div key={c.key}>
              <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider block mb-1">{c.label}</label>
              <input type="text" value={form[c.key]} onChange={(e) => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#D4A017]/50" />
            </div>
          ))}
        </div>
        {error && <p className="mt-3 text-red-400 text-[13px] bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}
        <button type="button" onClick={handleSubmit} disabled={guardando || ok}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-[#D4A017] hover:bg-[#F0B429] disabled:opacity-60 text-[#1A1A2E] font-black py-3.5 rounded-xl transition-all shadow-lg">
          {ok ? <><Check size={18} /> Guardado</> : guardando ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Guardar cambios</>}
        </button>
      </div>
    </div>
  );
}

function ModalFotoPerfil({ usuario, onCerrar, onActualizado }: ModalFotoPerfilProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [preview, setPreview] = useState<string | null>(usuario.foto_perfil);
  const [camara, setCamara] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [modelosCargados, setModelosCargados] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setModelosCargados(true);
      } catch {
        console.warn("Modelos AR no disponibles.");
      }
    };
    load();
  }, []);

  const detenerCamara = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCamara(false);
  };

  const abrirCamara = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(s);
      setCamara(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 100);
    } catch {
      setError("No se pudo acceder a la cámara.");
    }
  };

  const capturar = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    setPreview(canvasRef.current.toDataURL("image/jpeg", 0.85));
    detenerCamara();
  };

  const onVideoPlay = () => {
    if (!modelosCargados) return;
    intervalRef.current = setInterval(async () => {
      if (videoRef.current) {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
        if (detections.length > 0) {
          if(intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => capturar(), 800);
        }
      }
    }, 500);
  };

  const guardar = async () => {
    if (!preview || preview === usuario.foto_perfil) return;
    setGuardando(true); setError("");
    try {
      await api.put("/auth/perfil/foto", { cod_usuario: usuario.cod, foto_perfil: preview });
      const u = { ...usuario, foto_perfil: preview };
      localStorage.setItem("usuario", JSON.stringify(u));
      onActualizado(preview);
      setOk(true);
      setTimeout(() => onCerrar(), 1200);
    } catch {
      setError("Error al guardar la foto.");
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => {
    return () => detenerCamara();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onMouseDown={() => { detenerCamara(); onCerrar(); }}>
      <div className="bg-[#0D1117] border border-white/10 rounded-3xl w-full max-w-[480px] p-6 pb-8 shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-black text-[18px]">Foto de perfil</h3>
          <button type="button" onClick={() => { detenerCamara(); onCerrar(); }} className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="flex justify-center mb-5 relative">
          {camara ? (
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-[#D4A017] shadow-[0_0_20px_rgba(212,160,23,0.3)]">
              <video ref={videoRef} autoPlay playsInline muted onPlay={onVideoPlay} className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-0 w-full text-center"><span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">Detectando rostro...</span></div>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#D4A017]/50 bg-white/5 flex items-center justify-center">
              {preview ? <img src={preview} className="w-full h-full object-cover" alt="preview" /> : <User size={40} className="text-white/20" />}
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {error && <p className="mb-3 text-red-400 text-[13px] bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-center">{error}</p>}
        <div className="space-y-2">
          {camara ? (
            <>
              <button type="button" onClick={capturar} className="w-full flex items-center justify-center gap-2 bg-[#D4A017] hover:bg-[#F0B429] text-[#1A1A2E] font-black py-3 rounded-xl transition-colors"><Camera size={18} /> Capturar manual</button>
              <button type="button" onClick={detenerCamara} className="w-full bg-white/5 text-white/60 hover:text-white py-3 rounded-xl transition-colors">Cancelar</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl transition-all"><Upload size={17} /> Subir desde galería</button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = (ev) => setPreview(ev.target?.result as string); r.readAsDataURL(f); } }} />
              <button type="button" onClick={abrirCamara} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl transition-all"><Camera size={17} /> Usar cámara (Auto-captura)</button>
              <button type="button" onClick={guardar} disabled={guardando || ok || !preview || preview === usuario.foto_perfil} className="w-full flex items-center justify-center gap-2 bg-[#D4A017] hover:bg-[#F0B429] disabled:opacity-40 text-[#1A1A2E] font-black py-3 rounded-xl transition-all">
                {ok ? <><Check size={17} /> Guardado</> : guardando ? <Loader2 size={17} className="animate-spin" /> : <><Save size={17} /> Guardar foto</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalCambiarPassword({ onCerrar }: ModalCambiarPasswordProps) {
  const [form, setForm] = useState({ password_actual: "", password_nuevo: "", confirmar: "" });
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const handleSubmit = async () => {
    if (!form.password_actual || !form.password_nuevo || !form.confirmar) return setError("Completa todos los campos.");
    if (form.password_nuevo !== form.confirmar) return setError("Las contraseñas nuevas no coinciden.");
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/.test(form.password_nuevo)) return setError("Mínimo 8 caracteres, mayúscula, número y símbolo.");
    setGuardando(true); setError("");
    try {
      await api.put("/auth/perfil/password", form);
      setOk(true);
      setTimeout(() => onCerrar(), 1500);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { mensaje?: string } } };
      setError(err?.response?.data?.mensaje ?? "Error al cambiar contraseña.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onMouseDown={onCerrar}>
      <div className="bg-[#0D1117] border border-white/10 rounded-3xl w-full max-w-[480px] p-6 pb-8 shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-black text-[18px]">Cambiar contraseña</h3>
          <button type="button" onClick={onCerrar} className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider block mb-1">Contraseña actual</label>
            <div className="relative">
              <input type={verActual ? "text" : "password"} value={form.password_actual} onChange={(e) => setForm(p => ({ ...p, password_actual: e.target.value }))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 pr-11 text-[14px] outline-none focus:border-[#D4A017]/50" />
              <button type="button" onClick={() => setVerActual(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">{verActual ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <div>
            <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider block mb-1">Nueva contraseña</label>
            <div className="relative">
              <input type={verNueva ? "text" : "password"} value={form.password_nuevo} onChange={(e) => setForm(p => ({ ...p, password_nuevo: e.target.value }))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 pr-11 text-[14px] outline-none focus:border-[#D4A017]/50" />
              <button type="button" onClick={() => setVerNueva(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">{verNueva ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <div>
            <label className="text-white/40 text-[11px] font-bold uppercase tracking-wider block mb-1">Confirmar nueva contraseña</label>
            <input type="password" value={form.confirmar} onChange={(e) => setForm(p => ({ ...p, confirmar: e.target.value }))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#D4A017]/50" />
          </div>
        </div>
        {error && <p className="mt-3 text-red-400 text-[13px] bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}
        {ok && <p className="mt-3 text-green-400 text-[13px] bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 flex items-center gap-2"><Check size={15} /> Contraseña actualizada</p>}
        <button type="button" onClick={handleSubmit} disabled={guardando || ok} className="mt-5 w-full flex items-center justify-center gap-2 bg-[#D4A017] hover:bg-[#F0B429] disabled:opacity-60 text-[#1A1A2E] font-black py-3.5 rounded-xl transition-all">
          {guardando ? <Loader2 size={18} className="animate-spin" /> : <><Lock size={18} /> Cambiar contraseña</>}
        </button>
      </div>
    </div>
  );
}

// ==================== VISTAS PRINCIPALES ====================
function VistaInicio({ reservas, usuario, onIrReservas, onIrInmersion }: VistaInicioProps) {
  const [hoy] = useState(() => Date.now());
  const proximaReserva = reservas.find((r) => r.estado === "confirmada" || r.estado === "pendiente");
  const tienePagoPendiente = reservas.some((r) => r.estado === "pendiente");
  const diasRestantes = proximaReserva ? Math.ceil((new Date(proximaReserva.fecha_reserva).getTime() - hoy) / 86400000) : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-[28px] md:text-[32px] font-black text-white tracking-tight">Hola, {usuario.nombre} 👋</h1>
        <p className="text-white/50 text-[15px] mt-1">Bienvenido a tu panel de viajero</p>
      </div>
      {tienePagoPendiente && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AlertTriangle size={24} className="text-yellow-400 shrink-0" />
            <div>
              <p className="text-yellow-400 font-bold text-[15px]">Tienes un pago pendiente</p>
              <p className="text-yellow-400/70 text-[13px]">Confirma tu pago para asegurar tu cupo en el tour.</p>
            </div>
          </div>
          <button onClick={onIrReservas} className="bg-yellow-500 hover:bg-yellow-400 text-[#1A1A2E] text-[13px] font-black px-4 py-2 rounded-xl transition-colors">Ver →</button>
        </div>
      )}
      {proximaReserva ? (
        <div className="relative rounded-3xl overflow-hidden h-[280px] md:h-[340px] border border-white/10 shadow-2xl group">
          <img src={proximaReserva.paquete.foto_principal || "https://via.placeholder.com/1200x600?text=Tour"} alt="Tour" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
          <div className="absolute inset-0 p-8 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="bg-[#D4A017] text-[#1A1A2E] text-[12px] font-black px-4 py-1.5 rounded-full shadow-lg">Próximo destino</span>
              <BadgeEstado estado={proximaReserva.estado} />
            </div>
            <div>
              <h3 className="text-white font-black text-[28px] md:text-[36px] mb-2 leading-tight">{proximaReserva.paquete.nombre}</h3>
              <div className="flex items-center gap-6 text-white/80 text-[14px] font-medium mb-6">
                <span className="flex items-center gap-2"><Calendar size={16} className="text-[#D4A017]" /> {proximaReserva.fecha_reserva}</span>
                {diasRestantes !== null && diasRestantes >= 0 && (
                  <span className="flex items-center gap-2"><Clock size={16} className="text-[#D4A017]" /> {diasRestantes === 0 ? "¡Es hoy!" : `Faltan ${diasRestantes} días`}</span>
                )}
              </div>
              <button onClick={onIrReservas} className="bg-[#D4A017] hover:bg-[#F0B429] text-[#1A1A2E] text-[14px] font-black px-6 py-3 rounded-xl transition-colors shadow-lg">Ver itinerario completo →</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center shadow-lg">
          <Package size={56} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/80 font-bold text-[18px] mb-2">No tienes reservas activas</p>
          <p className="text-white/40 text-[14px] mb-6">Descubre Bolivia con nuestras experiencias únicas.</p>
          <Link to="/#paquetes" className="inline-block bg-[#D4A017] text-[#1A1A2E] font-black text-[14px] px-6 py-3 rounded-xl hover:bg-[#F0B429] transition-colors shadow-lg">Explorar paquetes →</Link>
        </div>
      )}
      <div className="pt-4">
        <p className="text-white/50 text-[13px] font-bold uppercase tracking-widest mb-4">Experiencias inmersivas</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={onIrInmersion} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 flex items-center gap-5 text-left transition-all group hover:shadow-blue-500/10 hover:border-blue-500/30">
            <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Globe size={28} className="text-blue-400" /></div>
            <div>
              <p className="text-white font-bold text-[16px]">Tours Virtuales 360°</p>
              <p className="text-white/40 text-[13px] mt-1">Explora los sitios desde tu dispositivo antes de viajar.</p>
            </div>
          </button>
          <button onClick={onIrInmersion} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 flex items-center gap-5 text-left transition-all group hover:shadow-[#D4A017]/10 hover:border-[#D4A017]/30">
            <div className="w-14 h-14 bg-[#D4A017]/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Camera size={28} className="text-[#D4A017]" /></div>
            <div>
              <p className="text-white font-bold text-[16px]">Realidad Aumentada</p>
              <p className="text-white/40 text-[13px] mt-1">Activa modelos AR interactivos durante tu recorrido.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function VistaReservas({ reservas, onCancelar }: VistaReservasProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-[26px] font-black text-white mb-4">Mis Reservas</h2>
      {reservas.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center shadow-lg">
          <Calendar size={56} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/60 font-bold text-[18px]">No tienes historial de reservas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reservas.map((r) => (
            <div key={r.cod} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-lg hover:bg-white/[0.07] transition-colors flex flex-col">
              <div className="h-[180px] relative shrink-0">
                <img src={r.paquete.foto_principal || "https://via.placeholder.com/800x400?text=Tour"} alt={r.paquete.nombre} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                  <h3 className="text-white font-black text-[20px] leading-tight pr-4">{r.paquete.nombre}</h3>
                  <BadgeEstado estado={r.estado} />
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4 text-center mb-5">
                  <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                    <p className="text-white/40 text-[11px] uppercase font-bold tracking-widest">Fecha</p>
                    <p className="text-white text-[14px] font-bold mt-1">{r.fecha_reserva}</p>
                  </div>
                  <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                    <p className="text-white/40 text-[11px] uppercase font-bold tracking-widest">Pasajeros</p>
                    <p className="text-white text-[14px] font-bold mt-1">{r.cantidad_pasajeros}</p>
                  </div>
                </div>
                {r.paquete.sitios.length > 0 && (
                  <div className="mb-5 flex-1">
                    <p className="text-white/40 text-[12px] uppercase font-bold mb-3 tracking-widest">Sitios incluidos</p>
                    <div className="flex flex-wrap gap-2">
                      {r.paquete.sitios.map((s) => (
                        <div key={s.cod} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors">
                          <MapPin size={12} className="text-[#D4A017]" />
                          <span className="text-white/80 text-[12px] font-medium">{s.nombre}</span>
                          {s.tiene_360 && <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-1.5 py-0.5 rounded-md">360°</span>}
                          {s.tiene_ra && <span className="bg-[#D4A017]/20 text-[#D4A017] text-[10px] font-black px-1.5 py-0.5 rounded-md">AR</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {r.pago && (
                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between mb-5 shrink-0">
                    <div>
                      <p className="text-white/40 text-[11px] uppercase font-bold tracking-widest">Total Pagado</p>
                      <p className="text-[#D4A017] font-black text-[18px] mt-0.5">Bs. {Number(r.pago.monto_pagado).toFixed(2)}</p>
                    </div>
                    <CreditCard size={28} className="text-white/10" />
                  </div>
                )}
                <div className="flex gap-3 mt-auto shrink-0">
                  <button type="button" onClick={() => generarVoucherPDF(r)} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-xl text-[14px] font-bold transition-colors">
                    <Download size={18} /> Voucher
                  </button>
                  {(r.estado === "pendiente" || r.estado === "confirmada") && (
                    <button type="button" onClick={() => onCancelar(r)} className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-3.5 rounded-xl text-[14px] font-bold transition-colors">
                      <X size={18} /> Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VistaInmersion({ reservas }: VistaInmersionProps) {
  const sitiosConAcceso = reservas.filter((r) => r.estado !== "cancelada").flatMap((r) => r.paquete.sitios).filter((s, i, arr) => arr.findIndex(x => x.cod === s.cod) === i);
  const sitiosCon360 = sitiosConAcceso.filter((s) => s.tiene_360);
  const sitiosConRA = sitiosConAcceso.filter((s) => s.tiene_ra);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-[26px] font-black text-white mb-4">Centro de Inmersión</h2>
      {sitiosConAcceso.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center shadow-lg">
          <Globe size={56} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/60 font-bold text-[18px] mb-2">Sin acceso inmersivo aún</p>
          <p className="text-white/40 text-[14px]">Reserva un paquete para desbloquear experiencias 360° y RA</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <p className="text-blue-400 text-[13px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Globe size={16} /> Tours Virtuales 360°</p>
            {sitiosCon360.length > 0 ? (
              <div className="space-y-3">
                {sitiosCon360.map((s) => (
                  <Link key={s.cod} to={`/viewer?sitio=${s.cod}`} className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-2xl p-5 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Globe size={24} className="text-blue-400" /></div>
                      <div><p className="text-white font-bold text-[15px]">{s.nombre}</p><p className="text-white/40 text-[13px] mt-0.5">Explorar en 360°</p></div>
                    </div>
                    <ChevronRight size={20} className="text-white/30 group-hover:text-blue-400" />
                  </Link>
                ))}
              </div>
            ) : <p className="text-white/30 text-[14px] bg-white/5 p-4 rounded-xl border border-white/5">Tus reservas actuales no incluyen sitios 360°.</p>}
          </div>
          <div>
            <p className="text-[#D4A017] text-[13px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Camera size={16} /> Realidad Aumentada</p>
            {sitiosConRA.length > 0 ? (
              <div className="space-y-3">
                {sitiosConRA.map((s) => (
                  <Link key={s.cod} to={`/ar?sitio=${s.cod}`} className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4A017]/30 rounded-2xl p-5 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#D4A017]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Camera size={24} className="text-[#D4A017]" /></div>
                      <div><p className="text-white font-bold text-[15px]">{s.nombre}</p><p className="text-white/40 text-[13px] mt-0.5">Activar cámara AR</p></div>
                    </div>
                    <ChevronRight size={20} className="text-white/30 group-hover:text-[#D4A017]" />
                  </Link>
                ))}
              </div>
            ) : <p className="text-white/30 text-[14px] bg-white/5 p-4 rounded-xl border border-white/5">Tus reservas actuales no incluyen sitios con AR.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function VistaPagos({ reservas }: VistaPagosProps) {
  const pagos = reservas.filter((r) => r.pago !== null);
  const totalPagado = pagos.reduce((sum, r) => sum + Number(r.pago?.monto_pagado ?? 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-[26px] font-black text-white mb-4">Mis Pagos</h2>
      <div className="bg-gradient-to-br from-[#D4A017]/20 to-[#1A1A2E]/60 border border-[#D4A017]/30 rounded-3xl p-8 md:p-10 shadow-[0_0_40px_rgba(212,160,23,0.05)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        <div className="absolute -right-10 -bottom-10 opacity-5"><CreditCard size={250} /></div>
        <div className="relative z-10 text-center md:text-left mb-4 md:mb-0">
          <p className="text-white/60 text-[14px] font-bold uppercase tracking-widest mb-2">Total Invertido en Viajes</p>
          <p className="text-[#D4A017] font-black text-[48px] leading-none mb-2">Bs. {totalPagado.toFixed(2)}</p>
          <p className="text-white/40 text-[14px] font-medium">Equivalente a USD ${(totalPagado / 6.96).toFixed(2)}</p>
        </div>
      </div>
      {pagos.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center shadow-lg mt-6">
          <CreditCard size={56} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/60 font-bold text-[18px]">Sin historial de pagos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {pagos.map((r) => (
            <div key={r.cod} className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-md hover:bg-white/10 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <p className="text-white font-bold text-[16px] max-w-[70%]">{r.paquete.nombre}</p>
                <BadgeEstado estado={r.estado} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <p className="text-white/40 text-[11px] uppercase font-bold mb-1 tracking-widest">Monto</p>
                  <p className="text-[#D4A017] font-black text-[18px]">Bs. {Number(r.pago!.monto_pagado).toFixed(2)}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <p className="text-white/40 text-[11px] uppercase font-bold mb-1 tracking-widest">Método</p>
                  <p className="text-white font-bold text-[15px] mt-0.5">{r.pago!.metodo_pago.split("_")[0].toUpperCase()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VistaPerfil({ usuario, onCerrarSesion, onActualizarUsuario }: VistaPerfilProps) {
  const [modalDatos, setModalDatos] = useState(false);
  const [modalFoto, setModalFoto] = useState(false);
  const [modalPassword, setModalPassword] = useState(false);

  const getIniciales = () => `${usuario.nombre?.charAt(0) ?? ""}${usuario.apellido_paterno?.charAt(0) ?? ""}`.toUpperCase() || "TU";

  return (
    <>
      {modalDatos && <ModalEditarDatos usuario={usuario} onCerrar={() => setModalDatos(false)} onActualizado={onActualizarUsuario} />}
      {modalFoto && <ModalFotoPerfil usuario={usuario} onCerrar={() => setModalFoto(false)} onActualizado={(f: string) => onActualizarUsuario({ ...usuario, foto_perfil: f })} />}
      {modalPassword && <ModalCambiarPassword onCerrar={() => setModalPassword(false)} />}

      <div className="space-y-8 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-[26px] font-black text-white mb-2">Mi Perfil</h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl">
          <button type="button" onClick={() => setModalFoto(true)} className="relative group cursor-pointer shrink-0">
            <div className="w-28 h-28 rounded-full bg-[#D4A017] flex items-center justify-center text-[#1A1A2E] font-black text-[32px] overflow-hidden shadow-[0_0_20px_rgba(212,160,23,0.3)]">
              {usuario.foto_perfil ? <img src={usuario.foto_perfil} className="w-full h-full object-cover" alt="Perfil" /> : getIniciales()}
            </div>
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Camera size={28} className="text-white" />
            </div>
          </button>
          <div className="text-center md:text-left flex-1">
            <p className="text-white font-black text-[24px] md:text-[28px]">{usuario.nombre} {usuario.apellido_paterno}</p>
            <p className="text-white/60 text-[15px] mt-1">{usuario.email}</p>
            {usuario.telefono && <p className="text-white/40 text-[14px] mt-1">{usuario.telefono}</p>}
            <span className="inline-block mt-4 bg-[#1B4332] border border-green-500/30 text-green-400 text-[12px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">
              Turista Verificado
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {[
            { ico: <Edit3 size={24} />, lbl: "Editar datos", desc: "Nombre, apellido, teléfono", onClick: () => setModalDatos(true) },
            { ico: <Lock size={24} />, lbl: "Seguridad", desc: "Cambiar contraseña", onClick: () => setModalPassword(true) },
            { ico: <Eye size={24} />, lbl: "Foto de perfil", desc: "Cambiar o tomar foto", onClick: () => setModalFoto(true) }
          ].map((op, i) => (
            <button key={i} type="button" onClick={op.onClick} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all shadow-md group">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white/60 mb-4 group-hover:text-white transition-colors">{op.ico}</div>
              <p className="text-white font-bold text-[16px]">{op.lbl}</p>
              <p className="text-white/40 text-[13px] mt-1">{op.desc}</p>
            </button>
          ))}
        </div>
        <div className="pt-6 border-t border-white/10 text-center md:text-right">
          <button type="button" onClick={onCerrarSesion} className="inline-flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-8 py-4 rounded-2xl font-bold transition-all shadow-md">
            <LogOut size={20} /> Cerrar sesión segura
          </button>
        </div>
      </div>
    </>
  );
}

// ==================== MAIN COMPONENT (DESKTOP LAYOUT) ====================
export function Turista() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<UsuarioData | null>(() => {
    try { const u = localStorage.getItem("usuario"); return u ? JSON.parse(u) : null; } catch { return null; }
  });

  const [vistaActiva, setVistaActiva] = useState<Vista>("inicio");
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [reservaCancelar, setReservaCancelar] = useState<Reserva | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const [idsLeidas, setIdsLeidas] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("notifs_leidas") || "[]"); } catch { return []; }
  });

  // SOLUCIÓN AL ERROR: Calculamos las notificaciones al vuelo con useMemo
  // Esto evita el renderizado en cascada y hace la app más rápida.
  const notificaciones = React.useMemo(() => {
    return generarNotificaciones(reservas, idsLeidas);
  }, [reservas, idsLeidas]);

  useEffect(() => { if (!usuario) navigate("/login"); }, [usuario, navigate]);

  useEffect(() => {
    let isMounted = true;

    const fetchDatos = async () => {
      try {
        const res = await api.get("/mis-reservas");
        if (isMounted) {
          const data: Reserva[] = Array.isArray(res.data) ? res.data : [];
          setReservas(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setCargando(false);
      }
    };

    if (usuario) {
      setTimeout(() => { fetchDatos(); }, 0);
    }
    return () => { isMounted = false; };
  }, [usuario]);

  const handleCancelar = async () => {
    if (!reservaCancelar) return;
    setCancelando(true);
    try {
      await api.patch(`/reservas/${reservaCancelar.cod}/cancelar`);
      setReservaCancelar(null);

      const res = await api.get("/mis-reservas");
      setReservas(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setCancelando(false);
    }
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  if (!usuario) return null;

  const sidebarItems = [
    { id: "inicio",    ico: <Home size={20} />,       lbl: "Inicio" },
    { id: "reservas",  ico: <Calendar size={20} />,   lbl: "Mis Reservas" },
    { id: "inmersion", ico: <Globe size={20} />,      lbl: "Inmersión 360°" },
    { id: "pagos",     ico: <CreditCard size={20} />, lbl: "Historial de Pagos" },
    { id: "perfil",    ico: <User size={20} />,       lbl: "Mi Perfil" },
  ];

  const renderVista = () => {
    switch(vistaActiva){
      case "inicio": return <VistaInicio reservas={reservas} usuario={usuario} onIrReservas={() => setVistaActiva("reservas")} onIrInmersion={() => setVistaActiva("inmersion")} />;
      case "reservas": return <VistaReservas reservas={reservas} onCancelar={setReservaCancelar} />;
      case "inmersion": return <VistaInmersion reservas={reservas} />;
      case "pagos": return <VistaPagos reservas={reservas} />;
      case "perfil": return <VistaPerfil usuario={usuario} onCerrarSesion={() => { localStorage.clear(); navigate("/"); }} onActualizarUsuario={(u: UsuarioData) => { setUsuario(u); localStorage.setItem("usuario", JSON.stringify(u)); }} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] font-['Inter'] overflow-hidden text-white w-full">

      <aside className={`fixed lg:static inset-y-0 left-0 w-[280px] bg-[#0A0A0F] border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-50 transform ${menuAbierto ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 flex flex-col shrink-0`}>
        <div className="h-[80px] px-8 flex items-center border-b border-white/5 shrink-0 justify-between">
          <Link to="/" onClick={() => setMenuAbierto(false)}>
            <img src="/logo.webp" alt="Diana Tours" className="h-10 w-auto" />
          </Link>
          <button type="button" className="lg:hidden text-white/50" onClick={() => setMenuAbierto(false)}><X size={24}/></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-8 space-y-2">
          <div className="px-8 mb-4"><span className="text-[#D4A017] text-[11px] font-black uppercase tracking-widest opacity-80">Menú Turista</span></div>
          {sidebarItems.map(item => (
            <MenuBoton key={item.id} activa={vistaActiva === item.id}
              onClick={() => { setVistaActiva(item.id as Vista); setMenuAbierto(false); }}
              icono={item.ico} texto={item.lbl} />
          ))}
        </nav>
        <div className="p-6 border-t border-white/5 shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-4 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors" onClick={() => { setVistaActiva("perfil"); setMenuAbierto(false); }}>
            <div className="w-10 h-10 rounded-full bg-[#D4A017] flex items-center justify-center text-[#1A1A2E] font-black text-[14px] overflow-hidden shrink-0">
              {usuario.foto_perfil ? <img src={usuario.foto_perfil} className="w-full h-full object-cover" alt="foto" /> : `${usuario.nombre?.charAt(0) ?? ""}${usuario.apellido_paterno?.charAt(0) ?? ""}`.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-[13px] font-bold truncate text-white">{usuario.nombre} {usuario.apellido_paterno}</p>
              <p className="text-[11px] text-white/50 truncate">Viajero</p>
            </div>
          </div>
        </div>
      </aside>

      {menuAbierto && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMenuAbierto(false)} />}

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative"
        style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(212,160,23,0.03) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(26,26,46,0.4) 0%, transparent 50%)" }}>

        {reservaCancelar && <ModalCancelar reserva={reservaCancelar} onConfirmar={handleCancelar} onCerrar={() => setReservaCancelar(null)} cancelando={cancelando} />}

        <header className="h-[80px] px-6 lg:px-10 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button type="button" className="lg:hidden text-white/70 hover:text-white" onClick={() => setMenuAbierto(true)}><Menu size={26}/></button>
            <h2 className="text-white text-[18px] md:text-[20px] font-black hidden sm:block capitalize">{vistaActiva.replace("-", " ")}</h2>
          </div>
          <div className="flex items-center gap-6 relative">
            <button type="button" onClick={() => setMostrarNotifs(p => !p)} className="relative text-white/60 hover:text-white transition-colors">
              <Bell size={22} />
              {noLeidas > 0 && <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] bg-[#D4A017] rounded-full border-2 border-[#050505] flex items-center justify-center"><span className="text-[#1A1A2E] text-[10px] font-black px-1">{noLeidas}</span></span>}
            </button>
            {mostrarNotifs && (
              <>
                <div className="fixed inset-0 z-40" onMouseDown={() => setMostrarNotifs(false)} />
                <div className="absolute top-12 right-0 z-50">
                   <PanelNotificaciones
                     notificaciones={notificaciones}
                     onCerrar={() => setMostrarNotifs(false)}
                     onMarcarLeidas={() => {
                       const ids = notificaciones.map(n => n.id);
                       const combinados = Array.from(new Set([...idsLeidas, ...ids]));
                       setIdsLeidas(combinados);
                       localStorage.setItem("notifs_leidas", JSON.stringify(combinados));
                     }}
                   />
                </div>
              </>
            )}
            <button type="button" onClick={() => setVistaActiva("perfil")} className="hidden md:flex w-10 h-10 rounded-full bg-[#D4A017] items-center justify-center text-[#1A1A2E] font-black text-[14px] overflow-hidden hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-[#D4A017]/50">
              {usuario.foto_perfil ? <img src={usuario.foto_perfil} className="w-full h-full object-cover" alt="foto" /> : `${usuario.nombre?.charAt(0) ?? ""}${usuario.apellido_paterno?.charAt(0) ?? ""}`.toUpperCase()}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 py-8 lg:py-10">
          {cargando ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 size={48} className="animate-spin text-[#D4A017] mb-4" />
              <p className="text-white/40 text-[15px] font-medium tracking-wide">Cargando tu información...</p>
            </div>
          ) : renderVista()}
        </div>

        <button type="button" onClick={() => navigate("/ar")}
          className="fixed bottom-8 right-8 w-16 h-16 bg-[#D4A017] hover:bg-[#F0B429] rounded-full shadow-[0_0_25px_rgba(212,160,23,0.3)] flex items-center justify-center cursor-pointer transition-all hover:scale-105 z-40 lg:absolute" title="Abrir Realidad Aumentada">
          <Camera size={26} className="text-[#1A1A2E]" />
        </button>

      </main>
    </div>
  );
}

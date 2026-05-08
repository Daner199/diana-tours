import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Loader2, ArrowLeft, Clock, MapPin, CheckCircle2, XCircle,
  Calendar, Lock, CreditCard, Banknote, X, Users, DollarSign,
  QrCode
} from "lucide-react";
import api from "../api";

interface DiaItinerario { dia: number; titulo: string; descripcion: string; }
interface Sitio { cod: number; nombre: string; }
interface PaqueteDetalleDB {
  cod: number;
  nombre: string;
  precio_bs: number;
  duracion_horas: number;
  foto_principal: string | null;
  acerca_de: string | null;
  que_esperar: string | null;
  incluye: string[] | null;
  no_incluye: string[] | null;
  itinerario: DiaItinerario[] | null;
  sitios: Sitio[];
}

// Interfaz estricta
interface PayloadReserva {
  cod_paquete: number;
  fecha_reserva: string;
  cantidad_pasajeros: number;
  metodo_pago: string;
  moneda: string;
  tarjeta_numero?: string;
  tarjeta_titular?: string;
  tarjeta_mes?: string;
  tarjeta_anio?: string;
  tarjeta_cvv?: string;
}

// ==================== MODAL DE RESERVA ====================
function ModalReserva({ paquete, onCerrar, onExito }: {
  paquete: PaqueteDetalleDB;
  onCerrar: () => void;
  onExito: (cod: number) => void;
}) {
  const [fecha, setFecha] = useState("");
  const [pasajeros, setPasajeros] = useState(1);
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta" | "qr">("efectivo");
  const [moneda, setMoneda] = useState<"BOB" | "USD">("BOB");
  const [tipoCambio, setTipoCambio] = useState(6.96);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Estados estrictos para la tarjeta
  const [tarjetaNumero, setTarjetaNumero] = useState("");
  const [tarjetaTitular, setTarjetaTitular] = useState("");
  const [tarjetaCvv, setTarjetaCvv] = useState("");

  // NUEVO: Un solo estado para la fecha de expiración visual (Ej: 03/2026)
  const [tarjetaExpiracion, setTarjetaExpiracion] = useState("");

  useEffect(() => {
    api.get("/tipo-cambio")
      .then(r => setTipoCambio(r.data.BOB_por_USD))
      .catch(() => setTipoCambio(6.96));
  }, []);

  const precioBs = Number(paquete.precio_bs);
  const totalBs  = precioBs * pasajeros;
  const totalUSD = parseFloat((totalBs / tipoCambio).toFixed(2));

  // Función para auto-formatear la fecha con la barra "/"
  const handleExpiracionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ""); // Solo permite números
    if (val.length >= 3) {
      val = val.substring(0, 2) + "/" + val.substring(2, 6);
    }
    setTarjetaExpiracion(val);
  };

  const handleReservar = async () => {
    if (!fecha) { setError("Selecciona una fecha para el tour."); return; }

    // Extraemos el mes y el año de la cadena visual (ej: "03" y "2026")
    const [mesStr, anioCompleto] = tarjetaExpiracion.split("/");
    // Laravel espera 2 dígitos para el año, así que sacamos los últimos 2 (ej: "26")
    const anioStr = anioCompleto?.length === 4 ? anioCompleto.substring(2, 4) : (anioCompleto || "");

    // Validación de Frontend para tarjeta
    if (metodoPago === "tarjeta") {
      if (tarjetaNumero.length < 16) { setError("El número de tarjeta debe tener 16 dígitos."); return; }
      if (!tarjetaTitular.trim()) { setError("Ingresa el nombre del titular."); return; }
      if (!mesStr || mesStr.length !== 2 || Number(mesStr) < 1 || Number(mesStr) > 12 || !anioStr || anioStr.length !== 2) {
        setError("Fecha de vencimiento inválida. Usa el formato MM/AAAA (Ej: 03/2026)."); return;
      }
      if (tarjetaCvv.length < 3) { setError("Ingresa el código CVV (3 dígitos)."); return; }
    }

    setError("");
    setGuardando(true);

    try {
      const payload: PayloadReserva = {
        cod_paquete: paquete.cod,
        fecha_reserva: fecha,
        cantidad_pasajeros: pasajeros,
        metodo_pago: metodoPago,
        moneda,
      };

      if (metodoPago === "tarjeta") {
        payload.tarjeta_numero = tarjetaNumero;
        payload.tarjeta_titular = tarjetaTitular;
        payload.tarjeta_mes = mesStr;       // Se envía "03"
        payload.tarjeta_anio = anioStr;     // Se envía "26"
        payload.tarjeta_cvv = tarjetaCvv;
      }

      const res = await api.post("/reservas", payload);
      onExito(res.data.reserva);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { mensaje?: string } } };
      setError(e.response?.data?.mensaje || "Error al crear la reserva.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0D1117] border border-white/10 rounded-2xl w-full max-w-[420px] shadow-2xl flex flex-col max-h-[88vh]">

        {/* Header compacto */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-white font-black text-[16px]">Confirmar Reserva</h2>
            <p className="text-white/40 text-[12px] truncate max-w-[260px]">{paquete.nombre}</p>
          </div>
          <button onClick={onCerrar} className="text-white/40 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-[13px]">
              {error}
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="block text-[12px] font-bold text-white/70 mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-[#D4A017]" /> Fecha del tour *
            </label>
            <input type="date" value={fecha}
              onChange={e => setFecha(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              max="2030-12-31"
              className="w-full h-[44px] px-4 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017] focus:outline-none text-[14px] cursor-pointer [color-scheme:dark]" />
          </div>

          {/* Pasajeros */}
          <div>
            <label className="block text-[12px] font-bold text-white/70 mb-1.5 flex items-center gap-1.5">
              <Users size={13} className="text-[#D4A017]" /> Pasajeros
            </label>
            <div className="flex items-center gap-4">
              <button onClick={() => setPasajeros(p => Math.max(1, p - 1))}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 cursor-pointer font-bold text-lg">−</button>
              <span className="text-white font-black text-[20px] w-6 text-center">{pasajeros}</span>
              <button onClick={() => setPasajeros(p => Math.min(20, p + 1))}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 cursor-pointer font-bold text-lg">+</button>
            </div>
          </div>

          {/* Moneda */}
          <div>
            <label className="block text-[12px] font-bold text-white/70 mb-1.5 flex items-center gap-1.5">
              <DollarSign size={13} className="text-[#D4A017]" /> Moneda
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["BOB", "USD"] as const).map(m => (
                <button key={m} onClick={() => setMoneda(m)}
                  className={`py-2.5 rounded-xl font-bold text-[13px] border transition-all cursor-pointer ${moneda === m ? "bg-[#D4A017] border-[#D4A017] text-[#1A1A2E]" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}>
                  {m === "BOB" ? "🇧🇴 Bolivianos" : "🇺🇸 Dólares"}
                </button>
              ))}
            </div>
            <p className="text-white/30 text-[11px] mt-1 text-center">1 USD = {tipoCambio} Bs.</p>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-[12px] font-bold text-white/70 mb-1.5 flex items-center gap-1.5">
              <CreditCard size={13} className="text-[#D4A017]" /> Método de pago
            </label>
            <div className="space-y-2">
              {([
                { id: "efectivo" as const, icono: <Banknote size={16} />, label: "Efectivo en oficina", desc: "Paga al llegar a Diana Tours" },
                { id: "tarjeta"  as const, icono: <CreditCard size={16} />, label: "Tarjeta de crédito/débito", desc: "Visa, Mastercard, etc." },
                { id: "qr"       as const, icono: <QrCode size={16} />, label: "Pago por QR", desc: "Escanea y transfiere" },
              ]).map(m => (
                <button key={m.id} onClick={() => setMetodoPago(m.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all text-left ${metodoPago === m.id ? "border-[#D4A017] bg-[#D4A017]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <span className={metodoPago === m.id ? "text-[#D4A017]" : "text-white/40"}>{m.icono}</span>
                  <div>
                    <p className={`text-[13px] font-bold ${metodoPago === m.id ? "text-white" : "text-white/60"}`}>{m.label}</p>
                    <p className="text-[11px] text-white/30">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* FORMULARIO TARJETA CON CAMPO MM/AAAA COMBINADO */}
            {metodoPago === "tarjeta" && (
              <div className="mt-3 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <p className="text-white/70 text-[12px] font-bold flex items-center gap-2">
                  <CreditCard size={14} className="text-[#D4A017]" />
                  Ingresa los datos de tu tarjeta
                </p>
                <input
                  type="text" placeholder="Número de tarjeta (16 dígitos)" maxLength={16}
                  value={tarjetaNumero} onChange={e => setTarjetaNumero(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-[40px] px-3 bg-black/20 border border-white/10 rounded-xl text-white text-[13px] focus:border-[#D4A017] outline-none transition-colors placeholder:text-white/20"
                />


                <div className="flex gap-2">
                  <input
                    type="text" placeholder=" (MM/AAAA)" maxLength={7}
                    value={tarjetaExpiracion} onChange={handleExpiracionChange}
                    className="w-2/3 h-[40px] px-3 bg-black/20 border border-white/10 rounded-xl text-white text-[13px] focus:border-[#D4A017] outline-none transition-colors placeholder:text-white/20 text-center"
                  />
                  <input
                    type="password" placeholder="CVV" maxLength={4}
                    value={tarjetaCvv} onChange={e => setTarjetaCvv(e.target.value.replace(/\D/g, ''))}
                    className="w-1/3 h-[40px] px-3 bg-black/20 border border-white/10 rounded-xl text-white text-[13px] focus:border-[#D4A017] outline-none transition-colors placeholder:text-white/20 text-center"
                  />
                </div>

                <input
                  type="text" placeholder="Nombre del titular "
                  value={tarjetaTitular} onChange={e => setTarjetaTitular(e.target.value.toUpperCase())}
                  className="w-full h-[40px] px-3 bg-black/20 border border-white/10 rounded-xl text-white text-[13px] focus:border-[#D4A017] outline-none transition-colors placeholder:text-white/20 uppercase"
                />
              </div>
            )}

            {/* QR de Diana Tours */}
            {metodoPago === "qr" && (
              <div className="mt-3 bg-white rounded-2xl p-4 text-center">
                <p className="text-[#1A1A2E] text-[12px] font-bold mb-2">Escanea para transferir</p>

                {/* NUEVA IMAGEN DEL QR */}
                <img
                  src="/qr-diana-tours.jpeg"
                  alt="QR para pago Diana Tours"
                  className="w-40 h-40 object-contain mx-auto rounded-xl border border-gray-200 shadow-sm"
                />

                <p className="text-[#1A1A2E] text-[11px] mt-3 font-bold">Cuenta: Diana Tours SRL</p>
                <p className="text-gray-500 text-[10px]">Banco Mercantil Santa Cruz · Nro. 1015873503</p>
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-[12px] text-white/50">
              <span>Precio/persona</span>
              <span>{moneda === "BOB" ? `Bs. ${precioBs.toFixed(2)}` : `USD $${(precioBs / tipoCambio).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-[12px] text-white/50">
              <span>Pasajeros</span>
              <span>× {pasajeros}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between font-black text-white text-[17px]">
              <span>Total</span>
              <div className="text-right">
                <div className="text-[#D4A017]">
                  {moneda === "BOB" ? `Bs. ${totalBs.toFixed(2)}` : `USD $${totalUSD}`}
                </div>
                <div className="text-[10px] text-white/30 font-normal">
                  {moneda === "BOB" ? `≈ USD $${totalUSD}` : `≈ Bs. ${totalBs.toFixed(2)}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 shrink-0">
          <button onClick={handleReservar} disabled={guardando}
            className="w-full h-[50px] bg-[#D4A017] hover:bg-[#F0B429] text-[#1A1A2E] font-black text-[15px] rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
            {guardando ? <Loader2 size={18} className="animate-spin" /> : "✅ Confirmar Reserva"}
          </button>
          <p className="text-center text-white/25 text-[10px] mt-2">
            Reserva en estado pendiente hasta confirmar pago
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================== MODAL ÉXITO ====================
function ModalExito({ codReserva, onCerrar }: { codReserva: number; onCerrar: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0D1117] border border-white/10 rounded-3xl w-full max-w-[380px] p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-white font-black text-[22px] mb-2">¡Reserva registrada!</h2>
        <p className="text-white/60 text-[14px] mb-2">
          Reserva <strong className="text-[#D4A017]">#{codReserva}</strong> creada.
        </p>
        <p className="text-white/40 text-[12px] mb-6">
          Diana Tours confirmará tu pago y te contactará pronto.
        </p>
        <button onClick={() => navigate("/turista")}
          className="w-full h-[48px] bg-[#D4A017] hover:bg-[#F0B429] text-[#1A1A2E] font-black rounded-xl mb-3 cursor-pointer transition-colors">
          Ver mis reservas
        </button>
        <button onClick={onCerrar}
          className="w-full h-[40px] border border-white/10 text-white/50 hover:text-white rounded-xl cursor-pointer transition-colors text-[13px]">
          Seguir explorando
        </button>
      </div>
    </div>
  );
}

// ==================== PÁGINA PRINCIPAL ====================
export function PaqueteDetalle() {
  const { cod } = useParams();
  const navigate = useNavigate();
  const [paquete, setPaquete] = useState<PaqueteDetalleDB | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalReserva, setMostrarModalReserva] = useState(false);
  const [codReservaExito, setCodReservaExito] = useState<number | null>(null);

 // ✅ Después - sin useState, solo una constante
const estaLogueado = (() => {
  const u = localStorage.getItem("token");
  return !!u && u !== "null" && u !== "undefined";
})();

  useEffect(() => {
    api.get(`/paquetes/${cod}`)
      .then(r => setPaquete(r.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [cod]);

  const handleClickReservar = () => {
    if (!estaLogueado) {
      localStorage.setItem("redirect_after_login", `/paquete/${cod}`);
      navigate("/login");
      return;
    }
    setMostrarModalReserva(true);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#D4A017]" />
      </div>
    );
  }

  if (!paquete) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Paquete no encontrado</h2>
        <Link to="/" className="text-[#D4A017] hover:underline flex items-center gap-2">
          <ArrowLeft size={18} /> Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Inter'] pb-20">

      {mostrarModalReserva && (
        <ModalReserva paquete={paquete} onCerrar={() => setMostrarModalReserva(false)}
          onExito={(c) => { setMostrarModalReserva(false); setCodReservaExito(c); }} />
      )}
      {codReservaExito && (
        <ModalExito codReserva={codReservaExito} onCerrar={() => setCodReservaExito(null)} />
      )}

      <div className="max-w-6xl mx-auto px-6 py-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-[#D4A017] transition-colors cursor-pointer">
          <ArrowLeft size={20} /> Volver
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 mb-12">
        <div className="w-full h-[40vh] md:h-[55vh] rounded-[2rem] overflow-hidden relative shadow-2xl border border-white/10 mb-8">
          <img src={paquete.foto_principal || "https://via.placeholder.com/1200x600?text=Tour+Diana+Tours"}
            alt={paquete.nombre} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">{paquete.nombre}</h1>
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 text-white/70">
            <Clock size={16} className="text-[#D4A017]" /> {paquete.duracion_horas} horas
          </span>
          <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 text-white/70">
            <MapPin size={16} className="text-[#D4A017]" /> {paquete.sitios?.length || 0} sitios
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">Acerca del recorrido</h2>
            <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{paquete.acerca_de || "Información no disponible."}</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4">¿Qué esperar?</h2>
            <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{paquete.que_esperar || "Información no disponible."}</p>
          </section>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="text-green-500" /> Incluye</h3>
              <ul className="space-y-3">
                {paquete.incluye?.length ? paquete.incluye.map((item, i) => (
                  <li key={i} className="text-white/70 flex items-start gap-2"><span className="text-[#D4A017] mt-1">•</span>{item}</li>
                )) : <li className="text-white/40">No especificado</li>}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><XCircle className="text-red-500" /> No incluye</h3>
              <ul className="space-y-3">
                {paquete.no_incluye?.length ? paquete.no_incluye.map((item, i) => (
                  <li key={i} className="text-white/70 flex items-start gap-2"><span className="text-red-400 mt-1">✕</span>{item}</li>
                )) : <li className="text-white/40">No especificado</li>}
              </ul>
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
              <Calendar className="text-[#D4A017]" /> Itinerario
            </h2>
            {paquete.itinerario?.length ? (
              <div className="space-y-6">
                {paquete.itinerario.map((dia, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#1A1A2E] border border-[#D4A017] flex items-center justify-center text-[#D4A017] font-bold text-sm shrink-0">{dia.dia}</div>
                      {i !== paquete.itinerario!.length - 1 && <div className="w-0.5 flex-1 bg-white/10 my-2" />}
                    </div>
                    <div className="pb-6">
                      <h4 className="text-lg font-bold mb-2">{dia.titulo}</h4>
                      <p className="text-white/70 text-sm leading-relaxed">{dia.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-white/40">El itinerario se confirmará al reservar.</p>}
          </section>
        </div>

        {/* SIDEBAR */}
        <div className="w-full lg:w-[360px] shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-7 sticky top-24 shadow-2xl">
            <div className="border-b border-white/10 pb-5 mb-4">
              <span className="text-3xl font-black text-[#D4A017]">Bs. {Number(paquete.precio_bs).toFixed(2)}</span>
              <span className="text-white/50 text-sm ml-2">/ persona</span>
              <div className="flex items-center gap-2 mt-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <DollarSign size={13} className="text-[#D4A017] shrink-0" />
                <span className="text-white text-[13px] font-medium">
                  ≈ <strong>USD ${(Number(paquete.precio_bs) / 6.96).toFixed(2)}</strong> por persona
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                <span className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-1">Duración</span>
                <span className="text-white font-medium text-[14px]">{paquete.duracion_horas} horas</span>
              </div>
              <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                <span className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-2">Sitios incluidos</span>
                <div className="flex flex-wrap gap-1.5">
                  {paquete.sitios?.slice(0, 3).map(s => (
                    <span key={s.cod} className="text-xs bg-[#1B4332] text-white px-2 py-1 rounded-md">{s.nombre}</span>
                  ))}
                  {paquete.sitios?.length > 3 && (
                    <span className="text-xs bg-white/10 text-white px-2 py-1 rounded-md">+{paquete.sitios.length - 3} más</span>
                  )}
                </div>
              </div>
            </div>

            <button onClick={handleClickReservar}
              className="w-full h-13 py-4 bg-[#D4A017] hover:bg-[#F0B429] text-[#1A1A2E] font-black text-[16px] rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(212,160,23,0.2)] cursor-pointer flex items-center justify-center gap-2">
              {estaLogueado ? "Reservar ahora" : <><Lock size={18} /> Inicia sesión para reservar</>}
            </button>

            {!estaLogueado && (
              <p className="text-center text-white/40 text-[12px] mt-3">
                ¿No tienes cuenta?{" "}
                <button onClick={() => navigate("/login")} className="text-[#D4A017] hover:underline cursor-pointer font-bold">
                  Regístrate gratis
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

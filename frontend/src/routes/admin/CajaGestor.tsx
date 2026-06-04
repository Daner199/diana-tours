import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Lock, Unlock,
  Plus, Minus, Loader2, RefreshCw, FileText, X,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Wallet
} from "lucide-react";
import api from "../../api";

// ── Interfaces ────────────────────────────────────────────────────────────────
interface CajaInfo {
  cod: number;
  fecha_apertura: string;
  saldo_inicial: number;
  estado: string;
  administrador: string | null;
}
interface EstadoCaja {
  abierta: boolean;
  caja: CajaInfo | null;
  total_ingresos: number;
  total_egresos: number;
  saldo_actual: number;
}
interface Transaccion {
  cod: number;
  tipo_movimiento: "ingreso" | "egreso";
  monto: number;
  descripcion: string;
  fecha_transaccion: string;
}
interface ReporteCaja {
  cod: number;
  fecha_apertura: string;
  fecha_cierre: string | null;
  estado: string;
  saldo_inicial: number;
  saldo_final: number;
  total_ingresos: number;
  total_egresos: number;
  administrador: string | null;
  transacciones: Transaccion[];
}
interface ReporteData {
  desde: string;
  hasta: string;
  total_cajas: number;
  total_ingresos: number;
  total_egresos: number;
  balance: number;
  cajas: ReporteCaja[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtBs = (n: number) =>
  "Bs. " + Number(n ?? 0).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtFecha = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const fmtFechaCorta = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });

const fechaHoy = (): string =>
  new Date().toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// ── Componente principal ──────────────────────────────────────────────────────
export default function CajaGestor() {
  const [estado, setEstado] = useState<EstadoCaja | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refresco, setRefresco] = useState(false);
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState<"ingreso" | "egreso" | null>(null);
  const [modalReporte, setModalReporte] = useState(false);
  const [confirmaCerrar, setConfirmaCerrar] = useState(false);

  const cargarEstado = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    else setRefresco(true);
    try {
      const [resEstado, resTx] = await Promise.all([
        api.get<EstadoCaja>("/admin/caja/estado-hoy"),
        api.get<{ abierta: boolean; transacciones: Transaccion[] }>("/admin/caja/transacciones"),
      ]);
      setEstado(resEstado.data);
      setTransacciones(resTx.data.transacciones ?? []);
    } catch (e) {
      console.error("Error cargando caja:", e);
    } finally {
      setCargando(false);
      setRefresco(false);
    }
  }, []);

  useEffect(() => {
    const init = setTimeout(() => cargarEstado(), 0);
    const poll = setInterval(() => cargarEstado(true), 30_000);
    return () => { clearTimeout(init); clearInterval(poll); };
  }, [cargarEstado]);

  const handleCerrarCaja = async () => {
    if (!estado?.caja) return;
    try {
      await api.post("/admin/caja/cerrar/" + estado.caja.cod);
      setConfirmaCerrar(false);
      cargarEstado(true);
    } catch (err) {
      const e = err as { response?: { data?: { mensaje?: string } } };
      alert(e.response?.data?.mensaje ?? "Error al cerrar la caja.");
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#D4A017] mb-4" />
        <p className="text-gray-500 font-medium">Cargando estado de caja...</p>
      </div>
    );
  }

  const abierta = estado?.abierta ?? false;
  const adminNombre = estado?.caja?.administrador ?? "Administrador";
  const fechaApertura = fmtFecha(estado?.caja?.fecha_apertura ?? null);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <header className="h-[80px] bg-white flex items-center justify-between px-8 shadow-sm border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <Wallet size={28} className="text-[#D4A017]" />
          <div>
            <h1 className="text-[22px] font-black text-[#1A1A2E] leading-tight">Caja Diaria</h1>
            <p className="text-[12px] text-gray-400 font-medium">{fechaHoy()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cargarEstado(true)}
            disabled={refresco}
            className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
            title="Actualizar"
          >
            <RefreshCw size={18} className={refresco ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setModalReporte(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold text-[13px]"
          >
            <FileText size={16} />
            <span>Reporte</span>
          </button>
          {!abierta ? (
            <button
              onClick={() => setModalAbrir(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1B4332] hover:bg-[#1B4332]/80 text-white rounded-xl font-bold text-[13px] shadow-md"
            >
              <Unlock size={16} />
              <span>Abrir Caja</span>
            </button>
          ) : (
            <button
              onClick={() => setConfirmaCerrar(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-[13px] shadow-md"
            >
              <Lock size={16} />
              <span>Cerrar Caja</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">

        {/* Banner de estado */}
        {!abierta ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-4">
            <AlertCircle size={32} className="text-amber-500 shrink-0" />
            <div>
              <p className="font-black text-amber-800 text-[16px]">No hay caja abierta hoy</p>
              <p className="text-amber-600 text-[13px] mt-0.5">
                Haz clic en Abrir Caja para comenzar a registrar movimientos del día.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#1B4332]/10 border border-[#1B4332]/20 rounded-2xl p-5 flex items-center gap-4">
            <CheckCircle2 size={28} className="text-[#1B4332] shrink-0" />
            <div>
              <p className="font-black text-[#1B4332] text-[15px]">
                {"Caja abierta — " + adminNombre}
              </p>
              <p className="text-[#1B4332]/70 text-[12px]">
                {"Desde " + fechaApertura}
              </p>
            </div>
          </div>
        )}

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <TarjetaMetrica titulo="Saldo Actual"    valor={fmtBs(estado?.saldo_actual ?? 0)}    icono={<DollarSign size={22} />} color="blue"  />
          <TarjetaMetrica titulo="Total Ingresos"  valor={fmtBs(estado?.total_ingresos ?? 0)}  icono={<TrendingUp size={22} />} color="green" />
          <TarjetaMetrica titulo="Total Egresos"   valor={fmtBs(estado?.total_egresos ?? 0)}   icono={<TrendingDown size={22} />} color="red" />
        </div>

        {/* Botones de movimiento */}
        {abierta && (
          <div className="flex gap-4">
            <button
              onClick={() => setModalMovimiento("ingreso")}
              className="flex items-center gap-2 px-6 py-3 bg-[#1B4332] hover:bg-[#1B4332]/80 text-white rounded-xl font-bold text-[14px] shadow"
            >
              <Plus size={18} />
              <span>Registrar Ingreso</span>
            </button>
            <button
              onClick={() => setModalMovimiento("egreso")}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-[14px] shadow"
            >
              <Minus size={18} />
              <span>Registrar Egreso</span>
            </button>
          </div>
        )}

        {/* Tabla de transacciones */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-black text-[#1A1A2E] text-[16px]">Movimientos del Día</h2>
            <span className="text-[12px] text-gray-400 font-medium">{transacciones.length + " transacciones"}</span>
          </div>
          {transacciones.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-gray-400">
              <DollarSign size={40} className="mb-3 text-gray-200" />
              <p className="font-bold text-[#1A1A2E] text-[15px]">Sin movimientos hoy</p>
              <p className="text-[13px] mt-1">Los ingresos y egresos registrados aparecerán aquí.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-100">

                  <th className="px-6 py-3 font-bold">Tipo</th>
                  <th className="px-6 py-3 font-bold">Descripción</th>
                  <th className="px-6 py-3 font-bold">Monto</th>
                  <th className="px-6 py-3 font-bold">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {transacciones.map((t) => (
                  <tr key={t.cod} className="border-b border-gray-50 hover:bg-gray-50">

                    <td className="px-6 py-3">
                      <span className={"inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold " + (t.tipo_movimiento === "ingreso" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {t.tipo_movimiento === "ingreso" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>{t.tipo_movimiento.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[#1A1A2E] font-medium">{t.descripcion}</td>
                    <td className={"px-6 py-3 font-black text-[14px] " + (t.tipo_movimiento === "ingreso" ? "text-green-600" : "text-red-600")}>
                      {(t.tipo_movimiento === "egreso" ? "- " : "") + fmtBs(t.monto)}
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-[12px]">{fmtFecha(t.fecha_transaccion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modales ── */}
      {modalAbrir && (
        <ModalAbrirCaja onCerrar={() => setModalAbrir(false)} onGuardado={() => cargarEstado(true)} />
      )}
      {modalMovimiento && (
        <ModalMovimiento
          tipo={modalMovimiento}
          onCerrar={() => setModalMovimiento(null)}
          onGuardado={() => cargarEstado(true)}
        />
      )}
      {modalReporte && (
        <ModalReporte onCerrar={() => setModalReporte(false)} />
      )}
      {confirmaCerrar && (
        <ModalConfirmarCierre
          estado={estado}
          onCerrar={() => setConfirmaCerrar(false)}
          onConfirmar={handleCerrarCaja}
        />
      )}
    </div>
  );
}

// ── TarjetaMetrica ────────────────────────────────────────────────────────────
function TarjetaMetrica({ titulo, valor, icono, color }: {
  titulo: string; valor: string; icono: React.ReactNode; color: "blue" | "green" | "red";
}) {
  const map = {
    blue:  { bg: "bg-blue-50",  icon: "text-blue-500",  val: "text-blue-700"  },
    green: { bg: "bg-green-50", icon: "text-green-500", val: "text-green-700" },
    red:   { bg: "bg-red-50",   icon: "text-red-500",   val: "text-red-700"   },
  };
  const c = map[color];
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">{titulo}</p>
        <div className={"w-9 h-9 rounded-xl flex items-center justify-center " + c.bg + " " + c.icon}>{icono}</div>
      </div>
      <p className={"text-[22px] font-black " + c.val}>{valor}</p>
    </div>
  );
}

// ── ModalBase ─────────────────────────────────────────────────────────────────
function ModalBase({ titulo, onCerrar, children }: {
  titulo: string; onCerrar: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[440px]">
        <div className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-white font-black text-[17px]">{titulo}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white"><X size={22} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Alerta ────────────────────────────────────────────────────────────────────
function Alerta({ mensaje }: { mensaje: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-[13px] flex items-start gap-2">
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <span>{mensaje}</span>
    </div>
  );
}

// ── ModalAbrirCaja ────────────────────────────────────────────────────────────
function ModalAbrirCaja({ onCerrar, onGuardado }: { onCerrar: () => void; onGuardado: () => void }) {
  const [saldo, setSaldo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const handleAbrir = async () => {
    if (!saldo || isNaN(Number(saldo)) || Number(saldo) < 0) {
      setError("Ingresa un saldo inicial válido (puede ser 0).");
      return;
    }
    setGuardando(true); setError("");
    try {
      await api.post("/admin/caja/abrir", { saldo_inicial: parseFloat(saldo) });
      onGuardado(); onCerrar();
    } catch (err) {
      const e = err as { response?: { data?: { mensaje?: string } } };
      setError(e.response?.data?.mensaje ?? "Error al abrir la caja.");
    } finally { setGuardando(false); }
  };

  return (
    <ModalBase titulo="Abrir Caja del Día" onCerrar={onCerrar}>
      <div className="space-y-4">
        {error && <Alerta mensaje={error} />}
        <div>
          <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Saldo Inicial (Bs.)</label>
          <input
            type="number" min="0" step="0.01" value={saldo}
            onChange={(e) => setSaldo(e.target.value)}
            placeholder="Ej: 500.00"
            className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4A017] text-[14px]"
          />
          <p className="text-[11px] text-gray-400 mt-1">Puede ser 0 si no tienes efectivo inicial.</p>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCerrar} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-[13px]">
            Cancelar
          </button>
          <button
            onClick={handleAbrir} disabled={guardando}
            className="flex-1 bg-[#1B4332] hover:bg-[#1B4332]/80 text-white py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2"
          >
            {guardando
              ? <Loader2 size={16} className="animate-spin" />
              : (<><Unlock size={16} /><span>Abrir Caja</span></>)
            }
          </button>
        </div>
      </div>
    </ModalBase>
  );
}

// ── ModalMovimiento ───────────────────────────────────────────────────────────
function ModalMovimiento({ tipo, onCerrar, onGuardado }: {
  tipo: "ingreso" | "egreso"; onCerrar: () => void; onGuardado: () => void;
}) {
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const esIngreso = tipo === "ingreso";

  const handleGuardar = async () => {
    if (!monto || Number(monto) <= 0) { setError("El monto debe ser mayor a 0."); return; }
    if (!descripcion.trim()) { setError("La descripción es obligatoria."); return; }
    setGuardando(true); setError("");
    try {
      await api.post("/admin/caja/" + tipo, { monto: parseFloat(monto), descripcion: descripcion.trim() });
      onGuardado(); onCerrar();
    } catch (err) {
      const e = err as { response?: { data?: { mensaje?: string } } };
      setError(e.response?.data?.mensaje ?? ("Error al registrar el " + tipo + "."));
    } finally { setGuardando(false); }
  };

  const tituloModal = esIngreso ? "Registrar Ingreso" : "Registrar Egreso";
  const claseBoton = esIngreso ? "bg-[#1B4332] hover:bg-[#1B4332]/80" : "bg-red-600 hover:bg-red-700";
  const placeholderDesc = esIngreso ? "Ej: Pago reserva #45" : "Ej: Compra de combustible";

  return (
    <ModalBase titulo={tituloModal} onCerrar={onCerrar}>
      <div className="space-y-4">
        {error && <Alerta mensaje={error} />}
        <div>
          <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Monto (Bs.)</label>
          <input
            type="number" min="0.01" step="0.01" value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Ej: 150.00"
            className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4A017] text-[14px]"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Descripción</label>
          <input
            value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
            placeholder={placeholderDesc}
            className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4A017] text-[14px]"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCerrar} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-[13px]">
            Cancelar
          </button>
          <button
            onClick={handleGuardar} disabled={guardando}
            className={"flex-1 text-white py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 " + claseBoton}
          >
            {guardando
              ? <Loader2 size={16} className="animate-spin" />
              : (<>{esIngreso ? <Plus size={16} /> : <Minus size={16} />}<span>{esIngreso ? "Guardar Ingreso" : "Guardar Egreso"}</span></>)
            }
          </button>
        </div>
      </div>
    </ModalBase>
  );
}

// ── ModalConfirmarCierre ──────────────────────────────────────────────────────
function ModalConfirmarCierre({ estado, onCerrar, onConfirmar }: {
  estado: EstadoCaja | null; onCerrar: () => void; onConfirmar: () => void;
}) {
  const [cerrando, setCerrando] = useState(false);

  const handleConfirmar = async () => {
    setCerrando(true);
    await onConfirmar();
    setCerrando(false);
  };

  const saldoInicial  = fmtBs(estado?.caja?.saldo_inicial ?? 0);
  const totalIngresos = fmtBs(estado?.total_ingresos ?? 0);
  const totalEgresos  = fmtBs(estado?.total_egresos ?? 0);
  const saldoFinal    = fmtBs(estado?.saldo_actual ?? 0);

  return (
    <ModalBase titulo="Confirmar Cierre de Caja" onCerrar={onCerrar}>
      <div className="space-y-4">
        <p className="text-[14px] text-gray-600">El saldo final quedará registrado y la caja se cerrará.</p>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Saldo inicial</span>
            <span className="font-bold">{saldoInicial}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>{"+ Ingresos"}</span>
            <span className="font-bold">{totalIngresos}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>{"- Egresos"}</span>
            <span className="font-bold">{totalEgresos}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="font-black text-[#1A1A2E]">Saldo Final</span>
            <span className="font-black text-[#1A1A2E] text-[15px]">{saldoFinal}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCerrar} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-[13px]">
            Cancelar
          </button>
          <button
            onClick={handleConfirmar} disabled={cerrando}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2"
          >
            {cerrando
              ? <Loader2 size={16} className="animate-spin" />
              : (<><Lock size={16} /><span>Cerrar Caja</span></>)
            }
          </button>
        </div>
      </div>
    </ModalBase>
  );
}

// ── ModalReporte ──────────────────────────────────────────────────────────────
function ModalReporte({ onCerrar }: { onCerrar: () => void }) {
  const hoy = new Date().toISOString().split("T")[0];
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [desde, setDesde] = useState(primerDiaMes);
  const [hasta, setHasta] = useState(hoy);
  const [reporte, setReporte] = useState<ReporteData | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [expandida, setExpandida] = useState<number | null>(null);

  const buscar = async () => {
    if (!desde || !hasta) { setError("Selecciona ambas fechas."); return; }
    setCargando(true); setError("");
    try {
      const res = await api.get<ReporteData>("/admin/caja/reporte?desde=" + desde + "&hasta=" + hasta);
      setReporte(res.data);
    } catch (err) {
      const e = err as { response?: { data?: { mensaje?: string } } };
      setError(e.response?.data?.mensaje ?? "Error al generar el reporte.");
    } finally { setCargando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[720px] max-h-[90vh] flex flex-col">
        <div className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between rounded-t-3xl shrink-0">
          <div className="flex items-center gap-3">
            <FileText size={22} className="text-[#D4A017]" />
            <h2 className="text-white font-black text-[18px]">Reporte de Caja</h2>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white"><X size={22} /></button>
        </div>

        {/* Filtros */}
        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[12px] font-bold text-gray-500 mb-1">Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                className="w-full h-[40px] px-3 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#D4A017]" />
            </div>
            <div className="flex-1">
              <label className="block text-[12px] font-bold text-gray-500 mb-1">Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                className="w-full h-[40px] px-3 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#D4A017]" />
            </div>
            <button
              onClick={buscar} disabled={cargando}
              className="px-5 h-[40px] bg-[#1A1A2E] hover:bg-[#D4A017] text-white rounded-xl font-bold text-[13px] flex items-center gap-2 whitespace-nowrap"
            >
              {cargando ? <Loader2 size={14} className="animate-spin" /> : <span>Generar</span>}
            </button>
          </div>
          {error && <p className="text-red-500 text-[12px] mt-2">{error}</p>}
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!reporte && !cargando && (
            <div className="py-12 text-center text-gray-400">
              <FileText size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium">Selecciona un rango y presiona Generar</p>
            </div>
          )}

          {reporte && (
            <div className="space-y-4">
              {/* Resumen global */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Cajas",    val: String(reporte.total_cajas),           color: "text-[#1A1A2E]" },
                  { label: "Ingresos", val: fmtBs(reporte.total_ingresos),          color: "text-green-600" },
                  { label: "Egresos",  val: fmtBs(reporte.total_egresos),           color: "text-red-600"   },
                  { label: "Balance",  val: fmtBs(reporte.balance), color: reporte.balance >= 0 ? "text-blue-600" : "text-red-600" },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-[11px] text-gray-400 font-bold uppercase">{item.label}</p>
                    <p className={"text-[14px] font-black mt-1 " + item.color}>{item.val}</p>
                  </div>
                ))}
              </div>

              {/* Lista de cajas */}
              <div className="space-y-2">
                {reporte.cajas.length === 0 && (
                  <p className="text-center text-gray-400 py-6 text-[13px]">Sin cajas en ese período.</p>
                )}
                {reporte.cajas.map((caja) => (
                  <div key={caja.cod} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandida(expandida === caja.cod ? null : caja.cod)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold " + (caja.estado === "abierta" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>
                          {caja.estado.toUpperCase()}
                        </span>
                        <span className="text-[13px] font-bold text-[#1A1A2E]">{fmtFechaCorta(caja.fecha_apertura)}</span>
                        <span className="text-[12px] text-gray-400">{caja.administrador ?? ""}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[13px] font-black text-blue-700">{fmtBs(caja.saldo_final)}</span>
                        {expandida === caja.cod ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </button>
                    {expandida === caja.cod && (
                      <div className="px-4 pb-3 border-t border-gray-100 bg-gray-50 space-y-1">
                        {caja.transacciones.length === 0 ? (
                          <p className="text-[12px] text-gray-400 py-3 text-center">Sin transacciones</p>
                        ) : caja.transacciones.map((t) => (
                          <div key={t.cod} className="flex items-center justify-between py-1.5 text-[12px]">
                            <span className={"w-16 text-center px-2 py-0.5 rounded-full font-bold text-[10px] " + (t.tipo_movimiento === "ingreso" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                              {t.tipo_movimiento.toUpperCase()}
                            </span>
                            <span className="flex-1 mx-3 text-gray-600 truncate">{t.descripcion}</span>
                            <span className={"font-black " + (t.tipo_movimiento === "ingreso" ? "text-green-600" : "text-red-600")}>
                              {fmtBs(t.monto)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Info, X, Loader2, Globe, Clock } from "lucide-react";
import api from "../api";

// ── Pannellum via CDN ─────────────────────────────────────────────────────────
declare global {
  interface Window {
    pannellum: {
      viewer: (container: string | HTMLElement, config: PannellumConfig) => PannellumViewer;
    };
  }
}
interface PannellumConfig {
  type: string;
  panorama: string;
  autoLoad: boolean;
  showControls: boolean;
  hotSpots?: PannellumHotspot[];
  hfov?: number;
}
interface PannellumHotspot {
  id: string;
  pitch: number;
  yaw: number;
  type: string;
  text?: string;
  clickHandlerFunc?: () => void;
}
interface PannellumViewer { destroy: () => void; }

// ── Interfaces BD ─────────────────────────────────────────────────────────────
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
  hotspots: Hotspot[];
}
interface DatosSitio {
  sitio: { cod: number; nombre: string };
  escenas: Escena[];
}

// ── Helper: detectar tipo de URL ──────────────────────────────────────────────
function esMapsEmbed(url: string): boolean {
  if (!url) return false;
  const u = url.trim();
  return u.startsWith("<iframe") || u.includes("googleusercontent.com") || u.includes("google.com/maps") || u.includes("maps.google.com");
}

function construirEmbedUrl(url: string): string {
  const u = url.trim();

  // Si se pegó el código iframe completo, extraemos solo la URL de su atributo src
  if (u.startsWith("<iframe")) {
    const match = u.match(/src=["']([^"']+)["']/);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Si ya es embed directo, usarlo tal cual
  if (u.includes("google.com/maps/embed")) return u;

  // Si es URL de vista normal, convertir a embed
  const panoMatch = u.match(/!1s([^!]+)/);
  if (panoMatch) {
    return `https://www.google.com/maps/embed?pb=!4v${Date.now()}!6m8!1m7!1s${panoMatch[1]}!2m2!1d0!2d0!3f0!4f0!5f0.7`;
  }
  return u;
}

// ── Cargar Pannellum desde CDN ────────────────────────────────────────────────
function cargarPannellum(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.pannellum) { resolve(); return; }
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Pannellum"));
    document.head.appendChild(script);
  });
}

// ── Componente principal ──────────────────────────────────────────────────────
export function Viewer360() {
  const [params]     = useSearchParams();
  const navigate     = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<PannellumViewer | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const segundosRef  = useRef(0);

  const codSitio  = params.get("sitio");
  const codEscena = params.get("escena");

  const [datos, setDatos]               = useState<DatosSitio | null>(null);
  const [escenaActual, setEscenaActual] = useState<Escena | null>(null);
  const [cargando, setCargando]         = useState(true);
  const [error, setError]               = useState("");
  const [pannellumListo, setPannellumListo] = useState(false);
  const [panelInfo, setPanelInfo]       = useState<string | null>(null);
  const [segundos, setSegundos]         = useState(0);

  // Cargar Pannellum al montar (siempre, por si alguna escena es jpg)
  useEffect(() => {
    cargarPannellum()
      .then(() => setPannellumListo(true))
      .catch((e) => console.error("Pannellum no cargó:", e));
  }, []);

  // Cargar datos del sitio
  useEffect(() => {
    if (!codSitio) {
      setTimeout(() => { setError("No se especificó el sitio."); setCargando(false); }, 0);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get<DatosSitio>("/gemelo/" + codSitio + "/escenas");
        setDatos(res.data);
        if (res.data.escenas.length === 0) {
          setError("Este sitio no tiene escenas 360° registradas.");
          setCargando(false);
          return;
        }
        const inicial = codEscena
          ? res.data.escenas.find((e) => e.cod === Number(codEscena))
          : res.data.escenas.find((e) => e.es_inicio) ?? res.data.escenas[0];
        setEscenaActual(inicial ?? res.data.escenas[0]);
      } catch (e) {
        console.error(e);
        setError("Error al cargar las escenas.");
      } finally {
        setCargando(false);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [codSitio, codEscena]);

  // Timer de inmersión
  useEffect(() => {
    timerRef.current = setInterval(() => {
      segundosRef.current += 1;
      setSegundos(segundosRef.current);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Registrar métrica al salir
  const registrarMetrica = useCallback(() => {
    if (segundosRef.current > 5 && codSitio) {
      api.post("/gemelo/metrica", {
        cod_sitio:         Number(codSitio),
        duracion_segundos: segundosRef.current,
      }).catch((e) => console.error(e));
    }
  }, [codSitio]);

  useEffect(() => {
    return () => { registrarMetrica(); };
  }, [registrarMetrica]);

  // Inicializar Pannellum SOLO si la escena es imagen jpg
  useEffect(() => {
    if (!escenaActual) return;

    // Si es embebido → no usar Pannellum
    if (esMapsEmbed(escenaActual.archivo_imagen_url)) {
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch (e) { console.error(e); }
        viewerRef.current = null;
      }
      return;
    }

    // Es imagen jpg → usar Pannellum
    if (!pannellumListo || !containerRef.current) return;

    if (viewerRef.current) {
      try { viewerRef.current.destroy(); } catch (e) { console.error(e); }
      viewerRef.current = null;
    }
    containerRef.current.innerHTML = "";

    const hotspots: PannellumHotspot[] = escenaActual.hotspots.map((h) => ({
      id:    "hs_" + h.cod,
      pitch: h.posicion_y,
      yaw:   h.posicion_x,
      type:  "info",
      text:  h.tipo_interaccion === "informacion"
        ? (h.texto_informativo ?? "")
        : ("→ " + (datos?.escenas.find((e) => e.cod === h.cod_escena_destino)?.nombre ?? "Ir")),
      clickHandlerFunc: h.tipo_interaccion === "navegacion" && h.cod_escena_destino
        ? () => {
            const destino = datos?.escenas.find((e) => e.cod === h.cod_escena_destino);
            if (destino) { setPanelInfo(null); setEscenaActual(destino); }
          }
        : h.tipo_interaccion === "informacion"
        ? () => setPanelInfo(h.texto_informativo)
        : undefined,
    }));

    try {
      viewerRef.current = window.pannellum.viewer(containerRef.current, {
        type:         "equirectangular",
        panorama:     escenaActual.archivo_imagen_url,
        autoLoad:     true,
        showControls: true,
        hfov:         100,
        hotSpots:     hotspots,
      });
    } catch (e) { console.error("Error Pannellum:", e); }

    return () => {
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch (e) { console.error(e); }
        viewerRef.current = null;
      }
    };
  }, [pannellumListo, escenaActual, datos]);

  const fmtTiempo = (s: number) => {
    const m = Math.floor(s / 60);
    const seg = s % 60;
    return (m > 0 ? m + "m " : "") + seg + "s";
  };

  const handleVolver = () => { registrarMetrica(); navigate(-1); };

  // ── Estados de carga y error ──────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex flex-col h-screen bg-[#1A1A2E] items-center justify-center">
        <Globe size={48} className="text-[#D4A017] mb-4 animate-pulse" />
        <p className="text-white font-bold text-[18px]">Cargando experiencia 360°...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-[#1A1A2E] items-center justify-center p-8">
        <Globe size={48} className="text-gray-600 mb-4" />
        <p className="text-white font-bold text-[18px] text-center">{error}</p>
        <button onClick={handleVolver} className="mt-6 flex items-center gap-2 px-5 py-3 bg-[#D4A017] text-[#1A1A2E] rounded-xl font-bold">
          <ArrowLeft size={18} />
          <span>Volver</span>
        </button>
      </div>
    );
  }

  const esGoogleMaps = escenaActual ? esMapsEmbed(escenaActual.archivo_imagen_url) : false;
  const embedUrl     = escenaActual ? construirEmbedUrl(escenaActual.archivo_imagen_url) : "";
  const nombreSitio  = datos?.sitio?.nombre ?? "Sitio";

  // ── Viewer principal ──────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">

      {/* ── MODO IFRAME (RECORRIDO ENLAZADO) ── */}
      {esGoogleMaps && escenaActual && (
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, display: "block" }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={escenaActual.nombre}
        />
      )}

      {/* ── MODO PANNELLUM (imagen jpg) ── */}
      {!esGoogleMaps && (
        <>
          <div ref={containerRef} className="w-full h-full" />
          {!pannellumListo && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1A1A2E]">
              <Loader2 size={40} className="animate-spin text-[#D4A017]" />
            </div>
          )}
        </>
      )}

      {/* ── BARRA SUPERIOR ── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <button
          onClick={handleVolver}
          className="flex items-center gap-2 px-4 py-2 bg-black/60 text-white rounded-xl font-semibold text-[13px] hover:bg-black/80 pointer-events-auto"
        >
          <ArrowLeft size={16} />
          <span>Volver</span>
        </button>

        <div className="text-center">
          <p className="text-white font-black text-[15px] drop-shadow">{nombreSitio}</p>
          {escenaActual && (
            <p className="text-gray-200 text-[12px] drop-shadow">{escenaActual.nombre}</p>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-black/60 rounded-xl pointer-events-auto">
          <Clock size={14} className="text-[#D4A017]" />
          <span className="text-white text-[12px] font-bold">{fmtTiempo(segundos)}</span>
        </div>
      </div>

      {/* ── BADGE tipo de visor ── */}
      <div className="absolute top-16 left-4 z-10">
        <span className={"px-3 py-1.5 rounded-xl text-[11px] font-bold " + (esGoogleMaps ? "bg-blue-600/80 text-white" : "bg-[#D4A017]/80 text-[#1A1A2E]")}>
          {esGoogleMaps ? "Vista de Recorrido" : "Vista 360° Panorámica"}
        </span>
      </div>

      {/* ── SELECTOR DE ESCENAS (bottom bar) ── */}
      {datos && datos.escenas.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {datos.escenas.map((esc) => (
              <button
                key={esc.cod}
                onClick={() => { setPanelInfo(null); setEscenaActual(esc); }}
                className={"shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all " + (escenaActual?.cod === esc.cod ? "bg-[#D4A017] text-[#1A1A2E]" : "bg-black/60 text-white hover:bg-black/80")}
              >
                {esMapsEmbed(esc.archivo_imagen_url)
                  ? <Globe size={12} />
                  : <span style={{ fontSize: 10 }}>360°</span>
                }
                <span>{esc.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── PANEL INFO HOTSPOT (solo Pannellum) ── */}
      {panelInfo && !esGoogleMaps && (
        <div className="absolute top-16 right-4 z-20 w-[280px] bg-white rounded-2xl shadow-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Info size={18} className="text-blue-500 shrink-0" />
              <p className="font-black text-[#1A1A2E] text-[14px]">Información</p>
            </div>
            <button onClick={() => setPanelInfo(null)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <p className="text-[13px] text-gray-600 leading-relaxed">{panelInfo}</p>
        </div>
      )}
    </div>
  );
}

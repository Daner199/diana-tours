import React, { useState, useEffect, useRef, useCallback } from "react";
import { Camera, X, Upload, User, Check, AlertCircle, Loader2 } from "lucide-react";
import api from "../api";
import * as faceapi from "face-api.js";

interface AdminUserData {
  cod: number;
  nombre?: string;
  apellido_paterno?: string;
  foto_perfil?: string;
  rol?: { nombre: string };
}

interface ModalPerfilProps {
  usuario: AdminUserData;
  onCerrar: () => void;
  onFotoActualizada: (foto: string) => void;
}

export default function ModalPerfil({ usuario, onCerrar, onFotoActualizada }: ModalPerfilProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [modoActivo, setModoActivo] = useState<"opciones" | "camara" | "subir">("opciones");
  const [modelosCargados, setModelosCargados] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [rostroDetectado, setRostroDetectado] = useState(false);
  const [contadorRegresivo, setContadorRegresivo] = useState<number | null>(null);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState("");

  const detenerCamara = useCallback(() => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCamaraActiva(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    faceapi.nets.tinyFaceDetector.loadFromUri("/models")
      .then(() => { if (mounted) setModelosCargados(true); })
      .catch(() => { if (mounted) setMensajeEstado("No se pudieron cargar los modelos."); });
    return () => { mounted = false; detenerCamara(); };
  }, [detenerCamara]);

  const capturarFoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    setFotoCapturada(canvas.toDataURL("image/jpeg", 0.85));
    detenerCamara();
    setMensajeEstado("¡Foto capturada! ¿Quieres usarla?");
  }, [detenerCamara]);

  const iniciarDeteccion = useCallback(() => {
    let contador = 0;
    let tomada = false;
    intervaloRef.current = setInterval(async () => {
      if (!videoRef.current || !modelosCargados || tomada) return;
      const d = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }));
      if (d.length > 0) {
        setRostroDetectado(true);
        contador++;
        if (contador <= 3) setContadorRegresivo(4 - contador);
        if (contador >= 3 && !tomada) {
          tomada = true;
          setContadorRegresivo(null);
          capturarFoto();
          if (intervaloRef.current) clearInterval(intervaloRef.current);
        }
      } else {
        setRostroDetectado(false);
        contador = 0;
        setContadorRegresivo(null);
      }
    }, 1000);
  }, [modelosCargados, capturarFoto]);

  const iniciarCamara = async () => {
    setModoActivo("camara");
    setFotoCapturada(null);
    setRostroDetectado(false);
    setContadorRegresivo(null);
    setMensajeEstado("Iniciando cámara...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300, facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCamaraActiva(true);
        setMensajeEstado("Coloca tu rostro dentro del óvalo");
        iniciarDeteccion();
      }
    } catch { setMensajeEstado("No se pudo acceder a la cámara."); }
  };

  const handleSubirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setFotoCapturada(reader.result as string); setModoActivo("subir"); setMensajeEstado("Foto lista. ¿Quieres usarla?"); };
    reader.readAsDataURL(file);
  };

  const guardarFoto = async () => {
    if (!fotoCapturada) return;
    setGuardando(true);
    try {
      await api.put("/auth/perfil/foto", { cod_usuario: usuario.cod, foto_perfil: fotoCapturada });
      const u = JSON.parse(localStorage.getItem("usuario") || "{}");
      u.foto_perfil = fotoCapturada;
      localStorage.setItem("usuario", JSON.stringify(u));
      onFotoActualizada(fotoCapturada);
      setTimeout(() => onCerrar(), 800);
    } catch { setMensajeEstado("Error al guardar. Intenta de nuevo."); }
    finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[460px] overflow-hidden">
        <div className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-[18px]">Foto de Perfil</h2>
            <p className="text-gray-400 text-[13px]">{usuario.nombre} {usuario.apellido_paterno}</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white"><X size={22} /></button>
        </div>
        <div className="p-6">
          {modoActivo === "opciones" && !fotoCapturada && (
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-[#D4A017] overflow-hidden bg-[#1A1A2E] flex items-center justify-center">
                  {usuario.foto_perfil ? <img src={usuario.foto_perfil} className="w-full h-full object-cover" alt="Perfil" /> : <User size={40} className="text-white/40" />}
                </div>
              </div>
              <button onClick={iniciarCamara} disabled={!modelosCargados}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 hover:border-[#D4A017] hover:bg-amber-50 rounded-2xl transition-all group disabled:opacity-50">
                <div className="w-12 h-12 bg-[#1A1A2E] rounded-xl flex items-center justify-center group-hover:bg-[#D4A017] transition-colors">
                  <Camera size={22} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-[14px]">Usar cámara web</p>
                  <p className="text-gray-500 text-[12px]">{modelosCargados ? "Captura automática al detectar rostro" : "Cargando IA..."}</p>
                </div>
                {!modelosCargados && <Loader2 size={18} className="animate-spin text-gray-400 ml-auto" />}
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 hover:border-[#D4A017] hover:bg-amber-50 rounded-2xl transition-all group">
                <div className="w-12 h-12 bg-[#1A1A2E] rounded-xl flex items-center justify-center group-hover:bg-[#D4A017] transition-colors">
                  <Upload size={22} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-[14px]">Subir desde archivo</p>
                  <p className="text-gray-500 text-[12px]">JPG, PNG o WEBP</p>
                </div>
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleSubirArchivo} className="hidden" />
            </div>
          )}
          {modoActivo === "camara" && !fotoCapturada && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-black">
                {!camaraActiva && (
                  <div className="absolute inset-0 flex items-center justify-center text-white z-10 bg-black">
                    <Loader2 className="animate-spin mr-2" size={20} /> Encendiendo cámara...
                  </div>
                )}
                <video ref={videoRef} className="w-full h-[280px] object-cover" style={{ transform: "scaleX(-1)" }} muted playsInline />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-[180px] h-[220px] border-4 rounded-[50%] transition-colors duration-500 ${rostroDetectado ? "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.5)]" : "border-white/40"}`} />
                </div>
                {contadorRegresivo !== null && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center text-[24px] font-black">
                    {contadorRegresivo}
                  </div>
                )}
                <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-2 ${rostroDetectado ? "bg-green-500 text-white" : "bg-black/60 text-white"}`}>
                  {rostroDetectado ? <><Check size={14} /> Rostro detectado</> : <><AlertCircle size={14} /> Ubica tu rostro</>}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <p className="text-center text-gray-500 text-[13px]">{mensajeEstado}</p>
              <button onClick={() => { detenerCamara(); setModoActivo("opciones"); }} className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50">Cancelar</button>
            </div>
          )}
          {fotoCapturada && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-36 h-36 rounded-full border-4 border-[#D4A017] overflow-hidden shadow-xl">
                  <img src={fotoCapturada} className="w-full h-full object-cover" alt="Captura" />
                </div>
              </div>
              {mensajeEstado && <p className="text-center text-[13px] text-gray-600 font-medium">{mensajeEstado}</p>}
              <button onClick={guardarFoto} disabled={guardando} className="w-full bg-[#1A1A2E] hover:bg-[#D4A017] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                {guardando ? <Loader2 size={20} className="animate-spin" /> : <><Check size={18} /> Guardar foto</>}
              </button>
              <button onClick={() => { setFotoCapturada(null); setModoActivo("opciones"); }} className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50">Tomar otra foto</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

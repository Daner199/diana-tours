import { Link, useNavigate } from "react-router-dom";
import {
  Mail, Lock, User, Check, Eye, EyeOff, ChevronRight, Loader2
} from "lucide-react";
import React, { useState } from "react";
import api from "../api";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Agregamos "recuperar" y "restablecer" a la lista para matar la línea roja
type Paso = "login" | "registro" | "verificar_cuenta" | "verificar_2fa" | "recuperar" | "restablecer";

// ==================== INTERFAZ ESTRICTA PARA ERRORES ====================
interface ApiError {
  response?: {
    data?: {
      message?: string;
      mensaje?: string;
      errors?: Record<string, string[]>;
    };
  };
}

export function Login() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState<Paso>("login");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [verPassword, setVerPassword] = useState(false);
  const [verPasswordReg, setVerPasswordReg] = useState(false);
  const [verPasswordReg2, setVerPasswordReg2] = useState(false);

  // Estados para los ojitos de la nueva contraseña
  const [verNewPassword, setVerNewPassword] = useState(false);
  const [verNewPassword2, setVerNewPassword2] = useState(false);

  const [userCod, setUserCod] = useState<number | null>(null);

  // Campos compartidos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");

  // Campos registro
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [emailReg, setEmailReg] = useState("");
  const [passwordReg, setPasswordReg] = useState("");
  const [passwordReg2, setPasswordReg2] = useState("");
  const [telefono, setTelefono] = useState("");
  const [recordarDispositivo, setRecordarDispositivo] = useState(false);

  // Campos recuperar contraseña
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  // ==================== HANDLERS DE FILTRADO ====================
  const soloLetras = (texto: string) => {
    return texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
  };

  // ==================== HANDLERS DE API ====================

  const handleLogin = async () => {
    setError("");
    setCargando(true);
    try {
      const tokenDispositivo = localStorage.getItem("token_dispositivo");
      const res = await api.post("/auth/login", {
        email,
        password,
        token_dispositivo: tokenDispositivo,
      });

      if (res.data.dispositivo_conocido) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("usuario", JSON.stringify(res.data.usuario));
        redirigirPorRol(res.data.usuario.cod_rol);
      } else {
        setUserCod(res.data.user_cod);
        setPaso("verificar_2fa");
        setMensaje("Enviamos un código de seguridad a tu correo electrónico.");
      }
    } catch (err: unknown) {
      const errorObj = err as ApiError;
      setError(errorObj.response?.data?.mensaje || "Credenciales incorrectas.");
    } finally {
      setCargando(false);
    }
  };

  const handleRegistro = async () => {
    setError("");

    if (!nombre || !apellidoPaterno || !emailReg || !passwordReg) {
      setError("Por favor, completa todos los campos obligatorios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailReg)) {
      setError("El formato del correo es inválido. Asegúrate de incluir '@' y el dominio.");
      return;
    }

    if (passwordReg !== passwordReg2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passRegex.test(passwordReg)) {
      setError("La contraseña debe tener mín. 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.");
      return;
    }

    setCargando(true);
    try {
      const res = await api.post("/auth/registro", {
        nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
        email: emailReg,
        password: passwordReg,
        cod_rol: 3,
        telefono,
      });
      setUserCod(res.data.user_cod);
      setPaso("verificar_cuenta");
      setMensaje("Enviamos un código de verificación a tu correo electrónico.");
    } catch (err: unknown) {
      const errorObj = err as ApiError;
      if (errorObj.response?.data?.errors) {
        const erroresBackend = errorObj.response.data.errors;
        const primerError = Object.values(erroresBackend)[0] as string[];
        setError(`Error del sistema: ${primerError[0]}`);
      } else {
        setError(errorObj.response?.data?.mensaje || errorObj.response?.data?.message || "Error al conectar con la base de datos.");
      }
    } finally {
      setCargando(false);
    }
  };

  const handleVerificarCuenta = async () => {
    setError("");
    setCargando(true);
    try {
      await api.post("/auth/verificar-cuenta", {
        user_cod: userCod,
        codigo,
      });
      setMensaje("¡Cuenta verificada! Ahora puedes iniciar sesión.");
      setPaso("login");
      setCodigo("");
    } catch (err: unknown) {
      const errorObj = err as ApiError;
      setError(errorObj.response?.data?.mensaje || "Código inválido o expirado.");
    } finally {
      setCargando(false);
    }
  };

  const handleVerificar2fa = async () => {
    setError("");
    setCargando(true);
    try {
      const res = await api.post("/auth/verificar-2fa", {
        user_cod: userCod,
        codigo,
        recordar_dispositivo: recordarDispositivo,
        nombre_dispositivo: navigator.userAgent.substring(0, 100),
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("usuario", JSON.stringify(res.data.usuario));

      if (res.data.token_dispositivo) {
        localStorage.setItem("token_dispositivo", res.data.token_dispositivo);
      }

      redirigirPorRol(res.data.usuario.cod_rol);
    } catch (err: unknown) {
      const errorObj = err as ApiError;
      setError(errorObj.response?.data?.mensaje || "Código de seguridad inválido.");
    } finally {
      setCargando(false);
    }
  };

  // ========== NUEVAS FUNCIONES PARA RECUPERAR CONTRASEÑA ==========
  const handleEnviarRecuperacion = async () => {
    setError("");
    if (!email) {
      setError("Por favor, ingresa tu correo electrónico.");
      return;
    }
    setCargando(true);
    try {
      await api.post("/auth/enviar-recuperacion", { email });
      setMensaje("Enviamos un código de 6 dígitos a tu correo.");
      setPaso("restablecer");
      setCodigo("");
    } catch (err: unknown) {
      const errorObj = err as ApiError;
      setError(errorObj.response?.data?.mensaje || "No encontramos ninguna cuenta con ese correo.");
    } finally {
      setCargando(false);
    }
  };

  const handleRestablecerPassword = async () => {
    setError("");
    if (!codigo || !newPassword || !newPassword2) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    if (newPassword !== newPassword2) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passRegex.test(newPassword)) {
      setError("La contraseña debe tener mín. 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.");
      return;
    }

    setCargando(true);
    try {
      await api.post("/auth/restablecer-password", {
        email,
        codigo,
        password: newPassword
      });
      setMensaje("¡Tu contraseña ha sido actualizada con éxito!");
      setPaso("login");
      setNewPassword("");
      setNewPassword2("");
      setCodigo("");
      setPassword("");
    } catch (err: unknown) {
      const errorObj = err as ApiError;
      setError(errorObj.response?.data?.mensaje || "Código inválido o expirado.");
    } finally {
      setCargando(false);
    }
  };

  const redirigirPorRol = (cod_rol: number) => {

    const redirect = localStorage.getItem("redirect_after_login");
    if (redirect) {
      localStorage.removeItem("redirect_after_login");
      navigate(redirect);
      return;
    }


    if (cod_rol === 3) {
      navigate("/turista");
    }
    // Si es cualquier otro rol (Admin, Guía, Oficinista), a su panel directo
    else if (cod_rol === 1) navigate("/admin");
    else if (cod_rol === 2) navigate("/guia");
    else if (cod_rol === 4) navigate("/oficinista");
    else navigate("/"); // Por si acaso un rol desconocido
  };

  // ==================== RENDER ====================
  return (
    <div className="flex min-h-screen font-['Inter'] bg-white">

      {/* PANEL IZQUIERDO */}
      <div className="hidden lg:flex w-1/2 bg-[#050505] flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img src="/vip-lapaz.jpeg" alt="Fondo" className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
        </div>

        <div className="p-10 relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.webp" alt="Diana Tours" className="h-10 w-auto rounded-md" />
          </Link>

        </div>

        <div className="flex-1 flex flex-col justify-center px-12 relative z-10 max-w-[600px] w-full">
          <h1 className="text-[42px] font-black text-white leading-[1.1] mb-6">
            Comienza tu <span className="text-[#D4A017]">aventura digital</span>.
          </h1>
          <p className="text-white/70 text-[16px] mb-10 leading-relaxed max-w-[450px]">
            Únete a nuestra plataforma para explorar interactivamente la ciudad y reservar las mejores experiencias de La Paz.
          </p>

          <div className="space-y-4">
            {[
              "Exploración virtual de sitios históricos.",
              "Recomendaciones de viaje personalizadas.",
              "Reserva de paquetes turísticos seguros.",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 text-white/80 text-[14px] font-medium">
                <div className="w-6 h-6 rounded-full bg-[#D4A017]/20 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-[#D4A017]" />
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="w-full lg:w-1/2 flex flex-col h-screen overflow-y-auto relative bg-[#F8F9FA]">
        <div className="pt-8 px-10 flex justify-end shrink-0">
          {paso === "login" ? (
            <>
              <span className="text-[#6B7280] text-[14px] mr-2">¿No tienes cuenta?</span>
              <button onClick={() => { setPaso("registro"); setError(""); setMensaje(""); }}
                className="text-[#1A1A2E] font-bold text-[14px] hover:text-[#D4A017] transition-colors">
                Regístrate →
              </button>
            </>
          ) : (
            <>
              <span className="text-[#6B7280] text-[14px] mr-2">¿Ya tienes cuenta?</span>
              <button onClick={() => { setPaso("login"); setError(""); setMensaje(""); }}
                className="text-[#1A1A2E] font-bold text-[14px] hover:text-[#D4A017] transition-colors">
                ← Iniciar sesión
              </button>
            </>
          )}
        </div>

        <div className="flex-1 px-10 pb-16 pt-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-[440px] bg-white p-10 rounded-[2rem] shadow-xl shadow-black/5 border border-gray-100">

            {/* MENSAJES DE ERROR */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-[13px] font-medium mb-6 flex items-start gap-2">
                <span className="text-red-500 font-bold mt-0.5">!</span>
                <span>{error}</span>
              </div>
            )}
            {mensaje && (
              <div className="bg-green-50 border border-green-100 text-green-700 rounded-xl px-4 py-3 text-[13px] font-medium mb-6 flex items-center gap-2">
                <Check size={16} className="text-green-500" /> {mensaje}
              </div>
            )}

            {/* ===== FORMULARIO LOGIN ===== */}
            {paso === "login" && (
              <>
                <h2 className="text-[28px] font-[900] text-[#1A1A2E] mb-2 tracking-tight">Bienvenido</h2>
                <p className="text-[#6B7280] text-[14px] mb-8">Ingresa tus datos para continuar.</p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">Correo electrónico</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        className="w-full h-[50px] pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-all text-[14px]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[13px] font-bold text-[#1A1A2E]">Contraseña</label>
                      <button onClick={() => { setPaso("recuperar"); setError(""); setMensaje(""); }} type="button"
                        className="text-[12px] font-medium text-[#D4A017] hover:underline">
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type={verPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Tu contraseña"
                        className="w-full h-[50px] pl-11 pr-11 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-all text-[14px]" />
                      <button type="button" onClick={() => setVerPassword(!verPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button onClick={handleLogin} disabled={cargando}
                      className="w-full bg-[#1A1A2E] hover:bg-[#D4A017] text-white h-[54px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-colors">
                      {cargando ? <Loader2 size={20} className="animate-spin" /> : "Iniciar sesión"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ===== FORMULARIO RECUPERAR (Paso 1) ===== */}
            {paso === "recuperar" && (
              <>
                <h2 className="text-[28px] font-[900] text-[#1A1A2E] mb-2 tracking-tight">Recuperar Acceso</h2>
                <p className="text-[#6B7280] text-[14px] mb-8">
                  Ingresa tu correo y te enviaremos un código para crear una nueva contraseña.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">Correo electrónico</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        className="w-full h-[50px] pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-all text-[14px]" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button onClick={handleEnviarRecuperacion} disabled={cargando}
                      className="w-full bg-[#1A1A2E] hover:bg-[#D4A017] text-white h-[54px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-colors">
                      {cargando ? <Loader2 size={20} className="animate-spin" /> : "Enviar código"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ===== FORMULARIO RESTABLECER (Paso 2) ===== */}
            {paso === "restablecer" && (
              <>
                <h2 className="text-[28px] font-[900] text-[#1A1A2E] mb-2 tracking-tight">Nueva Contraseña</h2>
                <p className="text-[#6B7280] text-[14px] mb-6">
                  Ingresa el código de 6 dígitos enviado a <b>{email}</b> y crea tu nueva contraseña.
                </p>

                <div className="space-y-5">
                  <input type="text" value={codigo} onChange={e => setCodigo(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="000000" maxLength={6}
                    className="w-full h-[60px] text-center text-[24px] font-bold tracking-[12px] bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-all mb-2" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">Nueva</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={verNewPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          placeholder="Ej: Tour@2026"
                          className="w-full h-[50px] pl-11 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] transition-all text-[14px]" />
                        <button type="button" onClick={() => setVerNewPassword(!verNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                          {verNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">Confirmar</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={verNewPassword2 ? "text" : "password"} value={newPassword2} onChange={e => setNewPassword2(e.target.value)}
                          placeholder="Repite"
                          className="w-full h-[50px] pl-11 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] transition-all text-[14px]" />
                        <button type="button" onClick={() => setVerNewPassword2(!verNewPassword2)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                          {verNewPassword2 ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button onClick={handleRestablecerPassword} disabled={cargando}
                      className="w-full bg-[#1A1A2E] hover:bg-[#D4A017] text-white h-[54px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-colors">
                      {cargando ? <Loader2 size={20} className="animate-spin" /> : "Guardar contraseña"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ===== FORMULARIO REGISTRO ===== */}
            {paso === "registro" && (
              <>
                <h2 className="text-[28px] font-[900] text-[#1A1A2E] mb-2 tracking-tight">Registro de Viajero</h2>
                <p className="text-[#6B7280] text-[14px] mb-6">Completa tus datos para crear tu cuenta.</p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">Nombre (s)</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={nombre} onChange={e => setNombre(soloLetras(e.target.value))}
                        placeholder="Ej. Ana María"
                        className="w-full h-[50px] pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] transition-all text-[14px]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">Apellido Paterno</label>
                      <input type="text" value={apellidoPaterno} onChange={e => setApellidoPaterno(soloLetras(e.target.value))}
                        placeholder="Ej. Pérez"
                        className="w-full h-[50px] px-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] transition-all text-[14px]" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">Apellido Materno</label>
                      <input type="text" value={apellidoMaterno} onChange={e => setApellidoMaterno(soloLetras(e.target.value))}
                        placeholder="(Opcional)"
                        className="w-full h-[50px] px-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] transition-all text-[14px]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">Correo electrónico</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" value={emailReg} onChange={e => setEmailReg(e.target.value)}
                        placeholder="tu@correo.com"
                        className="w-full h-[50px] pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] transition-all text-[14px]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">Teléfono / WhatsApp</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:border-[#D4A017] focus-within:ring-1 focus-within:ring-[#D4A017] transition-all px-4 h-[50px] flex items-center">
                      <PhoneInput
                        international
                        defaultCountry="BO"
                        value={telefono}
                        onChange={(val) => setTelefono(val ? val.toString() : "")}
                        className="w-full text-[14px] outline-none bg-transparent"
                        style={{ '--PhoneInput-color--focus': 'transparent' } as React.CSSProperties}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">Contraseña</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={verPasswordReg ? "text" : "password"} value={passwordReg} onChange={e => setPasswordReg(e.target.value)}
                          placeholder="Ej: Tour@2026"
                          className="w-full h-[50px] pl-11 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] transition-all text-[14px]" />
                        <button type="button" onClick={() => setVerPasswordReg(!verPasswordReg)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                          {verPasswordReg ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2">Confirmar</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={verPasswordReg2 ? "text" : "password"} value={passwordReg2} onChange={e => setPasswordReg2(e.target.value)}
                          placeholder="Repite"
                          className="w-full h-[50px] pl-11 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] transition-all text-[14px]" />
                        <button type="button" onClick={() => setVerPasswordReg2(!verPasswordReg2)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                          {verPasswordReg2 ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button onClick={handleRegistro} disabled={cargando}
                      className="w-full bg-[#1A1A2E] hover:bg-[#D4A017] text-white h-[54px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-colors">
                      {cargando ? <Loader2 size={20} className="animate-spin" /> : <>Crear cuenta <ChevronRight size={18} /></>}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ===== VERIFICAR CUENTA ===== */}
            {paso === "verificar_cuenta" && (
              <>
                <h2 className="text-[28px] font-black text-[#1A1A2E] mb-1">Verifica tu cuenta</h2>
                <p className="text-[#6B7280] text-[14px] mb-8">
                  Ingresa el código de 6 dígitos que enviamos a tu correo.
                </p>
                <div className="space-y-6">
                  <input type="text" value={codigo} onChange={e => setCodigo(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="000000" maxLength={6}
                    className="w-full h-[60px] text-center text-[24px] font-bold tracking-[12px] bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-all" />
                  <button onClick={handleVerificarCuenta} disabled={cargando}
                    className="w-full bg-[#1A1A2E] hover:bg-[#D4A017] text-white h-[54px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-colors">
                    {cargando ? <Loader2 size={20} className="animate-spin" /> : "Verificar cuenta"}
                  </button>
                </div>
              </>
            )}

            {/* ===== VERIFICAR 2FA ===== */}
            {paso === "verificar_2fa" && (
              <>
                <h2 className="text-[28px] font-black text-[#1A1A2E] mb-1">Acceso seguro</h2>
                <p className="text-[#6B7280] text-[14px] mb-8">
                  Ingresa el código de seguridad enviado a tu correo.
                </p>
                <div className="space-y-6">
                  <input type="text" value={codigo} onChange={e => setCodigo(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="000000" maxLength={6}
                    className="w-full h-[60px] text-center text-[24px] font-bold tracking-[12px] bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] transition-all" />

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={recordarDispositivo}
                      onChange={e => setRecordarDispositivo(e.target.checked)}
                      className="w-4 h-4 accent-[#D4A017]" />
                    <span className="text-[13px] font-medium text-gray-600">
                      Recordar este dispositivo (30 días)
                    </span>
                  </label>

                  <button onClick={handleVerificar2fa} disabled={cargando}
                    className="w-full bg-[#1A1A2E] hover:bg-[#D4A017] text-white h-[54px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-colors">
                    {cargando ? <Loader2 size={20} className="animate-spin" /> : "Confirmar acceso"}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

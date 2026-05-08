import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Mountain, MessageCircle, MapPin, Phone, Mail, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Guardamos los datos del usuario en este estado
  const [usuarioInfo, setUsuarioInfo] = useState<{ nombre: string; cod_rol: number } | null>(null);

  // Ocultar el Layout en páginas específicas como el Login
  const isPlainLayout = location.pathname === "/login";

  // Efecto para leer la memoria del navegador y saber si está logueado
  useEffect(() => {
    // Usamos setTimeout en 0 para volverlo asíncrono y quitar el error del linter
    const timer = setTimeout(() => {
      const userStr = localStorage.getItem("usuario");
      if (userStr && userStr !== "undefined") {
        setUsuarioInfo(JSON.parse(userStr));
      } else {
        setUsuarioInfo(null);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [location.pathname]); // Se actualiza cada vez que cambias de página

  // Efecto mágico para el Scroll Suave a las secciones
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.replace("#", ""));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  const handleCerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("token_dispositivo");
    setUsuarioInfo(null);
    navigate("/");
  };

  // Función para saber a qué panel enviarlo según su rol
  const getRutaPanel = () => {
    if (!usuarioInfo) return "/login";
    switch(usuarioInfo.cod_rol) {
      case 1: return "/admin";
      case 2: return "/guia";
      case 4: return "/oficinista";
      default: return "/turista"; // El rol 3
    }
  };

  if (isPlainLayout) {
    return <Outlet />;
  }

  const isViewer = location.pathname === "/viewer";

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Inter'] flex flex-col selection:bg-[#D4A017] selection:text-[#1A1A2E]">

      {/* NAVBAR GLASSMORPHISM */}
      <nav className="h-[72px] bg-black/40 backdrop-blur-md border-b border-white/10 text-white flex items-center justify-between px-8 sticky top-0 z-[100] transition-all">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo.webp" alt="Diana Tours" className="h-10 w-auto rounded-md" />
        </Link>

        {/* ENLACES CENTRALES CON SCROLL */}
        <div className="hidden md:flex gap-8 font-medium text-[14px]">
          <NavLink to="/" label="Inicio" current={location.pathname} />
          <NavLink to="/#sitios" label="Sitios Inmersivos" current={location.pathname} />
          <NavLink to="/#paquetes" label="Paquetes Turísticos" current={location.pathname} />
        </div>

        {/* BOTONES DERECHA: ¡AQUÍ ESTÁ LA MAGIA! */}
        <div className="hidden md:flex items-center gap-4">
          {usuarioInfo ? (
            // VISUAL SI ESTÁ LOGUEADO
            <div className="flex items-center gap-5">
              <Link to={getRutaPanel()} className="flex items-center gap-2 text-white hover:text-[#D4A017] transition-colors font-bold text-[13px] group">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:border-[#D4A017] group-hover:bg-[#D4A017]/20 transition-all">
                  <User size={16} className="text-[#D4A017]" />
                </div>
                Hola, {usuarioInfo.nombre}
              </Link>
              <div className="w-[1px] h-6 bg-white/20"></div> {/* Separador visual */}
              <button
                onClick={handleCerrarSesion}
                className="text-white/50 hover:text-red-400 transition-colors flex items-center gap-1 text-[12px] font-bold cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut size={16} /> Salir
              </button>
            </div>
          ) : (
            // VISUAL SI NO ESTÁ LOGUEADO
            <>
              <Link
                to="/login"
                className="border border-white/20 hover:border-[#D4A017] hover:text-[#D4A017] rounded-full px-6 h-[40px] flex items-center justify-center text-[13px] font-bold transition-all"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/viewer"
                className="bg-[#D4A017] hover:bg-[#F0B429] text-[#1A1A2E] rounded-full px-6 h-[40px] flex items-center justify-center text-[13px] font-black transition-transform hover:scale-105 shadow-[0_0_20px_rgba(212,160,23,0.2)]"
              >
                Explorar Gratis
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-white hover:text-[#D4A017] transition-colors">
          <Menu size={28} />
        </button>
      </nav>

      {/* CONTENIDO DE LA PÁGINA */}
      <main className="flex-1 flex flex-col relative z-10">
        <Outlet />
      </main>

      {/* FOOTER */}
      {!isViewer && (
        <footer className="bg-[#0A0F14] border-t border-white/5 text-white py-16 px-8 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#D4A017] opacity-[0.03] blur-[120px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 relative z-10">
            <div>
              <h3 className="text-[22px] font-bold mb-3 flex items-center gap-2 text-white">
                <Mountain size={22} className="text-[#D4A017]" />
                Diana Tours SRL
              </h3>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">
                Agencia de Viajes y Turismo en Bolivia. Descubre la magia de la ciudad maravilla con nuestras experiencias inmersivas de validación.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D4A017] hover:text-[#1A1A2E] transition-all"><InstagramIcon size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D4A017] hover:text-[#1A1A2E] transition-all"><FacebookIcon size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D4A017] hover:text-[#1A1A2E] transition-all"><MessageCircle size={18} /></a>
              </div>
            </div>

            <div>
              <h4 className="font-black text-[#D4A017] text-[12px] tracking-[0.2em] uppercase mb-6">Nuestros Destinos</h4>
              <ul className="space-y-3 text-[14px] text-white/60">
                <li className="hover:text-white transition-colors cursor-pointer"><Link to="/#sitios">Plaza Murillo</Link></li>
                <li className="hover:text-white transition-colors cursor-pointer"><Link to="/#sitios">Calle Jaén</Link></li>
                <li className="hover:text-white transition-colors cursor-pointer"><Link to="/#sitios">Valle de la Luna</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-[#D4A017] text-[12px] tracking-[0.2em] uppercase mb-6">Contacto</h4>
              <ul className="space-y-4 text-[14px] text-white/60">
                <li className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 text-[#D4A017]" /><span>La Paz, Bolivia</span></li>
                <li className="flex items-start gap-3"><Phone size={18} className="mt-0.5 text-[#D4A017]" /><span>+591 2 2123456</span></li>
                <li className="flex items-start gap-3"><Mail size={18} className="mt-0.5 text-[#D4A017]" /><span>info@dianatours.bo</span></li>
              </ul>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// COMPONENTE NAVLINK ADAPTADO PARA HASH LINKS
function NavLink({ to, label, current }: { to: string; label: string; current: string }) {
  const isHash = to.includes('#');
  const isActive = current === to && !isHash;

  if (isHash) {
    return (
      <a href={to} className="relative py-2 group text-white/60 hover:text-white transition-colors">
        {label}
        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#D4A017] transform origin-left transition-transform duration-300 scale-x-0 group-hover:scale-x-100"></span>
      </a>
    )
  }

  return (
    <Link
      to={to}
      className={`relative py-2 group ${isActive ? "text-white font-bold" : "text-white/60 hover:text-white transition-colors"}`}
    >
      {label}
      <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#D4A017] transform origin-left transition-transform duration-300 ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
    </Link>
  );
}

function FacebookIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
  );
}

function InstagramIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

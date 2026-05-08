import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MapPin, Compass, Camera, Map, ArrowRight, Luggage, Loader2 } from "lucide-react";
import api from "../api"; // Importamos tu conexión a Laravel

// ============ INTERFACES BASADAS EN TU BASE DE DATOS ============
interface SitioDB {
  cod: number;
  nombre: string;
  descripcion: string | null;
  foto: string | null;
}

interface PaqueteDB {
  cod: number;
  nombre: string;
  acerca_de: string | null;
  foto_principal: string | null;
  precio_bs: number;
}

export function Home() {
  // Estados para guardar los datos reales
  const [sitios, setSitios] = useState<SitioDB[]>([]);
  const [paquetes, setPaquetes] = useState<PaqueteDB[]>([]);
  const [cargando, setCargando] = useState(true);

  // Llamada a tu API de Laravel al cargar la página
  useEffect(() => {
    const cargarCatalogo = async () => {
      try {
        // Pedimos los datos públicos (Asegúrate de tener estas rutas en api.php)
        const [resSitios, resPaquetes] = await Promise.all([
          api.get("/sitios"),
          api.get("/paquetes")
        ]);

        setSitios(Array.isArray(resSitios.data) ? resSitios.data : []);
        setPaquetes(Array.isArray(resPaquetes.data) ? resPaquetes.data : []);
      } catch (error) {
        console.error("Error al cargar el catálogo:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarCatalogo();
  }, []);

  return (
    <div className="font-['Inter'] bg-[#050505] selection:bg-[#D4A017] selection:text-[#1A1A2E]">

      {/* ============ HERO CON VIDEO DE FONDO ============ */}
      <section className="relative h-[90vh] w-full overflow-hidden">
        {/* VIDEO DE FONDO INTACTO */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
        >
          <source src="/video-lapaz.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-[#050505]"></div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2 mb-8 shadow-2xl">
            <MapPin size={14} className="text-[#D4A017]" />
            <span className="text-white/90 text-[12px] font-semibold tracking-widest uppercase">
              La Paz, Ciudad Maravilla
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 max-w-4xl drop-shadow-2xl">
            Siente el latido de <br />
            <span className="text-[#D4A017]">Bolivia</span>
          </h1>

          <p className="text-white/80 text-lg md:text-xl max-w-2xl mb-12 font-light leading-relaxed">
            Planea tu viaje perfecto explorando nuestros destinos a través de <strong className="text-white font-medium">recorridos virtuales inmersivos</strong>. Siente la magia de estar ahí, antes de empacar tus maletas.
          </p>

          <div className="flex flex-col sm:flex-row gap-5">
            <Link
              to="/viewer"
              className="bg-[#D4A017] hover:bg-[#F0B429] text-[#1A1A2E] font-bold text-[15px] px-8 py-4 rounded-full shadow-[0_0_40px_rgba(212,160,23,0.3)] transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Explorar Sitios Interactivos
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <ChevronDown size={28} className="text-white/40" />
        </div>
      </section>

      {/* ============ SECCIÓN DE BENEFICIOS ============ */}
      <section className="py-24 px-6 relative bg-[#050505]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Una nueva forma de viajar
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Diseñamos experiencias turísticas de nueva generación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-10 hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-[#D4A017]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Compass size={32} className="text-[#D4A017]" />
              </div>
              <h3 className="text-white text-[22px] font-bold mb-4">Paseos en 360°</h3>
              <p className="text-white/60 text-[15px] leading-relaxed">
                Camina por la Plaza Murillo o el Valle de la Luna deslizando tu dedo. Conoce tu próximo destino en alta definición sin salir de casa.
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-10 hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-[#D4A017]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Camera size={32} className="text-[#D4A017]" />
              </div>
              <h3 className="text-white text-[22px] font-bold mb-4">Magia en tu celular</h3>
              <p className="text-white/60 text-[15px] leading-relaxed">
                Apunta tu cámara a los edificios históricos de la Calle Jaén y descubre sus secretos con animaciones interactivas.
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-10 hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-[#D4A017]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Map size={32} className="text-[#D4A017]" />
              </div>
              <h3 className="text-white text-[22px] font-bold mb-4">Guías de Excelencia</h3>
              <p className="text-white/60 text-[15px] leading-relaxed">
                Olvídate de itinerarios aburridos. Nuestros expertos personalizan tu ruta para que vivas La Paz a tu ritmo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECCIÓN SITIOS INMERSIVOS DINÁMICOS ============ */}
      <section id="sitios" className="bg-[#0A0F14] py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <span className="text-[#D4A017] text-[13px] font-bold tracking-widest uppercase mb-2 block">
              Exploración Previa
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              Sitios Inmersivos Urbanos
            </h2>
            <p className="text-white/50 mt-4 max-w-2xl">Lugares de La Paz que puedes recorrer virtualmente antes de comprar tu paquete.</p>
          </div>

          {cargando ? (
            <div className="flex justify-center py-12"><Loader2 size={40} className="animate-spin text-[#D4A017]" /></div>
          ) : sitios.length === 0 ? (
            <p className="text-white/40 text-center py-8">Pronto añadiremos nuevos sitios turísticos.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sitios.map((sitio) => (
                <SitioCard key={sitio.cod} sitio={sitio} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ SECCIÓN PAQUETES TURÍSTICOS DINÁMICOS ============ */}
      <section id="paquetes" className="bg-[#1B4332] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Luggage size={48} className="text-[#D4A017] mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Paquetes Turísticos
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Nuestras experiencias guiadas oficiales preparadas por Diana Tours.
            </p>
          </div>

          {cargando ? (
            <div className="flex justify-center py-12"><Loader2 size={40} className="animate-spin text-[#D4A017]" /></div>
          ) : paquetes.length === 0 ? (
            <p className="text-white/40 text-center py-8">Pronto publicaremos nuestros nuevos paquetes.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paquetes.map((paquete) => (
                <Link key={paquete.cod} to={`/paquete/${paquete.cod}`} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 flex h-36 cursor-pointer group hover:-translate-y-1 hover:shadow-2xl">
                  <div className="w-1/3 h-full overflow-hidden shrink-0 relative">
                    <img
                      src={paquete.foto_principal || "https://via.placeholder.com/150x150?text=Tour"}
                      alt={paquete.nombre}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-[#D4A017] text-[#1A1A2E] text-[11px] font-black px-2 py-1 rounded-md">
                      Bs. {paquete.precio_bs}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col justify-center flex-1 relative">
                    <h3 className="text-white font-bold text-[18px] mb-1 leading-tight group-hover:text-[#D4A017] transition-colors">{paquete.nombre}</h3>
                    <p className="text-white/60 text-[13px] line-clamp-2 mb-2">{paquete.acerca_de}</p>
                    <div className="mt-auto flex items-center text-[#D4A017] text-[12px] font-bold">
                      Ver detalles y reservar <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

// ============ COMPONENTE TARJETA DE SITIO ACTUALIZADO ============
function SitioCard({ sitio }: { sitio: SitioDB }) {
  return (
    <Link to={`/viewer?sitio=${sitio.cod}`} className="group relative rounded-3xl overflow-hidden h-[350px] cursor-pointer shadow-lg border border-white/10 block">
      <img
        src={sitio.foto || "https://via.placeholder.com/400x300?text=Falta+Imagen"}
        alt={sitio.nombre}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300"></div>

      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        {/* Como borramos el "tipo" de la DB, ponemos este texto por defecto para no perder el diseño */}
        <span className="text-[#D4A017] text-[11px] font-black tracking-widest uppercase mb-2 drop-shadow-md">
          Destino Urbano
        </span>
        <h3 className="text-white text-[24px] font-bold mb-2 leading-tight drop-shadow-md">{sitio.nombre}</h3>
        <p className="text-white/80 text-[14px] leading-relaxed line-clamp-2 mb-4">
          {sitio.descripcion}
        </p>
        <div className="flex items-center text-[#D4A017] text-[13px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
          Explorar sitio <ArrowRight size={16} className="ml-2" />
        </div>
      </div>
    </Link>
  );
}

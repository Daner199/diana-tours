import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Loader2, Users, Save, X, Lock, ShieldAlert } from "lucide-react";
import api from "../../api";

interface Usuario {
  cod: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  email: string;
  telefono: string | null;
  estado: string;
  foto_perfil: string | null;
  cod_rol: number;
  rol: string;
}

interface Rol {
  cod: number;
  nombre: string;
}

export default function UsuariosGestor() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalUsuario, setModalUsuario] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);
  const [eliminarItem, setEliminarItem] = useState<{ cod: number; nombre: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [resUsuarios, resRoles] = await Promise.all([
        api.get("/admin/usuarios"),
        api.get("/admin/roles"),
      ]);
      setUsuarios(Array.isArray(resUsuarios.data) ? resUsuarios.data : []);
      setRoles(Array.isArray(resRoles.data) ? resRoles.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cargarDatos(), 0);
    return () => clearTimeout(t);
  }, [cargarDatos]);

  const handleEliminar = async () => {
    if (!eliminarItem) return;
    setEliminando(true);
    try {
      await api.delete(`/admin/usuarios/${eliminarItem.cod}`);
      setEliminarItem(null);
      cargarDatos();
    } catch (e) { console.error(e); }
    finally { setEliminando(false); }
  };

  const handleCambiarEstado = async (cod: number, estadoActual: string) => {
    const nuevoEstado = estadoActual === "activo" ? "bloqueado" : "activo";
    try {
      await api.patch(`/admin/usuarios/${cod}/estado`, { estado: nuevoEstado });
      cargarDatos();
    } catch (e) { console.error(e); }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideTexto =
      u.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(filtroBusqueda.toLowerCase());
    const coincideRol = filtroRol === "todos" || u.rol === filtroRol;
    return coincideTexto && coincideRol;
  });

const coloresRol: Record<string, string> = {
    "Administrador":  "bg-[#1A1A2E] text-white",
    "Guía Turístico": "bg-[#1B4332] text-white",
    "Oficinista":     "bg-[#1e3a5f] text-white",
    "Turista":        "bg-gray-100 text-gray-700",
};

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8]">
      <header className="h-[80px] bg-white flex items-center justify-between px-8 shadow-sm border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-[24px] font-black text-[#1A1A2E]">Usuarios del Sistema</h1>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={filtroBusqueda}
              onChange={e => setFiltroBusqueda(e.target.value)}
              className="h-[40px] px-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] w-56 focus:border-[#D4A017] focus:outline-none"
            />
            <select
              value={filtroRol}
              onChange={e => setFiltroRol(e.target.value)}
              className="h-[40px] px-4 bg-gray-50 border border-gray-200 rounded-xl text-[14px] focus:border-[#D4A017] focus:outline-none"
            >
              <option value="todos">Todos los roles</option>
              {roles.map(r => <option key={r.cod} value={r.nombre}>{r.nombre}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={() => setModalUsuario(true)}
          className="bg-[#1A1A2E] hover:bg-[#D4A017] text-white px-5 py-2.5 rounded-xl font-bold text-[14px] flex items-center gap-2 shadow-md transition-colors cursor-pointer">
          <Plus size={18} /> Nuevo Usuario
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin mb-4 text-[#D4A017]" />
              <p className="text-gray-500 font-medium">Cargando usuarios...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[12px] uppercase tracking-wider border-b border-gray-200">
                    <th className="px-6 py-4 font-bold">Usuario</th>
                    <th className="px-6 py-4 font-bold">Correo</th>
                    <th className="px-6 py-4 font-bold">Teléfono</th>
                    <th className="px-6 py-4 font-bold">Rol</th>
                    <th className="px-6 py-4 font-bold">Estado</th>
                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-[14px]">
                  {usuariosFiltrados.map(u => (
                    <tr key={u.cod} className="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1A1A2E] flex items-center justify-center text-white font-bold text-[12px] shrink-0 overflow-hidden">
                            {u.foto_perfil
                              ? <img src={u.foto_perfil} className="w-full h-full object-cover" alt="foto" />
                              : `${u.nombre.charAt(0)}${u.apellido_paterno?.charAt(0) ?? ""}`.toUpperCase()
                            }
                          </div>
                          <div>
                            <p className="font-bold text-[#1A1A2E]">{u.nombre} {u.apellido_paterno}</p>

                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 text-gray-500">{u.telefono || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${coloresRol[u.rol] ?? "bg-gray-100 text-gray-600"}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleCambiarEstado(u.cod, u.estado)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all hover:opacity-80 ${
                            u.estado === "activo" ? "bg-green-100 text-green-700" :
                            u.estado === "bloqueado" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}
                          title="Clic para cambiar estado"
                        >
                          {u.estado === "activo" ? "✓ Activo" : u.estado === "bloqueado" ? "✗ Bloqueado" : u.estado}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5">
                        <button onClick={() => setUsuarioEditar(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Editar">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => setEliminarItem({ cod: u.cod, nombre: `${u.nombre} ${u.apellido_paterno}` })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {usuariosFiltrados.length === 0 && !cargando && (
                    <tr><td colSpan={6} className="px-6 py-16 text-center">
                      <Users size={48} className="mx-auto mb-3 text-gray-300" />
                      <p className="font-bold text-[#1A1A2E]">No hay usuarios que coincidan</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODALES */}
      {(modalUsuario || usuarioEditar) && (
        <ModalUsuario
          usuario={usuarioEditar}
          roles={roles}
          onCerrar={() => { setModalUsuario(false); setUsuarioEditar(null); }}
          onGuardado={cargarDatos}
        />
      )}

      {eliminarItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={28} className="text-red-500" />
            </div>
            <h2 className="text-[20px] font-black text-[#1A1A2E] mb-2">¿Eliminar usuario?</h2>
            <p className="text-gray-500 text-[14px] mb-6">
              Vas a eliminar a <strong className="text-[#1A1A2E]">"{eliminarItem.nombre}"</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setEliminarItem(null)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleEliminar} disabled={eliminando}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                {eliminando ? <Loader2 size={18} className="animate-spin" /> : <><Trash2 size={18} /> Eliminar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== MODAL CREAR/EDITAR USUARIO =====
interface ModalUsuarioProps {
  usuario?: Usuario | null;
  roles: Rol[];
  onCerrar: () => void;
  onGuardado: () => void;
}

function ModalUsuario({ usuario, roles, onCerrar, onGuardado }: ModalUsuarioProps) {
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [apellidoP, setApellidoP] = useState(usuario?.apellido_paterno ?? "");
  const [apellidoM, setApellidoM] = useState(usuario?.apellido_materno ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [telefono, setTelefono] = useState(usuario?.telefono ?? "");
  const [codRol, setCodRol] = useState(usuario?.cod_rol?.toString() ?? "");
  const [estado, setEstado] = useState(usuario?.estado ?? "activo");
  const [password, setPassword] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const soloLetras = (v: string) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");

  const handleGuardar = async () => {
    if (!nombre || !apellidoP || !email || !codRol) {
      setError("Nombre, apellido paterno, correo y rol son obligatorios.");
      return;
    }
    if (!usuario && !password) {
      setError("La contraseña es obligatoria para nuevos usuarios.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const datos: Record<string, string> = {
        nombre, apellido_paterno: apellidoP, apellido_materno: apellidoM,
        email, telefono, cod_rol: codRol, estado,
      };
      if (password) datos.password = password;

      if (usuario) {
        await api.put(`/admin/usuarios/${usuario.cod}`, datos);
      } else {
        await api.post("/admin/usuarios", datos);
      }
      onGuardado();
      onCerrar();
    } catch (err) {
      const e = err as { response?: { data?: { mensaje?: string; message?: string } } };
      setError(e.response?.data?.mensaje || e.response?.data?.message || "Error al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between shrink-0 rounded-t-3xl">
          <h2 className="text-white font-black text-[18px]">{usuario ? "Editar Usuario" : "Nuevo Usuario"}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white cursor-pointer"><X size={22} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-[13px]">{error}</div>}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Nombre *</label>
              <input value={nombre} onChange={e => setNombre(soloLetras(e.target.value))} placeholder="Ana"
                className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
            </div>
            <div className="col-span-1">
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Ap. Paterno *</label>
              <input value={apellidoP} onChange={e => setApellidoP(soloLetras(e.target.value))} placeholder="Pérez"
                className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
            </div>
            <div className="col-span-1">
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Ap. Materno</label>
              <input value={apellidoM} onChange={e => setApellidoM(soloLetras(e.target.value))} placeholder="López"
                className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Correo electrónico *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com"
              className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Teléfono</label>
              <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+591 7XXXXXXX"
                className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Rol *</label>
              <select value={codRol} onChange={e => setCodRol(e.target.value)}
                className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px] bg-white">
                <option value="">Seleccionar rol</option>
                {roles
                  .filter(r => r.nombre !== "Turista")
                  .map(r => <option key={r.cod} value={r.cod}>{r.nombre}</option>)
                }
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">
                <Lock size={13} className="inline mr-1" />
                {usuario ? "Nueva contraseña (opcional)" : "Contraseña *"}
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={usuario ? "Dejar vacío para no cambiar" : "Mín. 8 caracteres"}
                className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px]" />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#1A1A2E] mb-1.5">Estado</label>
              <select value={estado} onChange={e => setEstado(e.target.value)}
                className="w-full h-[48px] px-4 border border-gray-200 rounded-xl focus:border-[#D4A017] focus:outline-none text-[14px] bg-white">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0 bg-gray-50 rounded-b-3xl">
          <button onClick={onCerrar} className="flex-1 border border-gray-200 bg-white text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando}
            className="flex-1 bg-[#1A1A2E] hover:bg-[#D4A017] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60">
            {guardando ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {usuario ? "Actualizar" : "Crear Usuario"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

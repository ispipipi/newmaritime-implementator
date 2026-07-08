import { Mail, Plus, Trash2, UsersRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { enviarCorreoAccesoPerfil } from '../../services/userAccess';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../ui/GlassCard';

const colores = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#22c55e', '#06b6d4'];

const inicialesDesdeNombre = (nombre: string) =>
  nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

export function MantenedorUsuarios() {
  const { perfiles: usuarios, perfilesAcceso, proyectos, crearUsuario, actualizarUsuario, eliminarUsuario } = useAppStore();
  const [emailEnProceso, setEmailEnProceso] = useState('');
  const [mensajeAcceso, setMensajeAcceso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [filtroPerfil, setFiltroPerfil] = useState<'todos' | string>('todos');
  const perfilDefault = perfilesAcceso[0]?.id ?? 'artbpo_ejecutivo';
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    perfil: perfilDefault,
    proyectoClienteId: '',
    proyectoIds: [] as string[],
  });
  const perfilSeleccionado = perfilesAcceso.find((perfil) => perfil.id === form.perfil);
  const requiereProyectoCliente = perfilSeleccionado?.accesos.esCliente ?? form.perfil === 'cliente';
  const requiereMultiplesProyectos = form.perfil === 'rex_plus';

  const enviarAcceso = async (email: string) => {
    const emailNormalizado = email.trim().toLowerCase();
    setMensajeAcceso(null);

    if (!emailNormalizado) {
      setMensajeAcceso({ tipo: 'error', texto: 'Asigna un correo antes de enviar el acceso.' });
      return;
    }

    setEmailEnProceso(emailNormalizado);
    try {
      const resultado = await enviarCorreoAccesoPerfil(emailNormalizado);
      setMensajeAcceso({ tipo: 'ok', texto: `${resultado} Destinatario: ${emailNormalizado}` });
    } catch (error) {
      setMensajeAcceso({
        tipo: 'error',
        texto: error instanceof Error ? error.message : 'No se pudo enviar el correo de acceso.',
      });
    } finally {
      setEmailEnProceso('');
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nombre = form.nombre.trim();
    const email = form.email.trim().toLowerCase();
    if (!nombre || !email || !form.perfil) return;

    crearUsuario({
      nombre,
      email,
      perfil: form.perfil,
      proyectoClienteId: requiereProyectoCliente ? form.proyectoClienteId || proyectos[0]?.id : undefined,
      proyectoIds: requiereMultiplesProyectos ? form.proyectoIds : undefined,
      iniciales: inicialesDesdeNombre(nombre),
      rol: perfilSeleccionado?.nombre ?? 'Usuario',
      color: colores[usuarios.length % colores.length],
      activo: true,
    });
    setForm({ nombre: '', email: '', perfil: perfilDefault, proyectoClienteId: '', proyectoIds: [] });
    await enviarAcceso(email);
  };

  const perfilEsCliente = (perfilId: string) => perfilesAcceso.find((perfil) => perfil.id === perfilId)?.accesos.esCliente ?? perfilId === 'cliente';
  const perfilEsRexPlus = (perfilId: string) => perfilId === 'rex_plus';
  const toggleProyecto = (current: string[], proyectoId: string) =>
    current.includes(proyectoId) ? current.filter((id) => id !== proyectoId) : [...current, proyectoId];
  const nombresProyectosAsignados = (proyectoIds?: string[]) =>
    (proyectoIds ?? [])
      .map((proyectoId) => proyectos.find((proyecto) => proyecto.id === proyectoId)?.nombre)
      .filter((nombre): nombre is string => Boolean(nombre));
  const usuariosFiltrados =
    filtroPerfil === 'todos' ? usuarios : usuarios.filter((usuario) => usuario.perfil === filtroPerfil);

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-300">
          <UsersRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Mantenedor de usuarios</h2>
          <p className="text-sm text-slate-500">Crea, edita y elimina usuarios. Cada usuario debe tener nombre, correo y perfil.</p>
        </div>
      </div>

      <form className="grid gap-3 lg:grid-cols-6" onSubmit={submit}>
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder="Nombre" value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder="Correo" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.perfil} onChange={(event) => setForm((current) => ({ ...current, perfil: event.target.value, proyectoClienteId: '', proyectoIds: [] }))}>
          {perfilesAcceso.map((perfil) => (
            <option key={perfil.id} value={perfil.id}>{perfil.nombre}</option>
          ))}
        </select>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300">
          <Plus className="h-4 w-4" />
          Crear usuario
        </button>
        {requiereProyectoCliente ? (
          <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-3" value={form.proyectoClienteId} onChange={(event) => setForm((current) => ({ ...current, proyectoClienteId: event.target.value }))}>
            <option value="">Proyecto cliente</option>
            {proyectos.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>
            ))}
          </select>
        ) : null}
        {requiereMultiplesProyectos ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-300 lg:col-span-6">
            <p className="mb-2 font-medium text-white">Proyectos visibles para REX+</p>
            <div className="flex flex-wrap gap-2">
              {proyectos.map((proyecto) => {
                const active = form.proyectoIds.includes(proyecto.id);
                return (
                  <button
                    key={proyecto.id}
                    type="button"
                    className={`rounded-lg border px-3 py-2 ${active ? 'border-emerald-300/40 bg-emerald-400/12 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
                    onClick={() => setForm((current) => ({ ...current, proyectoIds: toggleProyecto(current.proyectoIds, proyecto.id) }))}
                  >
                    {proyecto.nombre}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </form>

      {mensajeAcceso ? (
        <p className={`mt-3 rounded-lg border p-3 text-sm ${mensajeAcceso.tipo === 'ok' ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100' : 'border-red-400/20 bg-red-500/10 text-red-100'}`}>
          {mensajeAcceso.texto}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-white">Filtrar usuarios por perfil</p>
          <p className="text-xs text-slate-500">
            Mostrando {usuariosFiltrados.length} de {usuarios.length} usuario(s).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-lg border px-3 py-2 text-sm ${filtroPerfil === 'todos' ? 'border-emerald-300/40 bg-emerald-400/12 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
            onClick={() => setFiltroPerfil('todos')}
          >
            Todos
          </button>
          {perfilesAcceso.map((perfil) => {
            const activo = filtroPerfil === perfil.id;
            return (
              <button
                key={perfil.id}
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm ${activo ? 'border-emerald-300/40 bg-emerald-400/12 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
                onClick={() => setFiltroPerfil(perfil.id)}
              >
                {perfil.nombre}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {usuariosFiltrados.map((usuario) => {
          const perfil = perfilesAcceso.find((item) => item.id === usuario.perfil);
          const esCliente = perfilEsCliente(usuario.perfil);
          const esRexPlus = perfilEsRexPlus(usuario.perfil);
          const proyectosAsignados = nombresProyectosAsignados(usuario.proyectoIds);
          const proyectoCliente = proyectos.find((proyecto) => proyecto.id === usuario.proyectoClienteId);
          const email = (usuario.email ?? '').trim().toLowerCase();
          const enviandoAcceso = !!email && emailEnProceso === email;

          return (
            <div key={usuario.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:grid-cols-12">
              <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-3" value={usuario.nombre} onChange={(event) => actualizarUsuario(usuario.id, { nombre: event.target.value, iniciales: inicialesDesdeNombre(event.target.value) })} />
              <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-3" type="email" placeholder="Correo" value={usuario.email ?? ''} onChange={(event) => actualizarUsuario(usuario.id, { email: event.target.value.trim().toLowerCase() })} />
              <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-3" value={usuario.perfil} onChange={(event) => actualizarUsuario(usuario.id, { perfil: event.target.value, rol: perfilesAcceso.find((item) => item.id === event.target.value)?.nombre ?? usuario.rol, proyectoClienteId: perfilEsCliente(event.target.value) ? usuario.proyectoClienteId || proyectos[0]?.id : undefined, proyectoIds: perfilEsRexPlus(event.target.value) ? usuario.proyectoIds ?? [] : undefined })}>
                {perfilesAcceso.map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300/20 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-2"
                disabled={enviandoAcceso}
                onClick={() => enviarAcceso(email)}
                type="button"
              >
                <Mail className="h-4 w-4" />
                {enviandoAcceso ? 'Enviando...' : 'Enviar acceso'}
              </button>
              <button className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-500/10" onClick={() => eliminarUsuario(usuario.id)} aria-label={`Eliminar ${usuario.nombre}`} type="button">
                <Trash2 className="h-4 w-4" />
              </button>
              {esCliente ? (
                <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:col-span-6" value={usuario.proyectoClienteId ?? ''} onChange={(event) => actualizarUsuario(usuario.id, { proyectoClienteId: event.target.value })}>
                  <option value="">Proyecto cliente</option>
                  {proyectos.map((proyecto) => (
                    <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>
                  ))}
                </select>
              ) : null}
              {esRexPlus ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 lg:col-span-12">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-white">Proyectos asignados a REX+</p>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[11px] font-medium text-emerald-100">
                      {proyectosAsignados.length} asignado(s)
                    </span>
                  </div>
                  {proyectosAsignados.length ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {proyectosAsignados.map((nombre) => (
                        <span
                          key={`${usuario.id}-${nombre}`}
                          className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-xs font-medium text-sky-100"
                        >
                          {nombre}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mb-3 text-xs text-amber-200">Este usuario REX+ aun no tiene proyectos visibles asignados.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {proyectos.map((proyecto) => {
                      const active = (usuario.proyectoIds ?? []).includes(proyecto.id);
                      return (
                        <button
                          key={proyecto.id}
                          type="button"
                          className={`rounded-lg border px-3 py-2 text-sm ${active ? 'border-emerald-300/40 bg-emerald-400/12 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
                          onClick={() =>
                            actualizarUsuario(usuario.id, {
                              proyectoIds: toggleProyecto(usuario.proyectoIds ?? [], proyecto.id),
                            })
                          }
                        >
                          {proyecto.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 text-xs lg:col-span-12">
                <span className="text-slate-500">Perfil actual: {perfil?.nombre ?? usuario.perfil}</span>
                {esRexPlus ? (
                  <>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 font-medium text-emerald-100">
                      {proyectosAsignados.length} proyecto(s) visibles
                    </span>
                    {proyectosAsignados.slice(0, 3).map((nombre) => (
                      <span
                        key={`${usuario.id}-resumen-${nombre}`}
                        className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-1 font-medium text-sky-100"
                      >
                        {nombre}
                      </span>
                    ))}
                    {proyectosAsignados.length > 3 ? (
                      <span className="text-slate-500">+{proyectosAsignados.length - 3} más</span>
                    ) : null}
                  </>
                ) : null}
                {esCliente && proyectoCliente ? (
                  <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2 py-1 font-medium text-violet-100">
                    Cliente: {proyectoCliente.nombre}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
        {usuariosFiltrados.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
            No hay usuarios para el filtro seleccionado.
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}

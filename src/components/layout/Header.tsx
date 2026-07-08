import { BriefcaseBusiness, Building2, CalendarRange, ListTodo, LogOut, Search, Settings, UserRound, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePermisos, useProyectosVisibles } from '../../hooks/usePermisos';
import { auth } from '../../services/firebaseClient';
import { useAppStore } from '../../store/useAppStore';
import { Breadcrumb } from './Breadcrumb';

export function Header() {
  const { usuarioActivo, setVista, setTareaActiva, setBusquedaTareas, tareas, fases, perfiles, ejecutivos } = useAppStore();
  const { puedeAdministrar, puedeGestionarUsuarios, puedeVerGanttAdmin } = usePermisos();
  const proyectosVisibles = useProyectosVisibles();
  const [query, setQuery] = useState('');
  const [openSearch, setOpenSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setOpenSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const proyectoIdsVisibles = useMemo(() => new Set(proyectosVisibles.map((proyecto) => proyecto.id)), [proyectosVisibles]);
  const tareasVisibles = useMemo(
    () => tareas.filter((tarea) => proyectoIdsVisibles.has(tarea.proyectoId)),
    [proyectoIdsVisibles, tareas],
  );

  const responsables = useMemo(() => {
    const mapa = new Map<string, { nombre: string; perfil?: string }>();
    [...perfiles, ...ejecutivos].forEach((persona) => {
      const key = persona.nombre.trim().toLowerCase();
      if (!key || mapa.has(key)) return;
      mapa.set(key, { nombre: persona.nombre, perfil: 'perfil' in persona ? persona.perfil : undefined });
    });
    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [ejecutivos, perfiles]);

  const resultados = useMemo(() => {
    if (!normalizedQuery) {
      return { proyectos: [], tareas: [], clientes: [], responsables: [] };
    }

    const proyectos = proyectosVisibles
      .filter((proyecto) =>
        [proyecto.nombre, proyecto.rut, proyecto.razonSocial, proyecto.representanteLegal, proyecto.sistemaOrigen]
          .some((value) => value.toLowerCase().includes(normalizedQuery)),
      )
      .slice(0, 5);

    const tareasEncontradas = tareasVisibles
      .filter((tarea) => {
        const proyecto = proyectosVisibles.find((item) => item.id === tarea.proyectoId);
        const fase = fases.find((item) => item.id === tarea.faseId);
        return [tarea.nombre, tarea.responsable, tarea.estado, proyecto?.nombre, fase?.nombre, fase?.codigo]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      })
      .slice(0, 6);

    const clientes = proyectosVisibles
      .filter((proyecto) =>
        [proyecto.razonSocial, proyecto.rut, proyecto.representanteLegal, proyecto.direccion]
          .some((value) => value.toLowerCase().includes(normalizedQuery)),
      )
      .slice(0, 4);

    const responsablesEncontrados = responsables
      .filter((persona) => persona.nombre.toLowerCase().includes(normalizedQuery))
      .slice(0, 5);

    return { proyectos, tareas: tareasEncontradas, clientes, responsables: responsablesEncontrados };
  }, [fases, normalizedQuery, proyectosVisibles, responsables, tareasVisibles]);

  const totalResultados =
    resultados.proyectos.length +
    resultados.tareas.length +
    resultados.clientes.length +
    resultados.responsables.length;

  const abrirProyecto = (proyectoId: string) => {
    setQuery('');
    setOpenSearch(false);
    setTareaActiva(null);
    setBusquedaTareas('');
    setVista('proyecto', proyectoId);
  };

  const abrirCliente = (proyectoId: string) => {
    setQuery('');
    setOpenSearch(false);
    setTareaActiva(null);
    setBusquedaTareas('');
    setVista('info_cliente', proyectoId);
  };

  const abrirTarea = (tareaId: string, proyectoId: string, faseId: string) => {
    setQuery('');
    setOpenSearch(false);
    setBusquedaTareas('');
    setTareaActiva(tareaId);
    setVista('proyecto', proyectoId, faseId);
  };

  const abrirMisTareasConResponsable = (responsable: string) => {
    setQuery('');
    setOpenSearch(false);
    setTareaActiva(null);
    setBusquedaTareas(responsable);
    setVista('mis_tareas');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f1117]/78 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button className="flex min-w-0 items-center gap-3" onClick={() => setVista('dashboard')}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-300/20">
              IM
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-base font-semibold text-white sm:text-lg">IMPLEMENTATOR</p>
              <p className="text-xs text-slate-500">artBPO Software Implementation</p>
            </div>
          </button>

          <div className="flex flex-col gap-3 lg:min-w-[min(100%,42rem)] lg:flex-1 lg:flex-row lg:items-center lg:justify-end">
            <div ref={searchRef} className="relative w-full lg:max-w-2xl">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5">
                <Search className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  placeholder="Buscar proyecto, tarea, cliente o responsable"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setOpenSearch(true);
                  }}
                  onFocus={() => setOpenSearch(true)}
                />
                {query ? (
                  <button
                    type="button"
                    className="rounded-md p-1 text-slate-500 hover:bg-white/8 hover:text-slate-300"
                    onClick={() => {
                      setQuery('');
                      setOpenSearch(false);
                    }}
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {openSearch && normalizedQuery ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#11141c] shadow-2xl shadow-black/35">
                  <div className="border-b border-white/8 px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                    {totalResultados ? `${totalResultados} resultado(s)` : 'Sin resultados'}
                  </div>
                  {totalResultados ? (
                    <div className="max-h-[70vh] overflow-y-auto p-2">
                      {resultados.proyectos.length ? (
                        <div className="mb-2">
                          <p className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Proyectos</p>
                          {resultados.proyectos.map((proyecto) => (
                            <button
                              key={`proyecto-${proyecto.id}`}
                              type="button"
                              className="flex w-full items-start justify-between rounded-xl px-3 py-3 text-left hover:bg-white/8"
                              onMouseDown={() => abrirProyecto(proyecto.id)}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{proyecto.nombre}</p>
                                <p className="truncate text-xs text-slate-400">{proyecto.razonSocial} · {proyecto.rut}</p>
                              </div>
                              <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {resultados.tareas.length ? (
                        <div className="mb-2">
                          <p className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Tareas</p>
                          {resultados.tareas.map((tarea) => {
                            const proyecto = proyectosVisibles.find((item) => item.id === tarea.proyectoId);
                            const fase = fases.find((item) => item.id === tarea.faseId);
                            return (
                              <button
                                key={`tarea-${tarea.id}`}
                                type="button"
                                className="flex w-full items-start justify-between rounded-xl px-3 py-3 text-left hover:bg-white/8"
                                onMouseDown={() => abrirTarea(tarea.id, tarea.proyectoId, tarea.faseId)}
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-white">{tarea.nombre}</p>
                                  <p className="truncate text-xs text-slate-400">
                                    {proyecto?.nombre ?? 'Proyecto'} · {fase?.codigo ? `${fase.codigo} · ` : ''}{tarea.responsable}
                                  </p>
                                </div>
                                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] text-slate-300">
                                  {tarea.estado}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {resultados.clientes.length ? (
                        <div className="mb-2">
                          <p className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Clientes</p>
                          {resultados.clientes.map((proyecto) => (
                            <button
                              key={`cliente-${proyecto.id}`}
                              type="button"
                              className="flex w-full items-start justify-between rounded-xl px-3 py-3 text-left hover:bg-white/8"
                              onMouseDown={() => abrirCliente(proyecto.id)}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{proyecto.razonSocial}</p>
                                <p className="truncate text-xs text-slate-400">{proyecto.nombre} · {proyecto.representanteLegal}</p>
                              </div>
                              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {resultados.responsables.length ? (
                        <div>
                          <p className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Responsables</p>
                          {resultados.responsables.map((persona) => (
                            <button
                              key={`responsable-${persona.nombre}`}
                              type="button"
                              className="flex w-full items-start justify-between rounded-xl px-3 py-3 text-left hover:bg-white/8"
                              onMouseDown={() => abrirMisTareasConResponsable(persona.nombre)}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{persona.nombre}</p>
                                <p className="truncate text-xs text-slate-400">Ir a tareas y revisar asignaciones</p>
                              </div>
                              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-sm text-slate-400">No encontré coincidencias con lo que escribiste.</div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {usuarioActivo ? (
                <button
                  className="flex items-center gap-2 rounded-lg border border-white/10 py-1.5 pl-2 pr-2 text-sm text-slate-200 hover:bg-white/8 sm:pr-3"
                  onClick={() => {
                    if (auth) void signOut(auth);
                    useAppStore.setState({ usuarioActivo: null });
                  }}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold" style={{ backgroundColor: `${usuarioActivo.color}26`, color: usuarioActivo.color }}>
                    {usuarioActivo.iniciales}
                  </span>
                  <span className="hidden sm:block">{usuarioActivo.nombre}</span>
                  <LogOut className="h-4 w-4 text-slate-500" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/8" onClick={() => setVista('proyectos')}>
              <BriefcaseBusiness className="h-4 w-4" />
              Proyectos
            </button>
            <button className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/8" onClick={() => setVista('mis_tareas')}>
              <ListTodo className="h-4 w-4" />
              Mis tareas
            </button>
            <button className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/8" onClick={() => setVista('info_cliente')}>
              <Building2 className="h-4 w-4" />
              Info cliente
            </button>
            {puedeVerGanttAdmin || puedeGestionarUsuarios || puedeAdministrar ? (
              <>
                {puedeVerGanttAdmin ? (
                  <button className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/8" onClick={() => setVista('gantt_admin')}>
                    <CalendarRange className="h-4 w-4" />
                    Gantt admin
                  </button>
                ) : null}
                {puedeGestionarUsuarios || puedeAdministrar ? (
                  <button className="shrink-0 rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/8" onClick={() => setVista('ajustes')} aria-label="Ajustes">
                    <Settings className="h-5 w-5" />
                  </button>
                ) : null}
              </>
            ) : null}
        </div>
        <Breadcrumb />
      </div>
    </header>
  );
}

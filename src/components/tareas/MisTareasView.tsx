import { AlertTriangle, Search, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useProyectosVisibles } from '../../hooks/usePermisos';
import { useAppStore } from '../../store/useAppStore';
import { FiltroTareasVista, OrdenTareasVista, Tarea, UsuarioActivo } from '../../types';
import { normalizarResponsable, responsableAsignadoAUsuario } from '../../utils/assignee';
import { tareaEstaVencida, tareaVenceHoy, tareaVencePronto } from '../../utils/taskHealth';
import { useT } from '../../i18n/useT';
import { TareasDrilldown } from '../proyectos/TareasDrilldown';

const getTasksForUser = (tareas: Tarea[], proyectoIds: string[], usuario: UsuarioActivo | null) => {
  const visible = tareas.filter((tarea) => proyectoIds.includes(tarea.proyectoId));
  if (usuario?.perfil === 'artbpo_ejecutivo' || usuario?.perfil === 'artbpo_admin' || usuario?.perfil === 'rex_plus') {
    return visible.filter((tarea) => responsableAsignadoAUsuario(tarea.responsable, usuario));
  }
  return visible;
};

const tieneAcentos = (value: string) => value.normalize('NFD') !== value;

const agregarPersonaUnica = (map: Map<string, string>, nombre: string) => {
  const clean = nombre.trim();
  const key = normalizarResponsable(clean);
  if (!key) return;
  const actual = map.get(key);
  if (!actual || (!tieneAcentos(actual) && tieneAcentos(clean))) {
    map.set(key, clean);
  }
};

const filtrarTareas = (tareas: Tarea[], filtro: FiltroTareasVista) => {
  switch (filtro) {
    case 'vencidas':
      return tareas.filter(tareaEstaVencida);
    case 'hoy':
      return tareas.filter(tareaVenceHoy);
    case 'proximas':
      return tareas.filter((tarea) => tareaVencePronto(tarea, 2));
    case 'bloqueadas':
      return tareas.filter((tarea) => tarea.estado === 'bloqueada');
    case 'completadas':
      return tareas.filter((tarea) => tarea.estado === 'completada');
    case 'en_proceso':
      return tareas.filter((tarea) => tarea.estado === 'en_proceso');
    case 'atencion':
      return tareas.filter((tarea) => tareaEstaVencida(tarea) || tareaVenceHoy(tarea) || tareaVencePronto(tarea, 2) || tarea.estado === 'bloqueada');
    default:
      return tareas;
  }
};

export function MisTareasView() {
  const proyectos = useProyectosVisibles();
  const t = useT();
  const {
    tareas,
    usuarioActivo,
    perfiles,
    ejecutivos,
    busquedaTareas,
    setBusquedaTareas,
    filtroTareasVista,
    setFiltroTareasVista,
    ordenTareasVista,
    setOrdenTareasVista,
  } = useAppStore();
  const [query, setQuery] = useState('');
  const proyectoIds = useMemo(() => proyectos.map((p) => p.id), [proyectos]);
  const personasAsignables = useMemo(() => {
    const byName = new Map<string, string>();
    [...perfiles.filter((perfil) => perfil.activo !== false), ...ejecutivos].forEach((persona) => {
      agregarPersonaUnica(byName, persona.nombre);
    });
    return Array.from(byName.values()).sort((a, b) => a.localeCompare(b));
  }, [ejecutivos, perfiles]);
  const [personaSeleccionada, setPersonaSeleccionada] = useState('');

  const misTareas = useMemo(() => {
    return getTasksForUser(tareas, proyectoIds, usuarioActivo);
  }, [proyectoIds, tareas, usuarioActivo]);
  const vencidas = misTareas.filter(tareaEstaVencida);
  const vencenHoy = misTareas.filter(tareaVenceHoy);
  const vencenPronto = misTareas.filter((tarea) => tareaVencePronto(tarea, 2));
  const bloqueadas = misTareas.filter((tarea) => tarea.estado === 'bloqueada');
  const esAdmin = usuarioActivo?.perfil === 'artbpo_admin';
  const persona = personaSeleccionada || personasAsignables[0] || '';
  const tareasPorPersona = useMemo(() => {
    if (!persona) return [];
    const visible = tareas.filter((tarea) => proyectoIds.includes(tarea.proyectoId));
    return visible.filter((tarea) => responsableAsignadoAUsuario(tarea.responsable, {
      id: persona,
      nombre: persona,
      iniciales: persona.split(' ').map((item) => item[0]).join('').slice(0, 3),
      rol: '',
      perfil: 'artbpo_ejecutivo',
      color: '#94a3b8',
    }));
  }, [persona, proyectoIds, tareas]);
  const misTareasFiltradas = useMemo(() => filtrarTareas(misTareas, filtroTareasVista), [filtroTareasVista, misTareas]);
  const tareasPorPersonaFiltradas = useMemo(
    () => filtrarTareas(tareasPorPersona, filtroTareasVista),
    [filtroTareasVista, tareasPorPersona],
  );

  useEffect(() => {
    if (!busquedaTareas) return;
    setQuery(busquedaTareas);
  }, [busquedaTareas]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">{t('mistareas_badge')}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{t('mistareas_title')}</h1>
          <p className="mt-2 text-slate-400">
            {usuarioActivo?.perfil === 'artbpo_ejecutivo' || usuarioActivo?.perfil === 'artbpo_admin'
              ? t('mistareas_subtitle_own')
              : t('mistareas_subtitle_generic')}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white"
            placeholder={t('mistareas_search_placeholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setBusquedaTareas(e.target.value);
            }}
          />
        </div>
      </div>

      {vencidas.length ? (
        <div className="rounded-xl border border-red-400/40 bg-red-500/15 p-4 shadow-[0_0_36px_rgba(239,68,68,0.16)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-red-100">{vencidas.length} {t('mistareas_overdue_banner')}</p>
              <p className="text-sm text-red-200/80">{t('mistareas_overdue_banner_sub')}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => setFiltroTareasVista('vencidas')}
          className={`rounded-xl border p-4 text-left shadow-[0_0_24px_rgba(239,68,68,0.12)] transition ${filtroTareasVista === 'vencidas' ? 'border-red-300 bg-red-500/18 ring-1 ring-red-300/40' : 'border-red-400/40 bg-red-500/12 hover:bg-red-500/16'}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-200">{t('mistareas_card_overdue')}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{vencidas.length}</p>
          <p className="mt-1 text-sm text-red-100/80">{t('mistareas_card_overdue_sub')}</p>
        </button>
        <button
          type="button"
          onClick={() => setFiltroTareasVista('hoy')}
          className={`rounded-xl border p-4 text-left transition ${filtroTareasVista === 'hoy' ? 'border-amber-200 bg-amber-400/18 ring-1 ring-amber-200/40' : 'border-amber-300/30 bg-amber-400/10 hover:bg-amber-400/14'}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">{t('mistareas_card_today')}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{vencenHoy.length}</p>
          <p className="mt-1 text-sm text-amber-100/80">{t('mistareas_card_today_sub')}</p>
        </button>
        <button
          type="button"
          onClick={() => setFiltroTareasVista('proximas')}
          className={`rounded-xl border p-4 text-left transition ${filtroTareasVista === 'proximas' ? 'border-orange-200 bg-orange-400/18 ring-1 ring-orange-200/40' : 'border-orange-300/25 bg-orange-400/10 hover:bg-orange-400/14'}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">{t('mistareas_card_soon')}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{vencenPronto.length}</p>
          <p className="mt-1 text-sm text-orange-100/80">{t('mistareas_card_soon_sub')}</p>
        </button>
        <button
          type="button"
          onClick={() => setFiltroTareasVista('bloqueadas')}
          className={`rounded-xl border p-4 text-left transition ${filtroTareasVista === 'bloqueadas' ? 'border-slate-200 bg-white/[0.08] ring-1 ring-slate-200/30' : 'border-slate-300/20 bg-white/[0.04] hover:bg-white/[0.06]'}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">{t('mistareas_card_blocked')}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{bloqueadas.length}</p>
          <p className="mt-1 text-sm text-slate-400">{t('mistareas_card_blocked_sub')}</p>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['todas', t('filter_todas')],
          ['atencion', t('filter_atencion')],
          ['vencidas', t('filter_vencidas')],
          ['en_proceso', t('filter_en_proceso')],
          ['hoy', t('filter_hoy')],
          ['proximas', t('filter_proximas')],
          ['bloqueadas', t('filter_bloqueadas')],
          ['completadas', t('filter_completadas')],
        ].map(([valor, label]) => {
          const activo = filtroTareasVista === valor;
          return (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltroTareasVista(valor as FiltroTareasVista)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${activo ? 'border-emerald-300/40 bg-emerald-400/12 text-emerald-100' : 'border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/8'}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-400">{t('order_by')}</span>
        {[
          ['criticas', t('order_criticas')],
          ['vence', t('order_vence')],
          ['nuevas', t('order_nuevas')],
          ['plan', t('order_plan')],
        ].map(([valor, label]) => {
          const activo = ordenTareasVista === valor;
          return (
            <button
              key={valor}
              type="button"
              onClick={() => setOrdenTareasVista(valor as OrdenTareasVista)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${activo ? 'border-sky-300/35 bg-sky-400/12 text-sky-100' : 'border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/8'}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <TareasDrilldown tareas={misTareasFiltradas} query={query} sortMode={ordenTareasVista} />

      {esAdmin ? (
        <section className="space-y-4 pt-2">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">{t('mistareas_admin_view')}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{t('mistareas_tasks_by_person')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('mistareas_admin_subtitle')}</p>
            </div>
            <label className="grid w-full gap-2 text-sm text-slate-300 sm:w-80">
              {t('mistareas_responsible_label')}
              <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white" value={persona} onChange={(event) => setPersonaSeleccionada(event.target.value)}>
                {personasAsignables.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-slate-300">
              <UsersRound className="h-4 w-4 text-emerald-300" />
              {tareasPorPersonaFiltradas.length} {t('mistareas_tasks_assigned_to')} {persona || t('mistareas_responsible_fallback')}
            </div>
            <TareasDrilldown tareas={tareasPorPersonaFiltradas} query={query} sortMode={ordenTareasVista} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

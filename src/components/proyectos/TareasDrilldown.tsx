import { AlertTriangle, ArrowRightLeft, ChevronDown, ChevronRight, FolderKanban, ListChecks, MessageSquare, Search, Send, StepForward, UserPlus, XCircle } from 'lucide-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAppStore, calcPctFase, calcPctProyecto } from '../../store/useAppStore';
import { Tarea } from '../../types';
import { normalizarResponsable, responsableAsignadoAUsuario } from '../../utils/assignee';
import { diasParaVencimiento, diasVencida, tareaEstaVencida, tareaVenceHoy, tareaVencePronto } from '../../utils/taskHealth';
import { usePermisos } from '../../hooks/usePermisos';
import { GlassCard } from '../ui/GlassCard';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusBadge } from '../ui/StatusBadge';
import { TareaEditDrawer } from './TareaEditDrawer';

type Props = {
  tareas: Tarea[];
  showProjectLevel?: boolean;
  query?: string;
  sortMode?: 'criticas' | 'vence' | 'nuevas' | 'plan';
};

const sortByPlan = (a: Tarea, b: Tarea) => a.fechaInicioPlan.localeCompare(b.fechaInicioPlan);
const estadoPrioridad: Record<Tarea['estado'], number> = {
  bloqueada: 1,
  en_proceso: 2,
  pendiente: 3,
  cancelada: 4,
  completada: 5,
};
const estadosOrden = ['vencida', 'bloqueada', 'en_proceso', 'pendiente', 'cancelada', 'completada'];
const estadoLabels: Record<string, string> = {
  vencida: 'Vencidas',
  bloqueada: 'Bloqueadas',
  en_proceso: 'En proceso',
  pendiente: 'Pendientes',
  completada: 'Completadas',
  cancelada: 'Canceladas',
};
const accionEstado: Record<Tarea['estado'], { next: Tarea['estado']; label: string }> = {
  pendiente: { next: 'en_proceso', label: 'Iniciar' },
  en_proceso: { next: 'completada', label: 'Completar' },
  completada: { next: 'pendiente', label: 'Reabrir' },
  bloqueada: { next: 'en_proceso', label: 'Reactivar' },
  cancelada: { next: 'pendiente', label: 'Reabrir' },
};

const toggleSet = (set: Set<string>, id: string) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

const estadoAgrupacion = (tarea: Tarea) => (tareaEstaVencida(tarea) ? 'vencida' : tarea.estado);

const compareByCriticidad = (a: Tarea, b: Tarea) => {
  if (tareaEstaVencida(a) || tareaEstaVencida(b)) {
    if (tareaEstaVencida(a) && tareaEstaVencida(b)) return diasVencida(b) - diasVencida(a);
    return tareaEstaVencida(a) ? -1 : 1;
  }

  if (a.estado !== b.estado) return estadoPrioridad[a.estado] - estadoPrioridad[b.estado];
  if (tareaVenceHoy(a) || tareaVenceHoy(b)) return tareaVenceHoy(a) ? -1 : 1;
  if (tareaVencePronto(a, 2) || tareaVencePronto(b, 2)) {
    if (tareaVencePronto(a, 2) && tareaVencePronto(b, 2)) {
      return (diasParaVencimiento(a) ?? 999) - (diasParaVencimiento(b) ?? 999);
    }
    return tareaVencePronto(a, 2) ? -1 : 1;
  }
  return (diasParaVencimiento(a) ?? 999) - (diasParaVencimiento(b) ?? 999) || sortByPlan(a, b);
};

const compareByVencimiento = (a: Tarea, b: Tarea) => {
  const diasA = diasParaVencimiento(a);
  const diasB = diasParaVencimiento(b);
  const pesoA = diasA === null ? 9999 : diasA;
  const pesoB = diasB === null ? 9999 : diasB;
  if (pesoA !== pesoB) return pesoA - pesoB;
  return compareByCriticidad(a, b);
};

const compareByNuevas = (a: Tarea, b: Tarea) => {
  const fechaB = new Date(b.actualizadoEn).getTime();
  const fechaA = new Date(a.actualizadoEn).getTime();
  if (fechaB !== fechaA) return fechaB - fechaA;
  return compareByCriticidad(a, b);
};

const sortTasksByMode = (items: Tarea[], sortMode: NonNullable<Props['sortMode']>) => {
  const ordered = [...items];
  switch (sortMode) {
    case 'criticas':
      return ordered.sort(compareByCriticidad);
    case 'vence':
      return ordered.sort(compareByVencimiento);
    case 'nuevas':
      return ordered.sort(compareByNuevas);
    default:
      return ordered.sort(sortByPlan);
  }
};

const formatFechaCorta = (fecha?: string) => {
  if (!fecha) return '';
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(fecha));
};

function QuickReassignPanel({
  tarea,
  personasAsignables,
}: {
  tarea: Tarea;
  personasAsignables: string[];
}) {
  const { usuarioActivo, solicitarReasignacionTarea, resolverReasignacionTarea } = useAppStore();
  const { puedeEditarDatosTarea, esComercial, esRexPlus } = usePermisos();
  const [open, setOpen] = useState(false);
  const [nuevoResponsable, setNuevoResponsable] = useState('');
  const [motivo, setMotivo] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);

  const solicitud = tarea.reasignacionPendiente ?? null;
  const usuarioEsResponsableActual = !!usuarioActivo && responsableAsignadoAUsuario(tarea.responsable, usuarioActivo);
  const puedeSolicitar =
    !esComercial &&
    !esRexPlus &&
    !!usuarioActivo &&
    (puedeEditarDatosTarea || usuarioEsResponsableActual);
  const usuarioEsDestinatario =
    !!usuarioActivo &&
    !!solicitud &&
    responsableAsignadoAUsuario(solicitud.destinatario, usuarioActivo);
  const usuarioEsSolicitante =
    !!usuarioActivo &&
    !!solicitud &&
    responsableAsignadoAUsuario(solicitud.solicitante, usuarioActivo);
  const hayPendiente = solicitud?.estado === 'pendiente';
  const opciones = personasAsignables.filter(
    (persona) => normalizarResponsable(persona) !== normalizarResponsable(tarea.responsable),
  );

  useEffect(() => {
    setNuevoResponsable('');
    setMotivo('');
    setMotivoRechazo('');
    setMensaje(null);
    setOpen(Boolean(solicitud && (solicitud.estado === 'pendiente' ? usuarioEsDestinatario : false)));
  }, [tarea.id, solicitud?.destinatario, solicitud?.estado, solicitud?.solicitadaEn, usuarioEsDestinatario]);

  if (!puedeSolicitar && !solicitud) return null;

  const enviarSolicitud = () => {
    if (!usuarioActivo) return;
    if (!nuevoResponsable.trim() || !motivo.trim()) {
      setMensaje('Selecciona responsable y deja el motivo.');
      return;
    }

    solicitarReasignacionTarea({
      tareaId: tarea.id,
      nuevoResponsable,
      motivo,
      usuario: usuarioActivo.nombre,
    });
    setNuevoResponsable('');
    setMotivo('');
    setMensaje(`Solicitud enviada a ${nuevoResponsable}.`);
    setOpen(false);
  };

  const aceptar = () => {
    if (!usuarioActivo) return;
    resolverReasignacionTarea({
      tareaId: tarea.id,
      accion: 'aceptar',
      usuario: usuarioActivo.nombre,
    });
    setMensaje('Reasignación aceptada.');
    setOpen(false);
  };

  const rechazar = () => {
    if (!usuarioActivo) return;
    if (!motivoRechazo.trim()) {
      setMensaje('Para rechazar, necesitamos el motivo.');
      return;
    }
    resolverReasignacionTarea({
      tareaId: tarea.id,
      accion: 'rechazar',
      usuario: usuarioActivo.nombre,
      motivo: motivoRechazo,
    });
    setMotivoRechazo('');
    setMensaje('Rechazo enviado al solicitante.');
    setOpen(false);
  };

  return (
    <div className="mt-2 rounded-lg border border-sky-300/20 bg-sky-400/[0.06] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {solicitud ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 font-semibold ${hayPendiente ? 'bg-sky-400/15 text-sky-100' : 'bg-red-500/15 text-red-100'}`}>
              {hayPendiente ? 'Reasignación pendiente' : 'Reasignación rechazada'}
            </span>
            <span className="text-slate-300">
              {solicitud.solicitante} → {solicitud.destinatario}
            </span>
          </div>
        ) : (
          <span className="rounded-full bg-sky-400/15 px-2.5 py-1 font-semibold text-sky-100">Solicitar reasignación</span>
        )}
        {puedeSolicitar && !hayPendiente ? (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300/20 px-2.5 py-1.5 text-[11px] font-semibold text-sky-100 hover:bg-sky-400/10"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            {open ? 'Ocultar' : solicitud?.estado === 'rechazada' ? 'Reintentar' : 'Abrir'}
          </button>
        ) : null}
      </div>

      {solicitud ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-200">{solicitud.motivo}</p>
          <p className="text-xs text-slate-400">
            {hayPendiente ? `Solicitada ${formatFechaCorta(solicitud.solicitadaEn)}` : `Respondida ${formatFechaCorta(solicitud.respondidaEn ?? solicitud.solicitadaEn)}`}
          </p>
          {solicitud.estado === 'rechazada' && solicitud.respuesta ? (
            <p className="rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              Motivo rechazo: {solicitud.respuesta}
            </p>
          ) : null}

          {hayPendiente && usuarioEsDestinatario ? (
            <div className="space-y-2">
              <textarea
                className="min-h-20 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Si vas a rechazar, explica por qué."
                value={motivoRechazo}
                onChange={(event) => setMotivoRechazo(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={aceptar}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-300"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Aceptar
                </button>
                <button
                  type="button"
                  onClick={rechazar}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-300/35 bg-red-500/12 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/18"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Rechazar
                </button>
              </div>
            </div>
          ) : hayPendiente && usuarioEsSolicitante ? (
            <p className="text-xs text-sky-100">Esperando respuesta de {solicitud.destinatario}.</p>
          ) : null}
        </div>
      ) : open && puedeSolicitar ? (
        <div className="space-y-2">
          <select
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            value={nuevoResponsable}
            onChange={(event) => setNuevoResponsable(event.target.value)}
          >
            <option value="">Selecciona responsable</option>
            {opciones.map((persona) => (
              <option key={persona} value={persona}>
                {persona}
              </option>
            ))}
          </select>
          <textarea
            className="min-h-20 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            placeholder="Explica por qué esta tarea debería pasar a otra persona."
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enviarSolicitud}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-300 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-200"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar solicitud
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/8"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {mensaje ? <p className="mt-2 text-xs text-sky-100">{mensaje}</p> : null}
    </div>
  );
}

const projectScore = (items: Tarea[], sortMode: NonNullable<Props['sortMode']>) => {
  const sorted = sortTasksByMode(items, sortMode);
  const primera = sorted[0];
  if (!primera) return 99999;
  switch (sortMode) {
    case 'nuevas':
      return -new Date(primera.actualizadoEn).getTime();
    case 'vence':
      return diasParaVencimiento(primera) ?? 9999;
    case 'criticas':
      return tareaEstaVencida(primera) ? -1000 - diasVencida(primera) : estadoPrioridad[primera.estado];
    default:
      return 0;
  }
};

export function TaskStatusGroups({
  tareas,
  renderTask,
  scopeId,
}: {
  tareas: Tarea[];
  renderTask: (tarea: Tarea) => ReactNode;
  scopeId: string;
}) {
  const [openStatuses, setOpenStatuses] = useState<Set<string>>(new Set());
  const groups = useMemo(() => {
    return estadosOrden
      .map((estado) => {
        const key = String(estado);
        return {
          key,
          label: estadoLabels[key] ?? key,
          tareas: tareas.filter((tarea) => estadoAgrupacion(tarea) === key),
        };
      })
      .filter((group) => group.tareas.length);
  }, [tareas]);

  if (!groups.length) return null;

  return (
    <div className="grid gap-3">
      {groups.map((group) => {
        const id = `${scopeId}-${group.key}`;
        const isOpen = openStatuses.has(id);
        const isCritical = group.key === 'vencida';
        return (
          <div key={id} className={`rounded-lg border ${isCritical ? 'border-red-400/45 bg-red-500/10' : 'border-white/10 bg-white/[0.025]'}`}>
            <button className="flex w-full items-center justify-between gap-3 p-3 text-left" onClick={() => setOpenStatuses((current) => toggleSet(current, id))}>
              <div className="flex min-w-0 items-center gap-2">
                {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />}
                <span className={`font-semibold ${isCritical ? 'text-red-100' : 'text-white'}`}>{group.label}</span>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isCritical ? 'bg-red-500 text-white' : 'bg-white/8 text-slate-300'}`}>
                {group.tareas.length}
              </span>
            </button>
            {isOpen ? <div className="grid gap-3 border-t border-white/10 p-3 md:grid-cols-2">{group.tareas.map((tarea) => renderTask(tarea))}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

export function TareasDrilldown({ tareas, showProjectLevel = true, query = '', sortMode = 'criticas' }: Props) {
  const { proyectos, fases, actualizarTarea, usuarioActivo, tareaActivaId, setTareaActiva, perfiles, ejecutivos } = useAppStore();
  const { puedeCambiarEstadoTarea, puedeEditarDatosTarea, esComercial, esRexPlus } = usePermisos();
  const [selected, setSelected] = useState<Tarea | null>(null);
  const normalized = query.trim().toLowerCase();
  const personasAsignables = useMemo(() => {
    const byName = new Map<string, string>();
    [...perfiles.filter((perfil) => perfil.activo !== false), ...ejecutivos].forEach((persona) => {
      const clean = persona.nombre.trim();
      const key = normalizarResponsable(clean);
      if (!key) return;
      if (!byName.has(key)) byName.set(key, clean);
    });
    return Array.from(byName.values()).sort((a, b) => a.localeCompare(b));
  }, [ejecutivos, perfiles]);

  const filtered = useMemo(() => {
    const ordered = sortTasksByMode(tareas, sortMode);
    if (!normalized) return ordered;
    return ordered.filter((tarea) => {
      const proyecto = proyectos.find((p) => p.id === tarea.proyectoId);
      const fase = fases.find((f) => f.id === tarea.faseId);
      return [tarea.nombre, tarea.responsable, tarea.estado, proyecto?.nombre, fase?.nombre, fase?.codigo]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [fases, normalized, proyectos, sortMode, tareas]);

  const projectIds = useMemo(() => Array.from(new Set(filtered.map((tarea) => tarea.proyectoId))), [filtered]);
  const phaseIds = useMemo(() => Array.from(new Set(filtered.map((tarea) => tarea.faseId))), [filtered]);
  const [openProjects, setOpenProjects] = useState<Set<string>>(new Set(projectIds));
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set(phaseIds));

  useEffect(() => {
    setOpenProjects((current) => new Set([...current, ...projectIds]));
    setOpenPhases((current) => new Set([...current, ...phaseIds]));
  }, [phaseIds, projectIds]);

  useEffect(() => {
    if (!tareaActivaId) return;
    const tareaEncontrada = filtered.find((tarea) => tarea.id === tareaActivaId);
    if (tareaEncontrada) {
      setSelected(tareaEncontrada);
      setOpenProjects((current) => new Set([...current, tareaEncontrada.proyectoId]));
      setOpenPhases((current) => new Set([...current, tareaEncontrada.faseId]));
    }
  }, [filtered, tareaActivaId]);

  const visibleProjects = useMemo(() => {
    const ids = Array.from(new Set(filtered.map((tarea) => tarea.proyectoId)));
    return ids
      .map((id) => proyectos.find((proyecto) => proyecto.id === id))
      .filter(Boolean)
      .sort((a, b) => {
        const tareasA = filtered.filter((tarea) => tarea.proyectoId === a?.id);
        const tareasB = filtered.filter((tarea) => tarea.proyectoId === b?.id);
        const score = projectScore(tareasA, sortMode) - projectScore(tareasB, sortMode);
        if (score !== 0) return score;
        return (a?.nombre ?? '').localeCompare(b?.nombre ?? '');
      });
  }, [filtered, proyectos, sortMode]);

  const ensureOpenProject = (id: string) => {
    setOpenProjects((current) => toggleSet(current, id));
  };

  const ensureOpenPhase = (id: string) => {
    setOpenPhases((current) => toggleSet(current, id));
  };

  const renderTask = (tarea: Tarea) => {
    const proyecto = proyectos.find((p) => p.id === tarea.proyectoId);
    const vencida = tareaEstaVencida(tarea);
    const overdueDays = diasVencida(tarea);
    const reasignacionPendiente = tarea.reasignacionPendiente?.estado === 'pendiente';
    const reasignacionRechazada = tarea.reasignacionPendiente?.estado === 'rechazada';
    const accion = accionEstado[tarea.estado];
    const puedeCambiarEstaTarea =
      !!usuarioActivo &&
      puedeCambiarEstadoTarea &&
      (!esRexPlus || responsableAsignadoAUsuario(tarea.responsable, usuarioActivo));
    const puedeReasignarRapido =
      ((!esComercial &&
        !esRexPlus &&
        !!usuarioActivo &&
        (puedeEditarDatosTarea || responsableAsignadoAUsuario(tarea.responsable, usuarioActivo))) ||
        !!tarea.reasignacionPendiente);
    const cambiarEstadoRapido = () => {
      if (!puedeCambiarEstaTarea) return;
      const hoy = new Date().toISOString().slice(0, 10);
      actualizarTarea(
        tarea.id,
        {
          estado: accion.next,
          ...(accion.next === 'en_proceso' || accion.next === 'completada' ? { fechaInicioReal: tarea.fechaInicioReal ?? hoy } : {}),
          ...(accion.next === 'completada' ? { fechaFinReal: tarea.fechaFinReal ?? hoy } : {}),
        },
        usuarioActivo?.nombre ?? 'Sistema',
      );
    };

    return (
      <div
        key={tarea.id}
        className={[
          'group relative w-full overflow-hidden rounded-lg border p-3 text-left transition',
          vencida
            ? 'border-red-400/50 bg-red-500/15 shadow-[0_0_34px_rgba(239,68,68,0.14)] hover:border-red-300/80 hover:bg-red-500/20'
            : reasignacionPendiente
              ? 'border-sky-300/45 bg-sky-500/12 shadow-[0_0_34px_rgba(56,189,248,0.16)] hover:border-sky-200/80 hover:bg-sky-500/16'
              : reasignacionRechazada
                ? 'border-red-300/35 bg-red-500/10 shadow-[0_0_28px_rgba(239,68,68,0.1)] hover:border-red-200/65 hover:bg-red-500/14'
            : 'border-white/10 bg-white/[0.035] hover:border-emerald-300/35 hover:bg-white/8',
        ].join(' ')}
      >
        {vencida ? <span className="absolute inset-y-0 left-0 w-1.5 rounded-l-lg bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.5)]" /> : null}
        {reasignacionPendiente ? <span className="absolute inset-y-0 right-0 w-1.5 rounded-r-lg bg-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.5)]" /> : null}
        {reasignacionRechazada ? <span className="absolute inset-y-0 right-0 w-1.5 rounded-r-lg bg-red-300 shadow-[0_0_18px_rgba(248,113,113,0.45)]" /> : null}
        <button className="w-full text-left" onClick={() => setSelected(tarea)}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge estado={tarea.estado} ping={tarea.estado === 'bloqueada'} />
                {vencida ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Vencida {overdueDays}d
                  </span>
                ) : null}
                {tarea.esMilestone ? <span className="rounded-full bg-amber-400/12 px-2.5 py-1 text-xs font-medium text-amber-100">Milestone</span> : null}
                {reasignacionPendiente ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400/18 px-2.5 py-1 text-xs font-semibold text-sky-50 shadow-[0_0_18px_rgba(56,189,248,0.2)]">
                    <span className="h-2 w-2 rounded-full bg-sky-200 animate-pulse" />
                    Reasignación pendiente
                  </span>
                ) : null}
                {reasignacionRechazada ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/18 px-2.5 py-1 text-xs font-semibold text-red-50 shadow-[0_0_18px_rgba(239,68,68,0.18)]">
                    <span className="h-2 w-2 rounded-full bg-red-200" />
                    Reasignación rechazada
                  </span>
                ) : null}
              </div>
              <h4 className="line-clamp-2 text-sm font-semibold text-white transition group-hover:text-emerald-100">{tarea.nombre}</h4>
              <p className="mt-1 truncate text-xs text-slate-400">
                {showProjectLevel ? null : <span>{proyecto?.nombre ?? 'Proyecto'} · </span>}
                {tarea.responsable}
              </p>
              {reasignacionPendiente && tarea.reasignacionPendiente ? (
                <p className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-sky-300/20 bg-sky-400/10 px-2.5 py-1.5 text-xs text-sky-100">
                  <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
                  Esperando respuesta de {tarea.reasignacionPendiente.destinatario}
                </p>
              ) : null}
              {reasignacionRechazada && tarea.reasignacionPendiente?.respuesta ? (
                <p className="mt-2 line-clamp-2 rounded-lg border border-red-300/15 bg-red-500/8 px-2.5 py-1.5 text-xs text-red-100">
                  Rechazo: {tarea.reasignacionPendiente.respuesta}
                </p>
              ) : null}
            </div>
            <div className={`text-left text-xs sm:text-right ${vencida ? 'text-red-100' : 'text-slate-400'}`}>
              {vencida ? <p className="mb-1 font-semibold uppercase tracking-[0.12em] text-red-200">Urgente</p> : null}
              {reasignacionPendiente ? <p className="mb-1 font-semibold uppercase tracking-[0.12em] text-sky-200">Por aceptar</p> : null}
              {reasignacionRechazada ? <p className="mb-1 font-semibold uppercase tracking-[0.12em] text-red-200">Devuelta</p> : null}
              <p>{tarea.fechaInicioPlan}</p>
              <p>{tarea.fechaFinPlan}</p>
            </div>
          </div>
        </button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-slate-500">
          {tarea.observacion || tarea.comentarios?.length ? (
            <span className="inline-flex items-center gap-1 text-emerald-200">
              <MessageSquare className="h-3.5 w-3.5" />
              {tarea.comentarios?.length ? `${tarea.comentarios.length} mensaje(s)` : 'Con notas'}
            </span>
          ) : <span>{tarea.duracionDias} dia(s)</span>}
          <button
            disabled={!puedeCambiarEstaTarea}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-45"
            onClick={cambiarEstadoRapido}
            type="button"
          >
            <StepForward className="h-3.5 w-3.5" />
            {accion.label}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelected(tarea)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/8"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Abrir ficha
          </button>
        </div>
        {puedeReasignarRapido ? <QuickReassignPanel tarea={tarea} personasAsignables={personasAsignables} /> : null}
      </div>
    );
  };

  const renderPhases = (projectId: string) => {
    const fasesProyecto = fases
      .filter((fase) => fase.proyectoId === projectId && filtered.some((tarea) => tarea.faseId === fase.id))
      .sort((a, b) => a.orden - b.orden);

    return (
      <div className="space-y-3">
        {fasesProyecto.map((fase) => {
          const tareasFase = sortTasksByMode(filtered.filter((tarea) => tarea.faseId === fase.id), sortMode);
          const pct = calcPctFase(fase.id, tareas);
          const isOpen = openPhases.has(fase.id);

          return (
            <div key={fase.id} className="rounded-xl border border-white/10 bg-black/10">
              <button className="flex w-full items-center justify-between gap-4 p-4 text-left" onClick={() => ensureOpenPhase(fase.id)}>
                <div className="flex min-w-0 items-center gap-3">
                  {isOpen ? <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">{fase.codigo}</p>
                    <h3 className="truncate font-semibold text-white">{fase.nombre}</h3>
                    <p className="mt-1 text-sm text-slate-500">{tareasFase.length} tarea(s)</p>
                  </div>
                </div>
                <div className="hidden min-w-36 sm:block">
                  <div className="mb-1 text-right text-sm font-semibold text-white">{pct}%</div>
                  <ProgressBar value={pct} tone={pct === 100 ? 'emerald' : 'blue'} />
                </div>
              </button>
              {isOpen ? (
                <div className="border-t border-white/10 p-3">
                  <TaskStatusGroups tareas={tareasFase} renderTask={renderTask} scopeId={`fase-${fase.id}`} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  if (!filtered.length) {
    return (
      <GlassCard className="p-6 text-center text-slate-400">
        <Search className="mx-auto mb-3 h-5 w-5 text-slate-500" />
        No hay tareas para mostrar con los filtros actuales.
      </GlassCard>
    );
  }

  if (!showProjectLevel) {
    const projectId = filtered[0]?.proyectoId ?? '';
    return (
      <>
        {renderPhases(projectId)}
        <TareaEditDrawer
          tarea={selected}
          onClose={() => {
            setSelected(null);
            setTareaActiva(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {visibleProjects.map((proyecto) => {
          if (!proyecto) return null;
          const tareasProyecto = filtered.filter((tarea) => tarea.proyectoId === proyecto.id);
          const pct = calcPctProyecto(proyecto.id, tareas);
          const isOpen = openProjects.has(proyecto.id);

          return (
            <GlassCard key={proyecto.id} className="overflow-hidden">
              <button className="flex w-full items-center justify-between gap-4 p-5 text-left" onClick={() => ensureOpenProject(proyecto.id)}>
                <div className="flex min-w-0 items-center gap-3">
                  {isOpen ? <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-200">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-white">{proyecto.nombre}</h2>
                    <p className="mt-1 text-sm text-slate-500">{tareasProyecto.length} tarea(s) visibles</p>
                  </div>
                </div>
                <div className="hidden min-w-44 sm:block">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-400">Avance</span>
                    <span className="font-semibold text-white">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} tone={pct === 100 ? 'emerald' : 'blue'} />
                </div>
              </button>
              {isOpen ? (
                <div className="border-t border-white/10 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <ListChecks className="h-4 w-4 text-emerald-300" />
                    Fases y tareas
                  </div>
                  {renderPhases(proyecto.id)}
                </div>
              ) : null}
            </GlassCard>
          );
        })}
      </div>
      <TareaEditDrawer
        tarea={selected}
        onClose={() => {
          setSelected(null);
          setTareaActiva(null);
        }}
      />
    </>
  );
}

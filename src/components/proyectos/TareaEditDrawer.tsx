import { AlertTriangle, ArrowRightLeft, Ban, CalendarDays, CheckCircle2, CircleDashed, Clock3, Flag, Lock, MessageCirclePlus, MessageSquare, OctagonAlert, PlayCircle, Save, Send, Siren, UserRound, UserPlus, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { EstadoTarea, Tarea } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { usePermisos } from '../../hooks/usePermisos';
import { StatusBadge } from '../ui/StatusBadge';
import { normalizarResponsable, responsableAsignadoAUsuario } from '../../utils/assignee';
import { diasVencida, tareaEstaVencida } from '../../utils/taskHealth';

type Props = {
  tarea: Tarea | null;
  onClose: () => void;
};

type PanelAccionTarea = 'estado' | 'impedimento' | 'reasignacion';

const estados: EstadoTarea[] = ['pendiente', 'en_proceso', 'completada', 'bloqueada', 'cancelada'];
const estadoConfig: Record<EstadoTarea, { label: string; hint: string; icon: typeof CheckCircle2; active: string }> = {
  pendiente: {
    label: 'Pendiente',
    hint: 'Aun no inicia',
    icon: CircleDashed,
    active: 'border-slate-300/40 bg-slate-300/15 text-white',
  },
  en_proceso: {
    label: 'Iniciar',
    hint: 'Estoy trabajando',
    icon: PlayCircle,
    active: 'border-blue-300/50 bg-blue-400/15 text-blue-100',
  },
  completada: {
    label: 'Completar',
    hint: 'Tarea lista',
    icon: CheckCircle2,
    active: 'border-emerald-300/50 bg-emerald-400/15 text-emerald-100',
  },
  bloqueada: {
    label: 'Bloquear',
    hint: 'Requiere ayuda',
    icon: OctagonAlert,
    active: 'border-amber-300/60 bg-amber-400/15 text-amber-100',
  },
  cancelada: {
    label: 'Cancelar',
    hint: 'No aplica',
    icon: Ban,
    active: 'border-red-300/50 bg-red-400/15 text-red-100',
  },
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

export function TareaEditDrawer({ tarea, onClose }: Props) {
  const {
    actualizarTarea,
    reportarImpedimentoTarea,
    solicitarReasignacionTarea,
    resolverReasignacionTarea,
    usuarioActivo,
    proyectos,
    fases,
    tareas,
    perfiles,
    ejecutivos,
  } = useAppStore();
  const { puedeCambiarEstadoTarea, puedeEditarDatosTarea, esComercial, esRexPlus } = usePermisos();
  const [form, setForm] = useState({
    estado: 'pendiente' as EstadoTarea,
    fechaInicioPlan: '',
    fechaFinPlan: '',
    comentarioNuevo: '',
    responsableDestrabe: '',
    motivoImpedimento: '',
    nuevoResponsable: '',
    motivoReasignacion: '',
    motivoRechazoReasignacion: '',
  });
  const [mensajeImpedimento, setMensajeImpedimento] = useState<string | null>(null);
  const [mensajeReasignacion, setMensajeReasignacion] = useState<string | null>(null);
  const [panelAccionActivo, setPanelAccionActivo] = useState<PanelAccionTarea>('estado');

  const tareaActual = tarea ? tareas.find((item) => item.id === tarea.id) ?? tarea : null;
  const proyecto = tareaActual ? proyectos.find((p) => p.id === tareaActual.proyectoId) : null;
  const fase = tareaActual ? fases.find((f) => f.id === tareaActual.faseId) : null;
  const vencida = tareaActual ? tareaEstaVencida(tareaActual) : false;
  const overdueDays = tareaActual ? diasVencida(tareaActual) : 0;
  const puedeCambiarEstadoEnTarea =
    !esComercial &&
    !!usuarioActivo &&
    !!tareaActual &&
    puedeCambiarEstadoTarea &&
    (!esRexPlus || responsableAsignadoAUsuario(tareaActual.responsable, usuarioActivo));
  const puedeReasignar =
    !esComercial &&
    !esRexPlus &&
    !!usuarioActivo &&
    !!tareaActual &&
    (puedeEditarDatosTarea || responsableAsignadoAUsuario(tareaActual.responsable, usuarioActivo));
  const puedeComentar = !esComercial && !esRexPlus;
  const puedeReportarImpedimento = !!usuarioActivo && !esComercial && !!tareaActual;
  const solicitudReasignacion = tareaActual?.reasignacionPendiente ?? null;
  const usuarioEsDestinatarioReasignacion =
    !!usuarioActivo &&
    !!solicitudReasignacion &&
    responsableAsignadoAUsuario(solicitudReasignacion.destinatario, usuarioActivo);
  const usuarioEsSolicitanteReasignacion =
    !!usuarioActivo &&
    !!solicitudReasignacion &&
    responsableAsignadoAUsuario(solicitudReasignacion.solicitante, usuarioActivo);
  const puedeSolicitarReasignacion = puedeReasignar;
  const puedeResolverReasignacion = !!usuarioActivo && !!solicitudReasignacion && usuarioEsDestinatarioReasignacion;
  const personasAsignables = useMemo(() => {
    const byName = new Map<string, string>();
    [...perfiles.filter((perfil) => perfil.activo !== false), ...ejecutivos].forEach((persona) => {
      agregarPersonaUnica(byName, persona.nombre);
    });
    if (tareaActual?.responsable) agregarPersonaUnica(byName, tareaActual.responsable);
    return Array.from(byName.values()).sort((a, b) => a.localeCompare(b));
  }, [ejecutivos, perfiles, tareaActual?.responsable]);

  useEffect(() => {
    if (!tareaActual) return;
    setForm({
      estado: tareaActual.estado,
      fechaInicioPlan: tareaActual.fechaInicioPlan,
      fechaFinPlan: tareaActual.fechaFinPlan,
      comentarioNuevo: '',
      responsableDestrabe: '',
      motivoImpedimento: '',
      nuevoResponsable: '',
      motivoReasignacion: '',
      motivoRechazoReasignacion: '',
    });
    setMensajeImpedimento(null);
    setMensajeReasignacion(null);
    setPanelAccionActivo('estado');
  }, [tareaActual?.fechaFinPlan, tareaActual?.fechaInicioPlan, tareaActual?.id, tareaActual?.estado]);

  const save = () => {
    if (!tareaActual) return;
    const hoy = new Date().toISOString().slice(0, 10);
    const nuevoComentario = form.comentarioNuevo.trim();
    const comentarios = puedeComentar && nuevoComentario
      ? [
          ...(tareaActual.comentarios ?? []),
          {
            id: `comentario-${crypto.randomUUID?.() ?? Date.now()}`,
            texto: nuevoComentario,
            usuario: usuarioActivo?.nombre ?? 'Sistema',
            fecha: new Date().toISOString(),
          },
        ]
      : tareaActual.comentarios;
    const cambios: Partial<Tarea> = {
      estado: form.estado,
      ...(comentarios ? { comentarios } : {}),
      ...(puedeEditarDatosTarea
        ? {
            fechaInicioPlan: form.fechaInicioPlan,
            fechaFinPlan: form.fechaFinPlan,
          }
        : {}),
    };

    if (form.estado === 'en_proceso' || form.estado === 'completada') {
      cambios.fechaInicioReal = tareaActual.fechaInicioReal ?? hoy;
    }

    if (form.estado === 'completada') {
      cambios.fechaFinReal = tareaActual.fechaFinReal ?? hoy;
    }

    actualizarTarea(tareaActual.id, cambios, usuarioActivo?.nombre ?? 'Sistema');
    setForm((current) => ({ ...current, comentarioNuevo: '' }));
  };

  const solicitarReasignacion = () => {
    if (!tareaActual || !usuarioActivo) return;
    const nuevoResponsable = form.nuevoResponsable.trim();
    const motivo = form.motivoReasignacion.trim();

    if (!nuevoResponsable || !motivo) {
      setMensajeReasignacion('Selecciona a quién quieres derivar la tarea y explica el motivo.');
      return;
    }

    solicitarReasignacionTarea({
      tareaId: tareaActual.id,
      nuevoResponsable,
      motivo,
      usuario: usuarioActivo.nombre,
    });

    setForm((current) => ({
      ...current,
      nuevoResponsable: '',
      motivoReasignacion: '',
      motivoRechazoReasignacion: '',
    }));
    setMensajeReasignacion(`Solicitud enviada a ${nuevoResponsable}. Le llegará una alerta y deberá aceptarla o rechazarla.`);
  };

  const aceptarReasignacion = () => {
    if (!tareaActual || !usuarioActivo) return;
    resolverReasignacionTarea({
      tareaId: tareaActual.id,
      accion: 'aceptar',
      usuario: usuarioActivo.nombre,
    });
    setMensajeReasignacion('Reasignación aceptada. La tarea ya quedó a tu nombre.');
    setForm((current) => ({ ...current, motivoRechazoReasignacion: '' }));
  };

  const rechazarReasignacion = () => {
    if (!tareaActual || !usuarioActivo) return;
    const motivo = form.motivoRechazoReasignacion.trim();
    if (!motivo) {
      setMensajeReasignacion('Para rechazar la tarea necesitamos dejar el motivo.');
      return;
    }

    resolverReasignacionTarea({
      tareaId: tareaActual.id,
      accion: 'rechazar',
      usuario: usuarioActivo.nombre,
      motivo,
    });
    setMensajeReasignacion('Rechazo enviado. El solicitante recibirá la alerta con tu argumento.');
    setForm((current) => ({ ...current, motivoRechazoReasignacion: '' }));
  };

  const reportarImpedimento = () => {
    if (!tareaActual || !usuarioActivo) return;
    const motivo = form.motivoImpedimento.trim();
    const responsableDestrabe = form.responsableDestrabe.trim();
    if (!motivo || !responsableDestrabe) {
      setMensajeImpedimento('Define quién debe destrabar y qué información estás esperando.');
      return;
    }

    reportarImpedimentoTarea({
      tareaOrigenId: tareaActual.id,
      responsableDestrabe,
      motivo,
      usuario: usuarioActivo.nombre,
    });

    setForm((current) => ({
      ...current,
      estado: 'bloqueada',
      comentarioNuevo: '',
      responsableDestrabe: '',
      motivoImpedimento: '',
    }));
    setMensajeImpedimento(`Solicitud enviada a ${responsableDestrabe}. Ya quedó creada su tarea de destrabe y su alerta.`);
    setPanelAccionActivo('impedimento');
  };

  const comentarios = tareaActual?.comentarios ?? [];
  const estadoActualConfig = estadoConfig[form.estado];
  const formatFecha = (fecha: string) =>
    new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(fecha));
  const reasignacionBloqueaNuevaSolicitud = solicitudReasignacion?.estado === 'pendiente';
  const opcionesReasignacion = personasAsignables.filter(
    (persona) => normalizarResponsable(persona) !== normalizarResponsable(tareaActual?.responsable),
  );

  return (
    <Drawer open={!!tareaActual} title="Ficha de tarea" onClose={onClose}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
        <div className="space-y-4">
          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {tareaActual ? <StatusBadge estado={form.estado} ping={form.estado === 'bloqueada'} /> : null}
              {vencida ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Vencida hace {overdueDays} dia(s)
                </span>
              ) : null}
              {tareaActual?.esMilestone ? <span className="rounded-full bg-amber-400/12 px-2.5 py-1 text-xs font-medium text-amber-100">Milestone</span> : null}
              {!puedeEditarDatosTarea ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-xs text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                  {esComercial ? 'Solo lectura' : esRexPlus ? 'Solo estado en tareas asignadas' : puedeReasignar ? 'Estado, reasignacion y comentarios' : 'Solo estado y comentarios'}
                </span>
              ) : null}
            </div>
            <h3 className="text-xl font-semibold leading-tight text-white">{tareaActual?.nombre}</h3>
            {tareaActual?.descripcion ? <p className="mt-1 line-clamp-3 text-sm text-slate-400">{tareaActual.descripcion}</p> : null}
            <p className="mt-2 truncate text-xs text-slate-500">{proyecto?.nombre ?? 'Proyecto'}</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">Fase</p>
                <p className="flex items-center gap-2 text-sm font-medium text-white">
                  <Flag className="h-3.5 w-3.5 text-emerald-300" />
                  {fase ? `${fase.codigo} · ${fase.nombre}` : 'Sin fase'}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">Responsable</p>
                <p className="flex items-center gap-2 text-sm font-medium text-white">
                  <UserRound className="h-3.5 w-3.5 text-emerald-300" />
                  {tareaActual?.responsable || 'Sin asignar'}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">Plan</p>
                <p className="flex items-center gap-2 text-sm font-medium text-white">
                  <CalendarDays className="h-3.5 w-3.5 text-emerald-300" />
                  {form.fechaInicioPlan || '-'} / {form.fechaFinPlan || '-'}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">Duracion</p>
                <p className="flex items-center gap-2 text-sm font-medium text-white">
                  <Clock3 className="h-3.5 w-3.5 text-emerald-300" />
                  {tareaActual?.duracionDias ?? 0} dia(s)
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Estado y acciones
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">
                {estadoActualConfig.label} · {estadoActualConfig.hint}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
              {estados.map((estado) => {
                const config = estadoConfig[estado];
                const Icon = config.icon;
                const active = form.estado === estado;
                return (
                  <button
                    key={estado}
                    disabled={!puedeCambiarEstadoEnTarea}
                    className={[
                      'flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center transition disabled:cursor-not-allowed disabled:opacity-55',
                      active ? config.active : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-emerald-300/35 hover:bg-white/8',
                    ].join(' ')}
                    onClick={() => setForm((s) => ({ ...s, estado }))}
                    type="button"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-semibold">{config.label}</span>
                    <span className="text-[11px] opacity-70">{config.hint}</span>
                  </button>
                );
              })}
            </div>

            {(puedeReportarImpedimento || puedeSolicitarReasignacion || solicitudReasignacion) ? (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Acciones sobre la tarea</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {puedeReportarImpedimento ? (
                    <button
                      type="button"
                      onClick={() => setPanelAccionActivo((current) => (current === 'impedimento' ? 'estado' : 'impedimento'))}
                      className={[
                        'flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center transition',
                        panelAccionActivo === 'impedimento'
                          ? 'border-amber-300/60 bg-amber-400/15 text-amber-100'
                          : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-amber-300/35 hover:bg-white/8',
                      ].join(' ')}
                    >
                      <Siren className="h-5 w-5" />
                      <span className="text-xs font-semibold">Impedimento</span>
                      <span className="text-[11px] opacity-70">Pedir destrabe</span>
                    </button>
                  ) : null}

                  {(puedeSolicitarReasignacion || solicitudReasignacion) ? (
                    <button
                      type="button"
                      onClick={() => setPanelAccionActivo((current) => (current === 'reasignacion' ? 'estado' : 'reasignacion'))}
                      className={[
                        'relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center transition',
                        panelAccionActivo === 'reasignacion'
                          ? 'border-sky-300/60 bg-sky-400/15 text-sky-100'
                          : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-sky-300/35 hover:bg-white/8',
                      ].join(' ')}
                    >
                      {solicitudReasignacion?.estado === 'pendiente' ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-sky-200 shadow-[0_0_12px_rgba(125,211,252,0.9)] animate-pulse" /> : null}
                      {solicitudReasignacion?.estado === 'rechazada' ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-300 shadow-[0_0_12px_rgba(252,165,165,0.85)]" /> : null}
                      <ArrowRightLeft className="h-5 w-5" />
                      <span className="text-xs font-semibold">Reasignación</span>
                      <span className="text-[11px] opacity-70">
                        {solicitudReasignacion?.estado === 'pendiente'
                          ? 'Pendiente'
                          : solicitudReasignacion?.estado === 'rechazada'
                            ? 'Rechazada'
                            : 'Cambiar responsable'}
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {puedeReportarImpedimento && panelAccionActivo === 'impedimento' ? (
              <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-400/[0.08] p-4 shadow-[0_16px_34px_rgba(251,191,36,0.12)]">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Siren className="h-4 w-4 text-amber-200" />
                  Reportar impedimento
                </div>
                <p className="mb-3 text-sm text-slate-200">
                  Si esta tarea depende de otra persona para seguir avanzando, deja el motivo, crea su tarea de destrabe y le llegará una alerta.
                </p>

                <div className="grid gap-3 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.35fr)_220px]">
                  <label className="grid gap-1 text-sm text-slate-300">
                    Quién debe destrabar
                    <select
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white"
                      value={form.responsableDestrabe}
                      onChange={(e) => setForm((current) => ({ ...current, responsableDestrabe: e.target.value }))}
                    >
                      <option value="">Selecciona responsable</option>
                      {personasAsignables
                        .filter((persona) => normalizarResponsable(persona) !== normalizarResponsable(tareaActual?.responsable))
                        .map((persona) => (
                          <option key={persona} value={persona}>
                            {persona}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm text-slate-300">
                    Qué te está impidiendo avanzar
                    <textarea
                      className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                      placeholder='Ejemplo: pedí información al cliente para continuar con la carga inicial.'
                      value={form.motivoImpedimento}
                      onChange={(e) => setForm((current) => ({ ...current, motivoImpedimento: e.target.value }))}
                    />
                  </label>

                  <div className="flex flex-col justify-end gap-2">
                    <button
                      type="button"
                      onClick={reportarImpedimento}
                      className="inline-flex min-h-24 items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-3 text-center font-semibold text-slate-950 shadow-[0_12px_28px_rgba(252,211,77,0.24)] transition hover:bg-amber-200"
                    >
                      <Siren className="h-4 w-4" />
                      Crear tarea de destrabe y alertar
                    </button>
                  </div>
                </div>

                {mensajeImpedimento ? <p className="mt-3 text-sm text-amber-100">{mensajeImpedimento}</p> : null}
              </div>
            ) : null}

            {(puedeSolicitarReasignacion || solicitudReasignacion) && panelAccionActivo === 'reasignacion' ? (
              <div className="mt-4 rounded-xl border border-sky-300/20 bg-sky-400/[0.06] p-4 shadow-[0_16px_34px_rgba(56,189,248,0.1)]">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <ArrowRightLeft className="h-4 w-4 text-sky-200" />
                  Reasignación de tarea
                </div>

                {solicitudReasignacion ? (
                  <div className="mb-3 rounded-xl border border-white/10 bg-black/10 p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-slate-200">
                        {solicitudReasignacion.estado === 'pendiente' ? 'Pendiente de respuesta' : 'Rechazada'}
                      </span>
                      <span className="text-slate-400">
                        {solicitudReasignacion.solicitante} → {solicitudReasignacion.destinatario}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200">{solicitudReasignacion.motivo}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Solicitada el {formatFecha(solicitudReasignacion.solicitadaEn)}
                      {solicitudReasignacion.respondidaEn ? ` · Respondida el ${formatFecha(solicitudReasignacion.respondidaEn)}` : ''}
                    </p>
                    {solicitudReasignacion.estado === 'rechazada' && solicitudReasignacion.respuesta ? (
                      <div className="mt-3 rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                        Motivo del rechazo: {solicitudReasignacion.respuesta}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {puedeResolverReasignacion && solicitudReasignacion?.estado === 'pendiente' ? (
                  <div className="grid gap-3">
                    <p className="text-sm text-slate-200">
                      Esta tarea fue solicitada para ti. Puedes aceptarla ahora o rechazarla explicando por qué.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={aceptarReasignacion}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 shadow-[0_12px_28px_rgba(16,185,129,0.24)] transition hover:bg-emerald-300"
                      >
                        <UserPlus className="h-4 w-4" />
                        Aceptar tarea
                      </button>
                      <button
                        type="button"
                        onClick={rechazarReasignacion}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300/35 bg-red-500/12 px-4 py-3 font-semibold text-red-100 transition hover:bg-red-500/18"
                      >
                        <XCircle className="h-4 w-4" />
                        Rechazar tarea
                      </button>
                    </div>
                    <label className="grid gap-1 text-sm text-slate-300">
                      Motivo del rechazo
                      <textarea
                        className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                        placeholder="Ejemplo: hoy no tengo contexto, necesito cierre de otra actividad, o no corresponde a mi frente."
                        value={form.motivoRechazoReasignacion}
                        onChange={(e) => setForm((current) => ({ ...current, motivoRechazoReasignacion: e.target.value }))}
                      />
                    </label>
                  </div>
                ) : puedeSolicitarReasignacion ? (
                  <div className="grid gap-3 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.35fr)_220px]">
                    <label className="grid gap-1 text-sm text-slate-300">
                      Nuevo responsable
                      <select
                        disabled={reasignacionBloqueaNuevaSolicitud}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
                        value={form.nuevoResponsable}
                        onChange={(e) => setForm((current) => ({ ...current, nuevoResponsable: e.target.value }))}
                      >
                        <option value="">Selecciona responsable</option>
                        {opcionesReasignacion.map((persona) => (
                          <option key={persona} value={persona}>
                            {persona}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-1 text-sm text-slate-300">
                      Motivo de la reasignación
                      <textarea
                        disabled={reasignacionBloqueaNuevaSolicitud}
                        className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="Ejemplo: esta actividad debe continuarla quien lidera carga de estructura o quien ya tiene relación con el cliente."
                        value={form.motivoReasignacion}
                        onChange={(e) => setForm((current) => ({ ...current, motivoReasignacion: e.target.value }))}
                      />
                    </label>

                    <div className="flex flex-col justify-end gap-2">
                      <button
                        type="button"
                        onClick={solicitarReasignacion}
                        disabled={reasignacionBloqueaNuevaSolicitud}
                        className="inline-flex min-h-24 items-center justify-center gap-2 rounded-lg bg-sky-300 px-4 py-3 text-center font-semibold text-slate-950 shadow-[0_12px_28px_rgba(56,189,248,0.24)] transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Solicitar reasignación
                      </button>
                    </div>
                  </div>
                ) : null}

                {solicitudReasignacion?.estado === 'pendiente' && usuarioEsSolicitanteReasignacion ? (
                  <p className="mt-3 text-sm text-sky-100">
                    Esperando respuesta de {solicitudReasignacion.destinatario}. Mientras tanto, la tarea sigue a nombre de {tareaActual?.responsable}.
                  </p>
                ) : null}
                {mensajeReasignacion ? <p className="mt-3 text-sm text-sky-100">{mensajeReasignacion}</p> : null}
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Datos de gestion</h3>
              <span className="text-xs text-slate-500">Edicion puntual</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-1 text-sm text-slate-300 md:col-span-1">
                Responsable
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white">
                  {tareaActual?.responsable || 'Sin asignar'}
                </div>
              </div>

              <label className="grid gap-1 text-sm text-slate-300">
                Inicio plan
                <input disabled={!puedeEditarDatosTarea} type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.fechaInicioPlan} onChange={(e) => setForm((s) => ({ ...s, fechaInicioPlan: e.target.value }))} />
              </label>
              <label className="grid gap-1 text-sm text-slate-300">
                Fin plan
                <input disabled={!puedeEditarDatosTarea} type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60" value={form.fechaFinPlan} onChange={(e) => setForm((s) => ({ ...s, fechaFinPlan: e.target.value }))} />
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-semibold text-white">
                <MessageSquare className="h-4 w-4 text-emerald-300" />
                Observaciones
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-100">
                <MessageCirclePlus className="h-3.5 w-3.5" />
                {puedeComentar ? 'Nuevo mensaje' : 'Solo lectura'}
              </span>
            </div>

            <div className="mb-3 max-h-52 space-y-2 overflow-y-auto pr-1">
              {tareaActual?.observacion ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-2">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-slate-300">Nota anterior</span>
                    <span className="text-slate-500">Migrada desde observacion</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-300">{tareaActual.observacion}</p>
                </div>
              ) : null}

              {comentarios.length ? (
                comentarios.map((comentario) => (
                  <div key={comentario.id} className="rounded-lg border border-emerald-300/10 bg-emerald-400/[0.045] p-2">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-emerald-100">{comentario.usuario}</span>
                      <span className="text-slate-500">{formatFecha(comentario.fecha)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-200">{comentario.texto}</p>
                  </div>
                ))
              ) : !tareaActual?.observacion ? (
                <p className="rounded-lg border border-dashed border-white/10 p-3 text-sm text-slate-500">Sin comentarios todavía.</p>
              ) : null}
            </div>

            <label className="grid gap-2 text-sm text-slate-300">
              Agregar comentario
              <textarea disabled={!puedeComentar} className="min-h-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60" placeholder={!puedeComentar ? 'Este perfil no puede agregar comentarios' : 'Escribe un avance, bloqueo, acuerdo o contexto clave...'} value={form.comentarioNuevo} onChange={(e) => setForm((s) => ({ ...s, comentarioNuevo: e.target.value }))} />
            </label>
          </section>

          {tareaActual?.historial?.length ? (
            <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <h3 className="mb-2 text-sm font-semibold text-white">Últimos cambios</h3>
              <div className="grid gap-2 text-xs text-slate-400">
                {tareaActual.historial.slice(-4).map((item, index) => (
                  <p key={`${item.fecha}-${index}`} className="rounded-lg border border-white/8 bg-black/10 px-3 py-2">
                    <span className="font-medium text-slate-300">{item.campo}</span>: {item.valorAnterior || '-'} {'>'} {item.valorNuevo || '-'} · {item.usuario}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            {esComercial ? (
              <div className="text-center text-sm font-medium text-slate-400">
                Perfil solo lectura: no puede modificar estado, responsable ni comentarios.
              </div>
            ) : !puedeCambiarEstadoEnTarea && esRexPlus ? (
              <div className="text-center text-sm font-medium text-slate-400">
                Perfil REX+: solo puede cambiar el estado de tareas asignadas a su nombre.
              </div>
            ) : (
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3.5 font-semibold text-slate-950 shadow-[0_16px_32px_rgba(16,185,129,0.24)] hover:bg-emerald-300" onClick={save}>
                <Save className="h-4 w-4" />
                {puedeComentar && form.comentarioNuevo.trim() ? <Send className="h-4 w-4" /> : null}
                Actualizar tarea
              </button>
            )}
          </section>
        </div>
      </div>
    </Drawer>
  );
}

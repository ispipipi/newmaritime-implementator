import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Cloud, Link2, Lock, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { usePermisos } from '../../hooks/usePermisos';
import { useAppStore } from '../../store/useAppStore';
import { EstadoTarea, Tarea } from '../../types';
import { GoogleSheetPlanPayload, GoogleSheetPlanRow, normalizeGoogleSheetSourceUrl, parseGoogleSheetCsv, parseGoogleSheetPlan } from '../../utils/googleSheetsPlan';
import { useT } from '../../i18n/useT';
import { GanttView } from './GanttView';
import { GlassCard } from '../ui/GlassCard';
import { StatusBadge } from '../ui/StatusBadge';

const estados: EstadoTarea[] = ['pendiente', 'en_proceso', 'completada', 'bloqueada', 'cancelada'];

const calcDuracion = (inicio: string, fin: string) => Math.max(0, differenceInCalendarDays(parseISO(fin), parseISO(inicio)));

export function GanttAdminView() {
  const {
    proyectos,
    fases,
    tareas,
    ejecutivos,
    actualizarTarea,
    actualizarProyecto,
    crearTarea,
    eliminarTarea,
    usuarioActivo,
    fuenteGoogleSheetsUrl,
    setFuenteGoogleSheetsUrl,
    reemplazarPlanificacionProyecto,
    desplazarCronogramaProyecto,
  } = useAppStore();
  const { puedeAdministrar } = usePermisos();
  const t = useT();
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id ?? '');
  const [sheetUrl, setSheetUrl] = useState(fuenteGoogleSheetsUrl);
  const [syncState, setSyncState] = useState<{ loading: boolean; message: string; error: boolean }>({ loading: false, message: '', error: false });
  const [fechaInicioProyecto, setFechaInicioProyecto] = useState(proyectos[0]?.fechaInicio ?? new Date().toISOString().slice(0, 10));

  const fasesProyecto = useMemo(() => fases.filter((fase) => fase.proyectoId === proyectoId).sort((a, b) => a.orden - b.orden), [fases, proyectoId]);
  const tareasProyecto = useMemo(() => tareas.filter((tarea) => tarea.proyectoId === proyectoId).sort((a, b) => a.fechaInicioPlan.localeCompare(b.fechaInicioPlan)), [tareas, proyectoId]);
  const proyecto = proyectos.find((p) => p.id === proyectoId);

  const [form, setForm] = useState({
    faseId: fasesProyecto[0]?.id ?? '',
    nombre: '',
    responsable: ejecutivos.find((e) => e.perfil === 'artbpo_ejecutivo')?.nombre ?? '',
    estado: 'pendiente' as EstadoTarea,
    fechaInicioPlan: proyecto?.fechaInicio ?? new Date().toISOString().slice(0, 10),
    fechaFinPlan: proyecto?.fechaInicio ?? new Date().toISOString().slice(0, 10),
    esMilestone: false,
  });

  const currentFaseId = form.faseId || fasesProyecto[0]?.id || '';

  useEffect(() => {
    setForm((s) => ({
      ...s,
      faseId: fasesProyecto[0]?.id ?? '',
      fechaInicioPlan: proyecto?.fechaInicio ?? s.fechaInicioPlan,
      fechaFinPlan: proyecto?.fechaInicio ?? s.fechaFinPlan,
    }));
  }, [fasesProyecto, proyecto]);

  useEffect(() => {
    if (proyecto?.fechaInicio) {
      setFechaInicioProyecto(proyecto.fechaInicio);
    }
  }, [proyecto?.fechaInicio, proyectoId]);

  if (!puedeAdministrar) {
    return (
      <GlassCard className="p-6">
        <Lock className="mb-4 h-8 w-8 text-slate-500" />
        <h1 className="text-2xl font-semibold text-white">Acceso restringido</h1>
        <p className="mt-2 text-slate-400">Solo Administrador y Cerebro Operacional pueden modificar la Gantt completa.</p>
      </GlassCard>
    );
  }

  const updateTask = (tarea: Tarea, cambios: Partial<Tarea>) => {
    const next = { ...cambios };
    if (next.fechaInicioPlan || next.fechaFinPlan) {
      const inicio = next.fechaInicioPlan ?? tarea.fechaInicioPlan;
      const fin = next.fechaFinPlan ?? tarea.fechaFinPlan;
      next.duracionDias = calcDuracion(inicio, fin);
    }
    actualizarTarea(tarea.id, next, usuarioActivo?.nombre ?? 'Administrador');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nombre.trim() || !proyectoId || !currentFaseId) return;
    crearTarea({
      faseId: currentFaseId,
      proyectoId,
      nombre: form.nombre,
      descripcion: '',
      responsable: form.responsable || 'Sin asignar',
      estado: form.estado,
      fechaInicioPlan: form.fechaInicioPlan,
      fechaFinPlan: form.fechaFinPlan,
      duracionDias: calcDuracion(form.fechaInicioPlan, form.fechaFinPlan),
      esMilestone: form.esMilestone,
      observacion: '',
    });
    setForm((s) => ({ ...s, nombre: '', esMilestone: false }));
  };

  const deleteTask = (tarea: Tarea) => {
    if (window.confirm(`Eliminar la tarea "${tarea.nombre}"?`)) {
      eliminarTarea(tarea.id);
    }
  };

  const saveSheetUrl = () => {
    setFuenteGoogleSheetsUrl(sheetUrl.trim());
    setSyncState({ loading: false, message: 'URL guardada. Ya puedes sincronizar desde Google Sheets.', error: false });
  };

  const syncFromGoogleSheets = async () => {
    const url = normalizeGoogleSheetSourceUrl(sheetUrl);
    if (!url || !proyectoId) {
      setSyncState({ loading: false, message: 'Pega primero la URL del Google Sheet o Apps Script.', error: true });
      return;
    }

    setSyncState({ loading: true, message: 'Leyendo planificacion desde Google Sheets...', error: false });
    try {
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) throw new Error(`Google Sheets respondio ${response.status}`);
      const contentType = response.headers.get('content-type') ?? '';
      const responseText = await response.text();
      const payload = contentType.includes('application/json') || responseText.trim().startsWith('{') || responseText.trim().startsWith('[')
        ? (JSON.parse(responseText) as GoogleSheetPlanPayload | GoogleSheetPlanRow[])
        : parseGoogleSheetCsv(responseText);
      const imported = parseGoogleSheetPlan(payload, proyectoId);

      if (!imported.tareas.length) {
        throw new Error('La respuesta no contiene tareas validas. Revisa la pestaña IMPLEMENTATOR_DATA.');
      }

      reemplazarPlanificacionProyecto(proyectoId, imported.fases, imported.tareas, usuarioActivo?.nombre ?? 'Administrador', {
        fechaInicio: imported.fechaInicio,
        fechaFin: imported.fechaFin,
      });
      setFuenteGoogleSheetsUrl(sheetUrl.trim());
      setSyncState({
        loading: false,
        message: `Sincronizado: ${imported.fases.length} fases y ${imported.tareas.length} tareas/hitos. Omitidas: ${imported.skipped.length}. Fechas corregidas: ${imported.correctedDates.length}.`,
        error: false,
      });
    } catch (error) {
      setSyncState({
        loading: false,
        message: error instanceof Error ? error.message : 'No se pudo sincronizar desde Google Sheets.',
        error: true,
      });
    }
  };

  const ajustarInicioProyecto = () => {
    if (!proyecto || !fechaInicioProyecto) return;
    if (fechaInicioProyecto === proyecto.fechaInicio) {
      setSyncState({ loading: false, message: 'La fecha de inicio ya coincide con la actual.', error: false });
      return;
    }

    desplazarCronogramaProyecto(proyecto.id, fechaInicioProyecto, usuarioActivo?.nombre ?? 'Administrador');
    setSyncState({
      loading: false,
      message: `Cronograma desplazado desde ${proyecto.fechaInicio} hacia ${fechaInicioProyecto}. Se ajustaron fases, tareas y go live.`,
      error: false,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">{t('gantt_admin_badge')}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{t('gantt_admin_title')}</h1>
          <p className="mt-2 text-slate-400">{t('gantt_admin_subtitle')}</p>
        </div>
        <select className="min-w-72 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      {proyecto ? (
        <GlassCard className="p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,320px)_auto_1fr] lg:items-end">
            <label className="grid gap-2 text-sm text-slate-300">
              Fecha de inicio del proyecto
              <input
                type="date"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                value={fechaInicioProyecto}
                onChange={(e) => setFechaInicioProyecto(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-300 px-4 py-3 font-semibold text-slate-950 hover:bg-sky-200"
              onClick={ajustarInicioProyecto}
            >
              <RefreshCw className="h-4 w-4" />
              Correr cronograma
            </button>
            <div className="grid gap-1 text-sm text-slate-400">
              <p>
                Inicio actual: <span className="font-medium text-white">{proyecto.fechaInicio}</span>
              </p>
              <p>
                Go live actual: <span className="font-medium text-white">{proyecto.fechaGoLive}</span>
              </p>
              <p className="text-xs text-slate-500">
                Al cambiar la fecha de inicio, se desplazan en bloque las fechas planificadas de fases, tareas y la fecha go live.
              </p>
            </div>
          </div>
        </GlassCard>
      ) : null}

      <GlassCard className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-emerald-300">
              <Cloud className="h-4 w-4" />
              Fuente viva
            </div>
            <h2 className="text-xl font-semibold text-white">{t('gantt_sync_title')}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('gantt_sync_subtitle')}
            </p>
            <label className="mt-4 grid gap-2 text-sm text-slate-300">
              {t('gantt_sync_url_label')}
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white"
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit?gid=..."
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                  />
                </div>
                <button type="button" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/8" onClick={saveSheetUrl}>
                  {t('gantt_sync_save_url')}
                </button>
              </div>
            </label>
            {syncState.message ? (
              <p className={`mt-3 text-sm ${syncState.error ? 'text-red-300' : 'text-emerald-300'}`}>{syncState.message}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
            onClick={syncFromGoogleSheets}
            disabled={syncState.loading}
          >
            <RefreshCw className={`h-4 w-4 ${syncState.loading ? 'animate-spin' : ''}`} />
            {t('gantt_sync_button')}
          </button>
        </div>
      </GlassCard>

      <GanttView fases={fasesProyecto} tareas={tareasProyecto} />

      <GlassCard className="p-5">
        <h2 className="mb-4 text-xl font-semibold text-white">{t('gantt_add_task_title')}</h2>
        <form className="grid gap-3 lg:grid-cols-6" onSubmit={submit}>
          <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={currentFaseId} onChange={(e) => setForm((s) => ({ ...s, faseId: e.target.value }))}>
            {fasesProyecto.map((fase) => (
              <option key={fase.id} value={fase.id}>
                {fase.codigo} · {fase.nombre}
              </option>
            ))}
          </select>
          <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder={t('gantt_add_task_nombre')} value={form.nombre} onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))} />
          <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder={t('gantt_add_task_responsable')} value={form.responsable} onChange={(e) => setForm((s) => ({ ...s, responsable: e.target.value }))} />
          <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.fechaInicioPlan} onChange={(e) => setForm((s) => ({ ...s, fechaInicioPlan: e.target.value }))} />
          <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.fechaFinPlan} onChange={(e) => setForm((s) => ({ ...s, fechaFinPlan: e.target.value }))} />
          <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.estado} onChange={(e) => setForm((s) => ({ ...s, estado: e.target.value as EstadoTarea }))}>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado.replace('_', ' ')}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.esMilestone} onChange={(e) => setForm((s) => ({ ...s, esMilestone: e.target.checked }))} />
            {t('gantt_milestone_label')}
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300">
            <Plus className="h-4 w-4" />
            {t('gantt_add_task_button')}
          </button>
        </form>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-semibold text-white">{t('gantt_edit_title')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('gantt_edit_subtitle')}</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-[1180px] w-full text-left">
            <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('gantt_col_tarea')}</th>
                <th className="px-4 py-3">{t('gantt_col_fase')}</th>
                <th className="px-4 py-3">{t('gantt_col_responsable')}</th>
                <th className="px-4 py-3">{t('gantt_col_estado')}</th>
                <th className="px-4 py-3">{t('gantt_col_inicio')}</th>
                <th className="px-4 py-3">{t('gantt_col_fin')}</th>
                <th className="px-4 py-3">{t('gantt_col_milestone')}</th>
                <th className="px-4 py-3 text-right">{t('gantt_col_eliminar')}</th>
              </tr>
            </thead>
            <tbody>
              {tareasProyecto.map((tarea) => (
                <tr key={tarea.id} className="border-b border-white/8 last:border-0">
                  <td className="px-4 py-3">
                    <input className="w-full min-w-64 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.nombre} onChange={(e) => updateTask(tarea, { nombre: e.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <select className="w-full min-w-48 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.faseId} onChange={(e) => updateTask(tarea, { faseId: e.target.value })}>
                      {fasesProyecto.map((fase) => (
                        <option key={fase.id} value={fase.id}>
                          {fase.codigo}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input className="w-full min-w-44 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.responsable} onChange={(e) => updateTask(tarea, { responsable: e.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="mb-2">
                      <StatusBadge estado={tarea.estado} />
                    </div>
                    <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.estado} onChange={(e) => updateTask(tarea, { estado: e.target.value as EstadoTarea })}>
                      {estados.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.fechaInicioPlan} onChange={(e) => updateTask(tarea, { fechaInicioPlan: e.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={tarea.fechaFinPlan} onChange={(e) => updateTask(tarea, { fechaFinPlan: e.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                      <input type="checkbox" checked={tarea.esMilestone} onChange={(e) => updateTask(tarea, { esMilestone: e.target.checked })} />
                      {t('gantt_milestone_si')}
                    </label>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-red-400/20 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10" onClick={() => deleteTask(tarea)}>
                      <Trash2 className="h-4 w-4" />
                      {t('gantt_col_eliminar')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Save className="h-4 w-4" />
        Los cambios quedan persistidos y el administrador puede desplazar el cronograma completo desde la fecha de inicio del proyecto.
      </div>
    </div>
  );
}

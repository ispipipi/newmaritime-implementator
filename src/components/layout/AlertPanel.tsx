import { AlertTriangle, Bell, Check, ChevronDown, ChevronRight, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Tarea } from '../../types';
import { alertaVisibleParaUsuario } from '../../utils/assignee';
import { diasParaVencimiento } from '../../utils/taskHealth';
import { TareaEditDrawer } from '../proyectos/TareaEditDrawer';
import { GlassCard } from '../ui/GlassCard';

const normalizar = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const etiquetaTipoAlerta: Record<string, string> = {
  vencida: 'Vencida',
  proxima_vencer: 'Próxima',
  bloqueada: 'Bloqueada',
  en_riesgo: 'En riesgo',
  reasignada: 'Reasignada',
  solicitud_reasignacion: 'Por aceptar',
  reasignacion_rechazada: 'Rechazada',
};

type GrupoAlerta = 'criticas' | 'hoy' | 'proximas' | 'reasignadas' | 'otras';

const grupoConfig: Record<
  GrupoAlerta,
  { label: string; empty: string; accent: string; badge: string }
> = {
  criticas: {
    label: 'Críticas',
    empty: 'Sin alertas críticas.',
    accent: 'text-red-100',
    badge: 'bg-red-500 text-white',
  },
  hoy: {
    label: 'Hoy',
    empty: 'Sin alertas para hoy.',
    accent: 'text-amber-100',
    badge: 'bg-amber-400/15 text-amber-100',
  },
  proximas: {
    label: 'Próximas',
    empty: 'Sin alertas próximas.',
    accent: 'text-orange-100',
    badge: 'bg-orange-400/15 text-orange-100',
  },
  reasignadas: {
    label: 'Reasignadas',
    empty: 'Sin tareas reasignadas.',
    accent: 'text-blue-100',
    badge: 'bg-blue-400/15 text-blue-100',
  },
  otras: {
    label: 'Otras',
    empty: 'Sin otras alertas.',
    accent: 'text-slate-200',
    badge: 'bg-white/8 text-slate-200',
  },
};

export function AlertPanel() {
  const { alertas, proyectos, tareas, marcarAlertaLeida, setVista, usuarioActivo } = useAppStore();
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [grupoActivo, setGrupoActivo] = useState<'todas' | GrupoAlerta>('todas');
  const [gruposAbiertos, setGruposAbiertos] = useState<Set<GrupoAlerta>>(new Set(['criticas', 'hoy']));

  const buscarTareaAlerta = (alerta: (typeof alertas)[number]) => {
    const tareaPorId = tareas.find((item) => item.id === alerta.tareaId);
    if (tareaPorId) return tareaPorId;

    const nombreDesdeMensaje = alerta.mensaje.split(':').slice(1).join(':');
    const nombreNormalizado = normalizar(nombreDesdeMensaje);
    if (!nombreNormalizado) return null;

    return (
      tareas.find((item) => item.proyectoId === alerta.proyectoId && normalizar(item.nombre) === nombreNormalizado) ??
      tareas.find((item) => item.proyectoId === alerta.proyectoId && normalizar(item.nombre).includes(nombreNormalizado)) ??
      null
    );
  };

  const abrirAlerta = (alerta: (typeof alertas)[number]) => {
    const tarea = buscarTareaAlerta(alerta);
    if (tarea) {
      setTareaSeleccionada(tarea);
      return;
    }

    setVista('proyecto', alerta.proyectoId);
  };

  const pendientes = useMemo(
    () =>
      alertas
        .filter((a) => !a.leida && alertaVisibleParaUsuario(a, usuarioActivo))
        .sort((a, b) => {
          const prioridad = {
            vencida: 0,
            bloqueada: 1,
            solicitud_reasignacion: 2,
            reasignacion_rechazada: 3,
            reasignada: 4,
            proxima_vencer: 5,
            en_riesgo: 6,
          };
          return prioridad[a.tipo] - prioridad[b.tipo];
        }),
    [alertas, usuarioActivo],
  );

  const clasificarAlerta = (alerta: (typeof alertas)[number]): GrupoAlerta => {
    const tarea = buscarTareaAlerta(alerta);
    if (alerta.tipo === 'vencida' || alerta.tipo === 'bloqueada' || alerta.tipo === 'en_riesgo') return 'criticas';
    if (alerta.tipo === 'reasignada' || alerta.tipo === 'solicitud_reasignacion' || alerta.tipo === 'reasignacion_rechazada') return 'reasignadas';
    if (alerta.tipo === 'proxima_vencer') {
      const dias = tarea ? diasParaVencimiento(tarea) : null;
      if (dias === 0) return 'hoy';
      return 'proximas';
    }
    return 'otras';
  };

  const grupos = useMemo(() => {
    const base: Record<GrupoAlerta, typeof pendientes> = {
      criticas: [],
      hoy: [],
      proximas: [],
      reasignadas: [],
      otras: [],
    };
    pendientes.forEach((alerta) => {
      base[clasificarAlerta(alerta)].push(alerta);
    });
    return base;
  }, [pendientes]);

  const gruposVisibles = grupoActivo === 'todas' ? (Object.keys(grupoConfig) as GrupoAlerta[]) : [grupoActivo];
  const toggleGrupo = (grupo: GrupoAlerta) =>
    setGruposAbiertos((current) => {
      const next = new Set(current);
      if (next.has(grupo)) next.delete(grupo);
      else next.add(grupo);
      return next;
    });

  return (
    <GlassCard className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-300" />
          <h3 className="font-semibold text-white">Alertas</h3>
        </div>
        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-200">{pendientes.length}</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setGrupoActivo('todas')}
          className={`rounded-lg border px-3 py-2 text-sm transition ${grupoActivo === 'todas' ? 'border-emerald-300/35 bg-emerald-400/12 text-emerald-100' : 'border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/8'}`}
        >
          Todas
        </button>
        {(Object.keys(grupoConfig) as GrupoAlerta[]).map((grupo) => (
          <button
            key={grupo}
            type="button"
            onClick={() => setGrupoActivo(grupo)}
            className={`rounded-lg border px-3 py-2 text-sm transition ${grupoActivo === grupo ? 'border-emerald-300/35 bg-emerald-400/12 text-emerald-100' : 'border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/8'}`}
          >
            {grupoConfig[grupo].label} ({grupos[grupo].length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {pendientes.length ? (
          gruposVisibles.map((grupo) => {
            const items = grupos[grupo];
            const abierto = gruposAbiertos.has(grupo) || grupoActivo !== 'todas';
            const config = grupoConfig[grupo];

            if (!items.length && grupoActivo === 'todas') return null;

            return (
              <div key={grupo} className="rounded-xl border border-white/10 bg-white/[0.03]">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 p-3 text-left"
                  onClick={() => toggleGrupo(grupo)}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {abierto ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                    <span className={`font-semibold ${config.accent}`}>{config.label}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}>{items.length}</span>
                </button>

                {abierto ? (
                  <div className="space-y-3 border-t border-white/10 p-3">
                    {items.length ? (
                      items.map((alerta) => {
            const proyecto = proyectos.find((p) => p.id === alerta.proyectoId);
            const esVencida = alerta.tipo === 'vencida';
            const esReasignada =
              alerta.tipo === 'reasignada' || alerta.tipo === 'solicitud_reasignacion' || alerta.tipo === 'reasignacion_rechazada';
            return (
              <div
                key={alerta.id}
                className={[
                  'rounded-lg border p-3 transition',
                  esVencida
                    ? 'border-red-400/50 bg-red-500/15 shadow-[0_0_26px_rgba(239,68,68,0.12)] hover:border-red-300/80'
                    : esReasignada
                      ? 'border-blue-300/30 bg-blue-400/10 hover:border-blue-300/55'
                      : 'border-white/8 bg-white/[0.035] hover:border-emerald-300/25 hover:bg-white/8',
                ].join(' ')}
              >
                <button className="w-full text-left text-sm font-medium text-slate-100 hover:text-white" onClick={() => abrirAlerta(alerta)}>
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold" style={esVencida ? { background: '#ef4444', color: '#ffffff' } : undefined}>
                    {esVencida ? <AlertTriangle className="h-3.5 w-3.5" /> : esReasignada ? <UserPlus className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                    {etiquetaTipoAlerta[alerta.tipo] ?? alerta.tipo.replace(/_/g, ' ')}
                  </span>
                  {alerta.mensaje}
                </button>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="truncate">{proyecto?.nombre ?? 'Proyecto'}</span>
                  <button className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200" onClick={() => marcarAlertaLeida(alerta.id)}>
                    <Check className="h-3.5 w-3.5" />
                    Leída
                  </button>
                </div>
              </div>
                      );
                    })
                    ) : (
                      <p className="rounded-lg border border-white/8 bg-white/[0.035] p-3 text-sm text-slate-400">{config.empty}</p>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="rounded-lg border border-white/8 bg-white/[0.035] p-3 text-sm text-slate-400">Sin alertas pendientes.</p>
        )}
      </div>
      <TareaEditDrawer tarea={tareaSeleccionada} onClose={() => setTareaSeleccionada(null)} />
    </GlassCard>
  );
}

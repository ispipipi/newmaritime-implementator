import { Building2, Edit3, GitBranch, Layers, UserRound } from 'lucide-react';
import { useState } from 'react';
import { usePermisos, useProyectosVisibles } from '../../hooks/usePermisos';
import { useAppStore } from '../../store/useAppStore';
import { Proyecto } from '../../types';
import { getClientInfo } from '../../utils/clientInfo';
import { useT } from '../../i18n/useT';
import { GlassCard } from '../ui/GlassCard';
import { ProyectoEditDrawer } from '../proyectos/ProyectoEditDrawer';

export function InfoClienteView() {
  const proyectos = useProyectosVisibles();
  const proyectoActivoId = useAppStore((s) => s.proyectoActivoId);
  const { puedeEditarProyectos } = usePermisos();
  const t = useT();
  const [selected, setSelected] = useState<Proyecto | null>(null);
  const proyectosMostrados = proyectoActivoId ? proyectos.filter((p) => p.id === proyectoActivoId) : proyectos;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">{t('info_cliente_badge')}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{t('nav_info_cliente')}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {proyectosMostrados.map((proyecto) => {
          const info = getClientInfo(proyecto);
          const rows = [
            { label: t('info_cliente_client'), value: info.cliente, icon: Building2 },
            { label: t('info_cliente_main_contact'), value: info.contactoPrincipal, icon: UserRound },
            { label: t('info_cliente_repo'), value: info.repositorio, icon: GitBranch },
            { label: t('info_cliente_stack'), value: info.stackTecnico, icon: Layers },
          ];

          return (
            <GlassCard key={proyecto.id} className="p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">{proyecto.nombre}</h2>
                  <p className="mt-1 text-sm text-slate-500">{proyecto.categoria} · {t('go_live_label')} {proyecto.fechaGoLive}</p>
                </div>
                {puedeEditarProyectos ? (
                  <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/8" onClick={() => setSelected(proyecto)}>
                    <Edit3 className="h-4 w-4" />
                    {t('proyecto_edit')}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3">
                {rows.map((row) => (
                  <div key={row.label} className="flex gap-3 rounded-lg border border-white/8 bg-white/[0.035] p-3">
                    <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{row.label}</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>

      <ProyectoEditDrawer proyecto={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

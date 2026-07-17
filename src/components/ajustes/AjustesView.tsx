import { Lock, ShieldCheck, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePermisos } from '../../hooks/usePermisos';
import { GlassCard } from '../ui/GlassCard';
import { MantenedorPerfiles } from './MantenedorPerfiles';
import { MantenedorUsuarios } from './MantenedorUsuarios';

type AjusteTab = 'perfiles' | 'usuarios';

export function AjustesView() {
  const { puedeAdministrar, puedeGestionarUsuarios } = usePermisos();
  const [tabActiva, setTabActiva] = useState<AjusteTab>('perfiles');

  const tabs = useMemo(
    () => [
      { id: 'perfiles' as const, label: 'Mantenedor perfiles', description: 'Roles y accesos', icon: ShieldCheck },
      { id: 'usuarios' as const, label: 'Mantenedor usuarios', description: 'Personas, correo y perfil', icon: Users },
    ],
    [],
  );

  const tabDisponible = tabs.some((tab) => tab.id === tabActiva) ? tabActiva : tabs[0]?.id;

  if (!puedeAdministrar && !puedeGestionarUsuarios) {
    return (
      <GlassCard className="p-6">
        <Lock className="mb-4 h-8 w-8 text-slate-500" />
        <h1 className="text-2xl font-semibold text-white">Acceso restringido</h1>
        <p className="mt-2 text-slate-400">Solo perfiles con acceso de administracion pueden gestionar esta seccion.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Administración</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Ajustes</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-xl border border-white/10 bg-white/[0.025] p-2 lg:sticky lg:top-32">
          <nav className="grid gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tabDisponible === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition ${
                    active
                      ? 'border border-emerald-300/30 bg-emerald-300/12 text-emerald-50'
                      : 'border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04]'
                  }`}
                  onClick={() => setTabActiva(tab.id)}
                >
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${active ? 'text-emerald-200' : 'text-slate-500'}`} />
                  <span className="min-w-0">
                    <span className="block font-semibold">{tab.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{tab.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          {tabDisponible === 'perfiles' ? <MantenedorPerfiles /> : null}
          {tabDisponible === 'usuarios' ? <MantenedorUsuarios /> : null}
        </section>
      </div>
    </div>
  );
}

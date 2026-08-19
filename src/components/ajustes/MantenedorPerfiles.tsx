import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { AccesosPerfil } from '../../types';
import { useT } from '../../i18n/useT';
import { DictKey } from '../../i18n/translations';
import { GlassCard } from '../ui/GlassCard';

const accesoLabelKeys: Array<{ key: keyof AccesosPerfil; labelKey: DictKey }> = [
  { key: 'puedeAdministrar', labelKey: 'perf_admin_system' },
  { key: 'puedeEditarProyectos', labelKey: 'perf_edit_projects' },
  { key: 'puedeEditarDatosTarea', labelKey: 'perf_edit_task_data' },
  { key: 'puedeCambiarEstadoTarea', labelKey: 'perf_change_status' },
  { key: 'puedeVerGanttAdmin', labelKey: 'perf_gantt_admin' },
  { key: 'puedeGestionarUsuarios', labelKey: 'perf_manage_users' },
  { key: 'soloLectura', labelKey: 'perf_readonly' },
  { key: 'esCliente', labelKey: 'perf_client_profile' },
];

const accesosBase: AccesosPerfil = {
  puedeAdministrar: false,
  puedeEditarProyectos: false,
  puedeEditarDatosTarea: false,
  puedeCambiarEstadoTarea: true,
  puedeVerGanttAdmin: false,
  puedeGestionarUsuarios: false,
  soloLectura: false,
  esCliente: false,
};

export function MantenedorPerfiles() {
  const { perfilesAcceso, crearPerfilAcceso, actualizarPerfilAcceso, eliminarPerfilAcceso } = useAppStore();
  const t = useT();
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    accesos: accesosBase,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nombre.trim()) return;
    crearPerfilAcceso(form);
    setForm({ nombre: '', descripcion: '', accesos: accesosBase });
  };

  const toggleFormAcceso = (key: keyof AccesosPerfil) => {
    setForm((current) => ({
      ...current,
      accesos: {
        ...current.accesos,
        [key]: !current.accesos[key],
        ...(key === 'soloLectura' && !current.accesos.soloLectura ? { puedeCambiarEstadoTarea: false, puedeEditarDatosTarea: false, puedeEditarProyectos: false } : {}),
      },
    }));
  };

  const togglePerfilAcceso = (id: string, accesos: AccesosPerfil, key: keyof AccesosPerfil) => {
    actualizarPerfilAcceso(id, {
      accesos: {
        ...accesos,
        [key]: !accesos[key],
        ...(key === 'soloLectura' && !accesos.soloLectura ? { puedeCambiarEstadoTarea: false, puedeEditarDatosTarea: false, puedeEditarProyectos: false } : {}),
      },
    });
  };

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">{t('perf_title')}</h2>
          <p className="text-sm text-slate-500">{t('perf_subtitle')}</p>
        </div>
      </div>

      <form className="grid gap-3" onSubmit={submit}>
        <div className="grid gap-3 lg:grid-cols-3">
          <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder={t('perf_name_placeholder')} value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} />
          <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder={t('perf_desc_placeholder')} value={form.descripcion} onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {accesoLabelKeys.map((acceso) => (
            <label key={acceso.key} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.accesos[acceso.key]} onChange={() => toggleFormAcceso(acceso.key)} />
              {t(acceso.labelKey)}
            </label>
          ))}
        </div>
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300 sm:w-fit">
          <Plus className="h-4 w-4" />
          {t('perf_create')}
        </button>
      </form>

      <div className="mt-5 grid gap-3">
        {perfilesAcceso.map((perfil) => (
          <div key={perfil.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-semibold text-white sm:min-w-80"
                  value={perfil.nombre}
                  onChange={(event) => actualizarPerfilAcceso(perfil.id, { nombre: event.target.value })}
                />
                <input
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white sm:min-w-96"
                  placeholder={t('perf_desc_placeholder')}
                  value={perfil.descripcion ?? ''}
                  onChange={(event) => actualizarPerfilAcceso(perfil.id, { descripcion: event.target.value })}
                />
              </div>
              <button
                className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={perfil.protegido}
                onClick={() => eliminarPerfilAcceso(perfil.id)}
                aria-label={`${t('perf_delete_aria')} ${perfil.nombre}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {accesoLabelKeys.map((acceso) => (
                <label key={`${perfil.id}-${acceso.key}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-slate-300">
                  <input type="checkbox" checked={perfil.accesos[acceso.key]} onChange={() => togglePerfilAcceso(perfil.id, perfil.accesos, acceso.key)} />
                  {t(acceso.labelKey)}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

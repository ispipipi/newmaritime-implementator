import { Plus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../ui/GlassCard';

export function MantenedorEjecutivos() {
  const { ejecutivos, crearEjecutivo, actualizarEjecutivo } = useAppStore();
  const [form, setForm] = useState({
    nombre: '',
    iniciales: '',
    rol: 'Analista Implementación',
    perfil: 'artbpo_ejecutivo' as const,
    color: '#22c55e',
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nombre.trim()) return;
    crearEjecutivo(form);
    setForm((s) => ({ ...s, nombre: '', iniciales: '' }));
  };

  return (
    <GlassCard className="p-5">
      <h2 className="mb-4 text-xl font-semibold text-white">Mantenedor de ejecutivos</h2>
      <form className="grid gap-3 lg:grid-cols-5" onSubmit={submit}>
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Iniciales" value={form.iniciales} onChange={(e) => setForm((s) => ({ ...s, iniciales: e.target.value }))} />
        <input type="color" className="h-11 rounded-lg border border-white/10 bg-white/5 px-2 py-1" value={form.color} onChange={(e) => setForm((s) => ({ ...s, color: e.target.value }))} />
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300">
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </form>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {ejecutivos.map((ejecutivo) => (
          <div key={ejecutivo.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold" style={{ backgroundColor: `${ejecutivo.color}24`, color: ejecutivo.color }}>
                {ejecutivo.iniciales}
              </span>
              <div>
                <p className="font-medium text-white">{ejecutivo.nombre}</p>
                <p className="text-sm text-slate-500">{ejecutivo.rol}</p>
              </div>
            </div>
            <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" value={ejecutivo.rol} onChange={(e) => actualizarEjecutivo(ejecutivo.id, { rol: e.target.value })} />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

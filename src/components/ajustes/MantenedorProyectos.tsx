import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { SistemaOrigen } from '../../types';
import { GlassCard } from '../ui/GlassCard';

const sistemas: SistemaOrigen[] = ['Visma', 'Meta4', 'Talana', 'Workday', 'BUK', 'Otro'];

export function MantenedorProyectos() {
  const { proyectos, ejecutivos, crearProyecto, eliminarProyecto } = useAppStore();
  const [form, setForm] = useState({
    nombre: '',
    rut: '',
    razonSocial: '',
    representanteLegal: '',
    direccion: '',
    cajaCompensacion: '',
    mutualidad: '',
    porcentajeCotizacionMutual: 0,
    sistemaOrigen: 'Visma' as SistemaOrigen,
    ejecutivoId: ejecutivos.find((e) => e.perfil === 'artbpo_ejecutivo')?.id ?? ejecutivos[0]?.id ?? '',
    supervisorId: ejecutivos.find((e) => e.perfil === 'artbpo_admin')?.id ?? ejecutivos[0]?.id ?? '',
    fechaInicio: '2026-05-04',
    fechaGoLive: '2026-08-01',
    estado: 'activo' as const,
    observaciones: '',
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nombre.trim()) return;
    crearProyecto(form);
    setForm((s) => ({
      ...s,
      nombre: '',
      rut: '',
      razonSocial: '',
      representanteLegal: '',
      direccion: '',
      cajaCompensacion: '',
      mutualidad: '',
      porcentajeCotizacionMutual: 0,
      observaciones: '',
    }));
  };

  return (
    <GlassCard className="p-5">
      <h2 className="mb-4 text-xl font-semibold text-white">Mantenedor de proyectos</h2>
      <form className="grid gap-3 lg:grid-cols-4" onSubmit={submit}>
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder="Nombre cliente" value={form.nombre} onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="RUT" value={form.rut} onChange={(e) => setForm((s) => ({ ...s, rut: e.target.value }))} />
        <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.sistemaOrigen} onChange={(e) => setForm((s) => ({ ...s, sistemaOrigen: e.target.value as SistemaOrigen }))}>
          {sistemas.map((sistema) => (
            <option key={sistema}>{sistema}</option>
          ))}
        </select>
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder="Razon social" value={form.razonSocial} onChange={(e) => setForm((s) => ({ ...s, razonSocial: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Representante legal" value={form.representanteLegal} onChange={(e) => setForm((s) => ({ ...s, representanteLegal: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Direccion" value={form.direccion} onChange={(e) => setForm((s) => ({ ...s, direccion: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Caja de compensacion" value={form.cajaCompensacion} onChange={(e) => setForm((s) => ({ ...s, cajaCompensacion: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Mutualidad" value={form.mutualidad} onChange={(e) => setForm((s) => ({ ...s, mutualidad: e.target.value }))} />
        <input type="number" step="0.01" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="% mutualidad" value={form.porcentajeCotizacionMutual} onChange={(e) => setForm((s) => ({ ...s, porcentajeCotizacionMutual: Number(e.target.value) }))} />
        <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.fechaInicio} onChange={(e) => setForm((s) => ({ ...s, fechaInicio: e.target.value }))} />
        <input type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.fechaGoLive} onChange={(e) => setForm((s) => ({ ...s, fechaGoLive: e.target.value }))} />
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-300">
          <Plus className="h-4 w-4" />
          Crear
        </button>
      </form>

      <div className="mt-5 divide-y divide-white/8">
        {proyectos.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="font-medium text-white">{p.nombre}</p>
              <p className="text-sm text-slate-500">{p.sistemaOrigen} · {p.fechaGoLive}</p>
            </div>
            <button className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-500/10" onClick={() => eliminarProyecto(p.id)} aria-label={`Eliminar ${p.nombre}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CategoriaProyecto } from '../../types';
import { GlassCard } from '../ui/GlassCard';

const categorias: CategoriaProyecto[] = ['Demo', 'Solución completa', 'Corrección', 'QA / Auditoría', 'Handoff', 'Otro'];

export function MantenedorProyectos() {
  const { proyectos, ejecutivos, crearProyecto, eliminarProyecto } = useAppStore();
  const [form, setForm] = useState({
    nombre: '',
    cliente: '',
    contactoPrincipal: '',
    repositorio: '',
    urlProyecto: '',
    stackTecnico: '',
    categoria: 'Solución completa' as CategoriaProyecto,
    ejecutivoId: ejecutivos.find((e) => e.perfil === 'artbpo_ejecutivo')?.id ?? ejecutivos[0]?.id ?? '',
    supervisorId: ejecutivos.find((e) => e.perfil === 'artbpo_admin')?.id ?? ejecutivos[0]?.id ?? '',
    fechaInicio: '2026-07-09',
    fechaGoLive: '2026-09-04',
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
      cliente: '',
      contactoPrincipal: '',
      repositorio: '',
      urlProyecto: '',
      stackTecnico: '',
      observaciones: '',
    }));
  };

  return (
    <GlassCard className="p-5">
      <h2 className="mb-4 text-xl font-semibold text-white">Mantenedor de proyectos</h2>
      <form className="grid gap-3 lg:grid-cols-4" onSubmit={submit}>
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white lg:col-span-2" placeholder="Nombre del proyecto" value={form.nombre} onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Cliente" value={form.cliente} onChange={(e) => setForm((s) => ({ ...s, cliente: e.target.value }))} />
        <select className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" value={form.categoria} onChange={(e) => setForm((s) => ({ ...s, categoria: e.target.value as CategoriaProyecto }))}>
          {categorias.map((categoria) => (
            <option key={categoria}>{categoria}</option>
          ))}
        </select>
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Contacto principal" value={form.contactoPrincipal} onChange={(e) => setForm((s) => ({ ...s, contactoPrincipal: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Repositorio" value={form.repositorio} onChange={(e) => setForm((s) => ({ ...s, repositorio: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="URL del proyecto" value={form.urlProyecto} onChange={(e) => setForm((s) => ({ ...s, urlProyecto: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white" placeholder="Stack técnico" value={form.stackTecnico} onChange={(e) => setForm((s) => ({ ...s, stackTecnico: e.target.value }))} />
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
              <p className="text-sm text-slate-500">{p.categoria} · {p.fechaGoLive}</p>
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

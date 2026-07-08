import { ExternalLink, FileText, KeyRound, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { usePermisos } from '../../hooks/usePermisos';
import { useAppStore } from '../../store/useAppStore';
import { AccesoCompania, DocumentoExpediente, PortalAcceso, TipoDocumentoExpediente } from '../../types';
import { GlassCard } from '../ui/GlassCard';

type Props = {
  proyectoId: string;
};

type AccesoForm = Omit<AccesoCompania, 'id' | 'actualizadoPor' | 'actualizadoEn'> & { id?: string };

const tiposDocumento: TipoDocumentoExpediente[] = ['Contrato', 'Mandato', 'Certificado', 'Acta', 'Carga inicial', 'Legal', 'Otro'];
const portales: PortalAcceso[] = ['Previred', 'MiDT', 'Caja compensacion', 'AFC', 'Mutual', 'Portal licencias', 'Otro'];

const formatoFecha = (fecha: string) =>
  new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(fecha));

export function ProyectoExpediente({ proyectoId }: Props) {
  const {
    expedientes,
    agregarDocumentoExpediente,
    eliminarDocumentoExpediente,
    guardarAccesoExpediente,
    eliminarAccesoExpediente,
  } = useAppStore();
  const { puedeAdministrar } = usePermisos();
  const expediente = expedientes[proyectoId] ?? { documentos: [], accesos: [] };
  const [documentoForm, setDocumentoForm] = useState({
    nombre: '',
    tipo: 'Contrato' as TipoDocumentoExpediente,
    url: '',
    descripcion: '',
  });
  const [accesoForm, setAccesoForm] = useState<AccesoForm>({
    portal: 'Previred',
    url: '',
    usuario: '',
    referenciaClave: '',
    responsable: '',
    notas: '',
  });

  const documentosOrdenados = useMemo(
    () => [...expediente.documentos].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)),
    [expediente.documentos],
  );

  const accesosOrdenados = useMemo(
    () => [...expediente.accesos].sort((a, b) => a.portal.localeCompare(b.portal)),
    [expediente.accesos],
  );

  const submitDocumento = (event: FormEvent) => {
    event.preventDefault();
    if (!documentoForm.nombre.trim() || !documentoForm.url.trim()) return;
    agregarDocumentoExpediente(proyectoId, {
      nombre: documentoForm.nombre.trim(),
      tipo: documentoForm.tipo,
      url: documentoForm.url.trim(),
      descripcion: documentoForm.descripcion.trim(),
    });
    setDocumentoForm((current) => ({ ...current, nombre: '', url: '', descripcion: '' }));
  };

  const submitAcceso = (event: FormEvent) => {
    event.preventDefault();
    if (!accesoForm.portal || !accesoForm.usuario.trim()) return;
    guardarAccesoExpediente(proyectoId, {
      ...accesoForm,
      url: accesoForm.url.trim(),
      usuario: accesoForm.usuario.trim(),
      referenciaClave: accesoForm.referenciaClave.trim(),
      responsable: accesoForm.responsable.trim(),
      notas: accesoForm.notas?.trim(),
    });
    setAccesoForm({
      portal: 'Previred',
      url: '',
      usuario: '',
      referenciaClave: '',
      responsable: '',
      notas: '',
    });
  };

  const editarAcceso = (acceso: AccesoCompania) => {
    setAccesoForm({
      id: acceso.id,
      portal: acceso.portal,
      url: acceso.url,
      usuario: acceso.usuario,
      referenciaClave: acceso.referenciaClave,
      responsable: acceso.responsable,
      notas: acceso.notas ?? '',
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Expediente digital</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Documentos importantes</h2>
          <p className="mt-2 text-sm text-slate-400">
            Guarda enlaces a documentos de Drive, contratos, mandatos, certificados y archivos clave del proyecto.
          </p>
        </div>

        {puedeAdministrar ? (
          <GlassCard className="p-4">
            <form className="grid gap-3 md:grid-cols-6" onSubmit={submitDocumento}>
              <input
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white md:col-span-2"
                placeholder="Nombre del documento"
                value={documentoForm.nombre}
                onChange={(event) => setDocumentoForm((current) => ({ ...current, nombre: event.target.value }))}
              />
              <select
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                value={documentoForm.tipo}
                onChange={(event) => setDocumentoForm((current) => ({ ...current, tipo: event.target.value as TipoDocumentoExpediente }))}
              >
                {tiposDocumento.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
              <input
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white md:col-span-2"
                placeholder="URL del documento"
                type="url"
                value={documentoForm.url}
                onChange={(event) => setDocumentoForm((current) => ({ ...current, url: event.target.value }))}
              />
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
                <Plus className="h-4 w-4" />
                Agregar
              </button>
              <textarea
                className="min-h-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white md:col-span-6"
                placeholder="Descripcion breve"
                value={documentoForm.descripcion}
                onChange={(event) => setDocumentoForm((current) => ({ ...current, descripcion: event.target.value }))}
              />
            </form>
          </GlassCard>
        ) : null}

        <div className="grid gap-3">
          {documentosOrdenados.length ? (
            documentosOrdenados.map((documento) => (
              <DocumentoCard
                key={documento.id}
                documento={documento}
                puedeAdministrar={puedeAdministrar}
                onDelete={() => eliminarDocumentoExpediente(proyectoId, documento.id)}
              />
            ))
          ) : (
            <GlassCard className="p-5 text-sm text-slate-400">Aun no hay documentos registrados en el expediente.</GlassCard>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Accesos operacionales</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Portales y claves</h2>
          <p className="mt-2 text-sm text-slate-400">
            Registra portal, usuario y referencia segura de la clave. No guardes contrasenas en texto plano.
          </p>
        </div>

        {puedeAdministrar ? (
          <>
            <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
              <div className="flex gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Por seguridad, usa el campo referencia para indicar donde esta la clave: 1Password, Bitwarden, Keeper, caja fuerte interna o ticket autorizado.</p>
              </div>
            </div>
            <GlassCard className="p-4">
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitAcceso}>
                <select
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  value={accesoForm.portal}
                  onChange={(event) => setAccesoForm((current) => ({ ...current, portal: event.target.value as PortalAcceso }))}
                >
                  {portales.map((portal) => (
                    <option key={portal} value={portal}>{portal}</option>
                  ))}
                </select>
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="URL portal"
                  value={accesoForm.url}
                  onChange={(event) => setAccesoForm((current) => ({ ...current, url: event.target.value }))}
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="Usuario"
                  value={accesoForm.usuario}
                  onChange={(event) => setAccesoForm((current) => ({ ...current, usuario: event.target.value }))}
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="Referencia segura de clave"
                  value={accesoForm.referenciaClave}
                  onChange={(event) => setAccesoForm((current) => ({ ...current, referenciaClave: event.target.value }))}
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  placeholder="Responsable del acceso"
                  value={accesoForm.responsable}
                  onChange={(event) => setAccesoForm((current) => ({ ...current, responsable: event.target.value }))}
                />
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
                  <KeyRound className="h-4 w-4" />
                  {accesoForm.id ? 'Actualizar acceso' : 'Guardar acceso'}
                </button>
                <textarea
                  className="min-h-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white sm:col-span-2"
                  placeholder="Notas de uso, permisos, restricciones o proceso de solicitud"
                  value={accesoForm.notas}
                  onChange={(event) => setAccesoForm((current) => ({ ...current, notas: event.target.value }))}
                />
              </form>
            </GlassCard>
          </>
        ) : (
          <GlassCard className="p-5 text-sm text-slate-400">
            Los accesos operacionales solo estan disponibles para administradores.
          </GlassCard>
        )}

        {puedeAdministrar ? (
          <div className="grid gap-3">
            {accesosOrdenados.length ? (
              accesosOrdenados.map((acceso) => (
                <AccesoCard
                  key={acceso.id}
                  acceso={acceso}
                  onEdit={() => editarAcceso(acceso)}
                  onDelete={() => eliminarAccesoExpediente(proyectoId, acceso.id)}
                />
              ))
            ) : (
              <GlassCard className="p-5 text-sm text-slate-400">Aun no hay accesos registrados.</GlassCard>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function DocumentoCard({
  documento,
  puedeAdministrar,
  onDelete,
}: {
  documento: DocumentoExpediente;
  puedeAdministrar: boolean;
  onDelete: () => void;
}) {
  return (
    <GlassCard className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-xs text-slate-300">
              <FileText className="h-3.5 w-3.5" />
              {documento.tipo}
            </span>
            <span className="text-xs text-slate-500">{formatoFecha(documento.creadoEn)} · {documento.creadoPor}</span>
          </div>
          <h3 className="font-semibold text-white">{documento.nombre}</h3>
          {documento.descripcion ? <p className="mt-1 text-sm text-slate-400">{documento.descripcion}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <a className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/8" href={documento.url} target="_blank" rel="noreferrer">
            Abrir
            <ExternalLink className="h-4 w-4" />
          </a>
          {puedeAdministrar ? (
            <button className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-500/10" onClick={onDelete} aria-label={`Eliminar ${documento.nombre}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}

function AccesoCard({
  acceso,
  onEdit,
  onDelete,
}: {
  acceso: AccesoCompania;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <GlassCard className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-100">
              <KeyRound className="h-3.5 w-3.5" />
              {acceso.portal}
            </span>
            <span className="text-xs text-slate-500">Actualizado {formatoFecha(acceso.actualizadoEn)}</span>
          </div>
          <p className="text-sm text-slate-400">Usuario</p>
          <h3 className="font-semibold text-white">{acceso.usuario}</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-400">
            <p><span className="text-slate-500">Clave:</span> {acceso.referenciaClave || 'Referencia no registrada'}</p>
            <p><span className="text-slate-500">Responsable:</span> {acceso.responsable || 'Sin responsable'}</p>
            {acceso.notas ? <p><span className="text-slate-500">Notas:</span> {acceso.notas}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {acceso.url ? (
            <a className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/8" href={acceso.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${acceso.portal}`}>
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
          <button className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/8" onClick={onEdit}>
            Editar
          </button>
          <button className="rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-500/10" onClick={onDelete} aria-label={`Eliminar ${acceso.portal}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

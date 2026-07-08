import { Alerta, Ejecutivo, ExpedienteProyecto, Fase, Proyecto, Tarea, UsuarioActivo } from '../types';
import { normalizarResponsable } from './assignee';

type Persona = Pick<UsuarioActivo, 'nombre' | 'iniciales'> | Pick<Ejecutivo, 'nombre' | 'iniciales'>;

const trimOrFallback = (value: string | undefined, fallback: string) => {
  const clean = (value ?? '').trim();
  return clean || fallback;
};

const normalizeIsoDate = (value?: string) => {
  const clean = String(value ?? '').trim();
  if (!clean) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const pickCanonicalName = (current: string | undefined, candidate: string) => {
  if (!current) return candidate;
  const currentHasAccents = current.normalize('NFD') !== current;
  const candidateHasAccents = candidate.normalize('NFD') !== candidate;
  if (!currentHasAccents && candidateHasAccents) return candidate;
  return current;
};

const buildCanonicalPeople = (personas: Persona[]) => {
  const exact = new Map<string, string>();
  const prefixes = new Map<string, string | null>();

  personas.forEach((persona) => {
    const nombre = trimOrFallback(persona.nombre, 'Sin asignar');
    const nombreKey = normalizarResponsable(nombre);
    if (nombreKey) exact.set(nombreKey, pickCanonicalName(exact.get(nombreKey), nombre));

    const inicialesKey = normalizarResponsable(persona.iniciales);
    if (inicialesKey) exact.set(inicialesKey, pickCanonicalName(exact.get(inicialesKey), nombre));

    const primerNombre = nombreKey.split(' ')[0] ?? '';
    if (primerNombre.length >= 3) {
      exact.set(primerNombre, pickCanonicalName(exact.get(primerNombre), nombre));
    }

    for (let length = 4; length <= primerNombre.length; length += 1) {
      const prefix = primerNombre.slice(0, length);
      const existing = prefixes.get(prefix);
      if (existing === undefined) prefixes.set(prefix, nombre);
      else if (existing !== nombre) prefixes.set(prefix, null);
    }
  });

  prefixes.forEach((value, key) => {
    if (value) exact.set(key, pickCanonicalName(exact.get(key), value));
  });

  return exact;
};

export const canonicalizarResponsable = (value: string | undefined, personas: Persona[]) => {
  const clean = trimOrFallback(value, 'Sin asignar');
  const key = normalizarResponsable(clean);
  if (!key) return clean;

  const canonicalPeople = buildCanonicalPeople(personas);
  return canonicalPeople.get(key) ?? clean;
};

export const sanitizarUsuario = (usuario: UsuarioActivo): UsuarioActivo => ({
  ...usuario,
  nombre: trimOrFallback(usuario.nombre, 'Sin nombre'),
  iniciales: trimOrFallback(usuario.iniciales, 'SN'),
  rol: trimOrFallback(usuario.rol, 'Sin rol'),
  email: usuario.email?.trim() ?? '',
  proyectoIds: usuario.proyectoIds?.filter(Boolean) ?? undefined,
});

export const sanitizarEjecutivo = (ejecutivo: Ejecutivo): Ejecutivo => ({
  ...ejecutivo,
  nombre: trimOrFallback(ejecutivo.nombre, 'Sin nombre'),
  iniciales: trimOrFallback(ejecutivo.iniciales, 'SN'),
  rol: trimOrFallback(ejecutivo.rol, 'Sin rol'),
});

export const sanitizarProyecto = (proyecto: Proyecto): Proyecto => ({
  ...proyecto,
  nombre: trimOrFallback(proyecto.nombre, 'Proyecto sin nombre'),
  razonSocial: trimOrFallback(proyecto.razonSocial, proyecto.nombre),
  representanteLegal: trimOrFallback(proyecto.representanteLegal, 'No informado'),
  direccion: trimOrFallback(proyecto.direccion, 'No informada'),
  cajaCompensacion: trimOrFallback(proyecto.cajaCompensacion, 'No informada'),
  mutualidad: trimOrFallback(proyecto.mutualidad, 'No informada'),
  observaciones: proyecto.observaciones?.trim() ?? '',
});

export const sanitizarFase = (fase: Fase, index?: number): Fase => {
  const inicio = normalizeIsoDate(fase.fechaInicioPlan) ?? new Date().toISOString().slice(0, 10);
  const finRaw = normalizeIsoDate(fase.fechaFinPlan) ?? inicio;
  const fin = finRaw < inicio ? inicio : finRaw;

  return {
    ...fase,
    codigo: trimOrFallback(fase.codigo, `F${(index ?? fase.orden) + 1}`),
    nombre: trimOrFallback(fase.nombre, 'Sin fase'),
    orden: index ?? fase.orden,
    fechaInicioPlan: inicio,
    fechaFinPlan: fin,
  };
};

export const sanitizarTarea = (tarea: Tarea, personas: Persona[]): Tarea => {
  const inicio = normalizeIsoDate(tarea.fechaInicioPlan) ?? new Date().toISOString().slice(0, 10);
  const finRaw = normalizeIsoDate(tarea.fechaFinPlan) ?? inicio;
  const fin = finRaw < inicio ? inicio : finRaw;
  const reasignacionPendiente = tarea.reasignacionPendiente
    ? {
        ...tarea.reasignacionPendiente,
        solicitante: canonicalizarResponsable(tarea.reasignacionPendiente.solicitante, personas),
        destinatario: canonicalizarResponsable(tarea.reasignacionPendiente.destinatario, personas),
        motivo: tarea.reasignacionPendiente.motivo?.trim() ?? '',
        respuesta: tarea.reasignacionPendiente.respuesta?.trim() ?? '',
      }
    : null;

  return {
    ...tarea,
    nombre: trimOrFallback(tarea.nombre, 'Tarea sin nombre'),
    descripcion: tarea.descripcion?.trim() ?? '',
    responsable: canonicalizarResponsable(tarea.responsable, personas),
    fechaInicioPlan: inicio,
    fechaFinPlan: fin,
    duracionDias: Math.max(0, tarea.duracionDias ?? 0),
    observacion: tarea.observacion?.trim() ?? '',
    reasignacionPendiente,
    comentarios: tarea.comentarios?.map((comentario) => ({
      ...comentario,
      texto: comentario.texto?.trim() ?? '',
      usuario: canonicalizarResponsable(comentario.usuario, personas),
    })),
    historial: tarea.historial?.map((item) => ({
      ...item,
      usuario: canonicalizarResponsable(item.usuario, personas),
      valorAnterior: item.valorAnterior ?? '',
      valorNuevo: item.valorNuevo ?? '',
    })),
  };
};

export const sanitizarAlertas = (alertas: Alerta[], tareas: Tarea[], proyectos: Proyecto[], personas: Persona[]) => {
  const taskIds = new Set(tareas.map((tarea) => tarea.id));
  const projectIds = new Set(proyectos.map((proyecto) => proyecto.id));

  return alertas
    .filter((alerta) => taskIds.has(alerta.tareaId) && projectIds.has(alerta.proyectoId))
    .map((alerta) => ({
      ...alerta,
      mensaje: trimOrFallback(alerta.mensaje, 'Alerta sin detalle'),
      destinatario: alerta.destinatario ? canonicalizarResponsable(alerta.destinatario, personas) : undefined,
    }));
};

export const sanitizarExpedientes = (expedientes: Record<string, ExpedienteProyecto>) =>
  Object.fromEntries(
    Object.entries(expedientes).map(([proyectoId, expediente]) => [
      proyectoId,
      {
        documentos: expediente.documentos ?? [],
        accesos: expediente.accesos ?? [],
      },
    ]),
  );

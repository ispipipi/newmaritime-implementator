import { Ejecutivo, Proyecto } from '../types';
import { GANTT_FRUTICOLA_FASES, GANTT_FRUTICOLA_SOURCE, GANTT_FRUTICOLA_TAREAS } from './ganttFruticola';

export const EJECUTIVOS_SEED: Ejecutivo[] = [
  {
    id: 'paulina-id',
    nombre: 'Paulina Vigueras',
    iniciales: 'PV',
    rol: 'Cerebro Operacional',
    perfil: 'artbpo_admin',
    color: '#8b5cf6',
  },
  {
    id: 'julio-id',
    nombre: 'Julio Espinoza',
    iniciales: 'JE',
    rol: 'Administrador',
    perfil: 'artbpo_admin',
    color: '#3b82f6',
  },
  {
    id: 'julissa-id',
    nombre: 'Julissa Espinoza',
    iniciales: 'JsE',
    rol: 'Analista Implementación',
    perfil: 'artbpo_ejecutivo',
    color: '#ec4899',
  },
  {
    id: 'salvador-id',
    nombre: 'Salvador Vásquez',
    iniciales: 'SV',
    rol: 'Analista Implementación',
    perfil: 'artbpo_ejecutivo',
    color: '#f97316',
  },
];

export const PROYECTO_AGRICHILE: Proyecto = {
  id: 'agrichile-id',
  nombre: 'Frutícola Agrichile S.A.',
  rut: '96.618.010-2',
  razonSocial: 'Frutícola Agrichile S.A.',
  representanteLegal: 'Representante Legal Agrichile',
  direccion: "Camino Agricola s/n, Region de O'Higgins",
  cajaCompensacion: 'Los Andes',
  mutualidad: 'ACHS',
  porcentajeCotizacionMutual: 0.93,
  sistemaOrigen: 'Visma',
  ejecutivoId: 'julissa-id',
  supervisorId: 'paulina-id',
  fechaInicio: GANTT_FRUTICOLA_SOURCE.fechaInicio,
  fechaGoLive: GANTT_FRUTICOLA_SOURCE.fechaFin,
  estado: 'activo',
  observaciones: `Cliente migración desde Visma. Planificacion cargada desde ${GANTT_FRUTICOLA_SOURCE.archivo}.`,
  creadoEn: '2026-05-04T09:00:00Z',
};

export const SEED_DATA = {
  ejecutivos: EJECUTIVOS_SEED,
  proyectos: [PROYECTO_AGRICHILE],
  fases: GANTT_FRUTICOLA_FASES,
  tareas: GANTT_FRUTICOLA_TAREAS,
};

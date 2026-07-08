import { Ejecutivo } from '../types';
import { NEWMARITIME_FASES, NEWMARITIME_TAREAS, PROYECTO_NEWMARITIME } from './newMaritimeData';

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
    id: 'milenko-id',
    nombre: 'Milenko',
    iniciales: 'ML',
    rol: 'Co-fundador / Desarrollo',
    perfil: 'artbpo_admin',
    color: '#14b8a6',
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

export const SEED_DATA = {
  ejecutivos: EJECUTIVOS_SEED,
  proyectos: [PROYECTO_NEWMARITIME],
  fases: NEWMARITIME_FASES,
  tareas: NEWMARITIME_TAREAS,
};

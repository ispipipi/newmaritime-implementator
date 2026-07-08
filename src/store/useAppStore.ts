import { addDays, differenceInCalendarDays, differenceInDays, format, parseISO } from 'date-fns';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PLANTILLA_FASES } from '../data/plantillaFases';
import { SEED_DATA } from '../data/seedData';
import { PERFILES_ACCESO_SEED, PERFILES_SEED } from '../data/perfiles';
import { GOOGLE_SHEETS_GANTT_URL } from '../data/googleSheetsSource';
import { Alerta, AppState, ExpedienteProyecto, Fase, Tarea } from '../types';
import { saveWorkspaceState } from '../services/remoteState';
import {
  calcCumplimientoGanttFase,
  calcCumplimientoGanttProyecto,
  calcPctFase,
  calcPctPlanificadoFase,
  calcPctPlanificadoProyecto,
  calcPctProyecto,
  semaforoCumplimientoFase,
  semaforoCumplimientoProyecto,
  semaforoProyecto,
} from '../utils/progressCalc';
import { normalizarResponsable } from '../utils/assignee';
import {
  canonicalizarResponsable,
  sanitizarAlertas,
  sanitizarEjecutivo,
  sanitizarExpedientes,
  sanitizarFase,
  sanitizarProyecto,
  sanitizarTarea,
  sanitizarUsuario,
} from '../utils/dataIntegrity';

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

const guardarRemoto = (state: AppState, motivo: string) => {
  void saveWorkspaceState(state, motivo).catch((error) => {
    console.warn('No se pudo guardar el estado remoto', error);
  });
};

const expedienteVacio = (): ExpedienteProyecto => ({ documentos: [], accesos: [] });
const obtenerPersonasActivas = (state: Pick<AppState, 'perfiles' | 'ejecutivos'>) => [
  ...state.perfiles.filter((perfil) => perfil.activo !== false),
  ...state.ejecutivos,
];

const sanitizarSlicesCompartidos = (
  estado: Partial<
    Pick<AppState, 'perfiles' | 'perfilesAcceso' | 'ejecutivos' | 'proyectos' | 'fases' | 'tareas' | 'alertas' | 'expedientes' | 'diasAnticipacionAlerta' | 'fuenteGoogleSheetsUrl'>
  >,
  fallback: Pick<AppState, 'perfiles' | 'perfilesAcceso' | 'ejecutivos' | 'proyectos' | 'fases' | 'tareas' | 'alertas' | 'expedientes' | 'diasAnticipacionAlerta' | 'fuenteGoogleSheetsUrl'>,
) => {
  const perfiles = asegurarPerfilesBase((estado.perfiles ?? fallback.perfiles).map(sanitizarUsuario));
  const perfilesAcceso = asegurarPerfilesAccesoBase(estado.perfilesAcceso ?? fallback.perfilesAcceso);
  const ejecutivos = (estado.ejecutivos ?? fallback.ejecutivos).map(sanitizarEjecutivo);
  const proyectos = (estado.proyectos ?? fallback.proyectos).map(sanitizarProyecto);
  const fases = (estado.fases ?? fallback.fases).map((fase, index) => sanitizarFase(fase, index));
  const personas = [...perfiles.filter((perfil) => perfil.activo !== false), ...ejecutivos];
  const tareas = (estado.tareas ?? fallback.tareas).map((tarea) => sanitizarTarea(tarea, personas));
  const alertas = sanitizarAlertas(estado.alertas ?? fallback.alertas, tareas, proyectos, personas);
  const expedientes = sanitizarExpedientes(estado.expedientes ?? fallback.expedientes);

  return {
    perfiles,
    perfilesAcceso,
    ejecutivos,
    proyectos,
    fases,
    tareas,
    alertas,
    expedientes,
    diasAnticipacionAlerta: estado.diasAnticipacionAlerta ?? fallback.diasAnticipacionAlerta,
    fuenteGoogleSheetsUrl: estado.fuenteGoogleSheetsUrl ?? fallback.fuenteGoogleSheetsUrl,
  };
};

const asegurarPerfilesBase = (perfiles: AppState['perfiles']) => {
  if (perfiles.length) return perfiles;
  const ids = new Set(perfiles.map((perfil) => perfil.id));
  const emails = new Set(perfiles.map((perfil) => perfil.email?.toLowerCase()).filter(Boolean));
  const faltantes = PERFILES_SEED.filter((perfil) => !ids.has(perfil.id) && (!perfil.email || !emails.has(perfil.email.toLowerCase())));
  return faltantes.length ? [...perfiles, ...faltantes] : perfiles;
};

const asegurarPerfilesAccesoBase = (perfilesAcceso: AppState['perfilesAcceso']) => {
  const ids = new Set(perfilesAcceso.map((perfil) => perfil.id));
  const faltantes = PERFILES_ACCESO_SEED.filter((perfil) => !ids.has(perfil.id));
  return faltantes.length ? [...perfilesAcceso, ...faltantes] : perfilesAcceso;
};

const generarPlanProyecto = (proyectoId: string, fechaInicio: string, responsable: string) => {
  const fases: Fase[] = [];
  const tareas: Tarea[] = [];
  let fechaCursor = parseISO(fechaInicio);

  PLANTILLA_FASES.forEach((plantillaFase, fi) => {
    const faseId = makeId('fase');
    const faseInicio = fechaCursor;

    plantillaFase.tareas.forEach((t, ti) => {
      const duracion = t.duracionDias || 1;
      const inicio = format(addDays(faseInicio, ti * duracion), 'yyyy-MM-dd');
      const fin = format(addDays(faseInicio, ti * duracion + (t.duracionDias || 0)), 'yyyy-MM-dd');
      tareas.push({
        id: makeId('tarea'),
        faseId,
        proyectoId,
        nombre: t.nombre,
        descripcion: '',
        responsable,
        estado: 'pendiente',
        fechaInicioPlan: inicio,
        fechaFinPlan: fin,
        duracionDias: duracion,
        esMilestone: t.esMilestone || false,
        observacion: '',
        actualizadoEn: new Date().toISOString(),
        historial: [],
      });
    });

    const faseDuracion = plantillaFase.tareas.reduce((acc, t) => acc + (t.duracionDias || 1), 0);
    const faseFinDate = addDays(faseInicio, faseDuracion);
    fases.push({
      id: faseId,
      proyectoId,
      codigo: plantillaFase.codigo,
      nombre: plantillaFase.nombre,
      orden: fi,
      fechaInicioPlan: format(faseInicio, 'yyyy-MM-dd'),
      fechaFinPlan: format(faseFinDate, 'yyyy-MM-dd'),
    });
    fechaCursor = addDays(faseFinDate, 1);
  });

  return { fases, tareas };
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      usuarioActivo: null,
      perfiles: PERFILES_SEED,
      perfilesAcceso: PERFILES_ACCESO_SEED,
      ejecutivos: SEED_DATA.ejecutivos,
      proyectos: SEED_DATA.proyectos,
      fases: SEED_DATA.fases,
      tareas: SEED_DATA.tareas,
      alertas: [],
      expedientes: {},
      vista: 'dashboard',
      proyectoActivoId: null,
      faseActivaId: null,
      tareaActivaId: null,
      busquedaTareas: '',
      filtroTareasVista: 'todas',
      ordenTareasVista: 'criticas',
      diasAnticipacionAlerta: 3,
      tema: 'noche',
      fuenteGoogleSheetsUrl: GOOGLE_SHEETS_GANTT_URL,
      sincronizadoRemotoEn: undefined,

      setUsuarioActivo: (u) => set({ usuarioActivo: u }),

      setVista: (vista, proyectoId, faseId) =>
        set({ vista, proyectoActivoId: proyectoId ?? null, faseActivaId: faseId ?? null }),

      setTareaActiva: (tareaId) => set({ tareaActivaId: tareaId }),

      setBusquedaTareas: (value) => set({ busquedaTareas: value }),

      setFiltroTareasVista: (value) => set({ filtroTareasVista: value }),

      setOrdenTareasVista: (value) => set({ ordenTareasVista: value }),

      setTema: (tema) => set({ tema }),

      alternarTema: () => set((s) => ({ tema: s.tema === 'noche' ? 'dia' : 'noche' })),

      setFuenteGoogleSheetsUrl: (url) => {
        set({ fuenteGoogleSheetsUrl: url });
        guardarRemoto(get(), 'fuente_google_sheets');
      },

      aplicarEstadoCompartido: (estado) =>
        set({
          ...sanitizarSlicesCompartidos(estado, {
            perfiles: get().perfiles,
            perfilesAcceso: get().perfilesAcceso,
            ejecutivos: get().ejecutivos,
            proyectos: get().proyectos,
            fases: get().fases,
            tareas: get().tareas,
            alertas: get().alertas,
            expedientes: get().expedientes,
            diasAnticipacionAlerta: get().diasAnticipacionAlerta,
            fuenteGoogleSheetsUrl: get().fuenteGoogleSheetsUrl,
          }),
          sincronizadoRemotoEn: new Date().toISOString(),
        }),

      crearPerfil: (perfil) => {
        set((s) => ({ perfiles: [...s.perfiles, { ...perfil, id: makeId('perfil') }] }));
        guardarRemoto(get(), 'crear_perfil');
      },

      actualizarPerfil: (id, cambios) => {
        set((s) => ({
          perfiles: s.perfiles.map((perfil) => (perfil.id === id ? { ...perfil, ...cambios } : perfil)),
          usuarioActivo: s.usuarioActivo?.id === id ? { ...s.usuarioActivo, ...cambios } : s.usuarioActivo,
        }));
        guardarRemoto(get(), 'actualizar_perfil');
      },

      eliminarPerfil: (id) => {
        set((s) => ({
          perfiles: s.perfiles.filter((perfil) => perfil.id !== id),
          usuarioActivo: s.usuarioActivo?.id === id ? null : s.usuarioActivo,
        }));
        guardarRemoto(get(), 'eliminar_perfil');
      },

      crearUsuario: (usuario) => {
        get().crearPerfil(usuario);
      },

      actualizarUsuario: (id, cambios) => {
        get().actualizarPerfil(id, cambios);
      },

      eliminarUsuario: (id) => {
        get().eliminarPerfil(id);
      },

      crearPerfilAcceso: (perfil) => {
        const nombre = perfil.nombre.trim();
        if (!nombre) return;
        const id = perfil.id?.trim() || `perfil-${nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || makeId('perfil-acceso')}`;
        set((s) => ({
          perfilesAcceso: [
            ...s.perfilesAcceso,
            {
              ...perfil,
              id,
              nombre,
            },
          ],
        }));
        guardarRemoto(get(), 'crear_perfil_acceso');
      },

      actualizarPerfilAcceso: (id, cambios) => {
        set((s) => ({
          perfilesAcceso: s.perfilesAcceso.map((perfil) => (perfil.id === id ? { ...perfil, ...cambios } : perfil)),
        }));
        guardarRemoto(get(), 'actualizar_perfil_acceso');
      },

      eliminarPerfilAcceso: (id) => {
        set((s) => ({
          perfilesAcceso: s.perfilesAcceso.filter((perfil) => perfil.id !== id || perfil.protegido),
        }));
        guardarRemoto(get(), 'eliminar_perfil_acceso');
      },

      reemplazarPlanificacionProyecto: (proyectoId, fasesImportadas, tareasImportadas, usuario, fechas) => {
        const ahora = new Date().toISOString();
        const personas = [...get().perfiles.filter((perfil) => perfil.activo !== false), ...get().ejecutivos];
        const fasesConAuditoria = fasesImportadas.map((fase) => ({ ...fase, proyectoId }));
        const tareasConAuditoria = tareasImportadas.map((tarea) => ({
          ...sanitizarTarea(
            {
              ...tarea,
              responsable: canonicalizarResponsable(tarea.responsable, personas),
            },
            personas,
          ),
          proyectoId,
          actualizadoEn: ahora,
          historial: [
            ...(tarea.historial || []),
            {
              fecha: ahora,
              campo: 'sincronizacion',
              valorAnterior: '',
              valorNuevo: 'Google Sheets',
              usuario,
            },
          ].slice(-10),
        }));

        set((s) => ({
          proyectos: s.proyectos.map((p) =>
            p.id === proyectoId
              ? {
                  ...p,
                  fechaInicio: fechas?.fechaInicio ?? p.fechaInicio,
                  fechaGoLive: fechas?.fechaFin ?? p.fechaGoLive,
                  observaciones: `${p.observaciones}\nPlanificacion sincronizada desde Google Sheets el ${new Date().toLocaleString('es-CL')}.`,
                }
              : p,
          ),
          fases: [...s.fases.filter((fase) => fase.proyectoId !== proyectoId), ...fasesConAuditoria],
          tareas: [...s.tareas.filter((tarea) => tarea.proyectoId !== proyectoId), ...tareasConAuditoria],
          alertas: s.alertas.filter((alerta) => alerta.proyectoId !== proyectoId),
        }));
        get().recalcularAlertas();
        guardarRemoto(get(), 'sincronizar_planificacion');
      },

      desplazarCronogramaProyecto: (proyectoId, nuevaFechaInicio, usuario) => {
        const { proyectos, fases, tareas, perfiles, ejecutivos } = get();
        const proyecto = proyectos.find((item) => item.id === proyectoId);
        if (!proyecto || !nuevaFechaInicio) return;

        const diasDesfase = differenceInCalendarDays(parseISO(nuevaFechaInicio), parseISO(proyecto.fechaInicio));
        if (!Number.isFinite(diasDesfase) || diasDesfase === 0) return;

        const personas = obtenerPersonasActivas({ perfiles, ejecutivos });
        const timestamp = new Date().toISOString();
        const moverFecha = (fecha: string) => format(addDays(parseISO(fecha), diasDesfase), 'yyyy-MM-dd');

        set((state) => ({
          proyectos: state.proyectos.map((item) =>
            item.id === proyectoId
              ? {
                  ...item,
                  fechaInicio: moverFecha(item.fechaInicio),
                  fechaGoLive: moverFecha(item.fechaGoLive),
                  observaciones: `${item.observaciones}${item.observaciones ? '\n' : ''}Cronograma desplazado ${diasDesfase > 0 ? `+${diasDesfase}` : diasDesfase} día(s) el ${new Date().toLocaleString('es-CL')}.`,
                }
              : item,
          ),
          fases: state.fases.map((fase) =>
            fase.proyectoId === proyectoId
              ? {
                  ...fase,
                  fechaInicioPlan: moverFecha(fase.fechaInicioPlan),
                  fechaFinPlan: moverFecha(fase.fechaFinPlan),
                }
              : fase,
          ),
          tareas: state.tareas.map((tarea) =>
            tarea.proyectoId === proyectoId
              ? sanitizarTarea(
                  {
                    ...tarea,
                    fechaInicioPlan: moverFecha(tarea.fechaInicioPlan),
                    fechaFinPlan: moverFecha(tarea.fechaFinPlan),
                    actualizadoEn: timestamp,
                    historial: [
                      ...(tarea.historial ?? []),
                      {
                        fecha: timestamp,
                        campo: 'desplazamiento_cronograma',
                        valorAnterior: proyecto.fechaInicio,
                        valorNuevo: nuevaFechaInicio,
                        usuario,
                      },
                    ].slice(-10),
                  },
                  personas,
                )
              : tarea,
          ),
        }));
        get().recalcularAlertas();
        guardarRemoto(get(), 'desplazar_cronograma_proyecto');
      },

      actualizarTarea: (id, cambios, usuario) => {
        const { tareas, perfiles, ejecutivos } = get();
        const tareaActual = tareas.find((t) => t.id === id);
        if (!tareaActual) return;
        const personas = obtenerPersonasActivas({ perfiles, ejecutivos });
        const timestamp = new Date().toISOString();

        const historialEntry = Object.entries(cambios).map(([campo, nuevo]) => ({
          fecha: timestamp,
          campo,
          valorAnterior: String(tareaActual[campo as keyof Tarea] ?? ''),
          valorNuevo: String(nuevo ?? ''),
          usuario,
        }));

        set({
          tareas: tareas.map((t) =>
            t.id === id
              ? sanitizarTarea(
                  {
                    ...t,
                    ...cambios,
                    actualizadoEn: timestamp,
                    historial: [...(t.historial || []), ...historialEntry].slice(-10),
                  },
                  personas,
                )
              : t,
          ),
        });
        get().recalcularAlertas();
        guardarRemoto(get(), 'actualizar_tarea');
      },

      actualizarFechasGantt: (tareaId, inicio, fin) => {
        set((s) => ({
          tareas: s.tareas.map((t) =>
            t.id === tareaId
              ? { ...t, fechaInicioPlan: inicio, fechaFinPlan: fin, actualizadoEn: new Date().toISOString() }
              : t,
          ),
        }));
        get().recalcularAlertas();
        guardarRemoto(get(), 'actualizar_fechas_gantt');
      },

      crearTarea: (t) => {
        const personas = [...get().perfiles.filter((perfil) => perfil.activo !== false), ...get().ejecutivos];
        set((s) => ({
          tareas: [
            ...s.tareas,
            sanitizarTarea(
              {
                ...t,
                responsable: canonicalizarResponsable(t.responsable, personas),
                id: makeId('tarea'),
                actualizadoEn: new Date().toISOString(),
                historial: [],
              },
              personas,
            ),
          ],
        }));
        get().recalcularAlertas();
        guardarRemoto(get(), 'crear_tarea');
      },

      reportarImpedimentoTarea: ({ tareaOrigenId, responsableDestrabe, motivo, usuario }) => {
        const { tareas, fases, perfiles, ejecutivos } = get();
        const tareaOrigen = tareas.find((tarea) => tarea.id === tareaOrigenId);
        if (!tareaOrigen) return;
        const personas = obtenerPersonasActivas({ perfiles, ejecutivos });
        const responsableCanonico = canonicalizarResponsable(responsableDestrabe, personas);

        const faseOrigen = fases.find((fase) => fase.id === tareaOrigen.faseId);
        const hoy = new Date();
        const fechaInicio = format(hoy, 'yyyy-MM-dd');
        const fechaFin = format(addDays(hoy, 1), 'yyyy-MM-dd');
        const timestamp = hoy.toISOString();
        const comentarioBloqueo = {
          id: `comentario-${crypto.randomUUID?.() ?? Date.now()}`,
          texto: `Impedimento reportado a ${responsableCanonico}: ${motivo}`,
          usuario,
          fecha: timestamp,
        };
        const nuevaTareaId = makeId('tarea');
        const nuevaTarea: Tarea = {
          id: nuevaTareaId,
          faseId: tareaOrigen.faseId,
          proyectoId: tareaOrigen.proyectoId,
          nombre: `Destrabar: ${tareaOrigen.nombre}`,
          descripcion: [
            `Tarea origen: ${tareaOrigen.nombre}`,
            faseOrigen ? `Fase: ${faseOrigen.codigo} · ${faseOrigen.nombre}` : '',
            `Motivo: ${motivo}`,
          ]
            .filter(Boolean)
            .join('\n'),
          responsable: responsableCanonico,
          estado: 'pendiente',
          fechaInicioPlan: fechaInicio,
          fechaFinPlan: fechaFin,
          duracionDias: 1,
          esMilestone: false,
          observacion: '',
          comentarios: [
            {
              id: `comentario-${crypto.randomUUID?.() ?? Date.now()}-destrabe`,
              texto: `Solicitud creada por ${usuario} para destrabar "${tareaOrigen.nombre}". Motivo: ${motivo}`,
              usuario,
              fecha: timestamp,
            },
          ],
          actualizadoEn: timestamp,
          historial: [
            {
              fecha: timestamp,
              campo: 'responsable',
              valorAnterior: '',
              valorNuevo: responsableCanonico,
              usuario,
            },
            {
              fecha: timestamp,
              campo: 'origen_impedimento',
              valorAnterior: '',
              valorNuevo: tareaOrigen.nombre,
              usuario,
            },
          ],
        };

        set((s) => ({
          tareas: s.tareas.map((tarea) =>
            tarea.id === tareaOrigenId
              ? {
                  ...tarea,
                  estado: 'bloqueada' as const,
                  actualizadoEn: timestamp,
                  comentarios: [...(tarea.comentarios ?? []), comentarioBloqueo],
                  historial: [
                    ...(tarea.historial ?? []),
                    {
                      fecha: timestamp,
                      campo: 'estado',
                      valorAnterior: tarea.estado,
                      valorNuevo: 'bloqueada',
                      usuario,
                    },
                    {
                      fecha: timestamp,
                      campo: 'impedimento',
                      valorAnterior: '',
                      valorNuevo: `${responsableCanonico}: ${motivo}`,
                      usuario,
                    },
                  ].slice(-10),
                }
              : tarea,
          ).concat(sanitizarTarea(nuevaTarea, personas)),
        }));
        get().recalcularAlertas();
        guardarRemoto(get(), 'reportar_impedimento_tarea');
      },

      solicitarReasignacionTarea: ({ tareaId, nuevoResponsable, motivo, usuario }) => {
        const { tareas, perfiles, ejecutivos } = get();
        const tareaActual = tareas.find((tarea) => tarea.id === tareaId);
        if (!tareaActual) return;

        const personas = obtenerPersonasActivas({ perfiles, ejecutivos });
        const nuevoResponsableCanonico = canonicalizarResponsable(nuevoResponsable, personas);
        const motivoLimpio = motivo.trim();
        if (
          !nuevoResponsableCanonico ||
          !motivoLimpio ||
          normalizarResponsable(nuevoResponsableCanonico) === normalizarResponsable(tareaActual.responsable)
        ) {
          return;
        }

        const timestamp = new Date().toISOString();
        set({
          tareas: tareas.map((tarea) =>
            tarea.id === tareaId
              ? sanitizarTarea(
                  {
                    ...tarea,
                    actualizadoEn: timestamp,
                    reasignacionPendiente: {
                      solicitante: usuario,
                      destinatario: nuevoResponsableCanonico,
                      motivo: motivoLimpio,
                      solicitadaEn: timestamp,
                      estado: 'pendiente',
                    },
                    comentarios: [
                      ...(tarea.comentarios ?? []),
                      {
                        id: `comentario-${crypto.randomUUID?.() ?? Date.now()}-reasignacion`,
                        texto: `Solicitud de reasignación enviada a ${nuevoResponsableCanonico}. Motivo: ${motivoLimpio}`,
                        usuario,
                        fecha: timestamp,
                      },
                    ],
                    historial: [
                      ...(tarea.historial ?? []),
                      {
                        fecha: timestamp,
                        campo: 'solicitud_reasignacion',
                        valorAnterior: tarea.responsable,
                        valorNuevo: `${nuevoResponsableCanonico}: ${motivoLimpio}`,
                        usuario,
                      },
                    ].slice(-10),
                  },
                  personas,
                )
              : tarea,
          ),
        });
        get().recalcularAlertas();
        guardarRemoto(get(), 'solicitar_reasignacion_tarea');
      },

      resolverReasignacionTarea: ({ tareaId, accion, usuario, motivo }) => {
        const { tareas, perfiles, ejecutivos } = get();
        const tareaActual = tareas.find((tarea) => tarea.id === tareaId);
        if (!tareaActual?.reasignacionPendiente) return;

        const personas = obtenerPersonasActivas({ perfiles, ejecutivos });
        const solicitud = tareaActual.reasignacionPendiente;
        const timestamp = new Date().toISOString();

        if (accion === 'rechazar' && !motivo?.trim()) return;

        set({
          tareas: tareas.map((tarea) => {
            if (tarea.id !== tareaId) return tarea;

            if (accion === 'aceptar') {
              return sanitizarTarea(
                {
                  ...tarea,
                  responsable: solicitud.destinatario,
                  actualizadoEn: timestamp,
                  reasignacionPendiente: null,
                  comentarios: [
                    ...(tarea.comentarios ?? []),
                    {
                      id: `comentario-${crypto.randomUUID?.() ?? Date.now()}-reasignacion-aceptada`,
                      texto: `${usuario} aceptó la reasignación y tomó la tarea.`,
                      usuario,
                      fecha: timestamp,
                    },
                  ],
                  historial: [
                    ...(tarea.historial ?? []),
                    {
                      fecha: timestamp,
                      campo: 'responsable',
                      valorAnterior: tarea.responsable,
                      valorNuevo: solicitud.destinatario,
                      usuario,
                    },
                    {
                      fecha: timestamp,
                      campo: 'reasignacion_resuelta',
                      valorAnterior: 'pendiente',
                      valorNuevo: 'aceptada',
                      usuario,
                    },
                  ].slice(-10),
                },
                personas,
              );
            }

            const motivoRechazo = motivo?.trim() ?? '';
            return sanitizarTarea(
              {
                ...tarea,
                actualizadoEn: timestamp,
                reasignacionPendiente: {
                  ...solicitud,
                  estado: 'rechazada',
                  respuesta: motivoRechazo,
                  respondidaEn: timestamp,
                },
                comentarios: [
                  ...(tarea.comentarios ?? []),
                  {
                    id: `comentario-${crypto.randomUUID?.() ?? Date.now()}-reasignacion-rechazada`,
                    texto: `${usuario} rechazó la reasignación. Motivo: ${motivoRechazo}`,
                    usuario,
                    fecha: timestamp,
                  },
                ],
                historial: [
                  ...(tarea.historial ?? []),
                  {
                    fecha: timestamp,
                    campo: 'reasignacion_rechazada',
                    valorAnterior: solicitud.destinatario,
                    valorNuevo: motivoRechazo,
                    usuario,
                  },
                ].slice(-10),
              },
              personas,
            );
          }),
        });
        get().recalcularAlertas();
        guardarRemoto(get(), accion === 'aceptar' ? 'aceptar_reasignacion_tarea' : 'rechazar_reasignacion_tarea');
      },

      eliminarTarea: (id) => {
        set((s) => ({
          tareas: s.tareas.filter((t) => t.id !== id),
          alertas: s.alertas.filter((a) => a.tareaId !== id),
        }));
        get().recalcularAlertas();
        guardarRemoto(get(), 'eliminar_tarea');
      },

      marcarAlertaLeida: (id) =>
        {
          set((s) => ({ alertas: s.alertas.map((a) => (a.id === id ? { ...a, leida: true } : a)) }));
          guardarRemoto(get(), 'marcar_alerta_leida');
        },

      crearProyecto: (p) => {
        const id = makeId('proyecto');
        const responsable = get().ejecutivos.find((e) => e.id === p.ejecutivoId)?.nombre ?? 'Sin asignar';
        const plan = generarPlanProyecto(id, p.fechaInicio, responsable);
        set((s) => ({
          proyectos: [...s.proyectos, { ...p, id, creadoEn: new Date().toISOString() }],
          fases: [...s.fases, ...plan.fases],
          tareas: [...s.tareas, ...plan.tareas],
        }));
        get().recalcularAlertas();
        guardarRemoto(get(), 'crear_proyecto');
      },

      actualizarProyecto: (id, cambios) => {
        set((s) => ({
          proyectos: s.proyectos.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
        }));
        guardarRemoto(get(), 'actualizar_proyecto');
      },

      eliminarProyecto: (id) => {
        set((s) => ({
          proyectos: s.proyectos.filter((p) => p.id !== id),
          fases: s.fases.filter((f) => f.proyectoId !== id),
          tareas: s.tareas.filter((t) => t.proyectoId !== id),
          alertas: s.alertas.filter((a) => a.proyectoId !== id),
        }));
        guardarRemoto(get(), 'eliminar_proyecto');
      },

      crearEjecutivo: (e) => {
        set((s) => ({ ejecutivos: [...s.ejecutivos, { ...e, id: makeId('ejecutivo') }] }));
        guardarRemoto(get(), 'crear_ejecutivo');
      },

      actualizarEjecutivo: (id, cambios) => {
        set((s) => ({ ejecutivos: s.ejecutivos.map((e) => (e.id === id ? { ...e, ...cambios } : e)) }));
        guardarRemoto(get(), 'actualizar_ejecutivo');
      },

      agregarDocumentoExpediente: (proyectoId, documento) => {
        const usuario = get().usuarioActivo?.nombre ?? 'Sistema';
        set((s) => {
          const expediente = s.expedientes[proyectoId] ?? expedienteVacio();
          return {
            expedientes: {
              ...s.expedientes,
              [proyectoId]: {
                ...expediente,
                documentos: [
                  ...expediente.documentos,
                  {
                    ...documento,
                    id: makeId('doc'),
                    creadoPor: usuario,
                    creadoEn: new Date().toISOString(),
                  },
                ],
              },
            },
          };
        });
        guardarRemoto(get(), 'agregar_documento_expediente');
      },

      eliminarDocumentoExpediente: (proyectoId, documentoId) => {
        set((s) => {
          const expediente = s.expedientes[proyectoId] ?? expedienteVacio();
          return {
            expedientes: {
              ...s.expedientes,
              [proyectoId]: {
                ...expediente,
                documentos: expediente.documentos.filter((documento) => documento.id !== documentoId),
              },
            },
          };
        });
        guardarRemoto(get(), 'eliminar_documento_expediente');
      },

      guardarAccesoExpediente: (proyectoId, acceso) => {
        const usuario = get().usuarioActivo?.nombre ?? 'Sistema';
        const id = acceso.id ?? makeId('acceso');
        set((s) => {
          const expediente = s.expedientes[proyectoId] ?? expedienteVacio();
          const nextAcceso = {
            ...acceso,
            id,
            actualizadoPor: usuario,
            actualizadoEn: new Date().toISOString(),
          };
          const existe = expediente.accesos.some((item) => item.id === id);
          return {
            expedientes: {
              ...s.expedientes,
              [proyectoId]: {
                ...expediente,
                accesos: existe
                  ? expediente.accesos.map((item) => (item.id === id ? nextAcceso : item))
                  : [...expediente.accesos, nextAcceso],
              },
            },
          };
        });
        guardarRemoto(get(), 'guardar_acceso_expediente');
      },

      eliminarAccesoExpediente: (proyectoId, accesoId) => {
        set((s) => {
          const expediente = s.expedientes[proyectoId] ?? expedienteVacio();
          return {
            expedientes: {
              ...s.expedientes,
              [proyectoId]: {
                ...expediente,
                accesos: expediente.accesos.filter((acceso) => acceso.id !== accesoId),
              },
            },
          };
        });
        guardarRemoto(get(), 'eliminar_acceso_expediente');
      },

      recalcularAlertas: () => {
        const { tareas, diasAnticipacionAlerta, alertas } = get();
        const hoy = new Date();
        const alertasExistentes = new Map(alertas.map((alerta) => [alerta.id, alerta]));
        const nuevasAlertas: Alerta[] = [];
        const agregarAlerta = (alerta: Omit<Alerta, 'leida' | 'creadaEn'>) => {
          const existente = alertasExistentes.get(alerta.id);
          nuevasAlertas.push({
            ...alerta,
            leida: existente?.leida ?? false,
            creadaEn: existente?.creadaEn ?? new Date().toISOString(),
          });
        };

        tareas.forEach((tarea) => {
          if (tarea.estado === 'completada' || tarea.estado === 'cancelada') return;
          const inicioPlan = parseISO(tarea.fechaInicioPlan);
          const finPlan = parseISO(tarea.fechaFinPlan);
          const diasDif = differenceInDays(finPlan, hoy);
          const diasInicio = differenceInDays(inicioPlan, hoy);

          if (diasDif < 0) {
            agregarAlerta({
              id: `alerta-vencida-${tarea.id}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'vencida',
              mensaje: `Incumplimiento Gantt: tarea vencida hace ${Math.abs(diasDif)} día(s): ${tarea.nombre}`,
            });
          } else if (diasDif <= diasAnticipacionAlerta) {
            agregarAlerta({
              id: `alerta-proxima-${tarea.id}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'proxima_vencer',
              mensaje: `Riesgo Gantt: vence en ${diasDif} día(s): ${tarea.nombre}`,
            });
          }

          if (tarea.estado === 'pendiente' && diasInicio < 0) {
            agregarAlerta({
              id: `alerta-inicio-plan-${tarea.id}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'en_riesgo',
              mensaje: `Riesgo Gantt: debio iniciar hace ${Math.abs(diasInicio)} día(s): ${tarea.nombre}`,
            });
          }

          if (tarea.estado === 'bloqueada') {
            agregarAlerta({
              id: `alerta-bloqueada-${tarea.id}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'bloqueada',
              mensaje: `Incumplimiento Gantt: tarea bloqueada: ${tarea.nombre}`,
            });
          }

          if (tarea.reasignacionPendiente?.estado === 'pendiente') {
            agregarAlerta({
              id: `alerta-solicitud-reasignacion-${tarea.id}-${tarea.reasignacionPendiente.solicitadaEn}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'solicitud_reasignacion',
              mensaje: `${tarea.reasignacionPendiente.solicitante} quiere reasignarte: ${tarea.nombre}`,
              destinatario: tarea.reasignacionPendiente.destinatario,
            });
          }

          if (tarea.reasignacionPendiente?.estado === 'rechazada') {
            agregarAlerta({
              id: `alerta-reasignacion-rechazada-${tarea.id}-${tarea.reasignacionPendiente.respondidaEn ?? tarea.reasignacionPendiente.solicitadaEn}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'reasignacion_rechazada',
              mensaje: `${tarea.reasignacionPendiente.destinatario} rechazó la reasignación de ${tarea.nombre}: ${tarea.reasignacionPendiente.respuesta || 'Sin motivo'}`,
              destinatario: tarea.reasignacionPendiente.solicitante,
            });
          }

          const cambiosResponsable = (tarea.historial ?? []).filter((item) => item.campo === 'responsable');
          const ultimoCambioResponsable = cambiosResponsable[cambiosResponsable.length - 1];
          const responsableActual = normalizarResponsable(tarea.responsable);
          const responsableNuevo = normalizarResponsable(ultimoCambioResponsable?.valorNuevo);
          const responsableAnterior = normalizarResponsable(ultimoCambioResponsable?.valorAnterior);

          if (ultimoCambioResponsable && responsableActual && responsableActual === responsableNuevo && responsableNuevo !== responsableAnterior) {
            agregarAlerta({
              id: `alerta-reasignada-${tarea.id}-${ultimoCambioResponsable.fecha}`,
              proyectoId: tarea.proyectoId,
              tareaId: tarea.id,
              tipo: 'reasignada',
              mensaje: `Nueva tarea asignada a ${tarea.responsable}: ${tarea.nombre}`,
              destinatario: tarea.responsable,
            });
          }
        });

        set({ alertas: nuevasAlertas });
      },
    }),
    {
      name: 'implementator_state',
      version: 3,
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState> | undefined;
        if (!persisted) return currentState;
        const { tema: _tema, ...persistedWithoutTheme } = persisted;
        return {
          ...currentState,
          ...persistedWithoutTheme,
          ...sanitizarSlicesCompartidos(persistedWithoutTheme, {
            perfiles: currentState.perfiles,
            perfilesAcceso: currentState.perfilesAcceso,
            ejecutivos: currentState.ejecutivos,
            proyectos: currentState.proyectos,
            fases: currentState.fases,
            tareas: currentState.tareas,
            alertas: currentState.alertas,
            expedientes: currentState.expedientes,
            diasAnticipacionAlerta: currentState.diasAnticipacionAlerta,
            fuenteGoogleSheetsUrl: currentState.fuenteGoogleSheetsUrl,
          }),
        };
      },
      partialize: (state) => ({
        usuarioActivo: state.usuarioActivo,
        perfiles: state.perfiles,
        perfilesAcceso: state.perfilesAcceso,
        ejecutivos: state.ejecutivos,
        proyectos: state.proyectos,
        fases: state.fases,
        tareas: state.tareas,
        alertas: state.alertas,
        expedientes: state.expedientes,
        diasAnticipacionAlerta: state.diasAnticipacionAlerta,
        fuenteGoogleSheetsUrl: state.fuenteGoogleSheetsUrl,
      }),
    },
  ),
);

export {
  calcCumplimientoGanttFase,
  calcCumplimientoGanttProyecto,
  calcPctFase,
  calcPctPlanificadoFase,
  calcPctPlanificadoProyecto,
  calcPctProyecto,
  semaforoCumplimientoFase,
  semaforoCumplimientoProyecto,
  semaforoProyecto,
};

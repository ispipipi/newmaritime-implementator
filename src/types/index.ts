export type CategoriaProyecto = 'Demo' | 'Solución completa' | 'Corrección' | 'QA / Auditoría' | 'Handoff' | 'Otro';

export type EstadoTarea = 'pendiente' | 'en_proceso' | 'completada' | 'bloqueada' | 'cancelada';

export type EstadoSemaforo = 'verde' | 'amarillo' | 'rojo';

export type PerfilApp = 'artbpo_admin' | 'artbpo_ejecutivo';

export type PerfilUsuario = string;

export type TemaApp = 'dia' | 'noche';
export type FiltroTareasVista =
  | 'todas'
  | 'vencidas'
  | 'hoy'
  | 'proximas'
  | 'bloqueadas'
  | 'completadas'
  | 'en_proceso'
  | 'atencion';
export type OrdenTareasVista = 'criticas' | 'vence' | 'nuevas' | 'plan';

export interface UsuarioActivo {
  id: string;
  nombre: string;
  iniciales: string;
  rol: string;
  perfil: PerfilUsuario;
  color: string;
  email?: string;
  activo?: boolean;
  proyectoClienteId?: string;
  proyectoIds?: string[];
}

export interface AccesosPerfil {
  puedeAdministrar: boolean;
  puedeEditarProyectos: boolean;
  puedeEditarDatosTarea: boolean;
  puedeCambiarEstadoTarea: boolean;
  puedeVerGanttAdmin: boolean;
  puedeGestionarUsuarios: boolean;
  soloLectura: boolean;
  esCliente: boolean;
}

export interface PerfilAcceso {
  id: PerfilUsuario;
  nombre: string;
  descripcion?: string;
  accesos: AccesosPerfil;
  protegido?: boolean;
}

export interface Ejecutivo {
  id: string;
  nombre: string;
  iniciales: string;
  rol: string;
  perfil: 'artbpo_admin' | 'artbpo_ejecutivo';
  color: string;
}

export interface Proyecto {
  id: string;
  nombre: string;
  cliente: string;
  contactoPrincipal: string;
  repositorio: string;
  urlProyecto: string;
  stackTecnico: string;
  categoria: CategoriaProyecto;
  ejecutivoId: string;
  supervisorId: string;
  fechaInicio: string;
  fechaGoLive: string;
  estado: 'activo' | 'completado' | 'pausado';
  observaciones: string;
  creadoEn: string;
}

export interface Fase {
  id: string;
  proyectoId: string;
  codigo: string;
  nombre: string;
  orden: number;
  fechaInicioPlan: string;
  fechaFinPlan: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
}

export interface ReasignacionPendienteTarea {
  solicitante: string;
  destinatario: string;
  motivo: string;
  solicitadaEn: string;
  estado: 'pendiente' | 'rechazada';
  respuesta?: string;
  respondidaEn?: string;
}

export interface Tarea {
  id: string;
  faseId: string;
  proyectoId: string;
  nombre: string;
  descripcion?: string;
  responsable: string;
  estado: EstadoTarea;
  fechaInicioPlan: string;
  fechaFinPlan: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
  duracionDias: number;
  esMilestone: boolean;
  observacion?: string;
  comentarios?: Array<{
    id: string;
    texto: string;
    usuario: string;
    fecha: string;
  }>;
  actualizadoEn: string;
  reasignacionPendiente?: ReasignacionPendienteTarea | null;
  historial?: Array<{
    fecha: string;
    campo: string;
    valorAnterior: string;
    valorNuevo: string;
    usuario: string;
  }>;
}

export interface Alerta {
  id: string;
  proyectoId: string;
  tareaId: string;
  tipo:
    | 'vencida'
    | 'proxima_vencer'
    | 'bloqueada'
    | 'en_riesgo'
    | 'reasignada'
    | 'solicitud_reasignacion'
    | 'reasignacion_rechazada';
  mensaje: string;
  leida: boolean;
  creadaEn: string;
  destinatario?: string;
}

export type TipoDocumentoExpediente =
  | 'Contrato'
  | 'Mandato'
  | 'Certificado'
  | 'Acta'
  | 'Carga inicial'
  | 'Legal'
  | 'Otro';

export interface DocumentoExpediente {
  id: string;
  nombre: string;
  tipo: TipoDocumentoExpediente;
  url: string;
  descripcion?: string;
  creadoPor: string;
  creadoEn: string;
}

export type PortalAcceso =
  | 'Previred'
  | 'MiDT'
  | 'Caja compensacion'
  | 'AFC'
  | 'Mutual'
  | 'Portal licencias'
  | 'Otro';

export interface AccesoCompania {
  id: string;
  portal: PortalAcceso;
  url: string;
  usuario: string;
  referenciaClave: string;
  responsable: string;
  notas?: string;
  actualizadoPor: string;
  actualizadoEn: string;
}

export interface ExpedienteProyecto {
  documentos: DocumentoExpediente[];
  accesos: AccesoCompania[];
}

export type Vista = 'dashboard' | 'proyectos' | 'proyecto' | 'fase' | 'mis_tareas' | 'info_cliente' | 'gantt_admin' | 'ajustes';

export interface AppState {
  usuarioActivo: UsuarioActivo | null;
  perfiles: UsuarioActivo[];
  perfilesAcceso: PerfilAcceso[];
  ejecutivos: Ejecutivo[];
  proyectos: Proyecto[];
  fases: Fase[];
  tareas: Tarea[];
  alertas: Alerta[];
  expedientes: Record<string, ExpedienteProyecto>;
  vista: Vista;
  proyectoActivoId: string | null;
  faseActivaId: string | null;
  tareaActivaId: string | null;
  busquedaTareas: string;
  filtroTareasVista: FiltroTareasVista;
  ordenTareasVista: OrdenTareasVista;
  diasAnticipacionAlerta: number;
  tema: TemaApp;
  fuenteGoogleSheetsUrl: string;
  sincronizadoRemotoEn?: string;
  setUsuarioActivo: (u: UsuarioActivo | null) => void;
  setVista: (v: Vista, proyectoId?: string, faseId?: string) => void;
  setTareaActiva: (tareaId: string | null) => void;
  setBusquedaTareas: (value: string) => void;
  setFiltroTareasVista: (value: FiltroTareasVista) => void;
  setOrdenTareasVista: (value: OrdenTareasVista) => void;
  setTema: (tema: TemaApp) => void;
  alternarTema: () => void;
  setFuenteGoogleSheetsUrl: (url: string) => void;
  aplicarEstadoCompartido: (estado: Partial<Pick<AppState, 'perfiles' | 'perfilesAcceso' | 'ejecutivos' | 'proyectos' | 'fases' | 'tareas' | 'alertas' | 'expedientes' | 'diasAnticipacionAlerta' | 'fuenteGoogleSheetsUrl'>>) => void;
  crearPerfil: (perfil: Omit<UsuarioActivo, 'id'>) => void;
  actualizarPerfil: (id: string, cambios: Partial<UsuarioActivo>) => void;
  eliminarPerfil: (id: string) => void;
  crearUsuario: (usuario: Omit<UsuarioActivo, 'id'>) => void;
  actualizarUsuario: (id: string, cambios: Partial<UsuarioActivo>) => void;
  eliminarUsuario: (id: string) => void;
  crearPerfilAcceso: (perfil: Omit<PerfilAcceso, 'id'> & { id?: string }) => void;
  actualizarPerfilAcceso: (id: string, cambios: Partial<PerfilAcceso>) => void;
  eliminarPerfilAcceso: (id: string) => void;
  reemplazarPlanificacionProyecto: (proyectoId: string, fases: Fase[], tareas: Tarea[], usuario: string, fechas?: { fechaInicio?: string; fechaFin?: string }) => void;
  desplazarCronogramaProyecto: (proyectoId: string, nuevaFechaInicio: string, usuario: string) => void;
  actualizarTarea: (id: string, cambios: Partial<Tarea>, usuario: string) => void;
  actualizarFechasGantt: (tareaId: string, inicio: string, fin: string) => void;
  crearTarea: (t: Omit<Tarea, 'id' | 'actualizadoEn' | 'historial'>) => void;
  reportarImpedimentoTarea: (payload: {
    tareaOrigenId: string;
    responsableDestrabe: string;
    motivo: string;
    usuario: string;
  }) => void;
  solicitarReasignacionTarea: (payload: {
    tareaId: string;
    nuevoResponsable: string;
    motivo: string;
    usuario: string;
  }) => void;
  resolverReasignacionTarea: (payload: {
    tareaId: string;
    accion: 'aceptar' | 'rechazar';
    usuario: string;
    motivo?: string;
  }) => void;
  eliminarTarea: (id: string) => void;
  marcarAlertaLeida: (id: string) => void;
  crearProyecto: (p: Omit<Proyecto, 'id' | 'creadoEn'>) => void;
  actualizarProyecto: (id: string, cambios: Partial<Proyecto>) => void;
  eliminarProyecto: (id: string) => void;
  crearEjecutivo: (e: Omit<Ejecutivo, 'id'>) => void;
  actualizarEjecutivo: (id: string, cambios: Partial<Ejecutivo>) => void;
  agregarDocumentoExpediente: (proyectoId: string, documento: Omit<DocumentoExpediente, 'id' | 'creadoEn' | 'creadoPor'>) => void;
  eliminarDocumentoExpediente: (proyectoId: string, documentoId: string) => void;
  guardarAccesoExpediente: (proyectoId: string, acceso: Omit<AccesoCompania, 'id' | 'actualizadoEn' | 'actualizadoPor'> & { id?: string }) => void;
  eliminarAccesoExpediente: (proyectoId: string, accesoId: string) => void;
  recalcularAlertas: () => void;
}

export type Idioma = 'es' | 'en';

const dict = {
  // Header / navegación
  app_tagline: { es: 'NPR Project Tracking', en: 'NPR Project Tracking' },
  nav_dashboard: { es: 'Panel', en: 'Dashboard' },
  nav_proyectos: { es: 'Proyectos', en: 'Projects' },
  nav_mis_tareas: { es: 'Mis tareas', en: 'My tasks' },
  nav_ajustes: { es: 'Ajustes', en: 'Settings' },
  nav_info_cliente: { es: 'Info cliente', en: 'Client info' },
  nav_gantt_admin: { es: 'Gantt admin', en: 'Gantt admin' },
  search_placeholder: { es: 'Buscar proyectos, tareas, clientes...', en: 'Search projects, tasks, clients...' },
  search_proyectos: { es: 'Proyectos', en: 'Projects' },
  search_tareas: { es: 'Tareas', en: 'Tasks' },
  search_clientes: { es: 'Clientes', en: 'Clients' },
  search_responsables: { es: 'Responsables', en: 'Assignees' },
  logout: { es: 'Cerrar sesión', en: 'Sign out' },
  theme_toggle: { es: 'Cambiar tema', en: 'Toggle theme' },
  language_toggle: { es: 'English', en: 'Español' },

  // Login
  login_title: { es: 'Ingreso seguro', en: 'Secure sign-in' },
  login_subtitle: { es: 'Accede con tu email y contraseña asignada.', en: 'Sign in with your assigned email and password.' },
  login_email: { es: 'Email', en: 'Email' },
  login_password: { es: 'Contraseña', en: 'Password' },
  login_button: { es: 'Ingresar', en: 'Sign in' },
  login_loading: { es: 'Ingresando...', en: 'Signing in...' },
  login_forgot: { es: 'Crear nueva contraseña', en: 'Create new password' },
  login_sending: { es: 'Enviando correo...', en: 'Sending email...' },
  login_signout_stuck: { es: 'Cerrar sesión e intentar con otro usuario', en: 'Sign out and try another user' },
  login_no_profile: { es: 'Tu usuario existe en Firebase, pero aún no tiene perfil asignado en IMPLEMENTATOR.', en: 'Your user exists in Firebase, but has no profile assigned in IMPLEMENTATOR yet.' },
  login_bad_credentials: { es: 'Email o contraseña incorrecta, o el usuario aún no existe en Firebase.', en: 'Incorrect email or password, or the user does not exist in Firebase yet.' },
  login_profile_load_error: { es: 'No se pudo cargar el perfil.', en: 'Could not load the profile.' },
  login_enter_email_first: { es: 'Ingresa tu email y luego presiona crear nueva contraseña.', en: 'Enter your email and then press create new password.' },
  login_recovery_sent: { es: 'Te enviamos un correo para crear una nueva contraseña. Por seguridad no se puede enviar la contraseña actual.', en: 'We sent you an email to create a new password. For security reasons the current password cannot be sent.' },
  login_recovery_error: { es: 'No se pudo enviar el correo de recuperación.', en: 'Could not send the recovery email.' },

  // Dashboard
  dashboard_title: { es: 'Panel general', en: 'Overview' },
  dashboard_proyectos_activos: { es: 'Proyectos activos', en: 'Active projects' },
  dashboard_tareas_pendientes: { es: 'Tareas pendientes', en: 'Pending tasks' },
  dashboard_tareas_vencidas: { es: 'Tareas vencidas', en: 'Overdue tasks' },

  // Gantt
  gantt_title: { es: 'Carta Gantt', en: 'Gantt chart' },
  gantt_subtitle: { es: 'Por fases — aprieta una fase para desplegar el detalle de tareas.', en: 'Grouped by phase — click a phase to expand task detail.' },
  gantt_semana: { es: 'Semana', en: 'Week' },
  gantt_tareas: { es: 'tareas', en: 'tasks' },
  gantt_fases: { es: 'fases', en: 'phases' },
  gantt_sync_title: { es: 'Sincronizar desde Google Sheets', en: 'Sync from Google Sheets' },
  gantt_sync_button: { es: 'Sincronizar', en: 'Sync' },
  gantt_sync_save_url: { es: 'Guardar URL', en: 'Save URL' },
  gantt_add_task_title: { es: 'Agregar tarea', en: 'Add task' },
  gantt_add_task_button: { es: 'Agregar', en: 'Add' },
  gantt_edit_title: { es: 'Editar tareas', en: 'Edit tasks' },
  gantt_col_tarea: { es: 'Tarea', en: 'Task' },
  gantt_col_fase: { es: 'Fase', en: 'Phase' },
  gantt_col_responsable: { es: 'Responsable', en: 'Assignee' },
  gantt_col_estado: { es: 'Estado', en: 'Status' },
  gantt_col_inicio: { es: 'Inicio', en: 'Start' },
  gantt_col_fin: { es: 'Fin', en: 'End' },
  gantt_col_milestone: { es: 'Milestone', en: 'Milestone' },
  gantt_col_eliminar: { es: 'Eliminar', en: 'Delete' },

  // Gantt admin extra
  gantt_admin_badge: { es: 'Administración', en: 'Administration' },
  gantt_admin_title: { es: 'Gantt completa', en: 'Full Gantt' },
  gantt_admin_subtitle: { es: 'Vista de administrador para ajustar fechas, estados, responsables y estructura de tareas.', en: 'Admin view to adjust dates, statuses, assignees and task structure.' },
  gantt_sync_subtitle: { es: 'Pega la URL del Google Sheet compartido o del Apps Script. Al sincronizar, se reemplazan fases y tareas del proyecto seleccionado.', en: 'Paste the shared Google Sheet URL or the Apps Script URL. Syncing replaces the phases and tasks of the selected project.' },
  gantt_sync_url_label: { es: 'URL del Apps Script', en: 'Apps Script URL' },
  gantt_add_task_nombre: { es: 'Nombre de tarea', en: 'Task name' },
  gantt_add_task_responsable: { es: 'Responsable', en: 'Assignee' },
  gantt_milestone_label: { es: 'Milestone', en: 'Milestone' },
  gantt_edit_subtitle: { es: 'Los cambios se guardan al modificar cada campo.', en: 'Changes are saved as you edit each field.' },
  gantt_milestone_si: { es: 'Sí', en: 'Yes' },
} as const;

export type DictKey = keyof typeof dict;

export function translate(key: DictKey, idioma: Idioma): string {
  return dict[key]?.[idioma] ?? String(key);
}

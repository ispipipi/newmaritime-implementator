// Traducciones de CONTENIDO (no de interfaz) para el roadmap de New Maritime.
// Clave = id de la fase/tarea en newMaritimeData.ts. Solo cubre "nombre" por ahora.

export const FASE_NOMBRE_EN: Record<string, string> = {
  'newmaritime-hubagencyos-f1': 'Discovery',
  'newmaritime-hubagencyos-f2': 'Architecture',
  'newmaritime-hubagencyos-f3': 'Construction · Core',
  'newmaritime-hubagencyos-f4': 'Construction · Support',
  'newmaritime-hubagencyos-f5': 'QA / Validation',
  'newmaritime-hubagencyos-f6': 'Soft launch',
  'newmaritime-hubagencyos-f7': 'Live operation',
  'newmaritime-hubagencyos-f8': 'Phase 2 · Evolution',
};

export const TAREA_NOMBRE_EN: Record<string, string> = {
  'newmaritime-hubagencyos-t1-kickoff-con-new-maritime-group': 'Kickoff with New Maritime Group',
  'newmaritime-hubagencyos-t2-confirmar-umbral-de-tolerancia-fda-vs-vouchers': 'Confirm FDA-vs-vouchers tolerance threshold',
  'newmaritime-hubagencyos-t3-confirmar-configurabilidad-del-cost-party-default': 'Confirm Cost Party default configurability',
  'newmaritime-hubagencyos-t4-confirmar-division-de-linea-pda-fda-entre-varios-billing-par': 'Confirm PDA/FDA line splitting across multiple Billing Parties',
  'newmaritime-hubagencyos-t5-validar-condiciones-de-disparo-de-reportes-vs-slas-reales': 'Validate report trigger conditions vs. real SLAs',
  'newmaritime-hubagencyos-t6-confirmar-versionado-con-fecha-de-port-tariffs': 'Confirm date-based versioning for Port Tariffs',
  'newmaritime-hubagencyos-t7-confirmar-fuente-de-produccion-de-timestamps-sof': 'Confirm production source for SOF timestamps',
  'newmaritime-hubagencyos-t8-confirmar-comportamiento-de-caso-reabierto-tras-collected': 'Confirm behavior for a case reopened after Collected',
  'newmaritime-hubagencyos-t9-confirmar-alcance-de-conexion-con-sedna': 'Confirm scope of the Sedna connection',
  'newmaritime-hubagencyos-t10-confirmar-boundary-de-conexion-erp-tbc': 'Confirm ERP connection boundary (TBC)',
  'newmaritime-hubagencyos-t11-confirmar-alcance-de-migracion-de-datos-historicos-gatship': 'Confirm scope of GATSHIP historical data migration',
  'newmaritime-hubagencyos-t12-definir-modelo-de-datos-completo': 'Define the complete data model',
  'newmaritime-hubagencyos-t13-disenar-motor-de-formulas-de-tarifas-portuarias': 'Design the port tariff formula engine',
  'newmaritime-hubagencyos-t14-disenar-arquitectura-de-los-4-flujos-ocr': 'Design architecture for the 4 OCR flows',
  'newmaritime-hubagencyos-t15-confirmar-stack-de-produccion': 'Confirm production stack',
  'newmaritime-hubagencyos-t16-disenar-arquitectura-de-integracion-con-sedna': 'Design Sedna integration architecture',
  'newmaritime-hubagencyos-t17-disenar-el-modelo-de-7-estados-del-register-status': 'Design the 7-status Register Status model',
  'newmaritime-hubagencyos-t18-operations-registro-de-casos-filtro-unificado-hand-over-boar': 'Operations — case register, unified filter, Hand Over Board',
  'newmaritime-hubagencyos-t19-create-pda-flujo-ocr-de-cotizacion-local': 'Create PDA — local quoting OCR flow',
  'newmaritime-hubagencyos-t20-create-case-voyage-instructions-ocr-y-manual': 'Create Case — Voyage Instructions (OCR and manual)',
  'newmaritime-hubagencyos-t21-case-workspace-overview-vessel-loading-unloading-dates-cargo': 'Case Workspace — Overview: Vessel, Loading/Unloading, Dates, Cargo, Audit Trail',
  'newmaritime-hubagencyos-t22-case-workspace-prefunding-panels-multi-parte-swift-reader': 'Case Workspace — multi-party Prefunding panels + Swift Reader',
  'newmaritime-hubagencyos-t23-case-workspace-pda-billing-parties-split-cost-party-line-ite': 'Case Workspace — PDA: Billing Parties + Cost Party split + line items',
  'newmaritime-hubagencyos-t24-case-workspace-agency-register-check-y-port-tariff-check': 'Case Workspace — Agency Register Check and Port Tariff Check',
  'newmaritime-hubagencyos-t25-case-workspace-fda-basico-upload-line-items-billing-parties': 'Case Workspace — basic FDA (upload, line items, Billing Parties)',
  'newmaritime-hubagencyos-t26-database-clients-disponent-owners': 'Database — Clients (Disponent Owners)',
  'newmaritime-hubagencyos-t27-database-local-agents-suppliers': 'Database — Local Agents (Suppliers)',
  'newmaritime-hubagencyos-t28-database-port-information-tariffs-restrictions-clearance-use': 'Database — Port Information: Tariffs, Restrictions, Clearance, Useful Info',
  'newmaritime-hubagencyos-t29-history-archivo-filtros-kpis-de-casos-cerrados': 'History — archive, filters, KPIs for closed cases',
  'newmaritime-hubagencyos-t30-case-workspace-documents-sof-generator': 'Case Workspace — Documents: SOF Generator',
  'newmaritime-hubagencyos-t31-auditoria-tecnica-completa-pistas-1-y-2': 'Full technical audit (tracks 1 and 2)',
  'newmaritime-hubagencyos-t32-uat-con-equipo-new-maritime': 'UAT with the New Maritime team',
  'newmaritime-hubagencyos-t33-validar-respuestas-de-levantamiento-contra-el-sistema-constr': 'Validate Discovery answers against the built system',
  'newmaritime-hubagencyos-t34-cierre-de-hallazgos-criticos': 'Close out critical findings',
  'newmaritime-hubagencyos-t35-migracion-de-datos-iniciales': 'Initial data migration',
  'newmaritime-hubagencyos-t36-operacion-en-paralelo-con-gatship': 'Parallel operation with GATSHIP',
  'newmaritime-hubagencyos-t37-canal-de-incidentes-mejoras-y-cambios-habilitado': 'Incident, improvement, and change channel enabled',
  'newmaritime-hubagencyos-t38-monitoreo-diario-de-discrepancias': 'Daily discrepancy monitoring',
  'newmaritime-hubagencyos-t39-go-live-corte-definitivo-de-gatship': 'Go-live — final GATSHIP cutover',
  'newmaritime-hubagencyos-t40-soporte-post-go-live': 'Post go-live support',
  'newmaritime-hubagencyos-t41-fda-voucher-cross-check-panel': 'FDA — Voucher Cross-Check panel',
  'newmaritime-hubagencyos-t42-fda-variance-analysis-panel': 'FDA — Variance Analysis panel',
  'newmaritime-hubagencyos-t43-fda-exchange-rate-advisor-logica-fx-critica': 'FDA — Exchange Rate Advisor (critical FX logic)',
  'newmaritime-hubagencyos-t44-fda-billing-instructions-board': 'FDA — Billing Instructions Board',
  'newmaritime-hubagencyos-t45-fda-query-generator-panel': 'FDA — Query Generator panel',
  'newmaritime-hubagencyos-t46-fda-voucher-preparation-workspace': 'FDA — Voucher Preparation workspace',
  'newmaritime-hubagencyos-t47-market-intelligence-port-statistics-con-datos-reales': 'Market Intelligence — Port Statistics with real data',
  'newmaritime-hubagencyos-t48-market-intelligence-intelligence-report-waf-ocr-line-up': 'Market Intelligence — Intelligence Report (WAF + OCR line-up)',
  'newmaritime-hubagencyos-t49-management-dashboard-general-by-port-by-customer': 'Management Dashboard — General, By Port, By Customer',
  'newmaritime-hubagencyos-t50-documents-bl-generator': 'Documents — BL Generator',
  'newmaritime-hubagencyos-t51-integracion-directa-gatship': 'Direct GATSHIP integration',
  'newmaritime-hubagencyos-t52-conexion-erp': 'ERP connection',
};

export function localizeFaseNombre(id: string, nombreOriginal: string, idioma: 'es' | 'en'): string {
  if (idioma === 'es') return nombreOriginal;
  return FASE_NOMBRE_EN[id] ?? nombreOriginal;
}

export function localizeTareaNombre(id: string, nombreOriginal: string, idioma: 'es' | 'en'): string {
  if (idioma === 'es') return nombreOriginal;
  return TAREA_NOMBRE_EN[id] ?? nombreOriginal;
}

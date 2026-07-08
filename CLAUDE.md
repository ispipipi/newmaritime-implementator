# CLAUDE.md — Implementator Template

## Propósito

Este repositorio es un template base para crear nuevas soluciones tipo Implementator para clientes NPR/artBPO.

No debe tratarse como un proyecto único, sino como una base reutilizable para futuros proyectos.

## Regla principal

Antes de modificar código, Claude debe distinguir entre:

- Core reutilizable del sistema.
- Configuración específica del cliente.
- Datos demo o mocks.
- Textos visibles.
- Configuración de despliegue.

Todo lo específico de un cliente debe quedar separado del core.

## Reglas funcionales

- No hardcodear nombres de cliente.
- No hardcodear dominios.
- No hardcodear logos específicos.
- No hardcodear colores de cliente dentro de componentes.
- No mezclar datos demo con lógica del sistema.
- Mantener los módulos activables/configurables cuando sea posible.
- Si una funcionalidad puede servir a futuros clientes, debe quedar en el core.
- Si una funcionalidad es solo de un cliente, debe quedar como personalización.

## Seguridad

- No subir archivos `.env` reales.
- No incluir credenciales, tokens ni claves API.
- No incluir datos reales de clientes.
- Usar `.env.example` como referencia.
- Antes de cerrar una tarea, revisar que no existan secretos o datos sensibles.

## Forma de trabajo

Antes de cambios grandes:

1. Revisar la estructura del proyecto.
2. Identificar archivos a modificar.
3. Proponer un plan breve.
4. Esperar aprobación.
5. Implementar.
6. Ejecutar build si existe.
7. Resumir cambios realizados.

## Comandos habituales

```bash
npm install
npm run dev
npm run build

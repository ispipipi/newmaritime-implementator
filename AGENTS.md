# AGENTS.md — Implementator Template

## Propósito

Este repositorio es un template base para crear nuevas soluciones tipo Implementator para clientes NPR/artBPO.

El objetivo es mantener una base reutilizable, configurable y limpia, evitando que cada nuevo proyecto parta desde cero.

## Reglas principales

- No hardcodear nombres de cliente.
- No hardcodear dominios.
- No hardcodear logos específicos.
- No dejar credenciales, tokens, claves API ni archivos `.env` reales.
- Todo lo específico de un cliente debe quedar separado en archivos de configuración.
- Mantener el core del sistema reutilizable para futuros proyectos.

## Configuración por cliente

Cuando se cree un nuevo proyecto desde este template, los datos variables deben configurarse en archivos como:

- Nombre del cliente
- Nombre de la solución
- Logo
- Colores
- Dominio
- Módulos activos
- Textos visibles
- Datos demo

## Forma de trabajo

Antes de implementar cambios grandes:

1. Revisar la estructura actual del proyecto.
2. Identificar qué parte es core reutilizable y qué parte es específica del cliente.
3. Proponer un plan breve.
4. Esperar aprobación antes de modificar muchas áreas.

## Seguridad

- No subir archivos `.env` reales.
- No incluir credenciales de Firebase.
- No incluir datos reales de clientes.
- Usar `.env.example` como referencia.
- Revisar que no existan secretos antes de cerrar una tarea.

## Comandos habituales

```bash
npm install
npm run dev
npm run build

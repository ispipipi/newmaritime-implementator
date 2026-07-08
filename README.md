# IMPLEMENTATOR — New Maritime Hub Agency OS

SPA para monitoreo del roadmap de proyectos NPR. Adaptado desde el template artBPO de nomina a un tracker generico de proyecto (Proyecto -> Fase -> Tarea). Cargado con el roadmap de Hub Agency OS para New Maritime Group (8 fases, 52 tareas). Construida con React 18, Vite, TypeScript, Tailwind CSS, Zustand, frappe-gantt y Recharts.

## Instalacion local

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Docker / Cloud Run

```bash
docker build -t implementator .
docker run -p 8080:8080 implementator
```

Para Cloud Run, sube la imagen a Artifact Registry y despliega exponiendo el puerto `8080`.

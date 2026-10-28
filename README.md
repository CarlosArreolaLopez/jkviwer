# JkViwer — Responsive Architecture & QA Validator (SDD)

**JkViwer** es un visor multi-dispositivo y validador de arquitectura responsiva desarrollado bajo la metodología **SDD (Specification-Driven Development)**.

## Características Principales

- **Modo Réplicas vs. Modo Independientes:** Sincronización determinista en tiempo real de scroll proporcional, clics, escritura en formularios y navegación entre Móvil, Tablet y Desktop, o desacoplamiento total/individual por dispositivo.
- **Drag & Drop Completo:**
  - Reordenamiento de simuladores en Modo Fila o Grid.
  - **Lienzo Libre 2D (`Freeform`):** Mueve cualquier simulador libremente a cualquier coordenada `(X, Y)`.
  - Arrastrar dispositivos directamente desde el catálogo lateral hacia el lienzo.
- **Auto-Fit Responsivo (`ResizeObserver`):** Ajusta automáticamente la escala matemática del lienzo para que todos los simuladores quepan al 100% en tu monitor conservando intacta la evaluación real de `@media queries`.
- **Proxy Interceptor + Inyección de Puente (`bridge.js`):** Elimina bloqueos `X-Frame-Options` y `Content-Security-Policy` para probar cualquier aplicación local (`localhost`) o externa.
- **Auditoría QA de Overflow Horizontal y Extractor de Breakpoints CSS:** Detecta elementos que desbordan el ancho del dispositivo móvil y extrae los puntos de quiebre `@media` de las hojas de estilo.

## Estructura SDD

- [`specs/01-prd.md`](./specs/01-prd.md) — Requisitos del Producto y Criterios Gherkin.
- [`specs/02-architecture.md`](./specs/02-architecture.md) — Documento de Arquitectura Técnica y ADRs.
- [`specs/03-contracts.md`](./specs/03-contracts.md) — Contratos de Datos e Interfaces TypeScript.
- [`specs/04-tasks.md`](./specs/04-tasks.md) — Plan de Implementación y Verificación.

## Uso Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Ejecutar suite de pruebas SDD
npm run test

# Compilar para producción
npm run build
```

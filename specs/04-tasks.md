# SDD Implementation Plan & Task Breakdown - JkViwer

**Proyecto:** JkViwer  
**Metodología:** Specification-Driven Development (SDD)  
**Regla de Oro SDD:** Ninguna tarea de código se da por terminada si no cumple estrictamente los contratos definidos en `03-contracts.md` y los criterios de aceptación Gherkin en `01-prd.md`.

---

## Fase 1: Cimientos y Contratos (Foundation & Contracts)
> **Objetivo:** Inicializar el proyecto con TypeScript estricto, configurar las herramientas de construcción (Vite + Tailwind CSS + Lucide Icons + Zustand) y traducir `03-contracts.md` en tipos compilables.

- [x] **TASK-1.1: Inicialización del Proyecto y Dependencias**
  - **Ref Spec:** `02-architecture.md` (Sección 4)
  - **Descripción:** Configurar `package.json`, TypeScript (`tsconfig.json`), Vite (`vite.config.ts`) y Tailwind CSS para el diseño oscuro profesional de la interfaz del visor.
  - **DoD (Definition of Done):** El proyecto compila sin errores con `npm run build`.

- [x] **TASK-1.2: Implementación de Contratos de Datos (`src/types/index.ts`)**
  - **Ref Spec:** `03-contracts.md` (Secciones 1, 2 y 3)
  - **Descripción:** Codificar todas las interfaces (`DevicePreset`, `ActiveViewport`, `VisorBridgeMessage`, `VisorState`, payloads de sincronización y reportes QA).
  - **DoD:** `tsc --noEmit` pasa sin advertencias ni usos de `any`.

- [x] **TASK-1.3: Catálogo de Dispositivos y Presets de Breakpoints (`src/constants/devices.ts`)**
  - **Ref Spec:** `01-prd.md` (US-02), `03-contracts.md` (`DevicePreset`)
  - **Descripción:** Crear la base de datos de dispositivos reales (iPhone SE, iPhone 15 Pro, Pixel 8, Samsung S24 Ultra, iPad Mini, iPad Pro 12.9", MacBook Air 13", Desktop 1080p, 2K) y suites de breakpoints (Tailwind CSS: `sm: 640`, `md: 768`, `lg: 1024`, `xl: 1280`, `2xl: 1536`).
  - **DoD:** Exportación tipada con suites rápidas de trabajo (`essential`, `mobile-suite`, `tailwind-breakpoints`).

---

## Fase 2: Motor de Interceptación Proxy y Puente DOM (`bridge.js`)
> **Objetivo:** Resolver el problema técnico central de los visores web: eliminar bloqueos de cabeceras (`X-Frame-Options` / `CSP`) e inyectar automáticamente el agente de sincronización y auditoría en cualquier URL cargada.

- [x] **TASK-2.1: Agente Inyectado de Sincronización y QA (`src/bridge/bridgeScript.ts`)**
  - **Ref Spec:** `02-architecture.md` (ADR-002), `03-contracts.md` (Sección 2 y 4)
  - **Descripción:** Crear el script autocontenido que se ejecuta dentro de cada viewport:
    1. Escucha y emite `SYNC_SCROLL` con bloqueo anti-rebote (`isApplyingRemoteEvent`).
    2. Genera selectores CSS deterministas y replica `SYNC_CLICK` y `SYNC_INPUT`.
    3. Ejecuta el algoritmo de auditoría `QA_SCAN_OVERFLOW` resaltando con bordes rojos (`outline: 2px dashed #ef4444`) los elementos cuyo `getBoundingClientRect().right > document.documentElement.clientWidth`.
    4. Extrae los `@media` queries de `document.styleSheets` para `QA_EXTRACT_BREAKPOINTS`.
  - **DoD:** El script puede inyectarse en cualquier documento HTML y responde a los comandos del Host vía `window.parent.postMessage`.

- [x] **TASK-2.2: Middleware Proxy Interceptor en Servidor (`server/proxyPlugin.ts`)**
  - **Ref Spec:** `01-prd.md` (US-01), `02-architecture.md` (ADR-001)
  - **Descripción:** Implementar el endpoint `/__visorr_proxy__?url=<target>` integrado en el servidor de Vite:
    1. Realiza la petición HTTP/HTTPS hacia la URL destino (sea `localhost:xxxx` o dominio externo).
    2. Elimina las cabeceras `x-frame-options`, `content-security-policy` y `content-security-policy-report-only`.
    3. Si el `content-type` es `text/html`, inyecta `<base href="...">` y el `<script>` del puente (`bridgeScript`) antes de devolver la respuesta.
    4. Incluye una página de demostración integrada (`/__visorr_demo__`) con diseño responsivo, formularios, tarjetas, breakpoints y un botón para simular un bug de overflow horizontal para probar todas las funciones del visor de inmediato.
  - **DoD:** Cualquier sitio web o el entorno demo carga dentro de los iframes con sincronización activa sin errores de consola de bloqueo de marcos.

---

## Fase 3: Estado Global y Orquestador de Sincronización
> **Objetivo:** Conectar el bus de mensajes del navegador con la interfaz de usuario y persistir el espacio de trabajo.

- [x] **TASK-3.1: Store Global con Persistencia (`src/store/useVisorStore.ts`)**
  - **Ref Spec:** `02-architecture.md` (ADR-003), `03-contracts.md` (Sección 3)
  - **Descripción:** Implementar el store de Zustand con persistencia en `localStorage` para gestionar URLs, historial, lista de viewports activos, rotación individual/masiva, nivel de zoom, modo de layout y reportes de QA.
  - **DoD:** Las acciones modifican el estado de forma inmutable y se recuperan tras recargar el navegador.

- [x] **TASK-3.2: Orquestador del Bus de Eventos (`src/services/syncEngine.ts`)**
  - **Ref Spec:** `02-architecture.md` (Sección 3), `03-contracts.md` (Sección 2)
  - **Descripción:** Implementar la clase/servicio `SyncEngine` que mantiene el registro de referencias `HTMLIFrameElement` por `instanceId`. Cuando recibe un mensaje `VISORR_BRIDGE_V1` de un viewport origen, verifica qué banderas (`scroll`, `click`, `input`) están activas en el store y retransmite el evento a todos los demás viewports registrados que tengan `syncEnabled: true`.
  - **DoD:** Latencia < 16ms y cero bucles infinitos de retroalimentación entre viewports.

---

## Fase 4: Interfaz de Usuario para Arquitectos y Desarrolladores (UI/UX)
> **Objetivo:** Construir el entorno visual de VisorR con controles ergonómicos, escalado matemático exacto y paneles de inspección.

- [x] **TASK-4.1: Barra Superior de Navegación y Control (`src/components/Topbar/Topbar.tsx`)**
  - **Ref Spec:** `01-prd.md` (US-01, US-03, US-04, US-05)
  - **Descripción:**
    - Input de URL con selector de historial y botón de carga rápida del laboratorio de pruebas integrado.
    - Selector de modo de conexión (`Proxy Interceptor` vs `Direct Iframe`).
    - Toggles rápidos de sincronización (Scroll, Clicks, Inputs).
    - Controles de Zoom del lienzo (`25%` a `125%`), conmutador de Layout (`Horizontal` / `Grid`), rotación global y botón de **Auditoría QA (Overflow Detector)**.

- [x] **TASK-4.2: Panel Lateral de Dispositivos y Presets (`src/components/Sidebar/Sidebar.tsx`)**
  - **Ref Spec:** `01-prd.md` (US-02, US-05)
  - **Descripción:**
    - Selector de Suites Rápidas (*Esencial: Móvil + Tablet + Desktop*, *Suite Móvil*, *Tailwind CSS Breakpoints*).
    - Catálogo para añadir dispositivos con 1 clic.
    - Formulario rápido para añadir un **Custom Viewport** (`Ancho x Alto`).
    - Panel de **Inspector QA y Breakpoints Detectados**: muestra los `@media` queries extraídos del CSS de la app y permite crear un viewport con ese ancho exacto al hacer clic.

- [x] **TASK-4.3: Marco de Dispositivo Inteligente (`src/components/Viewport/ViewportFrame.tsx`)**
  - **Ref Spec:** `01-prd.md` (US-02, US-04, US-05)
  - **Descripción:**
    - Cabecera del dispositivo con nombre, dimensiones (`393 × 852`), icono por categoría y badge de alerta si se detectan elementos con overflow horizontal (`⚠️ 2 overflows`).
    - Acciones por dispositivo: Rotar (`Portrait/Landscape`), Pausar/Activar sincronización individual, Abrir en pestaña nueva y Eliminar.
    - Contenedor con escalado geométrico real: utiliza `width: width * zoom` en el envoltorio exterior y `transform: scale(zoom)` con `transformOrigin: 'top left'` en el `<iframe>` interior para que las `@media queries` evalúen siempre la resolución real del dispositivo sin importar el zoom visual del lienzo.

- [x] **TASK-4.4: Lienzo de Trabajo Multi-Dispositivo (`src/components/Canvas/WorkspaceCanvas.tsx`)**
  - **Ref Spec:** `01-prd.md` (US-04)
  - **Descripción:** Lienzo con fondo reticulado técnico (blueprint dot-grid), soporte de disposición en fila horizontal o cuadrícula adaptable y soporte de atajos de zoom (`Ctrl + Rueda` o botones de zoom).

---

## Fase 5: Verificación y Validación contra Especificaciones (SDD Verification)
> **Objetivo:** Garantizar que el sistema implementado cumple cada contrato y criterio de aceptación.

- [x] **TASK-5.1: Pruebas Automatizadas de Contratos y Lógica (`tests/`)**
  - **Descripción:** Verificar normalización de URLs, transformaciones de rotación de viewports en el store y generación de payloads del protocolo Bridge.
- [x] **TASK-5.2: Validación End-to-End con Aplicación Demo Responsiva**
  - **Descripción:** Comprobar sincronización de scroll, replicación de inputs, rotación de dispositivos y detección visual de bugs de overflow horizontal.

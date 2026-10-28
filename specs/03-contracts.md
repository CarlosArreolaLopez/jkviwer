# Data Models & Interface Contracts - JkViwer

**Proyecto:** JkViwer  
**Propósito:** En **Specification-Driven Development (SDD)**, este archivo define los contratos inmutables entre el Host (UI de JkViwer), el Estado Global (`VisorStore`), el Proxy Local y el Agente Inyectado (`bridge.js`). Ningún módulo puede comunicarse fuera de estas estructuras tipadas.

---

## 1. Contratos de Dispositivos y Viewports (`DeviceContract`)

```typescript
export type DeviceCategory = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'custom';

export type Orientation = 'portrait' | 'landscape';

/**
 * Definición estática de un dispositivo dentro del catálogo predefinido.
 */
export interface DevicePreset {
  id: string;
  name: string;
  category: DeviceCategory;
  width: number;
  height: number;
  devicePixelRatio: number;
  userAgent?: string;
}

/**
 * Instancia activa de un viewport renderizado en el lienzo de trabajo.
 */
export interface ActiveViewport {
  instanceId: string;        // UUID o ID único de la instancia en el lienzo
  presetId: string;          // Referencia al preset original o 'custom'
  name: string;
  category: DeviceCategory;
  width: number;             // Ancho actual en px (se invierte al rotar)
  height: number;            // Alto actual en px (se invierte al rotar)
  orientation: Orientation;
  zoomOverride?: number;     // Escala individual opcional (0.25 a 2.0)
  syncEnabled: boolean;      // Si este viewport participa en la sincronización
  isMuted?: boolean;
}
```

---

## 2. Protocolo del Bus de Mensajes (`BridgeProtocolContract`)

Todos los mensajes transmitidos mediante `window.postMessage` entre el **Host** y los **Viewports** deben implementar la interfaz `VisorBridgeMessage` y llevar el discriminador `channel: 'VISORR_BRIDGE_V1'`.

```typescript
export type BridgeEventType =
  | 'BRIDGE_READY'           // Emitido por el iframe cuando el DOM está listo
  | 'SYNC_SCROLL'            // Movimiento de scroll (proporcional + absoluto)
  | 'SYNC_CLICK'             // Clic sobre un elemento del DOM
  | 'SYNC_INPUT'             // Escritura o cambio de valor en inputs/selects/textareas
  | 'SYNC_NAVIGATION'        // Cambio de URL interna o History API (pushState/popState)
  | 'QA_SCAN_OVERFLOW'       // Orden del Host para auditar desbordamiento horizontal
  | 'QA_OVERFLOW_REPORT'     // Respuesta del iframe con los elementos desbordados
  | 'QA_EXTRACT_BREAKPOINTS' // Orden para escanear @media queries de las hojas CSS
  | 'QA_BREAKPOINTS_REPORT'  // Lista de breakpoints CSS encontrados
  | 'SET_COLOR_SCHEME';      // Simulación de tema ('light' | 'dark')

export interface ScrollPayload {
  ratioX: number;            // Porcentaje horizontal (0.0 a 1.0)
  ratioY: number;            // Porcentaje vertical (0.0 a 1.0)
  scrollX: number;           // Valor absoluto de respaldo en px
  scrollY: number;           // Valor absoluto de respaldo en px
}

export interface ClickPayload {
  selector: string;          // Selector CSS determinista hacia el nodo objetivo
  xRatio?: number;           // Coordenada relativa dentro del elemento
  yRatio?: number;
}

export interface InputPayload {
  selector: string;          // Selector CSS único del input/textarea/select
  value: string;
  checked?: boolean;         // Para checkboxes y radio buttons
}

export interface OverflowElementInfo {
  selector: string;          // Selector CSS del elemento que desborda
  tagName: string;
  className: string;
  overflowAmountPx: number;  // Píxeles que exceden document.documentElement.clientWidth
  rectWidth: number;
}

export interface OverflowReportPayload {
  hasOverflow: boolean;
  count: number;
  elements: OverflowElementInfo[];
}

export interface BreakpointsReportPayload {
  breakpointsPx: number[];   // Ejemplo: [480, 640, 768, 1024, 1280, 1536]
  rawMediaQueries: string[];
}

/**
 * Sobre estándar (Envelope) para toda comunicación Host <-> Iframe.
 */
export interface VisorBridgeMessage<T = unknown> {
  channel: 'VISORR_BRIDGE_V1';
  type: BridgeEventType;
  sourceInstanceId: string;  // ID del viewport emisor o 'HOST'
  timestamp: number;
  payload: T;
}
```

---

## 3. Contrato del Estado Global (`VisorStoreContract`)

```typescript
export type CanvasLayoutMode = 'horizontal' | 'grid' | 'freeform';
export type ConnectionMode = 'proxy' | 'direct';
export type ColorSchemeSimulation = 'system' | 'light' | 'dark';
export type OperationMode = 'replicas' | 'independent';

export interface SyncConfig {
  scroll: boolean;
  click: boolean;
  input: boolean;
  navigation: boolean;
}

export interface QAReportByViewport {
  [instanceId: string]: {
    overflowCount: number;
    overflowElements: OverflowElementInfo[];
    lastCheckedAt: number;
  };
}

export interface VisorState {
  // Navegación
  currentUrl: string;
  urlHistory: string[];
  connectionMode: ConnectionMode;
  reloadKey: number;

  // Lienzo (Canvas)
  canvasZoom: number;              // 0.25 (25%) a 1.50 (150%)
  autoFitCanvas: boolean;          // Escala responsiva automática para que todo quepa en pantalla
  layoutMode: CanvasLayoutMode;
  colorScheme: ColorSchemeSimulation;
  showDeviceFrames: boolean;
  showRulers: boolean;

  // Sincronización
  syncConfig: SyncConfig;

  // Viewports y QA
  viewports: ActiveViewport[];
  qaOverlayActive: boolean;
  qaReports: QAReportByViewport;
  detectedBreakpoints: number[];

  // Acciones de Estado
  setUrl: (url: string) => void;
  setConnectionMode: (mode: ConnectionMode) => void;
  reloadAll: () => void;
  setCanvasZoom: (zoom: number) => void;
  setLayoutMode: (mode: CanvasLayoutMode) => void;
  setColorScheme: (scheme: ColorSchemeSimulation) => void;
  toggleSyncOption: (key: keyof SyncConfig) => void;
  
  // Acciones de Viewports
  addViewportFromPreset: (preset: DevicePreset) => void;
  addCustomViewport: (name: string, width: number, height: number, category?: DeviceCategory) => void;
  removeViewport: (instanceId: string) => void;
  rotateViewport: (instanceId: string) => void;
  rotateAllViewports: () => void;
  toggleViewportSync: (instanceId: string) => void;
  applyWorkspacePreset: (presetName: 'essential' | 'mobile-suite' | 'tailwind-breakpoints' | 'all') => void;

  // Acciones de Auditoría QA
  toggleQAOverlay: () => void;
  updateQAReport: (instanceId: string, report: OverflowReportPayload) => void;
  setDetectedBreakpoints: (breakpoints: number[]) => void;
}
```

---

## 4. Algoritmo de Generación de Selectores CSS Deterministas
Para que los eventos `SYNC_CLICK` y `SYNC_INPUT` funcionen incluso cuando el layout cambia entre móvil y desktop:
1. **Prioridad 1:** Si el elemento tiene `id` único (`#login-btn`), usar `#id`.
2. **Prioridad 2:** Si el elemento tiene atributos de prueba o semánticos (`data-testid`, `name`, `aria-label`), usar `tagName[attr="val"]`.
3. **Prioridad 3:** Construir la ruta jerárquica corta desde el ancestro con `id` más cercano usando `:nth-of-type(n)` (ej. `form > div:nth-of-type(2) > input:nth-of-type(1)`).

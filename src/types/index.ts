/**
 * Implementación estricta de los contratos definidos en specs/03-contracts.md
 */

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
  instanceId: string;
  presetId: string;
  name: string;
  category: DeviceCategory;
  width: number;
  height: number;
  orientation: Orientation;
  zoomOverride?: number;
  syncEnabled: boolean;
  isMuted?: boolean;
  x?: number;
  y?: number;
}

export type BridgeEventType =
  | 'BRIDGE_READY'
  | 'SYNC_SCROLL'
  | 'SYNC_CLICK'
  | 'SYNC_INPUT'
  | 'SYNC_NAVIGATION'
  | 'QA_SCAN_OVERFLOW'
  | 'QA_OVERFLOW_REPORT'
  | 'QA_EXTRACT_BREAKPOINTS'
  | 'QA_BREAKPOINTS_REPORT'
  | 'SET_COLOR_SCHEME';

export interface ScrollPayload {
  ratioX: number;
  ratioY: number;
  scrollX: number;
  scrollY: number;
}

export interface ClickPayload {
  selector: string;
  xRatio?: number;
  yRatio?: number;
}

export interface InputPayload {
  selector: string;
  value: string;
  checked?: boolean;
}

export interface OverflowElementInfo {
  selector: string;
  tagName: string;
  className: string;
  overflowAmountPx: number;
  rectWidth: number;
}

export interface OverflowReportPayload {
  hasOverflow: boolean;
  count: number;
  elements: OverflowElementInfo[];
}

export interface BreakpointsReportPayload {
  breakpointsPx: number[];
  rawMediaQueries: string[];
}

/**
 * Sobre estándar (Envelope) para toda comunicación Host <-> Iframe.
 */
export interface VisorBridgeMessage<T = unknown> {
  channel: 'VISORR_BRIDGE_V1';
  type: BridgeEventType;
  sourceInstanceId: string;
  timestamp: number;
  payload: T;
}

export type CanvasLayoutMode = 'horizontal' | 'grid' | 'freeform';
export type ConnectionMode = 'proxy' | 'direct';
export type ColorSchemeSimulation = 'system' | 'light' | 'dark';
export type WorkspacePresetName = 'essential' | 'mobile-suite' | 'tailwind-breakpoints' | 'all';
export type OperationMode = 'replicas' | 'independent';

export interface SyncConfig {
  mode: OperationMode;
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
  canvasZoom: number;
  autoFitCanvas: boolean;
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
  setCanvasZoom: (zoom: number, disableAutoFit?: boolean) => void;
  setAutoFitCanvas: (autoFit: boolean) => void;
  setLayoutMode: (mode: CanvasLayoutMode) => void;
  setColorScheme: (scheme: ColorSchemeSimulation) => void;
  setOperationMode: (mode: OperationMode) => void;
  toggleSyncOption: (key: Exclude<keyof SyncConfig, 'mode'>) => void;
  toggleRulers: () => void;

  // Acciones de Viewports
  addViewportFromPreset: (preset: DevicePreset) => void;
  addCustomViewport: (name: string, width: number, height: number, category?: DeviceCategory) => void;
  removeViewport: (instanceId: string) => void;
  rotateViewport: (instanceId: string) => void;
  rotateAllViewports: () => void;
  toggleViewportSync: (instanceId: string) => void;
  reorderViewports: (sourceId: string, targetId: string) => void;
  updateViewportPosition: (instanceId: string, x: number, y: number) => void;
  applyWorkspacePreset: (presetName: WorkspacePresetName) => void;

  // Acciones de Auditoría QA
  toggleQAOverlay: () => void;
  updateQAReport: (instanceId: string, report: OverflowReportPayload) => void;
  setDetectedBreakpoints: (breakpoints: number[]) => void;
}

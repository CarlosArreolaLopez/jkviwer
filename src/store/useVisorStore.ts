import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ActiveViewport,
  CanvasLayoutMode,
  ColorSchemeSimulation,
  ConnectionMode,
  DeviceCategory,
  DevicePreset,
  OperationMode,
  OverflowReportPayload,
  SyncConfig,
  VisorState,
  WorkspacePresetName,
} from '../types';
import { createActiveViewport, getPresetSuite } from '../constants/devices';
import { DEMO_URL, normalizeTargetUrl } from '../services/urlHelper';

export const useVisorStore = create<VisorState>()(
  persist(
    (set) => ({
      currentUrl: DEMO_URL,
      urlHistory: [
        DEMO_URL,
        'http://localhost:3000',
        'http://localhost:5173',
        'https://example.com',
      ],
      connectionMode: 'proxy',
      reloadKey: 1,

      canvasZoom: 0.65,
      autoFitCanvas: true,
      layoutMode: 'horizontal',
      colorScheme: 'light',
      showDeviceFrames: true,
      showRulers: true,

      syncConfig: {
        mode: 'replicas',
        scroll: true,
        click: true,
        input: true,
        navigation: true,
      },

      viewports: getPresetSuite('essential'),
      qaOverlayActive: true,
      qaReports: {},
      detectedBreakpoints: [640, 768, 1024, 1280],

      setUrl: (rawUrl: string) =>
        set((state) => {
          const normalized = normalizeTargetUrl(rawUrl);
          const nextHistory = [
            normalized,
            ...state.urlHistory.filter((u) => u !== normalized),
          ].slice(0, 10);
          return {
            currentUrl: normalized,
            urlHistory: nextHistory,
            qaReports: {},
            reloadKey: state.reloadKey + 1,
          };
        }),

      setConnectionMode: (mode: ConnectionMode) =>
        set((state) => ({
          connectionMode: mode,
          reloadKey: state.reloadKey + 1,
        })),

      reloadAll: () =>
        set((state) => ({
          reloadKey: state.reloadKey + 1,
          qaReports: {},
        })),

      setCanvasZoom: (zoom: number, disableAutoFit = true) =>
        set((state) => ({
          canvasZoom: Math.min(1.5, Math.max(0.2, Number(zoom.toFixed(2)))),
          autoFitCanvas: disableAutoFit ? false : state.autoFitCanvas,
        })),

      setAutoFitCanvas: (autoFit: boolean) => set({ autoFitCanvas: autoFit }),

      setLayoutMode: (mode: CanvasLayoutMode) => set({ layoutMode: mode }),

      setColorScheme: (scheme: ColorSchemeSimulation) => set({ colorScheme: scheme }),

      setOperationMode: (mode: OperationMode) =>
        set((state) => ({
          syncConfig: {
            ...state.syncConfig,
            mode,
            scroll: mode === 'replicas' ? true : state.syncConfig.scroll,
            click: mode === 'replicas' ? true : state.syncConfig.click,
            input: mode === 'replicas' ? true : state.syncConfig.input,
            navigation: mode === 'replicas' ? true : state.syncConfig.navigation,
          },
          viewports: state.viewports.map((vp) => ({
            ...vp,
            syncEnabled: mode === 'replicas',
          })),
        })),

      toggleSyncOption: (key: Exclude<keyof SyncConfig, 'mode'>) =>
        set((state) => ({
          syncConfig: {
            ...state.syncConfig,
            [key]: !state.syncConfig[key],
          },
        })),

      toggleRulers: () =>
        set((state) => ({
          showRulers: !state.showRulers,
        })),

      addViewportFromPreset: (preset: DevicePreset) =>
        set((state) => ({
          viewports: [...state.viewports, createActiveViewport(preset)],
        })),

      addCustomViewport: (
        name: string,
        width: number,
        height: number,
        category: DeviceCategory = 'custom'
      ) =>
        set((state) => {
          const safeW = Math.max(240, Math.min(3840, Math.round(width)));
          const safeH = Math.max(240, Math.min(2160, Math.round(height)));
          const customVp: ActiveViewport = {
            instanceId: `vp-custom-${Date.now().toString(36)}`,
            presetId: 'custom',
            name: name.trim() || `Custom ${safeW}×${safeH}`,
            category,
            width: safeW,
            height: safeH,
            orientation: safeW > safeH ? 'landscape' : 'portrait',
            syncEnabled: true,
          };
          return {
            viewports: [...state.viewports, customVp],
          };
        }),

      removeViewport: (instanceId: string) =>
        set((state) => {
          const nextReports = { ...state.qaReports };
          delete nextReports[instanceId];
          return {
            viewports: state.viewports.filter((v) => v.instanceId !== instanceId),
            qaReports: nextReports,
          };
        }),

      rotateViewport: (instanceId: string) =>
        set((state) => ({
          viewports: state.viewports.map((vp) => {
            if (vp.instanceId !== instanceId) return vp;
            const nextWidth = vp.height;
            const nextHeight = vp.width;
            return {
              ...vp,
              width: nextWidth,
              height: nextHeight,
              orientation: nextWidth > nextHeight ? 'landscape' : 'portrait',
            };
          }),
        })),

      rotateAllViewports: () =>
        set((state) => ({
          viewports: state.viewports.map((vp) => {
            const nextWidth = vp.height;
            const nextHeight = vp.width;
            return {
              ...vp,
              width: nextWidth,
              height: nextHeight,
              orientation: nextWidth > nextHeight ? 'landscape' : 'portrait',
            };
          }),
        })),

      toggleViewportSync: (instanceId: string) =>
        set((state) => {
          const nextViewports = state.viewports.map((vp) =>
            vp.instanceId === instanceId ? { ...vp, syncEnabled: !vp.syncEnabled } : vp
          );
          const anySynced = nextViewports.some((vp) => vp.syncEnabled);
          return {
            viewports: nextViewports,
            syncConfig: {
              ...state.syncConfig,
              mode: anySynced ? 'replicas' : 'independent',
            },
          };
        }),

      reorderViewports: (sourceId: string, targetId: string) =>
        set((state) => {
          if (sourceId === targetId) return state;
          const list = [...state.viewports];
          const sourceIndex = list.findIndex((v) => v.instanceId === sourceId);
          const targetIndex = list.findIndex((v) => v.instanceId === targetId);
          if (sourceIndex === -1 || targetIndex === -1) return state;
          const [moved] = list.splice(sourceIndex, 1);
          list.splice(targetIndex, 0, moved);
          return { viewports: list };
        }),

      updateViewportPosition: (instanceId: string, x: number, y: number) =>
        set((state) => ({
          viewports: state.viewports.map((vp) =>
            vp.instanceId === instanceId
              ? { ...vp, x: Math.max(12, Math.round(x)), y: Math.max(12, Math.round(y)) }
              : vp
          ),
        })),

      applyWorkspacePreset: (presetName: WorkspacePresetName) =>
        set({
          viewports: getPresetSuite(presetName),
          qaReports: {},
        }),

      toggleQAOverlay: () =>
        set((state) => ({
          qaOverlayActive: !state.qaOverlayActive,
        })),

      updateQAReport: (instanceId: string, report: OverflowReportPayload) =>
        set((state) => ({
          qaReports: {
            ...state.qaReports,
            [instanceId]: {
              overflowCount: report.count,
              overflowElements: report.elements,
              lastCheckedAt: Date.now(),
            },
          },
        })),

      setDetectedBreakpoints: (breakpoints: number[]) =>
        set({
          detectedBreakpoints: breakpoints,
        }),
    }),
    {
      name: 'visorr-workspace-storage-v1',
      partialize: (state) => ({
        currentUrl: state.currentUrl,
        urlHistory: state.urlHistory,
        connectionMode: state.connectionMode,
        canvasZoom: state.canvasZoom,
        autoFitCanvas: state.autoFitCanvas,
        layoutMode: state.layoutMode,
        colorScheme: state.colorScheme,
        syncConfig: state.syncConfig,
        viewports: state.viewports,
        qaOverlayActive: state.qaOverlayActive,
        showRulers: state.showRulers,
      }),
    }
  )
);

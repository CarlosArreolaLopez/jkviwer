import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeTargetUrl, buildIframeSrc, DEMO_URL } from '../src/services/urlHelper';
import { useVisorStore } from '../src/store/useVisorStore';
import { generateBridgeScriptString } from '../src/bridge/bridgeScript';
import { DEVICE_CATALOG } from '../src/constants/devices';

describe('SDD Verification Suite - VisorR Contracts & Business Logic', () => {
  beforeEach(() => {
    useVisorStore.getState().applyWorkspacePreset('essential');
  });

  describe('US-01: Normalización de URLs y Construcción de Rutas Proxy', () => {
    it('convierte puertos localhost sin protocolo a http://localhost:xxxx', () => {
      expect(normalizeTargetUrl('localhost:3000')).toBe('http://localhost:3000');
      expect(normalizeTargetUrl('127.0.0.1:8080/dashboard')).toBe(
        'http://127.0.0.1:8080/dashboard'
      );
    });

    it('añade https:// a dominios externos sin protocolo', () => {
      expect(normalizeTargetUrl('example.com')).toBe('https://example.com');
    });

    it('genera la ruta del interceptor proxy con instanceId inyectado', () => {
      const src = buildIframeSrc('http://localhost:4200', 'vp-test-1', 'proxy', 2);
      expect(src).toContain('/__visorr_proxy__?url=');
      expect(src).toContain(encodeURIComponent('http://localhost:4200'));
      expect(src).toContain('__visorr_id=vp-test-1');
    });

    it('resuelve el laboratorio demo integrado cuando se usa DEMO_URL', () => {
      const src = buildIframeSrc(DEMO_URL, 'vp-demo-1', 'proxy', 1);
      expect(src).toContain('/__visorr_demo__?__visorr_id=vp-demo-1');
    });
  });

  describe('US-02: Gestión de Viewports y Rotación Portrait/Landscape', () => {
    it('inicializa la suite esencial con 3 dispositivos (Móvil, Tablet, Laptop)', () => {
      const { viewports } = useVisorStore.getState();
      expect(viewports.length).toBe(3);
      expect(viewports[0].category).toBe('mobile');
      expect(viewports[1].category).toBe('tablet');
      expect(viewports[2].category).toBe('laptop');
    });

    it('invierte exactamente width y height al rotar un viewport individual (Criterio 2.2)', () => {
      const state = useVisorStore.getState();
      const target = state.viewports[0];
      const originalW = target.width;
      const originalH = target.height;

      state.rotateViewport(target.instanceId);

      const rotated = useVisorStore
        .getState()
        .viewports.find((v) => v.instanceId === target.instanceId)!;

      expect(rotated.width).toBe(originalH);
      expect(rotated.height).toBe(originalW);
      expect(rotated.orientation).toBe('landscape');
    });

    it('permite agregar un dispositivo del catálogo y un viewport personalizado', () => {
      const state = useVisorStore.getState();
      state.addViewportFromPreset(DEVICE_CATALOG[0]);
      state.addCustomViewport('TV 4K', 1920, 1080);

      const updated = useVisorStore.getState().viewports;
      expect(updated.length).toBe(5);
      expect(updated[4].name).toBe('TV 4K');
      expect(updated[4].width).toBe(1920);
    });

    it('permite reordenar simuladores mediante Drag & Drop y actualizar coordenadas X,Y en Lienzo Libre', () => {
      const state = useVisorStore.getState();
      const firstId = state.viewports[0].instanceId;
      const thirdId = state.viewports[2].instanceId;

      state.reorderViewports(firstId, thirdId);
      const reordered = useVisorStore.getState().viewports;
      expect(reordered[2].instanceId).toBe(firstId);

      reordered[0] && useVisorStore.getState().updateViewportPosition(firstId, 420, 180);
      const movedVp = useVisorStore
        .getState()
        .viewports.find((v) => v.instanceId === firstId)!;
      expect(movedVp.x).toBe(420);
      expect(movedVp.y).toBe(180);
    });
  });

  describe('US-03 & US-05: Contrato del Agente Inyectado y Conmutador Réplicas vs Independientes', () => {
    it('incluye el canal oficial VISORR_BRIDGE_V1 y todos los manejadores del contrato', () => {
      const script = generateBridgeScriptString();
      expect(script).toContain('VISORR_BRIDGE_V1');
      expect(script).toContain('SYNC_SCROLL');
      expect(script).toContain('SYNC_CLICK');
      expect(script).toContain('SYNC_INPUT');
      expect(script).toContain('QA_SCAN_OVERFLOW');
      expect(script).toContain('QA_OVERFLOW_REPORT');
      expect(script).toContain('QA_BREAKPOINTS_REPORT');
    });

    it('permite alternar globalmente e individualmente entre Modo Réplicas y Modo Independientes', () => {
      const state = useVisorStore.getState();
      expect(state.syncConfig.mode).toBe('replicas');
      expect(state.viewports.every((v) => v.syncEnabled)).toBe(true);

      // Cambiar a modo Independiente global
      state.setOperationMode('independent');
      const indepState = useVisorStore.getState();
      expect(indepState.syncConfig.mode).toBe('independent');
      expect(indepState.viewports.every((v) => !v.syncEnabled)).toBe(true);

      // Volver a modo Réplicas global
      indepState.setOperationMode('replicas');
      const repState = useVisorStore.getState();
      expect(repState.syncConfig.mode).toBe('replicas');
      expect(repState.viewports.every((v) => v.syncEnabled)).toBe(true);
    });
  });
});

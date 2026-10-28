import {
  BreakpointsReportPayload,
  ColorSchemeSimulation,
  OverflowReportPayload,
  VisorBridgeMessage,
} from '../types';
import { useVisorStore } from '../store/useVisorStore';

class SyncEngineService {
  private iframeRegistry = new Map<string, HTMLIFrameElement>();
  private initialized = false;

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    window.addEventListener('message', this.handleIncomingMessage);
    this.initialized = true;
  }

  public destroy(): void {
    if (!this.initialized || typeof window === 'undefined') return;
    window.removeEventListener('message', this.handleIncomingMessage);
    this.initialized = false;
  }

  public registerViewport(instanceId: string, iframe: HTMLIFrameElement | null): void {
    if (!iframe) {
      this.iframeRegistry.delete(instanceId);
      return;
    }
    this.iframeRegistry.set(instanceId, iframe);
  }

  public unregisterViewport(instanceId: string): void {
    this.iframeRegistry.delete(instanceId);
  }

  public broadcastOverflowScan(active: boolean): void {
    this.broadcastFromHost('QA_SCAN_OVERFLOW', { active });
  }

  public broadcastColorScheme(scheme: ColorSchemeSimulation): void {
    this.broadcastFromHost('SET_COLOR_SCHEME', { scheme });
  }

  public requestBreakpointsExtraction(): void {
    this.broadcastFromHost('QA_EXTRACT_BREAKPOINTS', {});
  }

  private broadcastFromHost<T>(type: VisorBridgeMessage<T>['type'], payload: T): void {
    const message: VisorBridgeMessage<T> = {
      channel: 'VISORR_BRIDGE_V1',
      type,
      sourceInstanceId: 'HOST',
      timestamp: Date.now(),
      payload,
    };

    for (const [, iframe] of this.iframeRegistry.entries()) {
      iframe.contentWindow?.postMessage(message, '*');
    }
  }

  private handleIncomingMessage = (event: MessageEvent): void => {
    const msg = event.data as VisorBridgeMessage | undefined;
    if (!msg || msg.channel !== 'VISORR_BRIDGE_V1') return;

    const state = useVisorStore.getState();

    // Resolver el instanceId tanto por payload como por event.source (contentWindow del iframe)
    let resolvedSourceId = msg.sourceInstanceId;
    if (!resolvedSourceId || !this.iframeRegistry.has(resolvedSourceId)) {
      for (const [id, iframeEl] of this.iframeRegistry.entries()) {
        if (iframeEl.contentWindow === event.source) {
          resolvedSourceId = id;
          break;
        }
      }
    }

    const sourceViewport = state.viewports.find((v) => v.instanceId === resolvedSourceId);

    switch (msg.type) {
      case 'BRIDGE_READY': {
        // Al inicializar un viewport, enviarle el estado actual de auditoría QA y tema
        const targetIframe = this.iframeRegistry.get(resolvedSourceId);
        if (targetIframe?.contentWindow) {
          targetIframe.contentWindow.postMessage(
            {
              channel: 'VISORR_BRIDGE_V1',
              type: 'QA_SCAN_OVERFLOW',
              sourceInstanceId: 'HOST',
              timestamp: Date.now(),
              payload: { active: state.qaOverlayActive },
            },
            '*'
          );
          targetIframe.contentWindow.postMessage(
            {
              channel: 'VISORR_BRIDGE_V1',
              type: 'SET_COLOR_SCHEME',
              sourceInstanceId: 'HOST',
              timestamp: Date.now(),
              payload: { scheme: state.colorScheme },
            },
            '*'
          );
        }
        break;
      }

      case 'SYNC_SCROLL': {
        if (state.syncConfig.mode === 'independent' || !state.syncConfig.scroll) return;
        if (sourceViewport && !sourceViewport.syncEnabled) return;
        this.relayToPeers({ ...msg, sourceInstanceId: resolvedSourceId });
        break;
      }

      case 'SYNC_CLICK': {
        if (state.syncConfig.mode === 'independent' || !state.syncConfig.click) return;
        if (sourceViewport && !sourceViewport.syncEnabled) return;
        this.relayToPeers({ ...msg, sourceInstanceId: resolvedSourceId });
        break;
      }

      case 'SYNC_INPUT': {
        if (state.syncConfig.mode === 'independent' || !state.syncConfig.input) return;
        if (sourceViewport && !sourceViewport.syncEnabled) return;
        this.relayToPeers({ ...msg, sourceInstanceId: resolvedSourceId });
        break;
      }

      case 'SYNC_NAVIGATION': {
        if (state.syncConfig.mode === 'independent' || !state.syncConfig.navigation) return;
        if (sourceViewport && !sourceViewport.syncEnabled) return;
        this.relayToPeers({ ...msg, sourceInstanceId: resolvedSourceId });
        break;
      }

      case 'QA_OVERFLOW_REPORT': {
        const report = msg.payload as OverflowReportPayload;
        state.updateQAReport(resolvedSourceId, report);
        break;
      }

      case 'QA_BREAKPOINTS_REPORT': {
        const bpReport = msg.payload as BreakpointsReportPayload;
        if (bpReport.breakpointsPx && bpReport.breakpointsPx.length > 0) {
          state.setDetectedBreakpoints(bpReport.breakpointsPx);
        }
        break;
      }
    }
  };

  private relayToPeers(msg: VisorBridgeMessage): void {
    const state = useVisorStore.getState();
    for (const vp of state.viewports) {
      if (vp.instanceId === msg.sourceInstanceId || !vp.syncEnabled) continue;
      const peerIframe = this.iframeRegistry.get(vp.instanceId);
      peerIframe?.contentWindow?.postMessage(msg, '*');
    }
  }
}

export const syncEngine = new SyncEngineService();

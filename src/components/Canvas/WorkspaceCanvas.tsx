import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MonitorOff, GripHorizontal, Move } from 'lucide-react';
import { useVisorStore } from '../../store/useVisorStore';
import { ViewportFrame } from '../Viewport/ViewportFrame';
import { syncEngine } from '../../services/syncEngine';
import { DEVICE_CATALOG } from '../../constants/devices';

export const WorkspaceCanvas: React.FC = () => {
  const {
    viewports,
    layoutMode,
    canvasZoom,
    autoFitCanvas,
    setCanvasZoom,
    setLayoutMode,
    addViewportFromPreset,
    reorderViewports,
    applyWorkspacePreset,
  } = useVisorStore();

  const mainRef = useRef<HTMLElement | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  useEffect(() => {
    syncEngine.init();
    return () => {
      syncEngine.destroy();
    };
  }, []);

  // Motor de Auto-Ajuste Responsivo (Auto-Fit): calcula la escala exacta según el ancho y alto del monitor del usuario
  const recalculateAutoFitZoom = useCallback(() => {
    if (!autoFitCanvas || !mainRef.current || viewports.length === 0) return;
    if (layoutMode === 'freeform') return;

    const containerWidth = mainRef.current.clientWidth;
    const containerHeight = mainRef.current.clientHeight;
    if (containerWidth < 200 || containerHeight < 200) return;

    const horizontalPadding = 56;
    const verticalPadding = 110;
    const gap = 24;

    if (layoutMode === 'horizontal') {
      const totalLogicalWidth = viewports.reduce((sum, vp) => sum + vp.width, 0);
      const maxLogicalHeight = Math.max(...viewports.map((vp) => vp.height), 600);
      const availableW = Math.max(240, containerWidth - horizontalPadding - gap * (viewports.length - 1));
      const availableH = Math.max(240, containerHeight - verticalPadding);

      const fitW = availableW / totalLogicalWidth;
      const fitH = availableH / maxLogicalHeight;
      const optimalZoom = Math.min(1.0, Math.max(0.22, Math.min(fitW, fitH)));
      setCanvasZoom(optimalZoom, false);
    } else if (layoutMode === 'grid') {
      // En modo cuadrícula, escalar para que el dispositivo más ancho quepa cómodamente junto a otros
      const maxDeviceW = Math.max(...viewports.map((vp) => vp.width), 800);
      const availableW = Math.max(280, containerWidth - horizontalPadding);
      const fitGrid = Math.min(0.85, Math.max(0.35, (availableW * 0.48) / maxDeviceW));
      setCanvasZoom(fitGrid, false);
    }
  }, [autoFitCanvas, layoutMode, viewports, setCanvasZoom]);

  useEffect(() => {
    recalculateAutoFitZoom();
  }, [recalculateAutoFitZoom]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      recalculateAutoFitZoom();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [recalculateAutoFitZoom]);

  // Soporte de Ctrl + Rueda del ratón para hacer zoom manual en el lienzo
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      setCanvasZoom(canvasZoom + delta, true);
    }
  };

  // Soporte para soltar dispositivos arrastrados desde el catálogo del Sidebar hacia el lienzo
  const handleCanvasDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/visorr-preset-id')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    const presetId = e.dataTransfer.getData('application/visorr-preset-id');
    if (presetId) {
      e.preventDefault();
      const preset = DEVICE_CATALOG.find((d) => d.id === presetId);
      if (preset) {
        addViewportFromPreset(preset);
      }
    }
  };

  return (
    <main
      ref={mainRef}
      onWheel={handleWheel}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      className="flex-1 h-full overflow-auto relative bg-[#090d16]"
      style={{
        backgroundImage:
          'radial-gradient(rgba(148, 163, 184, 0.14) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      {/* Indicador flotante de modo Drag & Drop */}
      {viewports.length > 0 && (
        <div className="sticky top-2 left-4 z-20 inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] text-slate-300 shadow-lg backdrop-blur max-w-[calc(100%-2rem)]">
          {layoutMode === 'freeform' ? (
            <>
              <Move className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>
                <strong>Lienzo Libre 2D:</strong> Arrastra cualquier simulador desde su barra superior.
              </span>
              <button
                type="button"
                onClick={() => setLayoutMode('horizontal')}
                className="ml-1 text-blue-400 hover:underline font-medium"
              >
                Volver a Fila Ordenada
              </button>
            </>
          ) : (
            <>
              <GripHorizontal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                <strong>Drag & Drop:</strong> Arrastra la cabecera de un simulador para reordenar, o activa
              </span>
              <button
                type="button"
                onClick={() => setLayoutMode('freeform')}
                className="text-blue-400 hover:underline font-semibold"
              >
                Lienzo Libre 2D
              </button>
            </>
          )}
        </div>
      )}

      {viewports.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <MonitorOff className="w-7 h-7 text-slate-500" />
          </div>
          <h2 className="text-base font-semibold text-slate-200 mb-1">
            No hay viewports activos en el lienzo
          </h2>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            Selecciona un dispositivo del catálogo izquierdo o restaura la suite esencial de arquitectura para comenzar a validar.
          </p>
          <button
            type="button"
            onClick={() => applyWorkspacePreset('essential')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition"
          >
            Cargar Suite Esencial (Móvil + Tablet + Desktop)
          </button>
        </div>
      ) : (
        <div
          className={`p-5 ${
            layoutMode === 'freeform'
              ? 'relative min-w-[2600px] min-h-[1600px]'
              : layoutMode === 'horizontal'
                ? 'flex flex-row items-start gap-5 min-w-max'
                : 'flex flex-wrap items-start gap-5 max-w-full'
          }`}
        >
          {viewports.map((vp, index) => (
            <ViewportFrame
              key={vp.instanceId}
              viewport={vp}
              index={index}
              activeDragId={activeDragId}
              onStartSortDrag={(id) => setActiveDragId(id)}
              onHoverSortTarget={(targetId) => {
                if (activeDragId && activeDragId !== targetId) {
                  reorderViewports(activeDragId, targetId);
                }
              }}
              onEndSortDrag={() => setActiveDragId(null)}
            />
          ))}
        </div>
      )}
    </main>
  );
};

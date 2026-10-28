import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  Trash2,
  Link2,
  Link2Off,
  Smartphone,
  Tablet,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  GripVertical,
} from 'lucide-react';
import { ActiveViewport } from '../../types';
import { useVisorStore } from '../../store/useVisorStore';
import { buildIframeSrc } from '../../services/urlHelper';
import { syncEngine } from '../../services/syncEngine';

interface ViewportFrameProps {
  viewport: ActiveViewport;
  index: number;
  activeDragId: string | null;
  onStartSortDrag: (instanceId: string) => void;
  onHoverSortTarget: (targetId: string) => void;
  onEndSortDrag: () => void;
}

export const ViewportFrame: React.FC<ViewportFrameProps> = ({
  viewport,
  index,
  activeDragId,
  onStartSortDrag,
  onHoverSortTarget,
  onEndSortDrag,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const {
    currentUrl,
    connectionMode,
    reloadKey,
    canvasZoom,
    layoutMode,
    qaOverlayActive,
    qaReports,
    rotateViewport,
    removeViewport,
    toggleViewportSync,
    updateViewportPosition,
  } = useVisorStore();

  const [isFreeDragging, setIsFreeDragging] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const dragOriginRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  useEffect(() => {
    syncEngine.registerViewport(viewport.instanceId, iframeRef.current);
    return () => {
      syncEngine.unregisterViewport(viewport.instanceId);
    };
  }, [viewport.instanceId]);

  const effectiveZoom = viewport.zoomOverride ?? canvasZoom;
  const scaledWidth = Math.round(viewport.width * effectiveZoom);
  const scaledHeight = Math.round(viewport.height * effectiveZoom);
  const isCompactHeader = scaledWidth < 310;

  // Coordenadas por defecto si se activa el modo Lienzo Libre (Freeform 2D)
  const defaultX = 28 + index * (scaledWidth + 32);
  const defaultY = 28;
  const posX = viewport.x ?? defaultX;
  const posY = viewport.y ?? defaultY;

  const iframeSrc = buildIframeSrc(
    currentUrl,
    viewport.instanceId,
    connectionMode,
    reloadKey
  );

  const report = qaReports[viewport.instanceId];
  const overflowCount = report?.overflowCount || 0;
  const isBeingDragged = activeDragId === viewport.instanceId || isFreeDragging;

  const getIcon = () => {
    if (viewport.category === 'mobile') return <Smartphone className="w-3.5 h-3.5 text-blue-400" />;
    if (viewport.category === 'tablet') return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
    return <Monitor className="w-3.5 h-3.5 text-emerald-400" />;
  };

  // Drag libre 2D (Pointer Events sobre la barra superior del simulador)
  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (layoutMode !== 'freeform') return;
    // Ignorar si hizo clic en un botón de acción
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsFreeDragging(true);
    dragOriginRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      initialX: posX,
      initialY: posY,
    };
  };

  const handleHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isFreeDragging || !dragOriginRef.current) return;
    const dx = e.clientX - dragOriginRef.current.startMouseX;
    const dy = e.clientY - dragOriginRef.current.startMouseY;
    updateViewportPosition(
      viewport.instanceId,
      dragOriginRef.current.initialX + dx,
      dragOriginRef.current.initialY + dy
    );
  };

  const handleHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isFreeDragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsFreeDragging(false);
    dragOriginRef.current = null;
  };

  // HTML5 Drag & Drop para reordenar tarjetas en modo Horizontal o Grid
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (layoutMode === 'freeform') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', viewport.instanceId);
    onStartSortDrag(viewport.instanceId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (layoutMode === 'freeform' || !activeDragId || activeDragId === viewport.instanceId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDropTarget) setIsDropTarget(true);
  };

  const handleDragLeave = () => {
    if (isDropTarget) setIsDropTarget(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropTarget(false);
    if (activeDragId && activeDragId !== viewport.instanceId) {
      onHoverSortTarget(viewport.instanceId);
    }
    onEndSortDrag();
  };

  const handleDragEnd = () => {
    setIsDropTarget(false);
    onEndSortDrag();
  };

  return (
    <div
      draggable={layoutMode !== 'freeform'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={`flex flex-col shrink-0 transition-shadow ${
        layoutMode === 'freeform' ? 'absolute' : 'relative'
      } ${isBeingDragged ? 'opacity-90 ring-2 ring-blue-500 z-40 shadow-2xl' : 'z-10'} ${
        isDropTarget ? 'ring-2 ring-indigo-400 scale-[1.01]' : ''
      }`}
      style={{
        width: `${scaledWidth}px`,
        ...(layoutMode === 'freeform'
          ? {
              left: `${posX}px`,
              top: `${posY}px`,
            }
          : {}),
      }}
    >
      {/* Cabecera del Marco del Dispositivo (Zona de Drag & Drop, exactamente del mismo ancho que el lienzo) */}
      <div
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        style={{ width: `${scaledWidth}px` }}
        title={
          layoutMode === 'freeform'
            ? 'Arrastra libremente este simulador a cualquier lugar del lienzo'
            : 'Arrastra desde aquí para cambiar el orden del simulador'
        }
        className={`px-2 py-1.5 rounded-t-xl border-x border-t flex items-center justify-between gap-1 select-none cursor-grab active:cursor-grabbing overflow-hidden ${
          qaOverlayActive && overflowCount > 0
            ? 'bg-red-950/70 border-red-500/60'
            : 'bg-slate-900/95 border-slate-700/80 hover:bg-slate-800/90'
        }`}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
          <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          {getIcon()}
          <span
            className="text-[11px] font-semibold text-slate-100 truncate"
            title={`${viewport.name} (${viewport.width}×${viewport.height})`}
          >
            {viewport.name}
          </span>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
            {viewport.width}×{viewport.height}
          </span>
        </div>

        {/* Controles y Estado QA del Dispositivo */}
        <div className="flex items-center gap-0.5 shrink-0">
          {qaOverlayActive && (
            <span
              title={
                overflowCount > 0
                  ? `${overflowCount} elemento(s) exceden el ancho de ${viewport.width}px`
                  : 'Sin desbordamiento horizontal'
              }
              className={`px-1 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 ${
                overflowCount > 0
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-emerald-500/15 text-emerald-300'
              }`}
            >
              {overflowCount > 0 ? (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  {overflowCount}
                </>
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
            </span>
          )}

          <button
            type="button"
            onClick={() => toggleViewportSync(viewport.instanceId)}
            title={
              viewport.syncEnabled
                ? 'En modo Réplica (Clic para volver independiente solo este dispositivo)'
                : 'Dispositivo Independiente (Clic para unir a las Réplicas)'
            }
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border transition ${
              viewport.syncEnabled
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 hover:bg-blue-500/25'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
            }`}
          >
            {viewport.syncEnabled ? (
              <>
                <Link2 className="w-3 h-3" />
                {!isCompactHeader && <span>Réplica</span>}
              </>
            ) : (
              <>
                <Link2Off className="w-3 h-3" />
                {!isCompactHeader && <span>Indep.</span>}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => rotateViewport(viewport.instanceId)}
            title="Rotar dispositivo (Portrait / Landscape)"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => removeViewport(viewport.instanceId)}
            title="Cerrar dispositivo"
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Contenedor Geométrico con Escala CSS (US-04 Criterio 4.1) */}
      <div
        className={`relative overflow-hidden rounded-b-xl border-x border-b bg-white shadow-2xl box-border ${
          qaOverlayActive && overflowCount > 0 ? 'border-red-500/70' : 'border-slate-700/80'
        }`}
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
        }}
      >
        {/* Escudo transparente temporal mientras se arrastra para que el iframe no robe los eventos del puntero */}
        {Boolean(activeDragId || isFreeDragging) && (
          <div className="absolute inset-0 z-30 bg-blue-500/5 backdrop-blur-[0.5px] cursor-grabbing" />
        )}

        <iframe
          ref={iframeRef}
          name={viewport.instanceId}
          title={`${viewport.name} (${viewport.width}x${viewport.height})`}
          src={iframeSrc}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          style={{
            width: `${viewport.width}px`,
            height: `${viewport.height}px`,
            transform: `scale(${effectiveZoom})`,
            transformOrigin: '0 0',
            border: 'none',
            display: 'block',
          }}
        />
      </div>

      {/* Lista rápida de selectores con Overflow si se detectan bugs en este viewport */}
      {qaOverlayActive && overflowCount > 0 && report?.overflowElements && (
        <div
          style={{ width: `${scaledWidth}px` }}
          className="mt-1.5 p-2 rounded-lg bg-red-950/50 border border-red-500/40 text-[11px] text-red-200 space-y-1 overflow-hidden"
        >
          <div className="font-semibold flex items-center gap-1 text-red-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Overflow detectado en {viewport.name}:</span>
          </div>
          {report.overflowElements.slice(0, 3).map((item, idx) => (
            <div
              key={`${item.selector}-${idx}`}
              className="font-mono text-[10px] bg-red-950/80 px-1.5 py-0.5 rounded truncate"
              title={item.selector}
            >
              +{item.overflowAmountPx}px ({item.rectWidth}px) → {item.selector}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

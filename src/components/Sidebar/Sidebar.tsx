import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  Plus,
  Layers,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useVisorStore } from '../../store/useVisorStore';
import { DEVICE_CATALOG } from '../../constants/devices';
import { DeviceCategory, WorkspacePresetName } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    viewports,
    detectedBreakpoints,
    qaReports,
    addViewportFromPreset,
    addCustomViewport,
    applyWorkspacePreset,
  } = useVisorStore();

  const [collapsed, setCollapsed] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWidth, setCustomWidth] = useState('390');
  const [customHeight, setCustomHeight] = useState('844');

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseInt(customWidth, 10) || 390;
    const h = parseInt(customHeight, 10) || 844;
    addCustomViewport(customName || `Custom ${w}×${h}`, w, h, 'custom');
    setCustomName('');
  };

  const getCategoryIcon = (cat: DeviceCategory) => {
    if (cat === 'mobile') return <Smartphone className="w-3.5 h-3.5 text-blue-400" />;
    if (cat === 'tablet') return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
    return <Monitor className="w-3.5 h-3.5 text-emerald-400" />;
  };

  if (collapsed) {
    return (
      <aside className="w-11 bg-[#0f172a] border-r border-slate-800 flex flex-col items-center py-3 gap-4 z-20 shrink-0">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Expandir Panel de Arquitectura y Dispositivos"
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 xl:w-72 bg-[#0f172a] border-r border-slate-800 flex flex-col h-full select-none z-20 shrink-0">
      {/* Cabecera del Sidebar */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Workspaces & QA
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="Contraer Panel"
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-5">
        {/* 1. Suites de Trabajo Rápidas */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Suites de Arquitectura
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { id: 'essential', label: 'Trío Esencial' },
                { id: 'mobile-suite', label: 'Suite Móvil' },
                { id: 'tailwind-breakpoints', label: 'Tailwind CSS' },
                { id: 'all', label: 'Matriz Full (6)' },
              ] as { id: WorkspacePresetName; label: string }[]
            ).map((suite) => (
              <button
                key={suite.id}
                type="button"
                onClick={() => applyWorkspacePreset(suite.id)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/40 text-left text-xs text-slate-200 transition"
              >
                {suite.label}
              </button>
            ))}
          </div>
        </section>

        {/* 2. Breakpoints CSS Detectados Automáticamente (US-05) */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Breakpoints CSS Activos
            </h3>
            <span className="text-[10px] text-slate-500">{detectedBreakpoints.length} detectados</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
            Extraídos de las reglas <code>@media</code> de la app. Haz clic en uno para instanciar su viewport:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {detectedBreakpoints.map((bp) => (
              <button
                key={bp}
                type="button"
                onClick={() =>
                  addCustomViewport(
                    `Breakpoint ${bp}px`,
                    bp,
                    bp < 768 ? 820 : 900,
                    bp < 640 ? 'mobile' : bp < 1024 ? 'tablet' : 'desktop'
                  )
                }
                className="px-2 py-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-mono transition"
                title={`Añadir viewport de ${bp}px de ancho`}
              >
                +{bp}px
              </button>
            ))}
          </div>
        </section>

        {/* 3. Catálogo de Dispositivos Reales */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Catálogo de Dispositivos
          </h3>
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {DEVICE_CATALOG.map((preset) => (
              <button
                key={preset.id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/visorr-preset-id', preset.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => addViewportFromPreset(preset)}
                title="Haz clic o arrastra este dispositivo hacia el lienzo"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800/70 flex items-center justify-between text-xs text-slate-200 group transition cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-2 truncate">
                  {getCategoryIcon(preset.category)}
                  <span className="truncate">{preset.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">
                    {preset.width}×{preset.height}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 4. Creación de Viewport Personalizado */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Dimensión Personalizada
          </h3>
          <form onSubmit={handleAddCustom} className="space-y-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nombre (ej. Kiosco Vertical)"
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Ancho (px)</label>
                <input
                  type="number"
                  min={240}
                  max={3840}
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Alto (px)</label>
                <input
                  type="number"
                  min={240}
                  max={2160}
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir al Lienzo
            </button>
          </form>
        </section>

        {/* 5. Resumen de Estado QA por Dispositivo Activo */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Auditoría en Tiempo Real ({viewports.length})
          </h3>
          <div className="space-y-1.5">
            {viewports.map((vp) => {
              const report = qaReports[vp.instanceId];
              const count = report?.overflowCount || 0;
              return (
                <div
                  key={vp.instanceId}
                  className="px-2.5 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <div className="font-medium text-slate-200 truncate">{vp.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {vp.width}×{vp.height}px · {vp.orientation}
                    </div>
                  </div>
                  {count > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      {count} bug{count > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      OK
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
};

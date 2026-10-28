import React, { useState, useEffect } from 'react';
import {
  Globe,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Columns,
  LayoutGrid,
  Move,
  ShieldAlert,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  Link2,
  Unlink,
  MousePointerClick,
  Keyboard,
  ArrowUpDown,
  Maximize2,
} from 'lucide-react';
import { useVisorStore } from '../../store/useVisorStore';
import { DEMO_URL } from '../../services/urlHelper';
import { syncEngine } from '../../services/syncEngine';

export const Topbar: React.FC = () => {
  const {
    currentUrl,
    urlHistory,
    connectionMode,
    canvasZoom,
    autoFitCanvas,
    layoutMode,
    colorScheme,
    syncConfig,
    qaOverlayActive,
    qaReports,
    setUrl,
    setConnectionMode,
    reloadAll,
    setCanvasZoom,
    setAutoFitCanvas,
    setLayoutMode,
    setColorScheme,
    setOperationMode,
    toggleSyncOption,
    rotateAllViewports,
    toggleQAOverlay,
  } = useVisorStore();

  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setInputUrl(currentUrl);
  }, [currentUrl]);

  const totalOverflows = Object.values(qaReports).reduce(
    (acc, r) => acc + (r?.overflowCount || 0),
    0
  );

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrl(inputUrl);
    setShowHistory(false);
  };

  const handleToggleQA = () => {
    const nextState = !qaOverlayActive;
    toggleQAOverlay();
    syncEngine.broadcastOverflowScan(nextState);
  };

  const handleSetOperationMode = (mode: 'replicas' | 'independent') => {
    setOperationMode(mode);
  };

  const handleToggleTheme = () => {
    const nextTheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(nextTheme);
    syncEngine.broadcastColorScheme(nextTheme);
  };

  return (
    <header className="min-h-14 py-1.5 bg-[#0f172a] border-b border-slate-800 px-3 flex flex-wrap items-center justify-between gap-2 select-none z-30">
      {/* Marca / Identidad */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
          <Columns className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-white text-sm">JkViwer</span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
              SDD v1.0
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-none hidden xl:block">
            Responsive Architecture Validator
          </p>
        </div>
      </div>

      {/* Barra de URL + Modo de Conexión */}
      <form
        onSubmit={handleUrlSubmit}
        className="flex-1 min-w-[240px] max-w-xl flex items-center gap-1.5 relative"
      >
        <div className="relative flex-1 flex items-center min-w-0">
          <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={inputUrl}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 180)}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="http://localhost:3000 o https://tu-app.com..."
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 rounded-lg pl-8 pr-20 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />
          <button
            type="button"
            onClick={() => setUrl(DEMO_URL)}
            title="Cargar Laboratorio Demo Integrado"
            className="absolute right-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition"
          >
            <Sparkles className="w-3 h-3" />
            <span>Demo</span>
          </button>

          {/* Historial desplegable (US-01 Criterio 1.2) */}
          {showHistory && urlHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Historial Reciente
              </div>
              {urlHistory.map((item) => (
                <button
                  key={item}
                  type="button"
                  onMouseDown={() => {
                    setInputUrl(item);
                    setUrl(item);
                    setShowHistory(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center justify-between"
                >
                  <span className="truncate">{item}</span>
                  {item === DEMO_URL && (
                    <span className="text-[10px] text-indigo-400 font-medium">Integrado</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selector Proxy vs Direct */}
        <select
          value={connectionMode}
          onChange={(e) => setConnectionMode(e.target.value as 'proxy' | 'direct')}
          title="Modo Proxy elimina X-Frame-Options e inyecta el puente de sincronización automáticamente"
          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 shrink-0"
        >
          <option value="proxy">Proxy + Bridge</option>
          <option value="direct">Directo</option>
        </select>

        <button
          type="button"
          onClick={reloadAll}
          title="Recargar todos los dispositivos"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shrink-0"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Selector Principal: Modo Réplicas vs Modo Independientes + Controles Granulares (US-03) */}
      <div className="flex items-center gap-1 bg-slate-900/95 p-1 rounded-xl border border-slate-700/80 shadow-inner shrink-0">
        <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
          <button
            type="button"
            onClick={() => handleSetOperationMode('replicas')}
            title="Modo Réplicas: Lo que hagas en Móvil, Tablet o Web se replica en todos"
            className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              syncConfig.mode !== 'independent'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Réplicas</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetOperationMode('independent')}
            title="Modo Independiente: Cada dispositivo funciona por separado sin afectar a los demás"
            className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
              syncConfig.mode === 'independent'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Unlink className="w-3.5 h-3.5" />
            <span>Indep.</span>
          </button>
        </div>

        {syncConfig.mode !== 'independent' && (
          <div className="hidden lg:flex items-center gap-1 pl-1 border-l border-slate-800">
            <button
              type="button"
              onClick={() => toggleSyncOption('scroll')}
              title="Replicar Scroll Proporcional"
              className={`px-1.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                syncConfig.scroll
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" />
              <span className="hidden 2xl:inline">Scroll</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSyncOption('click')}
              title="Replicar Clics"
              className={`px-1.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                syncConfig.click
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <MousePointerClick className="w-3 h-3" />
              <span className="hidden 2xl:inline">Clicks</span>
            </button>
            <button
              type="button"
              onClick={() => toggleSyncOption('input')}
              title="Replicar Escritura en Formularios"
              className={`px-1.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                syncConfig.input
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Keyboard className="w-3 h-3" />
              <span className="hidden 2xl:inline">Inputs</span>
            </button>
          </div>
        )}
      </div>

      {/* Controles de Lienzo Responsivo (Auto-Fit), Zoom, Rotación y QA */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Zoom + Auto-Fit Responsivo */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => setAutoFitCanvas(!autoFitCanvas)}
            title="Auto-Ajuste Responsivo: Calcula automáticamente la escala para que todos los simuladores quepan en tu monitor al 100%"
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
              autoFitCanvas
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3 h-3" />
            <span>Auto-Fit</span>
          </button>

          <button
            type="button"
            onClick={() => setCanvasZoom(canvasZoom - 0.08, true)}
            className="p-1 text-slate-400 hover:text-white"
            title="Alejar Lienzo Manualmente"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span
            className="px-1.5 text-[11px] font-mono text-slate-200"
            title="Escala actual de los simuladores en pantalla"
          >
            {Math.round(canvasZoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setCanvasZoom(canvasZoom + 0.08, true)}
            className="p-1 text-slate-400 hover:text-white"
            title="Acercar Lienzo Manualmente"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Selector de Layout: Fila Horizontal / Grid / Lienzo Libre (Drag & Drop) */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setLayoutMode('horizontal')}
            title="Fila Horizontal (Arrastra las tarjetas para reordenarlas)"
            className={`p-1 rounded transition ${
              layoutMode === 'horizontal'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('grid')}
            title="Cuadrícula Adaptable (Arrastra las tarjetas para reordenarlas)"
            className={`p-1 rounded transition ${
              layoutMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode('freeform')}
            title="Lienzo Libre 2D (Mueve cada simulador libremente a cualquier coordenada X,Y)"
            className={`p-1 rounded transition ${
              layoutMode === 'freeform'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rotar todos */}
        <button
          type="button"
          onClick={rotateAllViewports}
          title="Rotar todos los dispositivos (Portrait / Landscape)"
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Simulador Light/Dark */}
        <button
          type="button"
          onClick={handleToggleTheme}
          title={`Tema simulado: ${colorScheme.toUpperCase()}`}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
        >
          {colorScheme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-300" />
          )}
        </button>

        {/* Botón Auditoría Overflow QA */}
        <button
          type="button"
          onClick={handleToggleQA}
          title="Auditoría de Overflow Horizontal (Resalta elementos que rompen el ancho móvil)"
          className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition ${
            qaOverlayActive
              ? totalOverflows > 0
                ? 'bg-red-500/20 text-red-300 border-red-500/50'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="hidden md:inline">QA</span>
          {qaOverlayActive && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                totalOverflows > 0 ? 'bg-red-500 text-white' : 'bg-emerald-500/30 text-emerald-200'
              }`}
            >
              {totalOverflows}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

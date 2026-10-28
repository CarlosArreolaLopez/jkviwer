import { ConnectionMode } from '../types';

export const DEMO_URL = 'visorr://demo-lab';

/**
 * Normaliza cualquier entrada de usuario a una URL válida (US-01 Criterio 1.1).
 */
export function normalizeTargetUrl(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed || trimmed === DEMO_URL || trimmed.startsWith('visorr://')) {
    return DEMO_URL;
  }

  // Soporte directo para entradas como "localhost:3000" o "127.0.0.1:8080"
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/.*)?$/i.test(trimmed)) {
    return `http://${trimmed}`;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Construye la ruta final que consumirá el atributo `src` del iframe según el modo de conexión.
 */
export function buildIframeSrc(
  targetUrl: string,
  instanceId: string,
  mode: ConnectionMode,
  reloadKey: number
): string {
  const normalized = normalizeTargetUrl(targetUrl);

  if (normalized === DEMO_URL) {
    return `/__visorr_demo__?__visorr_id=${encodeURIComponent(instanceId)}&_r=${reloadKey}`;
  }

  if (mode === 'proxy') {
    return `/__visorr_proxy__?url=${encodeURIComponent(normalized)}&__visorr_id=${encodeURIComponent(instanceId)}&_r=${reloadKey}`;
  }

  // Modo Directo
  try {
    const urlObj = new URL(normalized);
    urlObj.searchParams.set('__visorr_id', instanceId);
    return urlObj.toString();
  } catch {
    return normalized;
  }
}

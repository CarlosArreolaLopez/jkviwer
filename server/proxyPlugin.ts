import type { Plugin } from 'vite';
import { generateBridgeScriptString } from '../src/bridge/bridgeScript';

function generateResponsiveDemoLabHtml(instanceId: string): string {
  const bridgeCode = generateBridgeScriptString();
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JkViwer Demo Target App</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #475569;
      --accent: #2563eb;
      --border: #e2e8f0;
    }
    html.dark, html[data-theme="dark"] {
      --bg: #0f172a;
      --card: #1e293b;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #3b82f6;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding-bottom: 80px;
      transition: background 0.2s, color 0.2s;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 20;
      background: var(--card);
      border-bottom: 1px solid var(--border);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .badge-bp {
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      background: #dbeafe;
      color: #1d4ed8;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 20px;
    }
    .hero {
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
      color: white;
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 24px;
    }
    .hero h1 { font-size: 1.65rem; margin-bottom: 8px; }
    .hero p { opacity: 0.9; font-size: 0.95rem; }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
    }
    .card h3 { font-size: 1.05rem; margin-bottom: 8px; }
    .card p { color: var(--muted); font-size: 0.9rem; }
    .form-box {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .form-row {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 12px;
    }
    input, select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg);
      color: var(--text);
      font-size: 14px;
    }
    button {
      cursor: pointer;
      padding: 10px 16px;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      background: var(--accent);
      color: white;
      transition: opacity 0.15s;
    }
    button:hover { opacity: 0.9; }
    .btn-danger { background: #dc2626; }
    .buggy-banner {
      display: none;
      width: 560px; /* Provoca overflow intencional en móviles < 560px */
      background: #fee2e2;
      color: #991b1b;
      border: 2px solid #ef4444;
      padding: 14px 18px;
      border-radius: 10px;
      font-weight: 700;
      margin-top: 16px;
    }
    .buggy-banner.visible {
      display: block;
    }

    /* Media Queries Reales para extracción automática por VisorR */
    @media (min-width: 640px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (min-width: 768px) {
      .hero h1 { font-size: 2.1rem; }
      .form-row { flex-direction: row; }
    }
    @media (min-width: 1024px) {
      .grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (min-width: 1280px) {
      .grid { grid-template-columns: repeat(4, 1fr); }
    }
  </style>
  <script>
    window.__VISORR_INSTANCE_ID__ = "${instanceId}";
    window.name = "${instanceId}";
  </script>
  <script>${bridgeCode}</script>
</head>
<body>
  <header>
    <div>
      <strong>App Bajo Prueba</strong>
      <span id="vp-size" style="margin-left: 8px; font-size: 12px; color: var(--muted);"></span>
    </div>
    <span class="badge-bp" id="bp-indicator">Breakpoint</span>
  </header>

  <div class="container">
    <section class="hero">
      <h1>Laboratorio de Validación Responsiva</h1>
      <p>Haz scroll, escribe en los campos o activa el simulador de bug de Overflow Horizontal para ver cómo JkViwer sincroniza y audita todos los viewports simultáneamente.</p>
    </section>

    <section class="form-box">
      <h3>1. Prueba de Sincronización de Interacciones (Inputs & Clics)</h3>
      <p style="color: var(--muted); font-size: 0.875rem;">Escribe en cualquier dispositivo y observa cómo se replica en tiempo real en los demás.</p>
      <div class="form-row">
        <input id="sync-search-input" name="projectSearch" type="text" placeholder="Escribe aquí (ej. Arquitectura Microfrontends)..." />
        <select id="sync-env-select" name="environment">
          <option value="staging">Entorno: Staging</option>
          <option value="qa">Entorno: QA Lab</option>
          <option value="prod">Entorno: Producción</option>
        </select>
        <button id="counter-btn" type="button">Clics Sincronizados: <span id="click-count">0</span></button>
      </div>
    </section>

    <section class="form-box">
      <h3>2. Simulador de Bug de Maquetación (Overflow Horizontal QA)</h3>
      <p style="color: var(--muted); font-size: 0.875rem; margin-bottom: 12px;">
        Inyecta un contenedor rígido de <code>560px</code> de ancho para comprobar cómo los móviles (<code>375px - 430px</code>) se desbordan mientras Tablets y Desktop permanecen intactos.
      </p>
      <button id="toggle-overflow-bug" class="btn-danger" type="button">
        Inyectar / Quitar Elemento Desbordado (560px)
      </button>
      <div id="buggy-element" class="buggy-banner">
        ⚠️ ELEMENTO RÍGIDO DE 560PX — Desborda pantallas móviles (Overflow Bug)
      </div>
    </section>

    <h3 style="margin-bottom: 12px;">3. Grid Adaptable por Media Queries (1 → 2 → 3 → 4 Columnas)</h3>
    <div class="grid">
      <article class="card">
        <h3>Módulo de Autenticación</h3>
        <p>En móvil ocupa el 100% del ancho; en sm (640px) pasa a 2 columnas; en lg (1024px) a 3 columnas y en xl (1280px) a 4 columnas.</p>
      </article>
      <article class="card">
        <h3>Pasarela de Pagos</h3>
        <p>Valida que los botones de llamada a la acción no queden truncados en resoluciones pequeñas como iPhone SE (375px).</p>
      </article>
      <article class="card">
        <h3>Dashboard Analítico</h3>
        <p>Comprueba el escalado proporcional del scroll cuando la longitud vertical cambia drásticamente entre móvil y escritorio.</p>
      </article>
      <article class="card">
        <h3>Catálogo de Productos</h3>
        <p>Verifica el comportamiento de las tarjetas al rotar dispositivos de Portrait a Landscape con un solo clic.</p>
      </article>
      <article class="card">
        <h3>Notificaciones Push</h3>
        <p>Inspecciona cómo se adapta la tipografía fluida y los espaciados internos en pantallas de alta densidad.</p>
      </article>
      <article class="card">
        <h3>Auditoría de Accesibilidad</h3>
        <p>Alterna entre Light Mode y Dark Mode desde la barra superior de JkViwer para auditar el contraste en todas las vistas.</p>
      </article>
      <article class="card">
        <h3>Gestión de Usuarios</h3>
        <p>Tablas responsivas y contenedores flexibles diseñados para prevenir scroll horizontal involuntario.</p>
      </article>
      <article class="card">
        <h3>Reportes Ejecutivos</h3>
        <p>Desplázate hasta el final de la página para comprobar la precisión del motor de sincronización proporcional.</p>
      </article>
    </div>
  </div>

  <script>
    function updateMetrics() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      var sizeEl = document.getElementById('vp-size');
      var bpEl = document.getElementById('bp-indicator');
      if (sizeEl) sizeEl.textContent = '(' + w + 'px × ' + h + 'px)';
      if (bpEl) {
        var label = 'XS (<640px)';
        if (w >= 1280) label = 'XL (≥1280px · 4 cols)';
        else if (w >= 1024) label = 'LG (≥1024px · 3 cols)';
        else if (w >= 768) label = 'MD (≥768px · 2 cols)';
        else if (w >= 640) label = 'SM (≥640px · 2 cols)';
        bpEl.textContent = label;
      }
    }
    window.addEventListener('resize', updateMetrics);
    updateMetrics();

    var count = 0;
    var btn = document.getElementById('counter-btn');
    var countSpan = document.getElementById('click-count');
    if (btn && countSpan) {
      btn.addEventListener('click', function() {
        count++;
        countSpan.textContent = String(count);
      });
    }

    var bugBtn = document.getElementById('toggle-overflow-bug');
    var bugBox = document.getElementById('buggy-element');
    if (bugBtn && bugBox) {
      bugBtn.addEventListener('click', function() {
        bugBox.classList.toggle('visible');
        setTimeout(function() {
          window.dispatchEvent(new Event('resize'));
        }, 30);
      });
    }
  </script>
</body>
</html>`;
}

export function visorProxyPlugin(): Plugin {
  return {
    name: 'visorr-interceptor-proxy',
    configureServer(server) {
      // 1. Endpoint para servir el script bridge directamente si se solicita
      server.middlewares.use('/__visorr_bridge__.js', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(generateBridgeScriptString());
      });

      // 2. Endpoint del Laboratorio Demo Responsivo integrado
      server.middlewares.use('/__visorr_demo__', (req, res) => {
        const urlObj = new URL(req.url || '', 'http://localhost');
        const instanceId = urlObj.searchParams.get('__visorr_id') || 'demo-vp';
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(generateResponsiveDemoLabHtml(instanceId));
      });

      // 3. Endpoint Proxy Interceptor para cualquier URL externa o localhost (ADR-001)
      server.middlewares.use('/__visorr_proxy__', async (req, res) => {
        try {
          const reqUrl = new URL(req.url || '', 'http://localhost');
          const targetUrl = reqUrl.searchParams.get('url');
          const instanceId = reqUrl.searchParams.get('__visorr_id') || 'proxy-vp';

          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing ?url= parameter');
            return;
          }

          if (targetUrl.startsWith('visorr://demo') || targetUrl.includes('/__visorr_demo__')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(generateResponsiveDemoLabHtml(instanceId));
            return;
          }

          const parsedTarget = new URL(targetUrl);
          const response = await fetch(parsedTarget.toString(), {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 VisorR/1.0',
              Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            },
          });

          const contentType = response.headers.get('content-type') || 'text/html';

          // Eliminar cabeceras que bloquean iframes (US-01 Criterio 1.1)
          res.removeHeader('X-Frame-Options');
          res.removeHeader('Content-Security-Policy');
          res.removeHeader('Content-Security-Policy-Report-Only');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', contentType);

          if (contentType.includes('text/html')) {
            let html = await response.text();
            const originBase = `${parsedTarget.origin}${parsedTarget.pathname.replace(/\/[^/]*$/, '/')}`;
            const injection = `
              <base href="${originBase}" />
              <script>window.__VISORR_INSTANCE_ID__ = "${instanceId}"; window.name = "${instanceId}";</script>
              <script>${generateBridgeScriptString()}</script>
            `;

            if (/<head[^>]*>/i.test(html)) {
              html = html.replace(/<head[^>]*>/i, (match) => `${match}\n${injection}`);
            } else {
              html = `${injection}\n${html}`;
            }

            res.statusCode = 200;
            res.end(html);
          } else {
            const arrayBuffer = await response.arrayBuffer();
            res.statusCode = response.status;
            res.end(Buffer.from(arrayBuffer));
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(`
            <!DOCTYPE html>
            <html style="background:#0f172a;color:#f8fafc;font-family:system-ui;padding:24px;">
              <body>
                <h3 style="color:#f87171;margin-bottom:8px;">No se pudo conectar con la URL destino</h3>
                <p style="color:#94a3b8;font-size:14px;">Detalle técnico: ${message}</p>
                <p style="color:#64748b;font-size:12px;margin-top:12px;">
                  Verifica que tu servidor local esté corriendo o cambia al modo "Directo" en la barra superior.
                </p>
              </body>
            </html>
          `);
        }
      });
    },
  };
}

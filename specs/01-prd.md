# Product Requirements Document (PRD) - JkViwer

**Proyecto:** JkViwer (Responsive Design & QA Validation Tool)  
**Metodología:** Specification-Driven Development (SDD)  
**Estado:** Aprobado para Implementación (Baseline v1.0)  
**Fecha:** 2026-10-27

---

## 1. Visión y Propósito del Producto
**JkViwer** es una herramienta para desarrolladores y arquitectos de software que permite previsualizar, interactuar y auditar aplicaciones web en múltiples resoluciones de pantalla simultáneamente dentro de un único lienzo interactivo. Elimina la fricción de cambiar manualmente el tamaño de la ventana del navegador y resuelve los bloqueos de seguridad (`X-Frame-Options` / `CSP`) e inconsistencias de estado entre vistas.

---

## 2. Objetivos del Negocio y Técnicos
1. **Validación Multi-Dispositivo en Tiempo Real:** Visualizar desde 1 hasta +10 viewports simultáneos con un rendimiento fluido (>60 FPS al navegar o hacer zoom en el lienzo).
2. **Sincronización Determinista:** Replicar scroll, clics, inputs de formularios y navegación de rutas en todos los dispositivos activos con una latencia inferior a 16ms.
3. **Evasión Transparente de Bloqueos de Seguridad:** Permitir la carga de cualquier aplicación en `localhost`, entornos de staging o producción eliminando cabeceras restrictivas e inyectando automáticamente el puente de sincronización.
4. **Auditoría Visual Automatizada (QA):** Detectar automáticamente desbordamientos horizontales (overflow bugs), extraer breakpoints de las hojas CSS activas y permitir capturas de pantalla comparativas.

---

## 3. Perfiles de Usuario (User Personas)
* **Arquitecto / Tech Lead:** Valida que los sistemas de diseño y layouts respondan adecuadamente a través de todos los puntos de quiebre (breakpoints) definidos en la arquitectura frontend.
* **Desarrollador Frontend:** Desarrolla con *Hot-Reloading* (`localhost`) viendo instantáneamente el impacto de sus cambios CSS/JS en móvil, tablet y desktop a la vez.
* **QA / Tester Funcional:** Verifica flujos completos (formularios, modales, tablas anchas) y exporta evidencia visual de errores de maquetación.

---

## 4. Historias de Usuario y Criterios de Aceptación (Gherkin)

### US-01: Carga de URL y Bypass de Seguridad
> **Como** desarrollador, **quiero** ingresar cualquier URL (`http://localhost:3000` o `https://sitio-externo.com`) **para** visualizarla en todos los dispositivos sin errores de bloqueo de iframe.

* **Criterio 1.1 (Carga exitosa):**
  * **Dado** que el usuario ingresa una URL válida en la barra de direcciones,
  * **Cuando** presiona `Enter` o hace clic en "Ir",
  * **Entonces** el sistema normaliza la URL, la enruta a través del motor proxy/interceptor, elimina cabeceras `X-Frame-Options` y `Content-Security-Policy: frame-ancestors`, y renderiza el sitio en todos los viewports activos.
* **Criterio 1.2 (Historial rápido):**
  * **Dado** que el usuario ha visitado URLs previamente,
  * **Cuando** despliega el selector de la barra de URL,
  * **Entonces** visualiza las últimas 10 URLs visitadas persistidas en almacenamiento local.

### US-02: Gestión de Viewports y Perfiles de Dispositivos
> **Como** usuario, **quiero** agregar, quitar, reordenar, rotar y personalizar los dispositivos en el lienzo **para** adaptar mi entorno de pruebas a las métricas objetivo del proyecto.

* **Criterio 2.1 (Catálogo predefinido y Custom):**
  * **Dado** el panel de dispositivos,
  * **Cuando** el usuario selecciona un preset (ej. *iPhone 15 Pro - 393x852*, *iPad Air - 820x1180*, *MacBook Air - 1440x900*) o ingresa dimensiones personalizadas,
  * **Entonces** se añade inmediatamente un nuevo viewport al lienzo con esas medidas exactas.
* **Criterio 2.2 (Rotación Portrait/Landscape):**
  * **Dado** un viewport activo con ancho `W` y alto `H`,
  * **Cuando** el usuario activa el botón "Rotar" de ese dispositivo (o el botón global de rotación),
  * **Entonces** las dimensiones del viewport pasan a ser ancho `H` y alto `W` conservando el estado de la página sin recargar el DOM.

### US-03: Sincronización de Eventos (Scroll, Click, Input, Navegación)
> **Como** desarrollador, **quiero** que mis acciones en un dispositivo se repliquen en los demás **para** no repetir manualmente el mismo flujo N veces.

* **Criterio 3.1 (Sincronización de Scroll Proporcional):**
  * **Dado** que la sincronización de scroll está activa,
  * **Cuando** el usuario hace scroll en el `Viewport A`,
  * **Entonces** el resto de viewports se desplazan al mismo porcentaje relativo de altura (`scrollY / (scrollHeight - clientHeight)`) sin provocar bucles infinitos de eventos (rebote).
* **Criterio 3.2 (Sincronización de Clics e Inputs):**
  * **Dado** que la sincronización de interacción está activa,
  * **Cuando** el usuario escribe en un `<input>` o hace clic en un botón/enlace identificable por un selector CSS único en el `Viewport A`,
  * **Entonces** el script inyectado localiza el mismo nodo DOM en los demás viewports y ejecuta la acción equivalente.

### US-04: Controles de Lienzo (Zoom, Pan, Disposición)
> **Como** usuario, **quiero** hacer zoom in/out en el lienzo general y alternar entre vista en cuadrícula (Grid) o fila horizontal **para** aprovechar el espacio de mi monitor.

* **Criterio 4.1 (Escala CSS sin pérdida de resolución real):**
  * **Dado** un lienzo con zoom al `50%` (`scale(0.5)`),
  * **Cuando** los viewports se renderizan en pantalla,
  * **Entonces** ocupan la mitad del espacio físico en el monitor del usuario, pero sus `window.innerWidth` y `@media queries` internas continúan reportando el 100% de sus dimensiones lógicas (ej. `1920x1080`).

### US-05: Herramientas de Auditoría y QA Responsivo
> **Como** arquitecto o QA, **quiero** detectar errores de maquetación y puntos de quiebre **para** garantizar la calidad responsiva antes de pasar a producción.

* **Criterio 5.1 (Inspector de Overflow Horizontal):**
  * **Dado** que el usuario activa el modo "Detectar Overflow",
  * **Cuando** algún elemento del DOM tiene un `getBoundingClientRect().right > document.documentElement.clientWidth`,
  * **Entonces** el visor resalta los elementos desbordados con un borde rojo pulsante y muestra una alerta con el conteo de elementos defectuosos en la cabecera del viewport.
* **Criterio 5.2 (Simulación de Tema Claro/Oscuro):**
  * **Dado** el conmutador de tema en la barra superior,
  * **Cuando** el usuario alterna entre Light y Dark,
  * **Entonces** el visor notifica o inyecta la preferencia de esquema de color en los viewports.

---

## 5. Requisitos No Funcionales (NFR)
* **NFR-01 (Rendimiento):** El uso de `requestAnimationFrame` y debouncing/throttling en el bus de eventos debe evitar bloqueos del hilo principal cuando hay hasta 8 viewports activos.
* **NFR-02 (Aislamiento de Errores):** Si un sitio externo falla al cargar o lanza excepciones de JavaScript internas, el contenedor de VisorR debe permanecer estable y mostrar un estado de error amigable solo en ese viewport.
* **NFR-03 (Persistencia):** Los workspaces (conjuntos de dispositivos, nivel de zoom, URL activa y banderas de sincronización) deben persistirse automáticamente en `localStorage`.
* **NFR-04 (Tipado Estricto):** Todo el código fuente (Frontend, Proxy y Script Inyectado) debe estar escrito en TypeScript bajo configuración `strict: true` y contratos compartidos.

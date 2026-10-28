/**
 * Agente inyectado dentro de los iframes objetivo (TASK-2.1).
 * Cumple los contratos de specs/03-contracts.md y el algoritmo anti-rebote ADR-002.
 */

export function generateBridgeScriptString(): string {
  return `
(function() {
  if (window.__VISORR_BRIDGE_ACTIVE__) return;
  window.__VISORR_BRIDGE_ACTIVE__ = true;

  var CHANNEL = 'VISORR_BRIDGE_V1';
  var urlParams = new URLSearchParams(window.location.search);
  var instanceId = window.__VISORR_INSTANCE_ID__ || urlParams.get('__visorr_id') || window.name || 'unknown-vp';
  var isApplyingRemoteEvent = false;
  var lockTimeout = null;
  var qaOverlayActive = false;

  function setRemoteLock(durationMs) {
    isApplyingRemoteEvent = true;
    if (lockTimeout) clearTimeout(lockTimeout);
    lockTimeout = setTimeout(function() {
      isApplyingRemoteEvent = false;
    }, durationMs || 65);
  }

  function sendToHost(type, payload) {
    if (window.parent === window) return;
    window.parent.postMessage({
      channel: CHANNEL,
      type: type,
      sourceInstanceId: instanceId,
      timestamp: Date.now(),
      payload: payload
    }, '*');
  }

  // Algoritmo de Generación de Selectores CSS Deterministas (specs/03-contracts.md Sección 4)
  function getDeterministicSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) {
      return '#' + CSS.escape(el.id);
    }
    var testId = el.getAttribute('data-testid') || el.getAttribute('data-visorr-id');
    if (testId) {
      return el.tagName.toLowerCase() + '[data-testid="' + CSS.escape(testId) + '"]';
    }
    var nameAttr = el.getAttribute('name');
    if (nameAttr && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.tagName === 'BUTTON')) {
      return el.tagName.toLowerCase() + '[name="' + CSS.escape(nameAttr) + '"]';
    }

    var path = [];
    var current = el;
    while (current && current.nodeType === 1 && current !== document.body && current !== document.documentElement) {
      var selector = current.tagName.toLowerCase();
      if (current.id) {
        selector = '#' + CSS.escape(current.id);
        path.unshift(selector);
        break;
      } else {
        var nth = 1;
        var sibling = current.previousElementSibling;
        while (sibling) {
          if (sibling.tagName === current.tagName) nth++;
          sibling = sibling.previousElementSibling;
        }
        selector += ':nth-of-type(' + nth + ')';
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  // 1. Sincronización de Scroll Proporcional (window y contenedores internos)
  var scrollTicking = false;
  window.addEventListener('scroll', function(e) {
    if (isApplyingRemoteEvent) return;
    if (!scrollTicking) {
      window.requestAnimationFrame(function() {
        var target = e.target;
        var isDoc = !target || target === document || target === document.documentElement || target === document.body;
        var doc = isDoc ? (document.scrollingElement || document.documentElement) : target;
        var currentScrollY = isDoc ? (window.scrollY || doc.scrollTop || 0) : doc.scrollTop;
        var currentScrollX = isDoc ? (window.scrollX || doc.scrollLeft || 0) : doc.scrollLeft;
        var maxScrollY = Math.max(1, doc.scrollHeight - doc.clientHeight);
        var maxScrollX = Math.max(1, doc.scrollWidth - doc.clientWidth);
        var ratioY = Math.min(1, Math.max(0, currentScrollY / maxScrollY));
        var ratioX = Math.min(1, Math.max(0, currentScrollX / maxScrollX));

        sendToHost('SYNC_SCROLL', {
          ratioX: ratioX,
          ratioY: ratioY,
          scrollX: currentScrollX,
          scrollY: currentScrollY,
          selector: isDoc ? '' : getDeterministicSelector(doc)
        });
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, true);

  // 2. Sincronización de Clics
  document.addEventListener('click', function(e) {
    if (isApplyingRemoteEvent) return;
    var target = e.target;
    if (!target || target.nodeType !== 1) return;
    // Ignorar clics sobre inputs de texto o selects para que no disparen doble evento con 'input'/'change'
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
      var inputType = (target.getAttribute('type') || 'text').toLowerCase();
      if (inputType !== 'button' && inputType !== 'submit' && inputType !== 'reset') {
        return;
      }
    }
    var interactive = target.closest('button, a, [role="button"], [data-sync-click]') || target;
    var selector = getDeterministicSelector(interactive);
    if (selector) {
      sendToHost('SYNC_CLICK', { selector: selector });
    }
  }, true);

  // 3. Sincronización deNavegación Interna (Enlaces y History API pushState/replaceState)
  var origPushState = history.pushState;
  history.pushState = function() {
    var ret = origPushState.apply(this, arguments);
    if (!isApplyingRemoteEvent) {
      sendToHost('SYNC_NAVIGATION', { path: window.location.pathname + window.location.search + window.location.hash });
    }
    return ret;
  };
  window.addEventListener('popstate', function() {
    if (!isApplyingRemoteEvent) {
      sendToHost('SYNC_NAVIGATION', { path: window.location.pathname + window.location.search + window.location.hash });
    }
  });

  // 3. Sincronización de Inputs y Changes (Text, Select, Checkbox, Radio)
  function handleFormEvent(e) {
    if (isApplyingRemoteEvent) return;
    var target = e.target;
    if (!target || target.nodeType !== 1) return;
    var selector = getDeterministicSelector(target);
    if (selector) {
      sendToHost('SYNC_INPUT', {
        selector: selector,
        value: target.value !== undefined ? String(target.value) : '',
        checked: !!target.checked
      });
    }
  }
  document.addEventListener('input', handleFormEvent, true);
  document.addEventListener('change', handleFormEvent, true);

  // 4. Auditoría QA: Escáner de Overflow Horizontal (US-05 Criterio 5.1)
  function scanHorizontalOverflow(highlight) {
    var viewportWidth = document.documentElement.clientWidth;
    var allElements = document.querySelectorAll('body *');
    var overflowing = [];

    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      var rect = el.getBoundingClientRect();
      // Ignorar contenedores ocultos o insignificantes
      var style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      if (rect.right > viewportWidth + 1.5) {
        var excess = Math.round(rect.right - viewportWidth);
        if (highlight) {
          el.setAttribute('data-visorr-overflow', excess + 'px');
          el.style.outline = '2px dashed #ef4444';
          el.style.outlineOffset = '-2px';
          el.style.boxShadow = 'inset 0 0 0 2px rgba(239, 68, 68, 0.25)';
        } else if (el.hasAttribute('data-visorr-overflow')) {
          el.removeAttribute('data-visorr-overflow');
          el.style.outline = '';
          el.style.outlineOffset = '';
          el.style.boxShadow = '';
        }
        overflowing.push({
          selector: getDeterministicSelector(el),
          tagName: el.tagName.toLowerCase(),
          className: typeof el.className === 'string' ? el.className.slice(0, 60) : '',
          overflowAmountPx: excess,
          rectWidth: Math.round(rect.width)
        });
      } else if (el.hasAttribute('data-visorr-overflow')) {
        el.removeAttribute('data-visorr-overflow');
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.style.boxShadow = '';
      }
    }

    sendToHost('QA_OVERFLOW_REPORT', {
      hasOverflow: overflowing.length > 0,
      count: overflowing.length,
      elements: overflowing.slice(0, 15)
    });
  }

  // 5. Extractor de Breakpoints CSS (@media queries)
  function extractCSSBreakpoints() {
    var pxValues = {};
    var rawQueries = [];
    try {
      var sheets = document.styleSheets;
      for (var i = 0; i < sheets.length; i++) {
        var rules;
        try {
          rules = sheets[i].cssRules;
        } catch (err) {
          continue;
        }
        if (!rules) continue;
        for (var j = 0; j < rules.length; j++) {
          var rule = rules[j];
          if (rule.type === CSSRule.MEDIA_RULE && rule.conditionText) {
            rawQueries.push(rule.conditionText);
            var matches = rule.conditionText.match(/(\\d+)px/g);
            if (matches) {
              for (var k = 0; k < matches.length; k++) {
                var val = parseInt(matches[k].replace('px', ''), 10);
                if (val >= 300 && val <= 2560) {
                  pxValues[val] = true;
                }
              }
            }
          }
        }
      }
    } catch (e) {}

    var sorted = Object.keys(pxValues).map(Number).sort(function(a, b) { return a - b; });
    sendToHost('QA_BREAKPOINTS_REPORT', {
      breakpointsPx: sorted,
      rawMediaQueries: rawQueries.slice(0, 25)
    });
  }

  // 6. Simulación de Color Scheme (Light / Dark)
  function applyColorScheme(scheme) {
    var html = document.documentElement;
    if (scheme === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
      html.style.colorScheme = 'dark';
    } else if (scheme === 'light') {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
      html.style.colorScheme = 'light';
    } else {
      html.style.colorScheme = '';
    }
  }

  // Receptor de órdenes desde el Host
  window.addEventListener('message', function(event) {
    var msg = event.data;
    if (!msg || msg.channel !== CHANNEL) return;
    if (msg.sourceInstanceId === instanceId) return;

    switch (msg.type) {
      case 'SYNC_SCROLL': {
        setRemoteLock(90);
        var container = msg.payload.selector ? document.querySelector(msg.payload.selector) : null;
        if (container && container !== document.documentElement && container !== document.body) {
          var maxCY = Math.max(0, container.scrollHeight - container.clientHeight);
          var maxCX = Math.max(0, container.scrollWidth - container.clientWidth);
          container.scrollTop = msg.payload.ratioY * maxCY;
          container.scrollLeft = msg.payload.ratioX * maxCX;
        } else {
          var doc = document.scrollingElement || document.documentElement;
          var maxScrollY = Math.max(0, doc.scrollHeight - doc.clientHeight);
          var maxScrollX = Math.max(0, doc.scrollWidth - doc.clientWidth);
          var targetY = msg.payload.ratioY * maxScrollY;
          var targetX = msg.payload.ratioX * maxScrollX;
          window.scrollTo({ top: targetY, left: targetX, behavior: 'auto' });
        }
        break;
      }
      case 'SYNC_CLICK': {
        setRemoteLock(90);
        try {
          var el = document.querySelector(msg.payload.selector);
          if (el) {
            if (typeof el.click === 'function') {
              el.click();
            } else {
              el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            }
          }
        } catch (err) {}
        break;
      }
      case 'SYNC_INPUT': {
        setRemoteLock(90);
        try {
          var inputEl = document.querySelector(msg.payload.selector);
          if (inputEl) {
            if (inputEl.type === 'checkbox' || inputEl.type === 'radio') {
              inputEl.checked = !!msg.payload.checked;
            } else {
              // Soporte para inputs nativos y controlados por React/Vue
              var proto = Object.getPrototypeOf(inputEl);
              var nativeSetter = proto && Object.getOwnPropertyDescriptor(proto, 'value')?.set;
              if (nativeSetter) {
                nativeSetter.call(inputEl, msg.payload.value);
              } else {
                inputEl.value = msg.payload.value;
              }
            }
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } catch (err) {}
        break;
      }
      case 'SYNC_NAVIGATION': {
        setRemoteLock(150);
        try {
          if (msg.payload && msg.payload.path) {
            var currentPath = window.location.pathname + window.location.search + window.location.hash;
            if (currentPath !== msg.payload.path) {
              history.pushState(null, '', msg.payload.path);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }
        } catch (err) {}
        break;
      }
      case 'QA_SCAN_OVERFLOW': {
        qaOverlayActive = !!(msg.payload && msg.payload.active);
        scanHorizontalOverflow(qaOverlayActive);
        break;
      }
      case 'QA_EXTRACT_BREAKPOINTS': {
        extractCSSBreakpoints();
        break;
      }
      case 'SET_COLOR_SCHEME': {
        applyColorScheme(msg.payload.scheme);
        break;
      }
    }
  });

  window.addEventListener('resize', function() {
    scanHorizontalOverflow(qaOverlayActive);
  });

  function initBridge() {
    sendToHost('BRIDGE_READY', {
      width: window.innerWidth,
      height: window.innerHeight,
      href: window.location.href
    });
    extractCSSBreakpoints();
    scanHorizontalOverflow(qaOverlayActive);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initBridge, 80);
  } else {
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(initBridge, 80);
    });
  }
})();
`;
}

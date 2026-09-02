'use strict';

(() => {
  function reportLoadFailure(src) {
    const status = document.getElementById('appStatus');
    if (status) status.textContent = `Не удалось загрузить скрипт приложения: ${src}`;
  }

  function loadScript(src, onload, onerror) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = onload || null;
    script.onerror = () => {
      if (typeof onerror === 'function') onerror();
      else reportLoadFailure(src);
    };
    document.head.appendChild(script);
  }

  // Curated upstream copy corrections are optional at runtime: if the small
  // reconciliation layer fails to load, the hardened baseline checklist still
  // starts normally rather than becoming unavailable.
  //
  // The rich behavioural-analytics add-on (analytics.js) has been deliberately
  // removed from this build: checklist-core.js already contains a complete,
  // self-sufficient simple end-of-season aggregate sender (nick + task/link/
  // quota counts only), so nothing further needs to load on top of it.
  loadScript(
    'template-corrections.js',
    () => loadScript('checklist-core.js'),
    () => {
      console.warn('4ek-lis: optional upstream template corrections could not be loaded');
      loadScript('checklist-core.js');
    }
  );
})();

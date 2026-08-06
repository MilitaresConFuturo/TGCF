const breakpoint = window.matchMedia('(min-width: 861px)');
let loadedMode;

function currentMode() {
  return breakpoint.matches ? 'desktop' : 'compact';
}

async function loadPresentation(mode) {
  if (mode === loadedMode) return;
  loadedMode = mode;
  const response = await fetch(`src/ui/${mode}/template.html`);
  if (!response.ok) throw new Error(`No se pudo cargar la plantilla ${mode}: ${response.status}`);
  document.querySelector('#app').innerHTML = await response.text();

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = `styles/${mode}.css`;
  document.head.append(stylesheet);

  const script = document.createElement('script');
  script.type = 'module';
  script.src = `src/ui/${mode}/app.js`;
  document.body.append(script);
}

await loadPresentation(currentMode());
breakpoint.addEventListener('change', event => {
  if (event.matches !== (loadedMode === 'desktop')) window.location.reload();
});

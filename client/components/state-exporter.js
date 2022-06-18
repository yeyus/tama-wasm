class StateExporter extends HTMLElement {
  constructor() {
    super();
    const template = document.getElementById('state-exporter');
    const templateContent = template.content;

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(templateContent.cloneNode(true));

    const buffer = shadowRoot.getElementById('buffer');
    
    shadowRoot.getElementById('export').onclick = () => {
      if (!this.exportFn) return;
      const state = this.exportFn();
      buffer.value = state;
    };

    shadowRoot.getElementById('import').onclick = () => {
      if (!this.importFn) return;
      importFn(buffer.value);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => customElements.define('state-exporter', StateExporter), false);
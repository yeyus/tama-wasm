import { LitElement, html, css } from 'https://unpkg.com/lit-element/lit-element.js?module';
import { ref, createRef } from 'https://unpkg.com/lit-html@2.2.6/directives/ref.js?module';

export const EVENT_EXPORT_CLICK = 'exportClick';
export const EVENT_IMPORT_CLICK = 'importClick';

export class StateExporter extends LitElement  {
  constructor() {
    super();

    this._bufferRef = createRef();
  }

  onExportClick() {
    const event = new CustomEvent(EVENT_EXPORT_CLICK, { bubbles: true, composed: true, cancelable: true });
    this.dispatchEvent(event);
  }

  onImportClick() {
    const event = new CustomEvent(EVENT_IMPORT_CLICK, { bubbles: true, composed: true, cancelable: true });
    this.dispatchEvent(event);
  }

  set buffer(value) {
    const buffer = this._bufferRef.value;
    buffer.value = value;
  }

  get buffer() {
    const buffer = this._bufferRef.value;
    return buffer.value;
  }

  static get styles() {
    return css`
      h1, textarea {
        font-family: monospace;
      }

      textarea {
        min-width: 350px;
        min-height: 200px;
        font-size: 12px;
        overflow: auto;
      }

      .actions {
        display: flex;
        flex-direction: row;
      }
    `;
  }

  render() {
    return html`
      <h1>State Exporter</h1>
      <div class="actions">
        <button @click=${this.onExportClick}>Export</button>
        <button @click=${this.onImportClick}>Import</button>
      </div>
      <textarea ${ref(this._bufferRef)}></textarea>
    `;
  }
}

customElements.define('state-exporter', StateExporter);
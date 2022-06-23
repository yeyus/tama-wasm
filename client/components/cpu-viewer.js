import { LitElement, html, css } from 'https://unpkg.com/lit-element/lit-element.js?module';

const toHex = (n, size) => n.toString(16).padStart(size*2, '0');
const orZero = (obj, key) => obj && obj[key] || 0;

export class CPUViewer extends LitElement {

  constructor() {
    super();
    this.state = null;
    this.prevMemory = new Uint8Array();
  }

  snapshot(state) {
    this.state = state;
    this.requestUpdate();
  }

  static get styles() {
    return css`
      h1 {
        font-family: monospace;
        font-size: 2em;
      }

      table {
        font-family: monospace;
      }

      table tr {
        text-align: left;
      }

      td.zero {
        opacity: 0.6;
      }

      td.changed {
        background-color: blueviolet;
        color: white;
      }
    `;
  }

  renderMemory(memory) {
    const { length } = memory;
    return html`
      <tbody>
        ${ [...Array(length/0x10).keys()].map(i => this.renderMemoryRow(memory, i * 0x10)) }
      </tbody>
    `;
  }

  renderMemoryRow(memory, start) {
    const tds = [];

    memory.subarray(start, start+0x10).forEach((value, index) => {
      let classes = [];
      if (!value) {
        classes.push('zero');
      }
      
      if (value !== this.prevMemory[start+index]) {
        classes.push('changed');
      }

      tds.push(html`<td class="${classes.join(',')}">${toHex(value, 1)}</td>`); 
    });

    return html`
      <tr>
        <th>${toHex(start,2)}</th>
        ${tds}
      </tr>
    `;
  }

  render() {

    const render = html`
      <h1>CPU State</h1>

      <!-- CPU Registers -->
      <table>
        <tbody>
          <tr>
            <th>PC</th>
            <td>0x${ toHex(orZero(this.state, 'pc'), 2) }</td>
            <th>NP</th>
            <td>0x${ toHex(orZero(this.state, 'np'), 1) }</td>
            <th>SP</th>
            <td>0x${ toHex(orZero(this.state, 'sp'), 2) }</td>
          </tr>
          <tr>
            <th>X</th>
            <td>0x${ toHex(orZero(this.state, 'x'), 2) }</td>
            <th>Y</th>
            <td>0x${ toHex(orZero(this.state, 'y'), 2) }</td>
            <th>A</th>
            <td>0x${ toHex(orZero(this.state, 'a'), 1) }</td>
            <th>B</th>
            <td>0x${ toHex(orZero(this.state, 'b'), 1) }</td>
          </tr>
          <tr>
            <th colspan="8">Flags</th>
          </tr>
          <tr>
            <th>C</th>
            <td>${ orZero(this.state, 'flags') & 1 ? '1' : '0' }</td>
            <th>Z</th>
            <td>${ (orZero(this.state, 'flags') >> 1) & 1 ? '1' : '0' }</td>
            <th>D</th>
            <td>${ (orZero(this.state, 'flags') >> 2) & 1 ? '1' : '0' }</td>
            <th>I</th>
            <td>${ (orZero(this.state, 'flags') >> 3) & 1 ? '1' : '0' }</td>
          </tr>
        </tbody>
      </table>

      <!-- Memory -->
      <table>
        <thead>
          <tr>
            <th>addr</th>
            <th>0</th>
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>5</th>
            <th>6</th>
            <th>7</th>
            <th>8</th>
            <th>9</th>
            <th>A</th>
            <th>B</th>
            <th>C</th>
            <th>D</th>
            <th>E</th>
            <th>F</th>
          </tr>
        </thead>
        ${ this.state && this.renderMemory(this.state.memory) }
      </table>
    `;

    // save to prev
    if (this.state) {
      const newArray = new Uint8Array(this.state.memory.length);
      newArray.set(this.state.memory);
      this.prevMemory = newArray;
    }

    return render;
  }
}

customElements.define('cpu-viewer', CPUViewer);
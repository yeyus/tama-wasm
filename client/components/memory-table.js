const toHex = (n, size) => n.toString(16).padStart(size*2, '0');

class MemoryTable extends HTMLElement {
  constructor() {
    super();
    const template = document.getElementById('memory-table');
    const templateContent = template.content;

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(templateContent.cloneNode(true));

    this.bodyRef = shadowRoot.querySelector('.dump');
    this.templateSlots = shadowRoot.querySelectorAll('[data-interpolate]');
    this.prevMemory = new Uint8Array();
  }

  update(state) {
    this.clear();
    this.renderMemory(state.memory);
    this.renderRegisters(state);

    const newArray = new Uint8Array(state.memory.length);
    newArray.set(state.memory);
    this.prevMemory = newArray;
  }

  renderMemory(memory) {
    this.clear()
    const body = this.bodyRef;
    
    for(let i = 0; i < memory.length; i += 0x10) {
      const tr = document.createElement('tr');
      
      const headerCell = document.createElement('th');
      headerCell.innerText = '0x' + i.toString(16);
      tr.appendChild(headerCell);

      for(let j = 0; j < 0x10; j++) {
        const value = memory[i+j];
        const td = document.createElement('td');
        td.innerText = toHex(value, 1);
        if (!value) {
          td.classList.add('zero');
        }

        if (value !== this.prevMemory[i+j]) {
          td.classList.add('changed');
        }

        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
  }

  renderRegisters(state) {
    this.templateSlots.forEach(element => {
      const field = element.dataset['interpolate'];
      const type = element.dataset['interpolateType'] || 'dec';
      const mask = element.dataset['interpolateMask'] && parseInt(element.dataset['interpolateMask'], 10);
      if (state[field] !== undefined) {
        let value = state[field];
        switch(type) {
          case 'hex':
            value = '0x' + toHex(value, 2);
            break;
          case 'boolbin':
            value = (value & mask) > 0 ? '1' : '0';
            break;
        }
        element.innerText = value;
      }
    });
  }

  clear() {
    const body = this.bodyRef;
    while(body.firstChild) {
      body.removeChild(body.firstChild);
    }
  }

  export() {
    const output = pako.deflate(this.prevMemory);
    console.log('deflate', output);
  }
}

document.addEventListener('DOMContentLoaded', () => customElements.define('memory-table', MemoryTable), false);

import { LitElement, html, css } from 'https://unpkg.com/lit-element/lit-element.js?module';
import { ref, createRef } from 'https://unpkg.com/lit-html@2.2.6/directives/ref.js?module';

const TAMA_WIDTH = 32;
const TAMA_HEIGHT = 16;
const TAMA_ICONS = 8;

const pixelToNumber = (x,y) => (x+1)*100 + y;
const numberToPixel = (n) => [Math.floor((n/100))-1, n % 100];

export const EVENT_BUTTON_PRESS = 'buttonPress';

export class TamaControls extends LitElement {
  constructor() { 
    super();

    console.log('PhysicalInterface instantiated!');
    // state
    this.lcd = new Array(TAMA_WIDTH).fill(0).map(() => new Array(TAMA_HEIGHT).fill(0));
    this.lcdUpdates = new Set();
    this.icons = new Array(TAMA_ICONS).fill(0);

    // flags
    this.audioPlaying = false;
    this.canDraw = false;

    // DOM references
    this.iconRefs = [];
    this.canvasRef = createRef();
    this.animationFrameId = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.animationFrameId = requestAnimationFrame(this.onAnimationFrame.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.canDraw = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  firstUpdated() {
    super.firstUpdated()    
    this.canvasCtx = this.canvasRef.value.getContext('2d');
    this.canvasCtx.imageSmoothingEnabled = false;
    this.iconRefs = this.renderRoot.querySelectorAll('.icon');    
    this.canDraw = true;
    this.canvasBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--tama-screen-background') || 'rgb(0,0,0)';
    this.canvasPixelColor = getComputedStyle(document.documentElement).getPropertyValue('--tama-screen-color') || 'rgb(255,255,255)';
  }

  onAnimationFrame() {
    if (this.canDraw) {
      this.draw(false);
    }
    this.animationFrameId = requestAnimationFrame(this.onAnimationFrame.bind(this));
  }

  _handleButton(btnIndex, state) {
    const detail = { index: btnIndex, state };
    const event = new CustomEvent(EVENT_BUTTON_PRESS, { detail, bubbles: true, composed: true, cancelable: true });
    this.dispatchEvent(event);
  }

  setLCDMatrix(x, y, val) {
    this.lcd[x][y] = val;
    this.lcdUpdates.add(pixelToNumber(x,y));
  }

  setLCDIcon(icon, val) {
    this.icons[icon] = val;
  }

  draw(completeDraw = false) {
    const canvas = this.canvasCtx;
    const icons = this.iconRefs;

    if (!canvas) throw new Error("Draw needs a canvas context to render to");

    if (completeDraw) {
      for(let x = 0; x < TAMA_WIDTH; x++) {
        for(let y = 0; y < TAMA_HEIGHT; y++) {
          canvas.fillStyle = this.lcd[x][y] > 0 ? this.canvasPixelColor : this.canvasBackgroundColor;
          canvas.fillRect(x, y, 1, 1);
        }
      }
    } else {
      this.lcdUpdates.forEach((n) => {
        const [x,y] = numberToPixel(n);
        canvas.fillStyle = this.lcd[x][y] > 0 ? this.canvasPixelColor : this.canvasBackgroundColor;
        canvas.fillRect(x, y, 1, 1);
      });
      this.lcdUpdates.clear();
    }

    this.icons.forEach((val, icon) => val ? icons[icon].classList.add('on') : icons[icon].classList.remove('on'));    
  }

  audioStart() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.oscillator = this.audioCtx.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.start();
  }
  
  setAudioFrequency(freq) {
    if(!this.audioCtx) return;
    this.oscillator.frequency.setValueAtTime(freq/10, this.audioCtx.currentTime);
  }

  setAudioPlay(en) {
    if (!this.audioCtx) return;

    if (!en && this.audioPlaying) {
      this.oscillator.disconnect(this.audioCtx.destination);
      this.audioPlaying = false;
    }
    if (en && !this.audioPlaying) {
      this.oscillator.connect(this.audioCtx.destination);
      this.audioPlaying = true;
    }
  }

  static get styles() {
    return css`
      #canvas {
        width: var(--tama-width);
        aspect-ratio: 2/1;
        image-rendering: pixelated;
      }
      
      .tama {
        width: var(--tama-width);
        background-color: var(--tama-background);
        padding: 20px;
      }

      .screen {
        background: var(--tama-screen-background);
      }
      
      .tama .icon-bar {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        width: auto;
        padding: 10px 0;
      }
      
      .tama .icon-bar .icon {
        height: 40px;
        opacity: 0.2;
      }
      
      .tama .icon-bar .icon.on {
        opacity: 1;
      }

      .buttons {        
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        flex-wrap: wrap;
        position: relative;
        z-index: 10;
      }

      .interface-btn {
        aspect-ratio: 1/1;
        background-color: var(--tama-button-gradient-from, #f7f7f7);
        background-image: -webkit-gradient(linear, left top, left bottom, from(var(--tama-button-gradient-from, #f7f7f7)), to(var(--tama-button-gradient-to, #e7e7e7)));
        background-image: -webkit-linear-gradient(top, var(--tama-button-gradient-from, #f7f7f7), var(--tama-button-gradient-to, #e7e7e7)); 
        background-image: -moz-linear-gradient(top, var(--tama-button-gradient-from, #f7f7f7), var(--tama-button-gradient-to, #e7e7e7)); 
        background-image: -ms-linear-gradient(top, var(--tama-button-gradient-from, #f7f7f7), var(--tama-button-gradient-to, #e7e7e7)); 
        background-image: -o-linear-gradient(top, var(--tama-button-gradient-from, #f7f7f7), var(--tama-button-gradient-to, #e7e7e7)); 
        border: var(--tama-button-border, solid 1px transparent);
        border-radius: 50%;
        box-shadow: 0px 3px 8px #aaa, inset 0px 2px 3px #fff;
        display: block;
        flex: 1;
        font-size: 1.5em;
        position: relative;
        margin: var(--tama-button-spacing, 8%);
        text-weight: bold;
      }

      .interface-btn:before {
        content: "";
        display: block;
        background: var(--tama-button-inset-background, #fff);
        border-top: 2px solid var(--tama-button-shadow-color, #ddd);
        position: absolute;
        top: var(--tama-button-inset-size, -18px);
        left: var(--tama-button-inset-size, -18px);
        bottom: var(--tama-button-inset-size, -18px);
        right: var(--tama-button-inset-size, -18px);
        z-index: -1;
        border-radius: 50%;
        box-shadow: inset 0px 8px 48px var(--tama-button-shadow-color, #ddd);
      }

      .interface-btn:active {
        box-shadow: 0px 3px 4px #aaa inset, 0px 2px 3px #fff;
      }

      .interface-btn:hover {
        text-decoration: none;
        color: #555;
        background: var(--tama-button-hover-background, #f5f5f5);
      }
    `;
  }

  render() {
    return html`
      <div class="tama">
        <div class="screen">
          <div class="icon-bar">
            <img class="icon" src="assets/food.svg" alt="Food" data-icon=0 />
            <img class="icon" src="assets/lights.svg" alt="Light" data-icon=1 />
            <img class="icon" src="assets/games.svg" alt="Games" data-icon=2 />
            <img class="icon" src="assets/medicine.svg" alt="Medicine" data-icon=3 />
          </div>
          <canvas ${ref(this.canvasRef)} id="canvas" width="32" height="16"></canvas>
          <div class="icon-bar">
            <img class="icon" src="assets/bath.svg" alt="Bath" data-icon=4 />
            <img class="icon" src="assets/stats.svg" alt="Stats" data-icon=5 />
            <img class="icon" src="assets/discipline.svg" alt="Discipline" data-icon=6 />
            <img class="icon" src="assets/attention.svg" alt="Attention" data-icon=7 />
          </div>
        </div>
        <div class="buttons">
          <button class="interface-btn" @mousedown="${this._handleButton.bind(this, 0, 1)}" @mouseup="${this._handleButton.bind(this, 0, 0)}"></button>
          <button class="interface-btn" @mousedown="${this._handleButton.bind(this, 1, 1)}" @mouseup="${this._handleButton.bind(this, 1, 0)}"></button>
          <button class="interface-btn" @mousedown="${this._handleButton.bind(this, 2, 1)}" @mouseup="${this._handleButton.bind(this, 2, 0)}"></button>
        </div>
      </div>            
    `;
  }
}

customElements.define('tama-controls', TamaControls);
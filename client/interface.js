'use strict';
const TAMA_WIDTH = 32;
const TAMA_HEIGHT = 16;
const TAMA_ICONS = 8;

const pixelToNumber = (x,y) => (x+1)*100 + y;
const numberToPixel = (n) => [Math.floor((n/100))-1, n % 100];

class TamaObject {
  constructor() {
    console.log('TamaObject instantiated!');
    // graphics config
    this.lcd = new Array(TAMA_WIDTH).fill(0).map(() => new Array(TAMA_HEIGHT).fill(0));
    this.lcdUpdates = new Set();
    this.icons = new Array(TAMA_ICONS).fill(0);

    // audio config
    this.audioPlaying = false;
  }

  setLCD(x, y, val) {
    this.lcd[x][y] = val;
    this.lcdUpdates.add(pixelToNumber(x,y));
  }

  draw(canvas, completeDraw = false) {
    if (!canvas) throw new Error("Draw needs a canvas context to render to");

    if (completeDraw) {
      for(let x = 0; x < TAMA_WIDTH; x++) {
        for(let y = 0; y < TAMA_HEIGHT; y++) {
          canvas.fillStyle = this.lcd[x][y] > 0 ? 'rgb(0,0,0)' : 'rgb(255,255,255)';
          canvas.fillRect(x, y, 1, 1);
        }
      }
    } else {
      this.lcdUpdates.forEach((n) => {
        const [x,y] = numberToPixel(n);
        canvas.fillStyle = this.lcd[x][y] > 0 ? 'rgb(0,0,0)' : 'rgb(255,255,255)';
        canvas.fillRect(x, y, 1, 1);
      });
      this.lcdUpdates.clear();
    }
    
  }

  setIcon(icon, val) {
    this.icons[icon] = val;
  }

  audioStart() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.oscillator = this.audioCtx.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.start();
  }
  
  setAudioFrequency(freq) {
    if(!this.audioCtx) return;

    console.log('Audio Freq: ', freq/10);
    this.oscillator.frequency.setValueAtTime(freq/10, this.audioCtx.currentTime);
  }

  setAudioPlay(en) {
    if (!this.audioCtx) return;

    if (!en && this.audioPlaying) {
      console.log('[audio] stop');
      this.oscillator.disconnect(this.audioCtx.destination);
      this.audioPlaying = false;
    }
    if (en && !this.audioPlaying) {
      console.log('[audio] start');
      this.oscillator.connect(this.audioCtx.destination);
      this.audioPlaying = true;
    }
  }
}
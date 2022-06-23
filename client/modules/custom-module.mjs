import { EmulationState } from './emulation-state.mjs';
import { EVENT_BUTTON_PRESS } from '../components/tama-controls.js';

//const log = (...args) => console.debug('[CustomModule]', ...args);
const log = (...args) => {};

const EXPORTED = {
  _runFor: ['u32t_tama_run_for'],
  _step: ['void_tama_step'],
  pressButton: ['void_tama_button'],
  getState: ['statet_tama_get_cpu_state', 'number', []],
  getStateSize: ['sizet_tama_get_cpu_state_size', 'number', []]
};

class TamaLib {
  constructor(module, physicalInterface) {
    this.emulationState = new EmulationState();
    this.physicalInterface = physicalInterface;
    this.stepCount = 0;

    Object.keys(EXPORTED).forEach(key => {
      this[key] = module.cwrap(...EXPORTED[key]);
    });

    this.physicalInterface.addEventListener(EVENT_BUTTON_PRESS, (e) => {
      const { detail: { index, state }} = e;
      log('Event', EVENT_BUTTON_PRESS, index, state);
      this.pressButton(index, state);
    });
  }

  /*******************/
  /* HAL definitions */
  /*******************/

  /* JS to WASM */
  step(numSteps) {
    this.stepCount += numSteps;
    this._step(numSteps);
  }

  runFor(ms) {
    this.stepCount += this._runFor(ms);
  }

  /* WASM to JS */
  setLCDMatrix(x, y, val) {
    log('setLCDMatrix',x,y,val);
    this.physicalInterface.setLCDMatrix(x, y, val);
  }

  setLCDIcon(icon, val) {
    log('setLCDIcon',icon,val);
    this.physicalInterface.setLCDIcon(icon, val);
  }

  setAudioFrequency(freq) {
    log('setAudioFrequency',freq);
    this.physicalInterface.setAudioFrequency(freq);
  }

  setAudioPlay(enabled) {
    log('setAudioPlay',enabled);
    this.physicalInterface.setAudioPlay(enabled);
  }
}

const Module = {};

Module.onRuntimeInitialized = function onRuntimeInitialized() {
  log('onRuntimeInitialized', this);

  const physicalInterface = document.getElementsByTagName('tama-controls')[0];
  this.tamaLib = new TamaLib(this, physicalInterface);
};

Module.postRun = function postRun() {
  log('postRun');
};

export default Module;
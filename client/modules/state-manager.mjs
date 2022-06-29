
const log = (...args) => console.log('[StateManager]', ...args);

export default class StateManager {
  constructor(storageBackend = window.localStorage) {
    this.storageBackend = storageBackend;
  }

  saveState(emulationState, tag = 'latest') {
    log(`Saving state to ${tag}`);
    const serializedState = emulationState.export();
    this.storageBackend.setItem(tag, serializedState);
  }

  getState(tag = 'latest') {
    log(`Fetching state from ${tag}`);
    return this.storageBackend.getItem(tag);
  }
}
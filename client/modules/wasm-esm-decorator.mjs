import CustomModule from './custom-module.mjs';

if (typeof fetch === 'undefined') {
  await import('path').then(path => globalThis.__dirname = path.dirname(import.meta.url));
  await import('module').then(module => globalThis.require = module.createRequire(import.meta.url));
}

import { default as wasm } from '../../build/tama.js';
export default await wasm({ 
  locateFile: function (path) { return '../build/' + path; },
  ...CustomModule
 });
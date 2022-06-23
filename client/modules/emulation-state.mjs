import { base64EncArr, base64DecToArr } from './lib/base64encode.mjs';

const VERSION = "tama0001";

class DataType {}

class U8DataType extends DataType {
  constructor() { super(); }
  size() { return 1; }
  fromU8Array(arr, addr) { return arr.at(addr); }
  toU8Array(value) { return Uint8Array.of(value & 0xff); }
}

class U16DataType extends DataType {
  constructor() { super(); }
  size() { return 2 }
  fromU8Array(arr, addr) { return (arr.at(addr) & 0xff) + ((arr.at(addr+1) & 0xff) << 8); }
  toU8Array(value) { return Uint8Array.from([value & 0xff, (value >> 8) & 0xff]); }
}

class U32DataType extends DataType {
  constructor() { super(); }
  size() { return 4 }
  fromU8Array(arr, addr) { return (arr.at(addr) & 0xff) + ((arr.at(addr+1) & 0xff) << 8) + ((arr.at(addr+2) & 0xff) << 16) + ((arr.at(addr+3) & 0xff) << 24); }
  toU8Array(value) { return Uint8Array.from([value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff]); }
}

class U8ArrayDataType extends DataType {
  constructor(size) {
    super();
    this.arraySize = size;
  }
  size() { return this.arraySize; }
  fromU8Array(arr, addr) { return arr.subarray(addr, addr + this.arraySize); }
  toU8Array(value) { return value; }
}

const TAGS = [
  ['pc', new U16DataType()],
  ['x', new U16DataType()], 
  ['y', new U16DataType()], 
  ['a', new U8DataType()], 
  ['b', new U8DataType()], 
  ['np', new U8DataType()], 
  ['sp', new U8DataType()],
  ['flags', new U8DataType()],
  ['tick_counter', new U32DataType()],
  ['clk_timer_timestamp', new U32DataType()],
  ['prog_timer_timestamp', new U32DataType()],
  ['prog_timer_enabled', new U8DataType()],
  ['prog_timer_data', new U8DataType()],
  ['prog_timer_rld', new U8DataType()],
  ['call_depth', new U32DataType()],
  ['interrupts', new U8ArrayDataType(24)],
  ['memory', new U8ArrayDataType(464)]
];

export class EmulationState {
  constructor() {
    this.version = VERSION;
  }

  static payloadSize() {
    return TAGS.reduce((acc, cur) => {
      const [, dataType] = cur;
      return acc + dataType.size();
    }, 0);
  }

  _getPointers(module, stateFn, stateSizeFn) {
    const stateStart = stateFn() / 4 ;
    const size = stateSizeFn() / 4;
    return module.HEAPU32.subarray(stateStart, stateStart + size);
  }

  pull(module, stateFn, stateSizeFn) {
    const pointers = this._getPointers(module, stateFn, stateSizeFn);
    pointers.forEach((addr, index) => {
      const [name, dataType] = TAGS[index];
      this[name] = dataType.fromU8Array(module.HEAPU8, addr);
    });
  }

  push(module, stateFn, stateSizeFn) {
    const pointers = this._getPointers(module, stateFn, stateSizeFn);
    pointers.forEach((addr, index) => {
      const [name, dataType] = TAGS[index];
      module.HEAPU8.set(dataType.toU8Array(this[name]), addr);
    });
  }

  /**
   * @brief takes internal state and extracts to base64
   */
  export() {
    // dump version number
    const encoder = new TextEncoder();
    const version = encoder.encode(VERSION);

    const construct = new Uint8Array(version.length + EmulationState.payloadSize());
    construct.set(version, 0);

    let i = version.length;
    TAGS.forEach(([name, dataType]) => {
      construct.set(dataType.toU8Array(this[name]), i);
      i += dataType.size();
    });

    return base64EncArr(construct);
  }

  /**
   * @brief takes base64 and updates internal state
   */
  import(b64str) {
    const buffer = base64DecToArr(b64str);

    // check version matches
    const decoder = new TextDecoder();
    const version = decoder.decode(buffer.subarray(0, VERSION.length));

    if (version !== VERSION) throw new Error("Save file version mismatch");

    let i = version.length;
    TAGS.forEach(([name, dataType]) => {
      this[name] = dataType.fromU8Array(buffer, i);
      i += dataType.size();
    });
  }

  static from(b64str) {
    const i = new EmulationState();
    i.import(b64str);

    return i;
  }
}
export class StaticBuffer {
  private _size;
  private _usage;

  constructor(size: number, usage: number) {
    this._size = size;
    this._usage = usage;
    console.log(this._size);
  }

  get size() {
    return this._size;
  }

  get usage() {
    return this._usage;
  }

  get arrayBuffer() {
    throw new Error('arrayBuffer getter must be overriden in an extended class');
  }

  finish() {
    throw new Error('finish() must be overriden in an extended class');
  }
}

export class DynamicBuffer extends StaticBuffer {
  beginUpdate() {
    throw new Error('beginUpdate() must be overriden in an extended class');
  }
}
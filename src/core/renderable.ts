export class Renderable {
  protected _vertexBuffer?: GPUBuffer;
  protected _pipeline?: GPURenderPipelineDescriptor;

  constructor() {}

  get pipeline() {
    return this._pipeline;
  }

  get buffer() {
    return this._vertexBuffer;
  }
}
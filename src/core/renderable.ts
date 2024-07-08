export class Renderable {
  protected _vertexBuffer?: GPUBuffer | WebGLBuffer;
  protected _pipeline?: GPURenderPipelineDescriptor | WebGLProgram;

  constructor() {}

  get pipeline() {
    return this._pipeline;
  }

  get buffer() {
    return this._vertexBuffer;
  }
}
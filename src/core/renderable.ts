import { Renderer } from "./renderer";
import { vec2, vec4 } from "gl-matrix";

export class Renderable {
  protected _position: vec2;
  protected _scale: vec2;
  protected _color: vec4;

  private _vertexBuffer?: GPUBuffer;
  private _colorBuffer?: GPUBuffer;
  private _pipeline?: GPURenderPipeline;

  constructor(handle: Renderer, pos: vec2, size: vec2, color: vec4, pipeline?: GPURenderPipeline) {
    this._position = pos;
    this._scale = size;
    this._color = color;

    if (handle.currentAPI === "WebGPU") {
      this._vertexBuffer = handle.device.createBuffer({
        size: new Float32Array([1, 1, 1]).byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Float32Array(this._vertexBuffer.getMappedRange()).set(new Float32Array([1, 1, 1]));
      this._vertexBuffer.unmap();

      const colorData = new Float32Array([
        color[0], color[1], color[2], color[3]
      ]);

      this._colorBuffer = handle.device.createBuffer({
        size: colorData.byteLength,  // Buffer size in bytes
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,  // Buffer for vertex data
        mappedAtCreation: true,  // Map buffer for data write
      });

      // Write the color data to the buffer
      new Float32Array(this._colorBuffer.getMappedRange()).set(colorData);
      this._colorBuffer.unmap();  // Unmap the buffer to make it usable by the GPU

      this._pipeline = pipeline;
    }
  }

  get position() {
    return this._position;
  }

  get scale() {
    return this._scale;
  }

  get color() {
    return this._color;
  }

  get vertexBuffer() {
    return this._vertexBuffer;
  }

  get colorBuffer() {
    return this._colorBuffer;
  }
}
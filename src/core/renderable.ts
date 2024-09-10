import { Renderer } from "./renderer";
import { vec2, vec4 } from "gl-matrix";

export class Renderable {
  protected _position: vec2;
  protected _scale: vec2;
  protected _color: vec4;

  private _vertexBuffer?: GPUBuffer;
  private _colorBuffer?: GPUBuffer;
  private _bindGroup?: GPUBindGroup;

  public colorData;

  constructor(handle: Renderer, pos: vec2, size: vec2, color: vec4) {
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
      handle.device.queue.writeBuffer(this._vertexBuffer, 0, new Float32Array([1, 1, 1]));

      this.colorData = new Float32Array([
        color[0], color[1], color[2], color[3]
      ]);

      this._colorBuffer = handle.device.createBuffer({
        size: this.colorData.byteLength * 2,  // Buffer size in bytes
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,  // Buffer for vertex data
        mappedAtCreation: true,  // Map buffer for data write
      });

      // Write the color data to the buffer
      new Float32Array(this._colorBuffer.getMappedRange()).set(this.colorData);
      this._colorBuffer.unmap();  // Unmap the buffer to make it usable by the GPU
      handle.device.queue.writeBuffer(<GPUBuffer>this.colorBuffer, 0, this.colorData);

      this._bindGroup = handle.device.createBindGroup({
        layout: handle.pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: this._colorBuffer,
            },
          },
        ]
      });
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

  get bindGroup() {
    return this._bindGroup;
  }

  translate(pos: vec2) {
    this._position = pos;
  }

  setScale(s: vec2) {
    this._scale = s;
  }
}
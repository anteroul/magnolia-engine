import { Renderer } from "./renderer";
import { vec2, vec4 } from "gl-matrix";
import { createTransformationMatrix } from "./util";

export class Renderable {
  protected _position: vec2;
  protected _scale: vec2 | number;
  protected _color: vec4;
  protected _vertexCount: number;
  protected _matrix: Float32Array;

  private _vertexBuffer?: GPUBuffer;
  private _colorBuffer?: GPUBuffer;
  private _pipeline?: GPURenderPipeline;

  constructor(handle: Renderer, pos: vec2, size: vec2 | number, color: vec4, vertices: Float32Array, pipeline?: GPURenderPipeline) {
    this._position = pos;
    this._scale = size;
    this._color = color;
    this._vertexCount = vertices.length / 2;
    this._matrix = createTransformationMatrix(1.0, 2.0, Math.PI / 4, 1.0, 1.0);

    if (handle.currentAPI === "WebGPU") {
      this._vertexBuffer = handle.device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Float32Array(this._vertexBuffer.getMappedRange()).set(vertices);
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

  get matrix() {
    return this._matrix;
  }

  get sizeInBytes() {
    return (<number>this._vertexBuffer?.size + <number>this._colorBuffer?.size);
  }

  get vertexBuffer() {
    return this._vertexBuffer;
  }

  get colorBuffer() {
    return this._colorBuffer;
  }
}
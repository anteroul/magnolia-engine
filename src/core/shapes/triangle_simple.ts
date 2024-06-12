import { Renderable } from "../renderable";
import { Renderer } from "../renderer";
import { StaticColor } from "../static_color";
import { VertexBuffer } from "../vertex_buffer";
import { vec4 } from "gl-matrix";

export class Triangle extends Renderable {
  private _buffer: VertexBuffer;
  private _color: StaticColor;

  constructor(handle: Renderer, vertices: Float32Array, color: vec4) {
    super();
    this._buffer = new VertexBuffer(handle.device, vertices);
    this._vertexBuffer = this._buffer.buffer;
    this._color = new StaticColor(handle.device, <vec4> color, handle.format);

    this._pipeline = <GPURenderPipelineDescriptor>{
      label: "pipeline",
      layout: "auto",
      vertex: {
        module: this._buffer.shader,
        entryPoint: "vs_main",
        buffers: [<GPUVertexBufferLayout>this._buffer.layout]
      },
      fragment: {
        module: this._color.shader,
        entryPoint: "fs_main",
        targets: [{
          format: <GPUTextureFormat>this._color.format
        }]
      },
      primitive: {
        topology: "triangle-list",
      }
    }
  }
}
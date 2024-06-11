import { VertexBuffer } from "./vertex_buffer";
import { ColorBuffer } from "./color_buffer";
import { Renderer } from "./renderer";
import { vec4 } from "gl-matrix";

export class Renderable {
  private _vertexBuffer: VertexBuffer;
  private _colorBuffer: ColorBuffer;
  private _pipeline: GPURenderPipelineDescriptor;

  constructor(handle: Renderer, vertices: Float32Array, color: vec4, topologyType: string) {
    this._vertexBuffer = new VertexBuffer(handle.device, vertices);
    this._colorBuffer = new ColorBuffer(handle.device, color, handle.format);

    this._pipeline = <GPURenderPipelineDescriptor>{
      label: "pipeline",
      layout: "auto",
      vertex: {
        module: this._vertexBuffer.shader,
        entryPoint: "main",
        buffers: [<GPUVertexBufferLayout>this._vertexBuffer.layout]
      },
      fragment: {
        module: this._colorBuffer.shader,
        entryPoint: "main",
        targets: [{
          format: <GPUTextureFormat>this._colorBuffer.format
        }]
      },
      primitive: {
        topology: topologyType,
      }
    }
  }

  get pipeline() {
    return this._pipeline;
  }

  get vertexBuffer() {
    return this._vertexBuffer.buffer;
  }
}
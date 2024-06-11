import { VertexBuffer } from "./vertex_buffer";
import { ColorBuffer } from "./color_buffer";
import { Renderer } from "./renderer";
import { vec4 } from "gl-matrix";

export class Renderable {
  private _vertexBuffer: VertexBuffer;
  private _colorBuffer: ColorBuffer;
  private _pipeline: GPURenderPipelineDescriptor;

  constructor(handle: Renderer, topologyType: string, vertices: Float32Array, color: GPUShaderModule | vec4) {
    this._vertexBuffer = new VertexBuffer(handle.device, vertices);
    if (color instanceof GPUShaderModule) {
      this._colorBuffer = new ColorBuffer(handle.device, [1, 1, 1, 1], handle.format);
      this._colorBuffer.setShader(color);
    } else {
      this._colorBuffer = new ColorBuffer(handle.device, <vec4> color, handle.format);
    }

    this._pipeline = <GPURenderPipelineDescriptor>{
      label: "pipeline",
      layout: "auto",
      vertex: {
        module: this._vertexBuffer.shader,
        entryPoint: "vs_main",
        buffers: [<GPUVertexBufferLayout>this._vertexBuffer.layout]
      },
      fragment: {
        module: this._colorBuffer.shader,
        entryPoint: "fs_main",
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
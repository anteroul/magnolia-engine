import { Renderable } from "../renderable";
import { Renderer } from "../renderer";
import { VertexBuffer } from "../vertex_buffer";

export class ShadedTriangle extends Renderable {
    constructor(handle: Renderer, vertices: Float32Array, shader: GPUShaderModule) {
        super();
        const vertexBuffer = new VertexBuffer(handle.device, vertices);
        this._vertexBuffer = vertexBuffer.buffer;

        this._pipeline = <GPURenderPipelineDescriptor>{
            label: "pipeline",
            layout: "auto",
            vertex: {
                module: shader,
                entryPoint: "vs_main",
                buffers: [<GPUVertexBufferLayout> vertexBuffer.layout]
            },
            fragment: {
                module: shader,
                entryPoint: "fs_main",
                targets: [{
                    format: <GPUTextureFormat>handle.format
                }]
            },
            primitive: {
                topology: "triangle-list",
            }
        }
    }
}
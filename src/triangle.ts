import { vec2, vec4 } from "gl-matrix";
import { Renderer } from "./renderer";

const BUFFER_SIZE = 64;

export class Triangle {
  private _vertexBuffer?: GPUBuffer;
  private _vertexShader?: GPUShaderModule;
  private _fragmentShader?: GPUShaderModule;
  private _bufferLayout?: GPUVertexBufferLayout;
  private _pipeline?: GPURenderPipeline;
  private _bindGroup?: GPUBindGroup

  constructor(handle: Renderer, vertices: Array<vec2>, color: vec4) {
    this._vertexShader = handle.device.createShaderModule({
      label: 'vert',
      code: `
              @vertex fn main(
                @builtin(vertex_index) vertexIndex : u32
              ) -> @builtin(position) vec4f {
                let pos = array(
                  vec2f(` + vertices[0][0] + "," + vertices[0][1] + `),  // top center
                  vec2f(` + vertices[1][0] + "," + vertices[1][1] + `),  // bottom left
                  vec2f(` + vertices[2][0] + "," + vertices[2][1] + `),  // bottom right
                );
         
                return vec4f(pos[vertexIndex], 0.0, 1.0);
              }`
    });

    this._fragmentShader = handle.device.createShaderModule({
      label: 'frag',
      code: `
                @fragment fn main() -> @location(0) vec4f {
                  return vec4f(` + color[0] + "," + color[1] + "," + color[2] + "," + color[3] + `);
                }
              `,
    });

    this._vertexBuffer = handle.device.createBuffer({
      size: BUFFER_SIZE,
      usage: GPUBufferUsage.VERTEX,
    });

    this._bufferLayout = {
      arrayStride: 24,
      attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0,
      }],
    };

    handle.geometry?.push(<GPUBuffer> this._vertexBuffer);
    //handle.device.queue.writeBuffer(<GPUBuffer> handle.buffer, 0, this._vertexBuffer.getMappedRange(), 0, handle.geometry?.length);

    this._pipeline = handle.device.createRenderPipeline({
      label: "pipeline",
      layout: "auto",
      vertex: {
        module: <GPUShaderModule>this._vertexShader,
        entryPoint: "main",
        buffers: [this._bufferLayout]
      },
      fragment: {
        module: <GPUShaderModule>this._fragmentShader,
        entryPoint: "main",
        targets: [{
          format: <GPUTextureFormat>handle.textureFormat
        }]
      },
      primitive: {
        topology: "triangle-list",
      }
    });
  }

  draw(pass: GPURenderPassEncoder, index: number) {
    pass.setPipeline(<GPURenderPipeline>this._pipeline);
    pass.setVertexBuffer(0, <GPUBuffer>this._vertexBuffer);
    pass.setBindGroup(0, <GPUBindGroup>this._bindGroup);
    pass.draw(3, index);
    pass.end();
  }
}
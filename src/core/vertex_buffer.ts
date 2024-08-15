import { StaticBuffer } from "./buffer";

export class VertexBuffer extends StaticBuffer {
    private _layout: GPUVertexBufferLayout;
    private _shader: GPUShaderModule;
    private _buffer: GPUBuffer;

    constructor(device: GPUDevice, vertices: Float32Array) {
        super(vertices.byteLength, GPUBufferUsage.VERTEX);

        this._shader = device.createShaderModule({
            label: 'vert',
            code: `
                @vertex fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4f {
                    let pos = array(
                        vec2f(` + vertices[0] + "," + vertices[1] + `),  // top center
                        vec2f(` + vertices[2] + "," + vertices[3] + `),  // bottom left
                        vec2f(` + vertices[4] + "," + vertices[5] + `),  // bottom right
                    );
                
                    return vec4f(pos[vertexIndex], 0.0, 1.0);
                }`
        });

        this._layout = {
            arrayStride: 8,
            attributes: [{
                format: "float32x2",
                offset: 0,
                shaderLocation: 0,
            }],
        };

        this._buffer = device.createBuffer({
            size: this.size,
            usage: this.usage,
            mappedAtCreation: true
        });

        new Float32Array(this._buffer.getMappedRange()).set(vertices);
        this._buffer.unmap()
    }

    get layout() {
        return this._layout;
    }

    get shader() {
        return this._shader;
    }

    get buffer() {
        return this._buffer;
    }
}
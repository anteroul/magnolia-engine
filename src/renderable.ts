import { mat4 } from "gl-matrix";
import { Renderer } from "./renderer";

export class Renderable {
    private _vertices: Float32Array;
    private _shader: GPUShaderModule | WebGLProgram;
    private _buffer: GPUBuffer | WebGLBuffer | null = null;
    private _bufferLayout: GPUVertexBufferLayout | null = null;
    private _rotation = 0.0;
    private _colors = [
        1.0, 1.0, 1.0, 1.0, // white
        1.0, 0.0, 0.0, 1.0, // red
        0.0, 1.0, 0.0, 1.0, // green
        0.0, 0.0, 1.0, 1.0, // blue
    ];

    constructor(handle: Renderer, vertices: Float32Array, shader: GPUShaderModule | WebGLProgram) {
        this._vertices = vertices;
        this._shader = shader;

        if (shader instanceof GPUShaderModule) {
            const usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

            const descriptor: GPUBufferDescriptor = {
                size: vertices.byteLength,
                usage: usage,
                mappedAtCreation: true // similar to HOST_VISIBLE, allows buffer to be written by the CPU
            };

            this._buffer = handle.device.createBuffer(descriptor);

            if (this._buffer instanceof GPUBuffer) {
                 //Buffer has been created, now load in the vertices
                new Float32Array(this._buffer.getMappedRange()).set(this._vertices);
                this._buffer.unmap();

                //now define the buffer layout
                this._bufferLayout = {
                    arrayStride: 24,
                    attributes: [
                        {
                            shaderLocation: 0,
                            format: "float32x3",
                            offset: 0
                        },
                        {
                            shaderLocation: 1,
                            format: "float32x3",
                            offset: 12
                        }
                    ]
                }
            } else {
                alert("Error creating vertex buffer!");
                return;
            }
        }
        
    }

    get vertices() {
        return this._vertices;
    }

    get shader() {
        return <GPUShaderModule | WebGLProgram> this._shader;
    }

    get colors() {
        return this._colors;
    }

    get buffer() {
        return <GPUBuffer | WebGLBuffer> this._buffer;
    }

    rotate(projection: mat4, view: mat4, deltaTime: number, speed: number) {
        this._rotation += deltaTime * speed;
        projection = mat4.create();

        mat4.rotate(
            projection,
            view,
            this._rotation,
            [1, 1, 1]
        );
    }
}
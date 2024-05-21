import { Shader } from "./shader";

export class Renderable {
    private _vertices: Float32Array;
    private _shader: GPUShaderModule | WebGLShader | undefined;

    constructor(vertices: Float32Array, shader: Shader) {
        this._vertices = vertices;
        if (shader.program) {
            this._shader = shader.program;
        }
    }

    get vertices() {
        return this._vertices;
    }

    get shader() {
        return <GPUShaderModule> this._shader;
    }

    get shaderGL() {
        return <WebGLShader> this._shader;
    }
}
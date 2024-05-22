export class Renderable {
    private _vertices: Float32Array;
    private _shader: GPUShaderModule | WebGLProgram;

    constructor(vertices: Float32Array, shader: GPUShaderModule | WebGLProgram) {
        this._vertices = vertices;
        this._shader = shader;
    }

    get vertices() {
        return this._vertices;
    }

    get shader() {
        return <GPUShaderModule | WebGLProgram> this._shader;
    }

    /*
    get shaderGL() {
        return <WebGLShader> this._shader;
    }
    */
}
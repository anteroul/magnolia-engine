export class Renderable {
    private _vertices: Float32Array;
    private _shader: GPUShaderModule | null;

    constructor(vertices: Float32Array, shader: GPUShaderModule | null) {
        this._vertices = vertices;
        this._shader = shader;
    }

    get vertices() {
        return this._vertices;
    }

    get shader() {
        return <GPUShaderModule> this._shader;
    }
}
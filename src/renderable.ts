export class Renderable {
    private _vertices: Float32Array;
    private _shader: GPUShaderModule | null;

    constructor(vertices: Float32Array, shader: GPUShaderModule | null) {
        this._vertices = vertices;
        if (!shader) {
            this._shader = null;
        } else {
            this._shader = shader;
        }
    }

    get vertices() {
        return this._vertices;
    }

    get shader() {
        return this._shader;
    }

    public getShader(): GPUShaderModule {
        if (!this._shader) {
            throw Error("Undefined shader module.");
        }
        return this._shader;
    }
}
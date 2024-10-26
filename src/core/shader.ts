export class Shader {
    public hasTranslationMatrix: boolean;
    private _shader: GPUShaderModule | WebGLProgram;

    constructor(s: GPUShaderModule | WebGLProgram, tmat: boolean) {
        this._shader = s;
        this.hasTranslationMatrix = tmat;
    }

    hasTMat() {
        return this.hasTranslationMatrix;
    }

    get shader() {
        return this._shader;
    }
}
import { mat4 } from "gl-matrix";

export class Renderable {
    private _vertices: Float32Array;
    private _shader: GPUShaderModule | WebGLProgram;
    private _rotation = 0.0
    private _colors = [
        1.0,
        1.0,
        1.0,
        1.0, // white
        1.0,
        0.0,
        0.0,
        1.0, // red
        0.0,
        1.0,
        0.0,
        1.0, // green
        0.0,
        0.0,
        1.0,
        1.0, // blue
    ];

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

    get colors() {
        return this._colors;
    }

    rotate(projection: mat4, view: mat4, deltaTime: number, speed: number) {
        this._rotation += deltaTime * speed;
        projection = mat4.create();

        mat4.rotate(
            view,
            view,
            this._rotation,
            [1, 1, 1]
        );
    }

    /*
    get shaderGL() {
        return <WebGLShader> this._shader;
    }
    */
}
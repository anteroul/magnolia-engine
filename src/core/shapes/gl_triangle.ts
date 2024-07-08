import { Renderable } from "../renderable";

export class TriangleGL extends Renderable {
    constructor(gl: WebGLRenderingContext) {
        super();
        const buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error("ERROR: GLBUFFER null");
        }
        this._vertexBuffer = buffer;
    }
}

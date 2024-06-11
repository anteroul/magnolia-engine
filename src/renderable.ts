import { Renderer } from "./renderer";

export class Renderable {
    protected programHandle?: Renderer;

    constructor(handle: Renderer) {
        this.programHandle = handle;
    }

    draw(pass: GPURenderPassEncoder, index: number) {
        
    }
}
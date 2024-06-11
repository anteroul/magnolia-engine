import { Renderable } from "../renderable";
import { Renderer } from "../renderer";
import { vec4 } from "gl-matrix";

export class Triangle extends Renderable {
  constructor(handle: Renderer, vertices: Float32Array, color: vec4 | GPUShaderModule) {
    super(handle, "triangle-list", vertices, color);
  }
}
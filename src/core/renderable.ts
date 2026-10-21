/// <reference types="@webgpu/types" />

import { Renderer } from "./renderer";
import { vec2, vec4 } from "gl-matrix";

export class Renderable {
  private _position: vec2;
  private _scale: vec2;
  private _color: vec4;
  private _vertexData: Float32Array;
  private _colorData: Float32Array;

  // for WebGL rendering (WebGPU and software read position/scale/color directly):
  public glVertexBuffer?: WebGLBuffer;
  public glColorBuffer?: WebGLBuffer;

  public vertexCount: number;

  constructor(handle: Renderer, pos: vec2, size: vec2, color: vec4) {
    this._position = pos;
    this._scale = size;
    this._color = color;

    this._vertexData = new Float32Array([
      this._position[0],
      this._position[1] + this._scale[1] / 2,
      this._position[0] - this._scale[0] / 2,
      this._position[1] - this._scale[1] / 2,
      this._position[0] + this._scale[0] / 2,
      this._position[1] - this._scale[1] / 2,
    ]);

    this._colorData = new Float32Array([
      this._color[0],
      this._color[1],
      this._color[2],
      this._color[3],

      this._color[0],
      this._color[1],
      this._color[2],
      this._color[3],

      this._color[0],
      this._color[1],
      this._color[2],
      this._color[3],
      
      this._color[0],
      this._color[1],
      this._color[2],
      this._color[3],
    ]);

    const api = handle.currentAPI;
    if (api === "WebGL" || api === "Legacy WebGL") {
      this.glVertexBuffer = <WebGLBuffer>handle.ctxGL.createBuffer();
      handle.ctxGL.bindBuffer(handle.ctxGL.ARRAY_BUFFER, this.glVertexBuffer);
      handle.ctxGL.bufferData(
        handle.ctxGL.ARRAY_BUFFER,
        this._vertexData,
        handle.ctxGL.STATIC_DRAW
      );

      this.glColorBuffer = <WebGLBuffer>handle.ctxGL.createBuffer();
      handle.ctxGL.bindBuffer(handle.ctxGL.ARRAY_BUFFER, this.glColorBuffer);
      handle.ctxGL.bufferData(
        handle.ctxGL.ARRAY_BUFFER,
        this._colorData,
        handle.ctxGL.STATIC_DRAW
      );
    }
    this.vertexCount = this.vertexData.length / 2; // Since we are using 2D triangles
  }

  private generateVertexData(): Float32Array {
    return new Float32Array([
      this._position[0],
      this._position[1] + this._scale[1] / 2,
      this._position[0] - this._scale[0] / 2,
      this._position[1] - this._scale[1] / 2,
      this._position[0] + this._scale[0] / 2,
      this._position[1] - this._scale[1] / 2,
    ]);
  }

  private generateColorData(): Float32Array {
    return new Float32Array([
      this._color[0],
      this._color[1],
      this._color[2],
      this._color[3],
      this._color[0],
      this._color[1],
      this._color[2],
      this._color[3],
      this._color[0],
      this._color[1],
      this._color[2],
      this._color[3],
    ]);
  }

  get position() {
    return this._position;
  }

  get scale() {
    return this._scale;
  }

  get color() {
    return this._color;
  }

  get vertexData() {
    return this._vertexData;
  }

  get colorData() {
    return this._colorData;
  }

  changeColor(color: vec4) {
    this._color = color;
    this._colorData = this.generateColorData();
  }

  translate(pos: vec2) {
    this._position = pos;
    this._vertexData = this.generateVertexData();
  }

  setScale(s: vec2) {
    this._scale = s;
    this._vertexData = this.generateVertexData();
  }
}

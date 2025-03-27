import { mat3 } from "gl-matrix";
import { createRenderPipeline } from "./pipeline";
import { Renderable } from "./renderable";
import { loadShaderGL, loadShaderWGPU } from "./shader_loader";

export class Renderer {
    private _canvas: HTMLCanvasElement;
    private _ctx: GPUCanvasContext | WebGL2RenderingContext | WebGLRenderingContext | null;
    // WGPU rendering:
    private _adapter!: GPUAdapter | null;
    private _device!: GPUDevice | null;
    private _pipeline!: GPURenderPipeline | null;
    private _textureFormat!: GPUTextureFormat | null;
    // WebGL rendering:
    private _shaderProgram!: WebGLProgram | null;

    public renderQueue: Array<Renderable> = [];
    public isDestroyed: boolean;

    constructor(canvas: HTMLCanvasElement | null, renderMode: any) {
        this._canvas = <HTMLCanvasElement>canvas;
        this._canvas.width = this._canvas.width; // Clears and resets the canvas
        this._ctx = null; // Reset context to ensure fresh initialization
        this._ctx = renderMode;
        this.isDestroyed = false;
    }

    async init() {
        // Reset flag
        this.isDestroyed = false;
        if (this._ctx! instanceof GPUCanvasContext) {
            // WebGPU initialization:
            if (!navigator.gpu) {
                console.log("WebGPU not supported on this browser. Switching render mode to WebGL.");
                this._ctx = null;
                this.init();
            } else {
                console.log("WebGPU support confirmed.");
                this._adapter = <GPUAdapter>await navigator.gpu.requestAdapter();

                if (!this._adapter) {
                    throw new Error("No appropriate GPU adapter found.");
                }

                this._ctx = <GPUCanvasContext>this._canvas.getContext("webgpu");

                if (!this._ctx) {
                    throw new Error("Failed to initialize WebGPU.");
                }

                this._textureFormat = navigator.gpu.getPreferredCanvasFormat();
                this._device = await this._adapter.requestDevice();

                this._ctx.configure({
                    device: <GPUDevice>this._device,
                    format: this._textureFormat,
                });

                this._pipeline = await createRenderPipeline(
                    this._device,
                    <GPUShaderModule>(
                        await loadShaderWGPU("./shaders/triangle.wgsl", this._device)
                    )
                );

                if (this._ctx instanceof GPUCanvasContext) {
                    const dpr = window.devicePixelRatio || 1;
                    this._canvas.width = Math.floor(this._canvas.clientWidth * dpr);
                    this._canvas.height = Math.floor(this._canvas.clientHeight * dpr);
                } else {
                    throw new Error("Failed to initialize WebGPU.");
                }
            }
            // initialization finished
        } else {
            // WebGL initialization:
            this._ctx = <WebGL2RenderingContext>this._canvas.getContext("webgl2");

            if (!this._ctx) {
                console.log("Failed to initialize WebGL2. Switching to legacy WebGL.");
                this._ctx = <WebGLRenderingContext>this._canvas.getContext("experimental-webgl");
            }

            if (this._ctx instanceof WebGLRenderingContext || this._ctx instanceof WebGL2RenderingContext) {
                const dpr = window.devicePixelRatio || 1;
                this._canvas.width = Math.floor(this._canvas.clientWidth * dpr);
                this._canvas.height = Math.floor(this._canvas.clientHeight * dpr);
                this._ctx.viewport(0, 0, this._canvas.width, this._canvas.height);
            } else {
                throw new Error("Failed to initialize WebGL.");
            }

            this._shaderProgram = <WebGLProgram>await loadShaderGL("./shaders/triangle_tMat.glsl", this._ctx);
            // initialization finished
        }
        console.log(this.currentAPI + " initialized.");
    }

    render() {
        if (!this.ctx) return; // Prevent crashes
        // WebGPU rendering:
        if (this.currentAPI === "WebGPU") {
            const renderPassDescriptor = <GPURenderPassDescriptor>{
                colorAttachments: [
                    {
                        view: this.ctx.getCurrentTexture().createView(),
                        loadOp: "clear",
                        storeOp: "store",
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    },
                ],
            };

            const commandEncoder = this.device.createCommandEncoder();
            const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
            passEncoder?.setPipeline(<GPURenderPipeline>this._pipeline);

            this.renderQueue.forEach((renderable) => {
                if (this.isDestroyed) return; // Ensure we don't proceed if switching API mid-frame
                renderable.updateBuffers(this);
                passEncoder.setVertexBuffer(0, renderable.vertexBuffer!);
                passEncoder.setVertexBuffer(1, renderable.colorBuffer!);
                passEncoder.setBindGroup(0, renderable.bindGroup!);
                passEncoder?.draw(renderable.vertexCount, 1, 0, 0);
            });
            passEncoder?.end();
            this.device.queue.submit([commandEncoder.finish()]);
        } else if (this.currentAPI === "WebGL" || this.currentAPI === "Legacy WebGL") {
            // WebGL rendering:

            if (!this.ctxGL) return; // Prevent crashes

            const program = this.glProgram;
            this.ctxGL.clearColor(0.0, 0.0, 0.0, 1.0);
            this.ctxGL.clear(this.ctxGL.COLOR_BUFFER_BIT);

            this.renderQueue.forEach((renderable) => {
                if (this.isDestroyed) return;
                /*
                if (this.shader?.shader instanceof WebGLProgram && this.shader?.hasTMat()) {
                    this.setPositionAttribute(this.ctxGL, renderable);
                    this.setColorAttribute(this.ctxGL, renderable);
                    this.ctxGL.useProgram(program);

                    const translationMatrix = mat3.create();
                    mat3.translate(translationMatrix, translationMatrix, renderable.position);

                    // Update uniform matrix
                    this.ctxGL.uniformMatrix3fv(
                        this.ctxGL.getUniformLocation(program, "uTranslationMatrix"),
                        false,
                        translationMatrix
                    );
                    this.ctxGL.drawArrays(this.ctxGL.TRIANGLES, 0, renderable.vertexCount);
                } else {
                    this.ctxGL.bindBuffer(this.ctxGL.ARRAY_BUFFER, <WebGLBuffer>renderable.glVertexBuffer);
                    this.ctxGL.bufferData(this.ctxGL.ARRAY_BUFFER, renderable.vertexData, this.ctxGL.DYNAMIC_DRAW); // Use DYNAMIC_DRAW
                    this.setPositionAttribute(this.ctxGL, renderable);
                    this.setColorAttribute(this.ctxGL, renderable);
                    this.ctxGL.useProgram(program);
                    this.ctxGL.drawArrays(this.ctxGL.TRIANGLES, 0, renderable.vertexCount);
                }
                */
                this.setPositionAttribute(this.ctxGL, renderable);
                this.setColorAttribute(this.ctxGL, renderable);
                this.ctxGL.useProgram(program);

                const translationMatrix = mat3.create();
                mat3.translate(translationMatrix, translationMatrix, renderable.position);

                // Update uniform matrix
                this.ctxGL.uniformMatrix3fv(
                    this.ctxGL.getUniformLocation(program, "uTranslationMatrix"),
                    false,
                    translationMatrix
                );
                this.ctxGL.drawArrays(this.ctxGL.TRIANGLES, 0, renderable.vertexCount);
            });
        }
    }

    private setPositionAttribute(ctx: WebGL2RenderingContext | WebGLRenderingContext, renderable: Renderable) {
        const numComponents = 2; // Number of values per vertex
        const type = ctx.FLOAT; // 32-bit floats
        const normalize = false;
        const stride = 0; // Use the defaults
        const offset = 0;

        ctx.bindBuffer(ctx.ARRAY_BUFFER, <WebGLBuffer>renderable.glVertexBuffer);
        ctx.vertexAttribPointer(
            ctx.getAttribLocation(this.glProgram, "aVertexPosition"),
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        ctx.enableVertexAttribArray(ctx.getAttribLocation(this.glProgram, "aVertexPosition"));
    }

    private setColorAttribute(ctx: WebGL2RenderingContext | WebGLRenderingContext, renderable: Renderable) {
        const numComponents = 4;
        const type = ctx.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        ctx.bindBuffer(ctx.ARRAY_BUFFER, <WebGLBuffer>renderable.glColorBuffer);
        ctx.vertexAttribPointer(
            ctx.getAttribLocation(this.glProgram, "aVertexColor"),
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        ctx.enableVertexAttribArray(ctx.getAttribLocation(this.glProgram, "aVertexColor"));
    }

    get ctx() {
        return <GPUCanvasContext>this._ctx;
    }

    get ctxGL() {
        return <WebGL2RenderingContext | WebGLRenderingContext>this._ctx;
    }

    get device() {
        return <GPUDevice>this._device;
    }

    get format() {
        return <GPUTextureFormat>this._textureFormat;
    }

    get currentAPI() {
        if (this._ctx instanceof GPUCanvasContext)
            return "WebGPU";
        else if (this._ctx instanceof WebGL2RenderingContext)
            return "WebGL";
        else if (this._ctx instanceof WebGLRenderingContext)
            return "Legacy WebGL";
        else
            return "none";
    }

    get geometryCount() {
        return this.renderQueue.length;
    }

    get pipeline() {
        return <GPURenderPipeline>this._pipeline;
    }

    get glProgram() {
        return <WebGLProgram>this._shaderProgram;
    }

    destroy() {
        console.log("Destroying renderer...");
        this.isDestroyed = true; // Prevent further rendering

        if (!this._ctx) {
            console.warn("Renderer already destroyed!");
            return;
        }

        this.renderQueue.length = 0; // Clear render queue

        if (this._ctx instanceof GPUCanvasContext) {
            console.log("Cleaning up WebGPU resources...");
            this._pipeline = null;
            this._textureFormat = null;
            this._device = null;
            this._adapter = null;
        } else if (this._ctx instanceof WebGLRenderingContext || this._ctx instanceof WebGL2RenderingContext) {
            console.log("Cleaning up WebGL resources...");
            if (this._shaderProgram) {
                this._ctx.deleteProgram(this._shaderProgram);
                this._shaderProgram = null;
            }
        }

        // Reset canvas state
        this._canvas.width = this._canvas.width; // Clears and resets the canvas
        this._ctx = null;
    }
}

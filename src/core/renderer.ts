import { mat3 } from "gl-matrix";
import { createRenderPipeline, INSTANCE_FLOATS } from "./pipeline";
import { Renderable } from "./renderable";
import { SoftwareRasterizer } from "./software_rasterizer";
import { loadShaderGL, loadShaderWGPU } from "./shader_loader";

export class Renderer {
    private _canvas: HTMLCanvasElement;
    private _ctx: GPUCanvasContext | WebGL2RenderingContext | WebGLRenderingContext | CanvasRenderingContext2D | null;
    // WGPU rendering:
    private _adapter!: GPUAdapter | null;
    private _device!: GPUDevice | null;
    private _pipeline!: GPURenderPipeline | null;
    private _textureFormat!: GPUTextureFormat | null;
    private _instanceBuffer: GPUBuffer | null = null;
    private _instanceData: Float32Array = new Float32Array(0);
    private _renderPassDescriptor!: GPURenderPassDescriptor;
    private _colorAttachment!: GPURenderPassColorAttachment;
    // WebGL rendering:
    private _shaderProgram!: WebGLProgram | null;
    // Software rendering:
    private _rasterizer: SoftwareRasterizer | null = null;

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
                throw new Error("WebGPU not supported on this browser. Switching render mode to WebGL.");
            } else {
                console.log("WebGPU support confirmed.");

                this._adapter = <GPUAdapter>await navigator?.gpu?.requestAdapter();

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
                    this._textureFormat,
                    <GPUShaderModule>(
                        await loadShaderWGPU("./shaders/triangle_instanced.wgsl", this._device)
                    )
                );

                // Reused every frame; only the view changes
                this._colorAttachment = {
                    view: <GPUTextureView><unknown>null,
                    loadOp: "clear",
                    storeOp: "store",
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                };
                this._renderPassDescriptor = { colorAttachments: [this._colorAttachment] };

                if (this._ctx instanceof GPUCanvasContext) {
                    const dpr = window.devicePixelRatio || 1;
                    this._canvas.width = Math.floor(this._canvas.clientWidth * dpr);
                    this._canvas.height = Math.floor(this._canvas.clientHeight * dpr);
                } else {
                    throw new Error("Failed to initialize WebGPU.");
                }
            }
            // initialization finished
        } else if (this._ctx instanceof CanvasRenderingContext2D) {
            // Software initialization:
            const dpr = window.devicePixelRatio || 1;
            this._canvas.width = Math.floor(this._canvas.clientWidth * dpr);
            this._canvas.height = Math.floor(this._canvas.clientHeight * dpr);
            this._rasterizer = new SoftwareRasterizer(this._ctx, this._canvas.width, this._canvas.height);
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
        const api = this.currentAPI;
        if (api === "WebGPU") {
            this.renderWebGPU();
        } else if (api === "Software") {
            this.renderSoftware();
        } else {
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


    // All triangles are drawn with a single instanced draw call
    private renderWebGPU() {
        const count = this.renderQueue.length;
        this.ensureInstanceCapacity(count);

        const data = this._instanceData;
        for (let i = 0; i < count; i++) {
            const renderable = this.renderQueue[i];
            const pos = renderable.position;
            const scale = renderable.scale;
            const color = renderable.color;
            const o = i * INSTANCE_FLOATS;
            data[o] = pos[0];
            data[o + 1] = pos[1];
            data[o + 2] = scale[0];
            data[o + 3] = scale[1];
            data[o + 4] = color[0];
            data[o + 5] = color[1];
            data[o + 6] = color[2];
            data[o + 7] = color[3];
        }

        const device = this.device;
        if (count > 0) {
            device.queue.writeBuffer(<GPUBuffer>this._instanceBuffer, 0, data, 0, count * INSTANCE_FLOATS);
        }

        this._colorAttachment.view = this.ctx.getCurrentTexture().createView();
        const commandEncoder = device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass(this._renderPassDescriptor);
        if (count > 0) {
            passEncoder.setPipeline(<GPURenderPipeline>this._pipeline);
            passEncoder.setVertexBuffer(0, this._instanceBuffer);
            passEncoder.draw(3, count, 0, 0);
        }
        passEncoder.end();
        device.queue.submit([commandEncoder.finish()]);
    }

    // Grows the instance buffer to the next power of two when the queue outgrows it
    private ensureInstanceCapacity(count: number) {
        const needed = Math.max(count, 1) * INSTANCE_FLOATS;
        if (this._instanceBuffer && this._instanceData.length >= needed) return;

        let capacity = Math.max(this._instanceData.length, 1024 * INSTANCE_FLOATS);
        while (capacity < needed) capacity *= 2;

        this._instanceBuffer?.destroy();
        this._instanceData = new Float32Array(capacity);
        this._instanceBuffer = this.device.createBuffer({
            label: "triangle instances",
            size: this._instanceData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
    }

    private renderSoftware() {
        const rasterizer = <SoftwareRasterizer>this._rasterizer;
        rasterizer.clear();
        for (let i = 0; i < this.renderQueue.length; i++) {
            const renderable = this.renderQueue[i];
            rasterizer.drawTriangle(renderable.position, renderable.scale, renderable.color);
        }
        rasterizer.present();
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
        if (navigator.gpu && this._ctx instanceof GPUCanvasContext)
            return "WebGPU";
        else if (this._ctx instanceof WebGL2RenderingContext)
            return "WebGL";
        else if (this._ctx instanceof WebGLRenderingContext)
            return "Legacy WebGL";
        else if (this._ctx instanceof CanvasRenderingContext2D)
            return "Software";
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

        if (navigator.gpu && this._ctx instanceof GPUCanvasContext) {
            console.log("Cleaning up WebGPU resources...");
            this._instanceBuffer?.destroy();
            this._instanceBuffer = null;
            this._instanceData = new Float32Array(0);
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
        } else if (this._ctx instanceof CanvasRenderingContext2D) {
            console.log("Cleaning up software renderer resources...");
            this._rasterizer = null;
        }

        // Reset canvas state
        this._canvas.width = this._canvas.width; // Clears and resets the canvas
        this._ctx = null;
    }
}

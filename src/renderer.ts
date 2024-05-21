import { Renderable } from "./renderable";

const BUFFER_SIZE = 64;

export class Renderer {
    private _canvas: HTMLCanvasElement;
    private _ctx: GPUCanvasContext | WebGL2RenderingContext | WebGLRenderingContext;
    private _adapter: GPUAdapter | null;
    private _textureFormat: GPUTextureFormat | null;
    private _device: GPUDevice | null;
    private _buffer: GPUBuffer | WebGLBuffer | null;
    private _bufferLayout: GPUVertexBufferLayout | null;
    private _colorAttachment: GPURenderPassColorAttachment | Float32Array | null;
    
    public RenderQueue: Array<Renderable> = [];

    constructor(canvas: HTMLCanvasElement | null, renderMode: GPUCanvasContext | WebGL2RenderingContext | WebGLRenderingContext) {
        this._canvas = <HTMLCanvasElement> canvas;
        this._ctx = renderMode;
        this._adapter = null;
        this._textureFormat = null;
        this._device = null;
        this._buffer = null;
        this._bufferLayout = null;
        this._colorAttachment = null;
    }

    async init() {
        if (this._ctx instanceof GPUCanvasContext) {
            if (!navigator.gpu) {
                console.log("WebGPU not supported on this browser. Switching render mode to WebGL.");
                this._ctx = <WebGL2RenderingContext> this._canvas.getContext("webgl2");
            } else {
                console.log("WebGPU support confirmed.");
                // WebGPU initialization code:
                this._adapter = await navigator.gpu.requestAdapter();
    
                if (!this._adapter) {
                    throw new Error("No appropriate GPU adapter found.");
                }

                this._ctx = <GPUCanvasContext> this._canvas.getContext("webgpu");

                if (!this._ctx) {
                    throw new Error("Failed to initialize WebGPU.");
                }

                this._textureFormat = navigator.gpu.getPreferredCanvasFormat();
                this._device = await this._adapter.requestDevice();
            
                this._ctx.configure({
                    device: <GPUDevice> this._device,
                    format: this._textureFormat
                });

                this._buffer = this._device.createBuffer({
                    size: BUFFER_SIZE,
                    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                });
                
                this._bufferLayout = {
                    arrayStride: 0,
                    attributes: [{
                        format: "float32x2",
                        offset: 0,
                        shaderLocation: 0,
                    }],
                };

                this._colorAttachment = {
                    view: this._ctx.getCurrentTexture().createView(),
                    resolveTarget: undefined,
                    loadOp: 'clear',
                    clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
                    storeOp: 'discard',
                };

                // initialization finished
                return;
            }
        } else {
            // WebGL initialization
            if (!this._ctx) {
                console.log("Failed to initialize WebGL2. Switching to legacy WebGL.");
                this._ctx = <WebGLRenderingContext> this._canvas.getContext("webgl");
            }

            this._buffer = <WebGLBuffer> this._ctx.createBuffer();
            this._ctx.bindBuffer(this._ctx.ARRAY_BUFFER, this._buffer);
            this._colorAttachment = <Float32Array> new Float32Array([0, 0, 0.4, 1]);
            this._ctx.clearColor(this._colorAttachment[0], this._colorAttachment[1], this._colorAttachment[2], this._colorAttachment[3]);
            // initialization finished
        }
    }

    setClearColor(_r: number, _g: number, _b: number) {
        if (this._ctx instanceof GPUCanvasContext) {
            this._colorAttachment = {
                view: this._ctx.getCurrentTexture().createView(),
                resolveTarget: undefined,
                loadOp: 'clear',
                clearValue: { r: _r, g: _g, b: _b, a: 1 },
                storeOp: 'discard',
            };
        } else {
            this._ctx.clearColor(_r, _g, _b, 1);
        }
    }

    renderWGPU(ctx: GPUCanvasContext, device: GPUDevice, index: number) {
        const r = this.RenderQueue.at(index);

        if (!r || !r.shader) {
            return;
        }

        device.queue.writeBuffer(<GPUBuffer> this._buffer, 0, r.vertices);
        const encoder = device.createCommandEncoder();

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: ctx.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
                storeOp: "store",
            }]
        });

        const pipeline = device.createRenderPipeline({
            label: "pipeline",
            layout: "auto",
            vertex: {
                module: r.shader,
                entryPoint: "vs_main",
                buffers: [this._bufferLayout]
            },
            fragment: {
                module: r.shader,
                entryPoint: "fs_main",
                targets: [{
                    format: <GPUTextureFormat> this._textureFormat
                }]
            },
            primitive: {
                topology: "triangle-list",
            }
        });

        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, <GPUBuffer> this._buffer);
        pass.draw(this.RenderQueue[index].vertices.length);
        pass.end();

        device.queue.submit([encoder.finish()]);
    }

    renderGL(ctx: WebGL2RenderingContext | WebGLRenderingContext, index: number, deltaTime: number) {
        const r = this.RenderQueue.at(index);

        if (!r) {
            return;
        }
        // Set background colour
        this.setClearColor(0, 0, 0.4);
        ctx.clearDepth(1.0);

        ctx.enable(ctx.DEPTH_TEST);
        ctx.depthFunc(ctx.LEQUAL);
        // Clear canvas
        ctx.clear(ctx.COLOR_BUFFER_BIT);

        const fieldOfView = (45 * Math.PI) / 180; // in radians
        const aspect = ctx.canvas.width / ctx.canvas.height;
        const zNear = 0.1;
        const zFar = 100.0;
        //const projectionMatrix = mat4.create();

        // NOTE: glmatrix.js always has the first argument
        // as the destination to receive the result.
        //mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

        // Set the drawing position to the "identity" point, which is
        // the center of the scene.
        //const modelViewMatrix = mat4.create();

        // Now move the drawing position a bit to where we want to
        // start drawing the square.
        /*
        mat4.translate(
            modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to translate
            [-0.0, 0.0, -6.0],
        ); // amount to translate

        r.rotate(projectionMatrix, modelViewMatrix, deltaTime, 1.5);

        this.setPositionAttribute(buffers, programInfo);
        this.setColorAttribute(this.context, buffers, programInfo);
        this.context.useProgram(programInfo.program);

        this.context.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix,
        );
        this.context.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix,
        );
        {
            const offset = 0;
            const vertexCount = 4;
            this.context.drawArrays(this.context.TRIANGLE_STRIP, offset, vertexCount);
        }
        */
        ctx.useProgram(r.shaderGL);
        ctx.bindBuffer(ctx.ARRAY_BUFFER, null);

        ctx.viewport(0,0, this._canvas.width, this._canvas.height);
        ctx.drawElements(ctx.TRIANGLES, r.vertices.length, ctx.UNSIGNED_SHORT, 0);
        ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
    }

    render(ctx: GPUCanvasContext | WebGL2RenderingContext | WebGLRenderingContext, index: number, deltaTime: number) {
        if (ctx instanceof GPUCanvasContext) {
            this.renderWGPU(ctx, this.device, index);
        } else if (ctx instanceof WebGLRenderingContext || WebGL2RenderingContext) {
            this.renderGL(ctx, index, deltaTime);
        }
    }

    get ctx() {
        return <GPUCanvasContext | WebGL2RenderingContext | WebGLRenderingContext> this._ctx;
    }

    get device() {
        return <GPUDevice> this._device;
    }
}

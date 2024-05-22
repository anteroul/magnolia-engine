import { Renderable } from "./renderable";
import { ShaderLoader } from "./shader";
import { mat4 } from "gl-matrix";

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
    public Shader: ShaderLoader;

    constructor(canvas: HTMLCanvasElement | null, renderMode: any) {
        this._canvas = <HTMLCanvasElement> canvas;
        this._ctx = renderMode;
        this._adapter = null;
        this._textureFormat = null;
        this._device = null;
        this._buffer = null;
        this._bufferLayout = null;
        this._colorAttachment = null;
        this.Shader = new ShaderLoader(this);
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
        console.log(this.currentAPI + " initialized.");
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

        if (!r) {
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
                module: <GPUShaderModule> r.shader,
                entryPoint: "vs_main",
                buffers: [this._bufferLayout]
            },
            fragment: {
                module: <GPUShaderModule> r.shader,
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

        /*
        ctx.bufferData(ctx.ARRAY_BUFFER, r.vertices, ctx.STATIC_DRAW);
        // Set background colour
        if (this._colorAttachment instanceof Float32Array) {
            ctx.clearColor(this._colorAttachment[0], this._colorAttachment[1], this._colorAttachment[2], this._colorAttachment[3]);
        } else {
            ctx.clearColor(0, 0, 0, 0);
        }
        ctx.clear(ctx.COLOR_BUFFER_BIT);
        
        ctx.useProgram(<WebGLProgram> r.shader);
        ctx.bindBuffer(ctx.ARRAY_BUFFER, this._buffer);
        
        const vertexPositionAttribute = ctx.getAttribLocation(r.shader, 'aVertexPosition');
        ctx.enableVertexAttribArray(vertexPositionAttribute);
        ctx.vertexAttribPointer(vertexPositionAttribute, 2, ctx.FLOAT, false, 0, 0);
        
        ctx.drawArrays(ctx.TRIANGLES, 0, 3);
        */

        const programInfo: WebGLProgram = r.shader;

        ctx.clearColor(0.0, 0.0, 0.2, 1.0);
        ctx.clearDepth(1.0);
        ctx.enable(ctx.DEPTH_TEST);
        ctx.depthFunc(ctx.LEQUAL);

        // Clear canvas.
        ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);

        const fieldOfView = (45 * Math.PI) / 180; // in radians
        const aspect = ctx.canvas.width / ctx.canvas.height;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4.create();

        // NOTE: glmatrix.js always has the first argument
        // as the destination to receive the result.
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

        // Set the drawing position to the "identity" point, which is
        // the center of the scene.
        const modelViewMatrix = mat4.create();

        // Now move the drawing position a bit to where we want to
        // start drawing the square.
        mat4.translate(
            modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to translate
            [-0.0, 0.0, -6.0],
        ); // amount to translate

        r.rotate(projectionMatrix, modelViewMatrix, deltaTime, 1.5);

        this.setPositionAttribute(ctx, r);
        this.setColorAttribute(ctx, r);
        ctx.useProgram(r.shader);

        ctx.uniformMatrix4fv(
            ctx.getUniformLocation(programInfo, "uProjectionMatrix"),
            false,
            projectionMatrix,
        );
        ctx.uniformMatrix4fv(
            ctx.getUniformLocation(programInfo, "uModelViewMatrix"),
            false,
            modelViewMatrix,
        );
        {
            const offset = 0;
            const vertexCount = 4;
            ctx.drawArrays(ctx.TRIANGLE_STRIP, offset, vertexCount);
        }
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

    get currentAPI() {
        if (this.ctx instanceof GPUCanvasContext)
            return "WebGPU";
        if (this.ctx instanceof WebGL2RenderingContext)
            return "WebGL2";
        if (this.ctx instanceof WebGLRenderingContext)
            return "WebGL";
        return "none";
    }

    setPositionAttribute(ctx: WebGL2RenderingContext | WebGLRenderingContext, r: Renderable) {
        const numComponents = 2; // pull out 2 values per iteration
        const type = ctx.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        ctx.bindBuffer(ctx.ARRAY_BUFFER, this._buffer);
        ctx.bufferData(ctx.ARRAY_BUFFER, r.vertices, ctx.STATIC_DRAW);
        ctx.vertexAttribPointer(
            ctx.getAttribLocation(r.shader, "aVertexPosition"),
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
        ctx.enableVertexAttribArray(ctx.getAttribLocation(r.shader, "aVertexPosition"));
    }

    setColorAttribute(ctx: WebGL2RenderingContext | WebGLRenderingContext, r: Renderable) {
        const numComponents = 4;
        const type = ctx.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        ctx.bindBuffer(ctx.ARRAY_BUFFER, this._buffer);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(r.colors), ctx.STATIC_DRAW);
        ctx.vertexAttribPointer(
            ctx.getAttribLocation(r.shader, "aVertexColor"),
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
        ctx.enableVertexAttribArray(ctx.getAttribLocation(r.shader, "aVertexColor"));
    }
}

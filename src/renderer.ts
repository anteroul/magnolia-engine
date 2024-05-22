import { Renderable } from "./renderable";
import { ShaderLoader } from "./shader";

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

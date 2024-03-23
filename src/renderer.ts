import { Renderable } from "./renderable";

const BUFFER_SIZE = 64;

export class Renderer {
    private _canvas: HTMLCanvasElement;
    private _ctxWGPU: GPUCanvasContext | null;
    private _ctxGL: WebGLRenderingContext | null;
    private _adapter: GPUAdapter | null;
    private _textureFormat: GPUTextureFormat | null;
    private _device: GPUDevice | null;
    private _buffer: GPUBuffer | null;
    private _bufferLayout: GPUVertexBufferLayout | null;
    private _colorAttachment: GPURenderPassColorAttachment | null;
    
    public RenderQueue: Array<Renderable> = [];

    constructor(canvas: HTMLCanvasElement | null) {
        this._canvas = <HTMLCanvasElement> canvas;
        this._ctxWGPU = null;
        this._ctxGL = null;
        this._adapter = null;
        this._textureFormat = null;
        this._device = null;
        this._buffer = null;
        this._bufferLayout = null;
        this._colorAttachment = null;
    }

    async init(enableWGPU: Boolean) {
        if (enableWGPU) {
            if (!navigator.gpu) {
                console.log("WebGPU not supported on this browser. Switching render mode to WebGL.");
                enableWGPU = false;
            } else {
                console.log("WebGPU support confirmed.");
                // WGPU initialization code:
                this._adapter = await navigator.gpu.requestAdapter();
    
                if (!this._adapter) {
                    throw new Error("No appropriate GPU adapter found.");
                }

                this._ctxWGPU = <GPUCanvasContext> this._canvas.getContext('webgpu');

                if (!this._ctxWGPU) {
                    throw new Error("Undefined context.");
                }

                this._textureFormat = navigator.gpu.getPreferredCanvasFormat();
                this._device = await this._adapter.requestDevice();
            
                this._ctxWGPU.configure({
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
                    view: this._ctxWGPU.getCurrentTexture().createView(),
                    resolveTarget: undefined,
                    loadOp: 'clear',
                    clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
                    storeOp: 'discard',
                };

                // initialization finished
                return;
            }
        }
        // WebGL initialization
        this._ctxGL = this._canvas.getContext("webgl");
    }

    setClearColor(_r: number, _g: number, _b: number) {
        let ctx = <GPUCanvasContext> this.ctx;
        if (ctx && this._colorAttachment) {
            this._colorAttachment = {
                view: ctx.getCurrentTexture().createView(),
                resolveTarget: undefined,
                loadOp: 'clear',
                clearValue: { r: _r, g: _g, b: _b, a: 1 },
                storeOp: 'discard',
            };
        }
    }

    render(ctx: GPUCanvasContext, device: GPUDevice, index: number) {
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
        pass.setVertexBuffer(0, this._buffer);
        pass.draw(this.RenderQueue[index].vertices.length);
        pass.end();

        device.queue.submit([encoder.finish()]);
    }

    get ctx() {
        if (!this._ctxGL) {
            return <GPUCanvasContext> this._ctxWGPU;
        }
        return <WebGLRenderingContext> this._ctxGL;
    }

    get device() {
        return <GPUDevice> this._device;
    }
}

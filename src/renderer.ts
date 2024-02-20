import { Renderable } from "./renderable";

const BUFFER_SIZE = 64;

export class Renderer {
    private _ctx: GPUCanvasContext | null;
    private _adapter: GPUAdapter | null;
    private _textureFormat: GPUTextureFormat | null;
    private _device: GPUDevice | null;
    private _buffer: GPUBuffer | null;
    private _bufferLayout: GPUVertexBufferLayout | null;
    private _colorAttachment: GPURenderPassColorAttachment | null;
    private _renderIndex: number;

    public RenderQueue: Array<Renderable> = [];

    constructor() {
        this._ctx = null;
        this._adapter = null;
        this._textureFormat = null;
        this._device = null;
        this._buffer = null;
        this._bufferLayout = null;
        this._colorAttachment = null;
        this._renderIndex = 0;
    }

    async init(canvas: HTMLCanvasElement) {
        if (!navigator.gpu) {
            throw new Error("WebGPU not supported on this browser.");
        } else {
            console.log("WebGPU support confirmed.");
        }

        this._adapter = await navigator.gpu.requestAdapter();
    
        if (!this._adapter) {
            throw new Error("No appropriate GPU adapter found.");
        }

        this._ctx = <GPUCanvasContext> canvas.getContext('webgpu');

        if (!this._ctx) {
            throw new Error("Undefined context.");
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
    }

    setClearColor(_r: number, _g: number, _b: number) {
        if (this._ctx && this._colorAttachment) {
            this._colorAttachment = {
                view: this._ctx.getCurrentTexture().createView(),
                resolveTarget: undefined,
                loadOp: 'clear',
                clearValue: { r: _r, g: _g, b: _b, a: 1 },
                storeOp: 'discard',
            };
        }
    }

    render() {
        if (!this._ctx) {
            throw new Error("Undefined context.");
        }

        if (!this._device) {
            throw new Error("Undefined device.");
        }

        this._device.queue.writeBuffer(<GPUBuffer> this._buffer, 0, this.RenderQueue[this._renderIndex].vertices);
        const encoder = this._device.createCommandEncoder();

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this._ctx.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
                storeOp: "store",
            }]
        });

        const pipeline = this._device.createRenderPipeline({
            label: "pipeline",
            layout: "auto",
            vertex: {
                module: <GPUShaderModule> this.RenderQueue[0].shader,
                entryPoint: "vs_main",
                buffers: [this._bufferLayout]
            },
            fragment: {
                module: <GPUShaderModule> this.RenderQueue[0].shader,
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
        pass.draw(this.RenderQueue[0].vertices.length);
        pass.end();

        this._device.queue.submit([encoder.finish()]);
    }

    async loadShader(url: RequestInfo): Promise<GPUShaderModule | null> {
        const response = await fetch(url);
        const source = await response.text();
        if (this._device) {
            return this._device.createShaderModule({ code: source });
        }
        return null;
    }
}

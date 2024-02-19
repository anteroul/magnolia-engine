import { Renderable } from "./renderable";

const BUFFER_SIZE = 64;

export class Renderer {
    
    private context: GPUCanvasContext | null;
    private adapter: GPUAdapter | null;
    private canvasFormat: GPUTextureFormat | null;
    private device: GPUDevice | null;
    private buffer: GPUBuffer | null;
    private bufferLayout: GPUVertexBufferLayout | null;
    private colorAttachment: GPURenderPassColorAttachment | null;
    private pipeline: GPURenderPipeline | null;
    private renderIndex: number;
    
    public renderQueue: Array<Renderable> = [];

    constructor(canvas: HTMLCanvasElement) {
        this.context = canvas.getContext("webgpu");
        this.adapter = null;
        this.canvasFormat = null;
        this.device = null;
        this.buffer = null;
        this.bufferLayout = null;
        this.colorAttachment = null;
        this.pipeline = null;
        this.renderIndex = 0;
    }

    public async init() {
        if (!navigator.gpu) {
            throw new Error("WebGPU not supported on this browser.");
        } else {
            console.log("WebGPU support confirmed.");
        }

        this.adapter = await navigator.gpu.requestAdapter();
    
        if (!this.adapter) {
            throw new Error("No appropriate GPU adapter found.");
        }

        if (!this.context) {
            throw new Error("Undefined context.");
        }

        this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        this.device = await this.adapter.requestDevice();
    
        this.context.configure({
            device: this.device,
            format: this.canvasFormat
        });

        this.buffer = this.device.createBuffer({
            size: BUFFER_SIZE,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        
        this.bufferLayout = {
            arrayStride: 0,
            attributes: [{
                format: "float32x2",
                offset: 0,
                shaderLocation: 0,
            }],
        };

        this.colorAttachment = {
            view: this.context.getCurrentTexture().createView(),
            resolveTarget: undefined,
            loadOp: 'clear',
            clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
            storeOp: 'discard',
        };

        this.pipeline = this.device.createRenderPipeline({
            label: "Pipeline",
            layout: "auto",
            vertex: {
                module: this.renderQueue[this.renderIndex].getShader(),
                entryPoint: "vs_main",
                buffers: [this.bufferLayout]
            },
            fragment: {
                module: this.renderQueue[this.renderIndex].getShader(),
                entryPoint: "fs_main",
                targets: [{
                    format: this.canvasFormat
                }]
            },
            primitive: {
                topology: "triangle-list",
            }
        });
    }

    public async loadShader(url: RequestInfo): Promise<GPUShaderModule | null> {
        const response = await fetch(url);
        const source = await response.text();
        const module: GPUShaderModule = this.getDevice().createShaderModule({ code: source });
        return module;
    }

    public setClearColor(_r: number, _g: number, _b: number) {
        this.colorAttachment = {
            view: this.getContext().getCurrentTexture().createView(),
            resolveTarget: undefined,
            loadOp: 'clear',
            clearValue: { r: _r, g: _g, b: _b, a: 1 },
            storeOp: 'discard',
        };
    }

    public render() {
        // Cycle the render queue.
        if (this.renderIndex > this.renderQueue.length) {
            this.renderIndex = 0;
        }

        this.initRenderable(this.renderQueue[this.renderIndex]);
        this.getDevice().queue.writeBuffer(this.getBuffer(), 0, this.renderQueue[this.renderIndex].vertices);

        const encoder = this.getDevice().createCommandEncoder();

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: this.getContext().getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
                storeOp: "store",
            }]
        });

        pass.setPipeline(this.getPipeline());
        pass.setVertexBuffer(0, this.buffer);
        pass.draw(this.renderQueue[this.renderIndex].vertices.length);
        pass.end();

        this.getDevice().queue.submit([encoder.finish()]);
        this.renderIndex++;
    }

    private getContext(): GPUCanvasContext {
        if (!this.context) {
            throw new Error("Undefined context.");
        }
        return this.context;
    }

    private getDevice(): GPUDevice {
        if (!this.device) {
            throw new Error("Undefined device.");
        }
        return this.device;
    }

    private getFormat(): GPUTextureFormat {
        if (!this.canvasFormat) {
            throw new Error("Undefined format.");
        }
        return this.canvasFormat;
    }

    private getBuffer(): GPUBuffer {
        if (!this.buffer) {
            throw new Error("Undefined buffer.");
        }
        return this.buffer;
    }

    private getPipeline(): GPURenderPipeline {
        if (!this.pipeline) {
            throw new Error("Undefined pipeline.");
        }
        return this.pipeline;
    }

    private initRenderable(r: Renderable) {
        this.buffer = this.getDevice().createBuffer({
            size: r.vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        this.pipeline = this.getDevice().createRenderPipeline({
            label: "Pipeline",
            layout: "auto",
            vertex: {
                module: this.renderQueue[this.renderIndex].getShader(),
                entryPoint: "vs_main",
                buffers: [this.bufferLayout]
            },
            fragment: {
                module: this.renderQueue[this.renderIndex].getShader(),
                entryPoint: "fs_main",
                targets: [{
                    format: this.getFormat()
                }]
            },
            primitive: {
                topology: "triangle-list",
            }
        });
    }
}
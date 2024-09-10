import { createRenderPipeline } from "./pipeline";
import { Renderable } from "./renderable";
import { ShaderLoader } from "./shader_loader";
import { rand } from "./util";

const uniformBufferSize = 32 * 1000;

export class Renderer {
    private _canvas: HTMLCanvasElement;
    private _ctx: GPUCanvasContext | WebGL2RenderingContext | WebGLRenderingContext;
    private _adapter?: GPUAdapter;
    private _device?: GPUDevice;
    private _pipeline?: GPURenderPipeline;
    private _bindGroup?: GPUBindGroup;
    private _uniformBuffer?: GPUBuffer;
    private _textureFormat?: GPUTextureFormat;
    private _uniformValues = new Float32Array(uniformBufferSize / 4);

    public renderQueue: Array<Renderable> = [];
    public shaderLoader: ShaderLoader;

    constructor(canvas: HTMLCanvasElement | null, renderMode: any) {
        this._canvas = <HTMLCanvasElement>canvas;
        this._ctx = renderMode;
        this.shaderLoader = new ShaderLoader(this);
    }

    async init() {
        if (this._ctx instanceof GPUCanvasContext) {
            if (!navigator.gpu) {
                console.log("WebGPU not supported on this browser. Switching render mode to WebGL.");
                this._ctx = <WebGL2RenderingContext>this._canvas.getContext("webgl2");
            } else {
                console.log("WebGPU support confirmed.");
                // WebGPU initialization code:
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
                    format: this._textureFormat
                });

                this._pipeline = await createRenderPipeline(this._device, <GPUShaderModule> await this.shaderLoader.load("./src/shaders/triangle.wgsl"));

                this._uniformBuffer = this._device.createBuffer({
                    label: "triangle uniform",
                    size: uniformBufferSize,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                });

                this._bindGroup = this._device.createBindGroup({
                    layout: this._pipeline.getBindGroupLayout(0),
                    entries: [
                        {
                            binding: 0,
                            resource: {
                                buffer: this._uniformBuffer,
                                offset: 0,  // This will be set dynamically in the render loop
                            }
                        }
                    ]
                });
                
                // initialization finished
            }
        } else {
            // WebGL initialization
            if (!this._ctx) {
                console.log("Failed to initialize WebGL2. Switching to legacy WebGL.");
                this._ctx = <WebGLRenderingContext>this._canvas.getContext("webgl");
            }
            // initialization finished
        }
        console.log(this.currentAPI + " initialized.");
    }

    render() {
        if (this.currentAPI === "WebGPU") {
            const renderPassDescriptor = <GPURenderPassDescriptor>{
                colorAttachments: [{
                    view: this.ctx.getCurrentTexture().createView(),
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 }
                }]
            };

            const commandEncoder = this.device.createCommandEncoder();
            const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
            passEncoder?.setPipeline(<GPURenderPipeline> this._pipeline);
            passEncoder?.setBindGroup(0, <GPUBindGroup> this._bindGroup);

            this.renderQueue.forEach((renderable) => {
                this._uniformValues.set(renderable.position, 0);              // set the position
                this._uniformValues.set(renderable.scale, 2);                 // set the scale
                this._uniformValues.set(renderable.color, 4);                 // set the color
                this.device.queue.writeBuffer(<GPUBuffer> this._uniformBuffer, 0, this._uniformValues);    
                this.device.queue.writeBuffer(<GPUBuffer> renderable.vertexBuffer, 1, this._uniformValues);
                this.device.queue.writeBuffer(<GPUBuffer> renderable.colorBuffer, 2, this._uniformValues);
                passEncoder?.draw(3);
            });
            passEncoder?.end();
            this.device.queue.submit([commandEncoder.finish()]);
        } else {
            // TODO: WebGL implementation
        }
    }

    get ctx() {
        return <GPUCanvasContext> this._ctx;
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
        if (this._ctx instanceof WebGL2RenderingContext)
            return "WebGL2";
        if (this._ctx instanceof WebGLRenderingContext)
            return "WebGL";
        return "none";
    }

    get geometryCount() {
        return this.renderQueue.length;
    }

    get pipeline() {
        return <GPURenderPipeline> this._pipeline;
    }
}
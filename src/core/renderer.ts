import { createRenderPipeline } from "./pipeline";
import { Renderable } from "./renderable";
import { ShaderLoader } from "./shader_loader";

const numberOfObjects = 100;  // Maximum number of objects
const matrixSize = 9 * 4;

export class Renderer {
    private _canvas: HTMLCanvasElement;
    private _ctx: GPUCanvasContext | WebGL2RenderingContext | WebGLRenderingContext;
    private _adapter?: GPUAdapter;
    private _device?: GPUDevice;
    private _pipeline?: GPURenderPipeline;
    private _bindGroup?: GPUBindGroup;
    private _uniformBuffer?: GPUBuffer;
    private _textureFormat?: GPUTextureFormat;

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

                const uniformBufferSize = numberOfObjects * matrixSize;

                this._uniformBuffer = this._device.createBuffer({
                    size: uniformBufferSize,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                });

                const bindGroupLayout = this._device.createBindGroupLayout({
                    entries: [
                        {
                            binding: 0,
                            visibility: GPUShaderStage.VERTEX,
                            buffer: {
                                type: 'uniform',
                                hasDynamicOffset: true  // Enable dynamic offsets
                            }
                        },
                        {
                            binding: 1,  // Color buffer
                            visibility: GPUShaderStage.FRAGMENT,
                            buffer: {
                                type: 'uniform',
                            }
                        }
                    ]
                });

                this._bindGroup = this._device.createBindGroup({
                    layout: bindGroupLayout,
                    entries: [
                        {
                            binding: 0,
                            resource: {
                                buffer: this._uniformBuffer,
                                offset: 0,  // This will be set dynamically in the render loop
                                size: matrixSize
                            }
                        },
                        {
                            binding: 1,  // Color buffer
                            resource: {
                                buffer: this._uniformBuffer,
                                offset: 0,  // This will be set dynamically in the render loop
                                size: 16
                            }
                        }
                    ]
                });

                // initialization finished
                this.renderQueue.push(new Renderable(this, ([0, 0]), 2, ([1, 0, 0, 1]), new Float32Array([1,1,1]), this._pipeline));
                this.renderQueue.push(new Renderable(this, ([-1, 1]), 2, ([0, 1, 0, 1]), new Float32Array([1,1,1]), this._pipeline));
                this.renderQueue.push(new Renderable(this, ([1, 1]), 2, ([1, 0, 1, 1]), new Float32Array([1,1,1]), this._pipeline));
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

    updateUniformBufferForObject() {
        const offset = this.geometryCount * matrixSize + 16;  // Find the correct offset for the object's data
        this.device.queue.writeBuffer(<GPUBuffer> this._uniformBuffer, offset, this.renderQueue[this.geometryCount].matrix);
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
                passEncoder?.setVertexBuffer(0, <GPUBuffer> renderable.vertexBuffer);
                passEncoder?.setVertexBuffer(1, <GPUBuffer> renderable.colorBuffer);
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
}
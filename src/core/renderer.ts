import { Renderable } from "./renderable";
import { ShaderLoader } from "./shader_loader";

export class Renderer {
    private _canvas: HTMLCanvasElement;
    private _ctx: GPUCanvasContext | WebGL2RenderingContext | WebGLRenderingContext;
    private _adapter: GPUAdapter | null;
    private _textureFormat: GPUTextureFormat | null;
    private _device: GPUDevice | null;
    
    public RenderQueue: Array<Renderable> = [];
    public ShaderLoader: ShaderLoader;

    constructor(canvas: HTMLCanvasElement | null, renderMode: any) {
        this._canvas = <HTMLCanvasElement> canvas;
        this._ctx = renderMode;
        this._adapter = null;
        this._textureFormat = null;
        this._device = null;
        this.ShaderLoader = new ShaderLoader(this);
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
                // initialization finished
            }
        } else {
            // WebGL initialization
            if (!this._ctx) {
                console.log("Failed to initialize WebGL2. Switching to legacy WebGL.");
                this._ctx = <WebGLRenderingContext> this._canvas.getContext("webgl");
            }
            // initialization finished
        }
        console.log(this.currentAPI + " initialized.");
    }

    render() {
        if (this.currentAPI === "WebGPU") {
            const commandEncoder = this.device.createCommandEncoder();
            const ctx = <GPUCanvasContext> this.ctx;
            const textureView = ctx.getCurrentTexture().createView();

            const renderPassDescriptor = <GPURenderPassDescriptor> {
                colorAttachments: [{
                    view: textureView,
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0}
                }]
            };

            const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
            let index = 0;
        
            this.RenderQueue.forEach(element => {
                index++;
                passEncoder.setPipeline(this.device.createRenderPipeline(element.pipeline));
                passEncoder.setVertexBuffer(0, element.vertexBuffer);
                passEncoder.draw(3, index);
            });

            passEncoder.end();
            this.device.queue.submit([commandEncoder.finish()]);

        } else {
            // TODO
        }
    }

    get ctx() {
        return <GPUCanvasContext | WebGL2RenderingContext | WebGLRenderingContext> this._ctx;
    }

    get device() {
        return <GPUDevice> this._device;
    }

    get format() {
        return <GPUTextureFormat> this._textureFormat;
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
}
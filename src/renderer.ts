import { Renderable } from "./renderable";

const BUFFER_SIZE = 64;
const SAMPLE_SHADER = `
struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) Color : vec4<f32>
};

@vertex
fn vs_main(@builtin(vertex_index) v_id: u32) -> Fragment {
    var positions = array<vec2<f32>, 3> (
        vec2<f32>( 0.0,  0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>( 0.5, -0.5)
    );

    var colors = array<vec3<f32>, 3> (
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0)
    );

    var output : Fragment;
    output.Position = vec4<f32>(positions[v_id], 0.0, 1.0);
    output.Color = vec4<f32>(colors[v_id], 1.0);

    return output;
}

@fragment
fn fs_main(@location(0) Color: vec4<f32>) -> @location(0) vec4<f32> {
    return Color;
}`;

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
        } else {
            console.log("Context: " + this._ctx);
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

        this.RenderQueue.push(<Renderable> new Renderable(new Float32Array([1, 1, 1]), this._device.createShaderModule( {code: SAMPLE_SHADER})));
        this.render(this._ctx, this._device);
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

    render(ctx: GPUCanvasContext, device: GPUDevice) {
        const r = this.RenderQueue.at(-1);

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
        pass.draw(this.RenderQueue[0].vertices.length);
        pass.end();

        device.queue.submit([encoder.finish()]);
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

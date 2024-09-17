import { mat3 } from "gl-matrix";
import { createRenderPipeline } from "./pipeline";
import { Renderable } from "./renderable";
import { ShaderLoader } from "./shader_loader";

export class Renderer {
    private _canvas: HTMLCanvasElement;
    private _ctx: GPUCanvasContext | WebGL2RenderingContext | WebGLRenderingContext;
    // WGPU rendering:
    private _adapter?: GPUAdapter;
    private _device?: GPUDevice;
    private _pipeline?: GPURenderPipeline;
    private _textureFormat?: GPUTextureFormat;
    // WebGL rendering:
    private _shaderProgram?: WebGLProgram;

    public renderQueue: Array<Renderable> = [];
    public shaderLoader: ShaderLoader;

    constructor(canvas: HTMLCanvasElement | null, renderMode: any) {
        this._canvas = <HTMLCanvasElement>canvas;
        this._ctx = renderMode;
        this.shaderLoader = new ShaderLoader(this);
    }

    async init() {
        if (this._ctx instanceof GPUCanvasContext) {
            // WebGPU initialization:
            if (!navigator.gpu) {
                console.log("WebGPU not supported on this browser. Switching render mode to WebGL.");
            } else {
                console.log("WebGPU support confirmed.");
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
                    format: this._textureFormat,
                });

                this._pipeline = await createRenderPipeline(
                    this._device,
                    <GPUShaderModule>(
                        await this.shaderLoader.load("./src/shaders/triangle.wgsl")
                    )
                );
            }
            // initialization finished
        } else {
            // WebGL initialization:
            if (!this._ctx) {
                console.log("Failed to initialize WebGL2. Switching to legacy WebGL.");
                this._ctx = <WebGLRenderingContext> this._canvas.getContext("webgl");
            }
            this._shaderProgram = await this.shaderLoader.load("./src/shaders/triangle.glsl");
            // initialization finished
        }
        console.log(this.currentAPI + " initialized.");
    }

    render() {
        // WebGPU rendering:
        if (this.currentAPI === "WebGPU") {
            const renderPassDescriptor = <GPURenderPassDescriptor>{
                colorAttachments: [
                    {
                        view: this.ctx.getCurrentTexture().createView(),
                        loadOp: "clear",
                        storeOp: "store",
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    },
                ],
            };

            const commandEncoder = this.device.createCommandEncoder();
            const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
            passEncoder?.setPipeline(<GPURenderPipeline>this._pipeline);

            this.renderQueue.forEach((renderable) => {
                const uniformData = this.getUniformDataForRenderable(renderable).buffer;
                this.device.queue.writeBuffer(
                    <GPUBuffer>renderable.uniformBuffer,
                    0,
                    uniformData
                );
                const bindGroup = this.device.createBindGroup({
                    layout: <GPUBindGroupLayout>this._pipeline?.getBindGroupLayout(0),
                    entries: [
                        {
                            binding: 0,
                            resource: {
                                buffer: <GPUBuffer>renderable.uniformBuffer,
                            },
                        },
                    ],
                });
                passEncoder.setBindGroup(0, bindGroup);
                passEncoder.setVertexBuffer(0, <GPUBuffer>renderable.vertexBuffer);
                passEncoder.setVertexBuffer(1, <GPUBuffer>renderable.colorBuffer);
                passEncoder?.draw(renderable.vertexCount, 1, 0, 0);
            });
            passEncoder?.end();
            this.device.queue.submit([commandEncoder.finish()]);
        } else {
            // WebGL rendering:
            const program = this.glProgram;
            this.ctxGL.clearColor(0.0, 0.0, 0.0, 1.0);
            this.ctxGL.clear(this.ctxGL.COLOR_BUFFER_BIT);

            this.renderQueue.forEach((renderable) => {
                this.setPositionAttribute(this.ctxGL, renderable);
                this.setColorAttribute(this.ctxGL, renderable);
                this.ctxGL.useProgram(program);

                const translationMatrix = mat3.create();

                mat3.translate(
                    translationMatrix,
                    translationMatrix,
                    renderable.position
                );

                this.ctxGL.uniformMatrix3fv(
                    this.ctxGL.getUniformLocation(program, "uTranslationMatrix"),
                    false,
                    translationMatrix
                );

                this.ctxGL.drawArrays(this.ctxGL.TRIANGLES, 0, renderable.vertexCount);
            });
        }
    }

    getUniformDataForRenderable(renderable: Renderable): { buffer: ArrayBuffer } {
        const uniformData = new Float32Array(16);
        uniformData.set(renderable.position, 0); // set the position
        uniformData.set(renderable.scale, 2); // set the scale
        uniformData.set(renderable.color, 4); // set the color

        renderable.uniformBuffer = this.device.createBuffer({
            label: "triangle uniform",
            size: uniformData.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        new Float32Array(renderable.uniformBuffer.getMappedRange()).set(
            uniformData
        );
        renderable.uniformBuffer.unmap();
        // Populate `uniformData` as needed for each renderable
        return { buffer: uniformData.buffer };
    }

    setPositionAttribute(
        ctx: WebGL2RenderingContext | WebGLRenderingContext,
        r: Renderable
    ) {
        const numComponents = 2; // pull out 2 values per iteration
        const type = ctx.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        ctx.bindBuffer(ctx.ARRAY_BUFFER, ctx.createBuffer());
        ctx.bufferData(ctx.ARRAY_BUFFER, r.vertexData, ctx.STATIC_DRAW);
        ctx.vertexAttribPointer(
            ctx.getAttribLocation(this.glProgram, "aVertexPosition"),
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        ctx.enableVertexAttribArray(
            ctx.getAttribLocation(this.glProgram, "aVertexPosition")
        );
    }

    setColorAttribute(
        ctx: WebGL2RenderingContext | WebGLRenderingContext,
        r: Renderable
    ) {
        const numComponents = 4;
        const type = ctx.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        ctx.bindBuffer(ctx.ARRAY_BUFFER, ctx.createBuffer());
        ctx.bufferData(
            ctx.ARRAY_BUFFER,
            new Float32Array(r.colorData),
            ctx.STATIC_DRAW
        );
        ctx.vertexAttribPointer(
            ctx.getAttribLocation(this.glProgram, "aVertexColor"),
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        ctx.enableVertexAttribArray(
            ctx.getAttribLocation(this.glProgram, "aVertexColor")
        );
    }

    get ctx() {
        return <GPUCanvasContext>this._ctx;
    }

    get ctxGL() {
        return <WebGL2RenderingContext | WebGLRenderingContext>this._ctx;
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
        else if (this._ctx instanceof WebGL2RenderingContext)
            return "WebGL";
        else if (this._ctx instanceof WebGLRenderingContext)
            return "Legacy WebGL";
        else
            return "none";
    }

    get geometryCount() {
        return this.renderQueue.length;
    }

    get pipeline() {
        return <GPURenderPipeline>this._pipeline;
    }

    get glProgram() {
        return <WebGLProgram>this._shaderProgram;
    }
}

import { ShaderLoader } from "./shader_loader";
import { vec2, vec4 } from "gl-matrix";
import { Triangle } from "./triangle";

export class Renderer {
    private _canvas: HTMLCanvasElement;
    private _ctx: GPUCanvasContext | WebGL2RenderingContext | WebGLRenderingContext;
    private _adapter: GPUAdapter | null;
    private _textureFormat: GPUTextureFormat | null;
    private _device: GPUDevice | null;
    private _colorAttachment: GPURenderPassColorAttachment | Float32Array | null;
    private _encoder?: GPUCommandEncoder;
    private _shader?: GPUShaderModule;
    
    public buffer?: GPUBuffer;
    public canvasToSizeMap = new WeakMap();
    public shaderLoader: ShaderLoader;
    public index: number = 0;

    constructor(canvas: HTMLCanvasElement | null, renderMode: any) {
        this._canvas = <HTMLCanvasElement> canvas;
        this._ctx = renderMode;
        this._adapter = null;
        this._textureFormat = null;
        this._device = null;
        this._colorAttachment = null;
        this.shaderLoader = new ShaderLoader(this);
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
                
                this._colorAttachment = {
                    view: this._ctx.getCurrentTexture().createView(),
                    resolveTarget: undefined,
                    loadOp: 'clear',
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    storeOp: 'store',
                };

                const objectBufferDescriptor: GPUBufferDescriptor = {
                    size: 64 * 1024,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                };

                this.buffer = this._device.createBuffer(objectBufferDescriptor);
                this._shader = <GPUShaderModule> <unknown> this.shaderLoader.load("./shaders/triangle.wgsl");
                // initialization finished
            }
        } else {
            // WebGL initialization
            if (!this._ctx) {
                console.log("Failed to initialize WebGL2. Switching to legacy WebGL.");
                this._ctx = <WebGLRenderingContext> this._canvas.getContext("webgl");
            }

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
                storeOp: 'store',
            };
        } else {
            this._ctx.clearColor(_r, _g, _b, 1);
        }
    }

    resizeCanvasToDisplaySize() {
        const canvas = this._canvas;
        // Get the canvas's current display size
        let { width, height } = this.canvasToSizeMap.get(canvas) || canvas;
    
        // Make sure it's valid for WebGPU
        width = Math.max(1, Math.min(width, this.device.limits.maxTextureDimension2D));
        height = Math.max(1, Math.min(height, this.device.limits.maxTextureDimension2D));
    
        // Only if the size is different, set the canvas size
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          canvas.width = width;
          canvas.height = height;
        }
        return needResize;
      }

    /*
    renderWGPU(ctx: GPUCanvasContext, device: GPUDevice, buffer: GPUBuffer, deltaTime: number) {
        const r = this.assets.at(0);

        if (!r) {
            return;
        }

        const projection = mat4.create();
        mat4.perspective(projection, Math.PI/4, this._canvas.width/this._canvas.height, 0.1, 10);

        const view = mat4.create();
        mat4.lookAt(view, [-2, 0, 2], [0, 0, 0], [0, 0, 1]);

        const model = mat4.create();
        mat4.rotate(model, model, deltaTime, [0, 0, 1]);

        device.queue.writeBuffer(buffer, 0, <ArrayBuffer>model); 
        device.queue.writeBuffer(buffer, 64, <ArrayBuffer>view); 
        device.queue.writeBuffer(buffer, 128, <ArrayBuffer>projection); 
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
        pass.setVertexBuffer(0, <GPUBuffer> r.buffer);
        pass.setBindGroup(0, this._bindGroup);
        pass.draw(r.vertices.length);
        pass.end();

        device.queue.submit([encoder.finish()]);
    }

    renderGL(ctx: WebGL2RenderingContext | WebGLRenderingContext, deltaTime: number) {
        const r = this.assets.at(0);

        if (!r) {
            return;
        }

        const programInfo: WebGLProgram = r.shader;

        ctx.clearColor(0.0, 0.0, 0.4, 1.0);
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
    */

    beginDrawing() {
        if (this.currentAPI === "WebGPU") {
            this._encoder = this.device.createCommandEncoder();
        } else {
            const ctx = <WebGL2RenderingContext | WebGLRenderingContext> this.ctx;
            ctx.clearColor(0.0, 0.0, 0.4, 1.0);
            ctx.clearDepth(1.0);
        }
        this.index = 0;
    }

    endDrawing() {
        if (this.currentAPI === "WebGPU") {
            const commandBuffer = this._encoder?.finish();
            this.device.queue.submit([<GPUCommandBuffer> commandBuffer]);
        } else {
            const ctx = <WebGL2RenderingContext | WebGLRenderingContext> this.ctx;
            ctx.clearColor(0.0, 0.0, 0.4, 1.0);
            ctx.clearDepth(1.0);
        }
    }

    drawTriangle(v1: vec2, v2: vec2, v3: vec2, c: vec4) {
        const triangle = new Triangle(this, new Array<vec2>(v1, v2, v3), c);
        triangle.draw(this.newPass(), this.index);
        this.index++;
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

    get textureFormat() {
        return this._textureFormat;
    }

    newPass(): GPURenderPassEncoder {
        const ctx = <GPUCanvasContext> this.ctx;

        return <GPURenderPassEncoder> this._encoder?.beginRenderPass({
            colorAttachments: [{
                view: ctx.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                storeOp: "store",
            }]
        });
    }

    /*
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
    }*/
}

export class Renderable {
    private _vertices: Float32Array;
    private _shader: GPUShaderModule | WebGLShader;

    constructor(vertices: Float32Array, shader: GPUShaderModule | WebGLShader) {
        this._vertices = vertices;
        this._shader = shader;
    }

    get vertices() {
        return this._vertices;
    }

    get shader() {
        return <GPUShaderModule> this._shader;
    }

    get shaderGL() {
        return <WebGLShader> this._shader;
    }

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    public setPositionAttribute(context: WebGL2RenderingContext | WebGLRenderingContext, position: number) {
        const numComponents = 2; // pull out 2 values per iteration
        const type = context.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        context.bindBuffer(context.ARRAY_BUFFER, this.vertices);
        context.vertexAttribPointer(
            position,
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
        context.enableVertexAttribArray(position);
    }

    public setColorAttribute(gl: WebGL2RenderingContext | WebGLRenderingContext, buffers: WebGLBuffer) {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers);
        gl.vertexAttribPointer(
            255,
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
        gl.enableVertexAttribArray(gl.vertexAttribPointer.arguments(0));
    }
}
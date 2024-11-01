export async function loadShaderWGPU(url: RequestInfo | URL, device: GPUDevice): Promise<GPUShaderModule> {
    const response = await fetch(url);
    const source = await response.text();
    return device.createShaderModule({ code: source });
}

export async function loadShaderGL(url: RequestInfo | URL, gl: WebGL2RenderingContext | WebGLRenderingContext): Promise<WebGLProgram | null> {
    const response = await fetch(url);
    const source = await response.text();
    const [vertexShaderSource, fragmentShaderSource] = source.split("//Fragment shader");

    let vertexShader = gl.createShader(gl.VERTEX_SHADER);

    if (!vertexShader) {
        console.log("SHADER_ERROR: Failed to create vertex shader!");
        return null;
    }

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    if (!fragmentShader) {
        console.log("SHADER_ERROR: Failed to create fragment shader!");
        return null;
    }

    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    let shader = gl.createProgram();

    if (shader) {
        gl.attachShader(shader, vertexShader);
        gl.attachShader(shader, fragmentShader);
        gl.linkProgram(shader);
        return shader;
    }

    console.log("SHADER_ERROR: Failed to compile shader program!");
    gl.deleteProgram(shader);
    return null;
}
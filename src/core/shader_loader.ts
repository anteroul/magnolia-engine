import { Renderer } from "./renderer";

export const SAMPLE_SHADER = `
struct Fragment {
    @builtin(position) Position: vec4<f32>,
    @location(0) Color: vec4<f32>
};
@vertex
fn vs_main(@builtin(vertex_index) v_id: u32) -> Fragment {
    var positions = array<vec2<f32>, 3> (
        vec2<f32>( -0.5,  0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>( 0.5, -0.5)
    );
    var colors = array<vec3<f32>, 3> (
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 0.0, 1.0)
    );
    var output: Fragment;
    output.Position = vec4<f32>(positions[v_id], 0.0, 1.0);
    output.Color = vec4<f32>(colors[v_id], 1.0);
    return output;
}
@fragment
fn fs_main(@location(0) Color: vec4<f32>) -> @location(0) vec4<f32> {
    return Color;
}`;

export class ShaderLoader {
    private _handle: Renderer;

    constructor(renderer: Renderer) {
        this._handle = renderer;
    }

    async load(url: RequestInfo | URL): Promise<GPUShaderModule | WebGLProgram | null> {
        if (this._handle.currentAPI === "WebGPU") {
            return this.loadShaderWGPU(url, this._handle.device);
        } else if (this._handle.ctxGL) {
            return this.loadShaderGL(url, this._handle.ctxGL);
        }
        return null;
    }

    private async loadShaderWGPU(url: RequestInfo | URL, device: GPUDevice): Promise<GPUShaderModule> {
        const response = await fetch(url);
        const source = await response.text();
        return device.createShaderModule({ code: source });
    }

    private async loadShaderGL(url: RequestInfo | URL, gl: WebGL2RenderingContext | WebGLRenderingContext): Promise<WebGLProgram | null> {
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
}
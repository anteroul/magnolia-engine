import { Renderer } from "./renderer";

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

export class ShaderLoader {
    async load(url: RequestInfo | URL, ren: Renderer): Promise<GPUShaderModule | WebGLShader> {
        let shader: GPUShaderModule | WebGLShader | null = null;
        if (ren.ctx instanceof GPUCanvasContext) {
            shader = this.loadShaderWGPU(url, ren.device);
        } else {
            shader = this.loadShaderGL(url, ren.ctx);
        }
        if (!shader) return ren.device.createShaderModule({code: SAMPLE_SHADER});
        return shader;
    }

    async loadShaderWGPU(url: RequestInfo | URL, device: GPUDevice): Promise<GPUShaderModule> {
        const response = await fetch(url);
        const source = await response.text();
        return device.createShaderModule({ code: source });
    }

    async loadShaderGL(url: RequestInfo | URL, gl: WebGL2RenderingContext | any): Promise<WebGLShader | null> {
        const response = await fetch(url);
        const source = await response.text();
        const [vertexShaderSource, fragmentShaderSource] = source.split("//Fragment shader");
        
        let vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        let shader = gl.createProgram();

        if (shader) {
            gl.attachShader(shader, vertexShader);
            gl.attachShader(shader, fragmentShader);
            gl.linkProgram(shader);
            return shader;
        }

        return null;
    }
}
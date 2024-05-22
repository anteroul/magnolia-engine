import { Renderable } from "./renderable";
import { Renderer } from "./renderer";

let renderer: Renderer | null = null;
let ticks = 0.0;
let currentTime = 0.0;
let deltaTime = 0.0;
let index = 0;

/*
async function loadShader(url: RequestInfo | URL, device: GPUDevice): Promise<GPUShaderModule> {
    const response = await fetch(url);
    const source = await response.text();
    return device.createShaderModule({ code: source });
}
*/

async function main() {
    let canvas = document.querySelector("canvas");
    renderer = new Renderer(canvas, canvas?.getContext("webgl2"));

    try {
        await renderer.init();
        //renderer.RenderQueue.push(<Renderable> new Renderable(new Float32Array([1, 1, 1]), await renderer.Shader.load("../src/shaders/triangle.wgsl")));
        renderer.RenderQueue.push(<Renderable> new Renderable(new Float32Array([1, 1, 1]), await renderer.Shader.load("../src/shaders/triangle.glsl")));
        index = renderer.RenderQueue.length - 1;
    } catch (err) {
        throw new Error("Failed to initialize renderer.");
    }
    gameLoop();
}

function gameLoop() {
    if (!renderer)
        return;
    
    currentTime *= 0.001;
    deltaTime = currentTime - ticks;
    ticks = currentTime;
    
    if (index < 0)
        index = renderer.RenderQueue.length;
    
    renderer.render(renderer.ctx, index, deltaTime);
    index--;
    
    requestAnimationFrame(gameLoop);
}

await main();

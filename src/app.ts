import { Renderable } from "./renderable";
import { Renderer } from "./renderer";

let renderer = new Renderer();
let index = 0;

async function loadShader(url: RequestInfo | URL, device: GPUDevice): Promise<GPUShaderModule> {
    const response = await fetch(url);
    const source = await response.text();
    return device.createShaderModule({ code: source });
}

function update() {
    if (index < 0) index = renderer.RenderQueue.length;
    renderer.render(renderer.ctx, renderer.device, index);
    index--;
    requestAnimationFrame(update);
}

async function init() {
    let canvas = document.querySelector("canvas");
    try {
        await renderer.init(<HTMLCanvasElement> canvas);
        renderer.RenderQueue.push(<Renderable> new Renderable(new Float32Array([1, 1, 1]), await loadShader("../src/shaders/triangle.wgsl", renderer.device)));
        //renderer.RenderQueue.push(<Renderable> new Renderable(new Float32Array([1, 1, 1]), await loadShader("../src/shaders/square.wgsl", renderer.device)));
        index = renderer.RenderQueue.length - 1;
        update();
    } catch (err) {
        throw new Error("Failed to initialize renderer.");
    }
}

await init();
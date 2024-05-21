import { Renderable } from "./renderable";
import { Renderer } from "./renderer";
import { Shader } from "./shader";

let renderer = new Renderer(document.querySelector("canvas"));
let index = 0;

/*
async function loadShader(url: RequestInfo | URL, device: GPUDevice): Promise<GPUShaderModule> {
    const response = await fetch(url);
    const source = await response.text();
    return device.createShaderModule({ code: source });
}
*/

function update() {
    if (index < 0) index = renderer.RenderQueue.length;
    renderer.render(<GPUCanvasContext> renderer.ctx, index);
    index--;
    requestAnimationFrame(update);
}

async function init() {
    try {
        await renderer.init(false);
        let shader = new Shader("../src/shaders/triangle.glsl", renderer);
        renderer.RenderQueue.push(<Renderable> new Renderable(new Float32Array([1, 1, 1]), shader));
        //renderer.RenderQueue.push(<Renderable> new Renderable(new Float32Array([1, 1, 1]), new Shader("../src/shaders/triangle.wgsl", renderer)));
        index = renderer.RenderQueue.length - 1;
        update();
    } catch (err) {
        throw new Error("Failed to initialize renderer.");
    }
}

init();
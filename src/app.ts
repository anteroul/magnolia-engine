import { Renderer } from "./renderer";

let renderer: Renderer | null = null;

async function main() {
    let canvas = document.querySelector("canvas");
    renderer = new Renderer(canvas, canvas?.getContext("webgpu"));

    try {
        await renderer.init();
        //renderer.assets.push(<Renderable> new Renderable(renderer, new Float32Array([1, 1, 1]), await renderer.shader.load("../src/shaders/triangle.wgsl")));
        //renderer.assets.push(<Renderable> new Renderable(renderer, new Float32Array([1, 1, 1]), await renderer.shader.load("../src/shaders/triangle.glsl")));
    } catch (err) {
        throw new Error("Failed to initialize renderer.");
    }
    gameLoop();
}

function gameLoop() {
    if (!renderer)
        return;
    
    renderer.beginDrawing();
    renderer.drawTriangle([0, 0.5], [-0.5, -0.5], [0.5, -0.5], [1, 0, 0, 1]);
    //renderer.drawTriangle([0, 0.4], [-0.4, -0.4], [0.4, -0.4], [0, 1, 0, 1]);
    renderer.endDrawing();
    requestAnimationFrame(gameLoop);
}

await main();

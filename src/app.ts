import { ShadedTriangle } from "./core/shapes/triangle_shaded";
import { Triangle } from "./core/shapes/triangle_simple";
import { Renderer } from "./core/renderer";

let renderer: Renderer | null = null;

async function main() {
    let canvas = document.querySelector("canvas");
    renderer = new Renderer(canvas, canvas?.getContext("webgpu"));

    try {
        await renderer.init();
        renderer.RenderQueue.push(new Triangle(renderer, new Float32Array([0, 0.8, -0.8, -0.8, 0.8, -0.8]), [1, 0, 0, 1]));
        renderer.RenderQueue.push(new Triangle(renderer, new Float32Array([0, 0.7, -0.7, -0.7, 0.7, -0.7]), [0, 1, 0, 1]));
        renderer.RenderQueue.push(new Triangle(renderer, new Float32Array([0, 0.6, -0.6, -0.6, 0.6, -0.6    ]), [0, 1, 1, 1]));
        renderer.RenderQueue.push(new ShadedTriangle(
            renderer, 
            new Float32Array([0, 0.2, -0.2, -0.2, 0.2, -0.2]), 
            <GPUShaderModule> await renderer.ShaderLoader.load("./src/shaders/triangle.wgsl")
        ));
    } catch (err) {
        throw new Error("Failed to initialize renderer.");
    }
    gameLoop();
}

function gameLoop() {
    if (!renderer)
        return;
    
    renderer.render();
    requestAnimationFrame(gameLoop);
}

await main();

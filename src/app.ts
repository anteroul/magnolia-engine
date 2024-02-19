import { Renderer } from "./renderer";
import { Renderable } from "./renderable";

let canvas = document.querySelector("canvas");
let renderer: Renderer | null = null;

function updateGameLoop(ren: Renderer) {
    requestAnimationFrame(ren.render);
    updateGameLoop(ren);
}

if (canvas && !renderer) {
    try {
        renderer = new Renderer(canvas);
        renderer.init();
        renderer.renderQueue.push(new Renderable(new Float32Array([1, 1, 1]), await renderer.loadShader("./shaders/triangle.wgsl")));
    } catch (err) {
        console.error("Failed to initialize renderer.", err);
    }
} else if (renderer) {
    updateGameLoop(renderer);
}

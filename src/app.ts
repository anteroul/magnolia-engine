import { Renderer } from "./renderer";
import { Renderable } from "./renderable";

async function init(): Promise<Renderer> {
    let canvas = document.querySelector("canvas");
    let renderer;

    if (canvas) {
        try {
            renderer = new Renderer();
            renderer.init(canvas);
            renderer.RenderQueue.push(<Renderable> new Renderable(new Float32Array([1, 1, 1]), await renderer.loadShader("./shaders/triangle.wgsl")));
        } catch (err) {
            throw new Error("Failed to initialize renderer.");
        }
    }
    return <Renderer> renderer;
}

function updateGameLoop(ren: Renderer) {
    requestAnimationFrame(ren.render);
}

let renderer = await init();
updateGameLoop(renderer);
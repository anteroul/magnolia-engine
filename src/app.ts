import { Renderer } from "./core/renderer";

const gcText = "Spawned Geometry: ";
const geometryCounter = document.getElementById("geometry");
let renderer: Renderer | null = null;

async function main() {
  let canvas = document.querySelector("canvas");
  renderer = new Renderer(canvas, canvas?.getContext("webgpu"));

  try {
    await renderer.init();
    /*
    TODO: This needs to be simplified:
    renderer.RenderQueue.push(
      new ShadedTriangle
      (
        renderer, new Float32Array([0, 0.2, -0.2, -0.2, 0.2, -0.2]), 
        <GPUShaderModule> await renderer.ShaderLoader.load("./src/shaders/triangle.wgsl")
      )
    );
    */
  } catch (err) {
    throw new Error("Failed to initialize renderer.");
  }
  gameLoop();
}

function gameLoop() {
  if (!renderer)
    return;
  else
    requestAnimationFrame(renderer.render);
  if (geometryCounter) {
    geometryCounter.innerText = gcText + renderer.RenderQueue.length;
  }
  gameLoop();
}

await main();

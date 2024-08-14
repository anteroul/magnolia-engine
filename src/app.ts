import { ShadedTriangle } from "./core/shapes/triangle_shaded";
import { Triangle } from "./core/shapes/triangle_simple";
import { Renderer } from "./core/renderer";
import { rand } from "./core/util";

let renderer: Renderer | null = null;
let createModernArtMasterpiece = true;

async function main() {
  let canvas = document.querySelector("canvas");
  renderer = new Renderer(canvas, canvas?.getContext("webgpu"));

  try {
    await renderer.init();
    if (createModernArtMasterpiece) {
      for (let i = 0; i < 100; i++) {
        renderer.RenderQueue.push(new Triangle(renderer, new Float32Array([rand(-2, 2), rand(-2, 2), rand(-2, 2), rand(-2, 2), rand(-2, 2), rand(-2, 2)]),
          [rand(0, 1), rand(0, 1), rand(0, 1), rand(0, 1)]));
      }
    } else {
      renderer.RenderQueue.push(new ShadedTriangle(
        renderer,
        new Float32Array([0, 0.2, -0.2, -0.2, 0.2, -0.2]),
        <GPUShaderModule>await renderer.ShaderLoader.load("./src/shaders/triangle.wgsl")
      ));
    }
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

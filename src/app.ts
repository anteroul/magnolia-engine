import now from "performance-now";
import { Renderer } from "./core/renderer";

const gcText = "Spawned Geometry: ";
const fpsText = "FPS: ";
const geometryCounter = document.getElementById("geometry");
const fpsCounter = document.getElementById("framerate");
let renderer: Renderer | null = null;
let prevFrame = now();
let FPS = 0;

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

function update() {
  prevFrame = now();
  /* game logic here */
}

function gameLoop() {
  const currentFrame = now();
  const deltaTime = currentFrame - prevFrame;

  if (renderer) {
    renderer.render();
    update();
    FPS = 1000 / deltaTime;
    if (geometryCounter && fpsCounter) {
      geometryCounter.innerText = gcText + renderer.RenderQueue.length;
      fpsCounter.innerHTML = fpsText + FPS.toFixed(0);
    }
  }
  requestAnimationFrame(gameLoop);
}

await main();

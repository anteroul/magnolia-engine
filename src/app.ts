import now from "performance-now";
import { rand } from "./core/util";
import { Renderer } from "./core/renderer";
import { Renderable } from "./core/renderable";
import { GameObject } from "./core/game_object";
import { WanderAround } from "./scripts/behaviour";
import { BorderCollision } from "./scripts/collisions";
import { DEFAULT_TRIANGLES } from "./config";
import { setupUI } from "./ui";
import { API } from "./core/render_modes";

const gcText = "Spawned Geometry: ";
const fpsText = "FPS: ";
const renderMode = document.getElementById("renderMode");
const geometryCounter = document.getElementById("geometry");
const fpsCounter = document.getElementById("framerate");
const avgFramerate = document.getElementById("avgFramerate");

let canvas = document.querySelector("canvas");
let renderer: Renderer | null = null;
let objects: Array<GameObject> = [];
let prevFrame = now();
let FPS = 0;
let avgFPS = 0;
let framesPassed = 0;
let animationFrameId: number;

const geometrySlider = document.getElementById("geometryCount") as HTMLInputElement;
const triangleDisplay = document.getElementById("triangleCountDisplay");

if (geometrySlider && triangleDisplay) {
    // Set initial value
    triangleDisplay.textContent = geometrySlider.value;

    // Update display when slider changes
    geometrySlider.addEventListener("input", () => {
        triangleDisplay.textContent = geometrySlider.value;
    });
}

setupUI((api, triangles) => {
  console.log("Switching to:", api, "with", triangles, "triangles");
  renderer?.destroy();
  prevFrame = now();
  FPS = 0;
  avgFPS = 0;
  framesPassed = 0;
  switchRenderMode(api, triangles);
});

function initGeometry(triangles: number) {
  for (let i = 0; i < triangles; ++i) {
    let obj = spawnGameObject(rand(-0.75, 0.75), rand(-0.75, 0.75), 0.3, new Float32Array([rand(0, 1), rand(0, 1), rand(0, 1), 1]));
    obj.setBehaviourFunction(new WanderAround(obj, 0.001));
    obj.setBehaviourFunction(new BorderCollision(obj));
  }
}

function switchRenderMode(newAPI: API, triangles: number) {
  if (renderer) {
      cancelAnimationFrame(animationFrameId); // Stop render loop
      renderer.destroy(); // Destroy current renderer
  }

  // Reset the canvas to remove previous context
  canvas?.remove(); // Remove the old canvas
  canvas = document.createElement("canvas"); // Create a new one
  document.body.appendChild(canvas); // Reattach to DOM

  // Request a new context based on API
  const newContext = canvas.getContext(newAPI === API.WEBGPU ? "webgpu" : "webgl2");
  
  if (!newContext) {
      throw new Error(`Failed to initialize ${newAPI} context.`);
  }

  renderer = new Renderer(canvas, newContext);
  renderer.init().then(() => {
      initGeometry(triangles);
      gameLoop(); // Restart rendering
  });
}

async function main() {
  if (!renderer) {
    renderer = new Renderer(canvas, canvas?.getContext(API.WEBGL));
  }
  try {
    await renderer.init();
  } catch (err) {
    console.error(err);
    throw new Error("Failed to initialize renderer.");
  }
  initGeometry(DEFAULT_TRIANGLES);
  gameLoop();
}

function spawnGameObject(x: number, y: number, size: number, color: Float32Array) {
  if (!renderer) {
    throw Error("Texture creation failure! Renderer undefined.");
  }
  const texture = new Renderable(renderer, ([0, 0]), ([size / 3 * 2, size]), color);
  const gameObject = new GameObject(([x, y]), texture);
  renderer?.renderQueue.push(gameObject.texture);
  objects.push(gameObject);
  return gameObject;
}

function update(deltaTime: number) {
  prevFrame = now();
  objects.forEach(i => {
    i.update(deltaTime);
  });
}

function gameLoop() {
  if (!renderer || renderer.isDestroyed) return; // Stop if renderer is gone

  const currentFrame = now();
  const deltaTime = currentFrame - prevFrame;
  framesPassed++;

  update(deltaTime);
  renderer.render();

  FPS = 1000 / deltaTime;
  avgFPS += FPS;

  if (geometryCounter && fpsCounter && renderMode && avgFramerate) {
      renderMode.innerHTML = "Renderer: " + renderer.currentAPI;
      geometryCounter.innerHTML = gcText + renderer.geometryCount;
      fpsCounter.innerHTML = fpsText + FPS.toFixed(0);
      avgFramerate.innerHTML = "Avg FPS: " + (avgFPS / framesPassed).toFixed(0);
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

export const spawnObject = (x: number, y: number, size: number, color: Float32Array) => {
  return spawnGameObject(x, y, size, color);
};

await main();

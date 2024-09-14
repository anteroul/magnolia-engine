import now from "performance-now";
import { rand } from "./core/util";
import { Renderer } from "./core/renderer";
import { Renderable } from "./core/renderable";
import { GameObject } from "./core/game_object";
import { WanderAround } from "./scripts/behaviour";
import { BorderCollision } from "./scripts/collisions";

const gcText = "Spawned Geometry: ";
const fpsText = "FPS: ";
const renderMode = document.getElementById("renderMode");
const geometryCounter = document.getElementById("geometry");
const fpsCounter = document.getElementById("framerate");
const avgFramerate = document.getElementById("avgFramerate");
let renderer: Renderer | null = null;
let objects: Array<GameObject> = [];
let prevFrame = now();
let FPS = 0;
let avgFPS = 0;
let framesPassed = 0;

async function main() {
  let canvas = document.querySelector("canvas");
  renderer = new Renderer(canvas, canvas?.getContext("webgl2"));
  try {
    await renderer.init();
  } catch (err) {
    throw new Error("Failed to initialize renderer.");
  }
  for (let i = 0; i < 500; ++i) {
    let obj = spawnGameObject(rand(-0.75, 0.75), rand(-0.75, 0.75), 0.3, new Float32Array([rand(0, 1), rand(0, 1), rand(0, 1), 1]));
    obj.setBehaviourFunction(new WanderAround(obj, 0.001));
    obj.setBehaviourFunction(new BorderCollision(obj));
  }
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
  const currentFrame = now();
  const deltaTime = currentFrame - prevFrame;
  framesPassed++;

  if (renderer) {
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
  }
  requestAnimationFrame(gameLoop);
}

export const spawnObject = (x: number, y: number, size: number, color: Float32Array) => {
  return spawnGameObject(x, y, size, color);
};

await main();

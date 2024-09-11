import now from "performance-now";
import { Renderer } from "./core/renderer";
import { Renderable } from "./core/renderable";
import { GameObject } from "./core/game_object";
import { WanderAround } from "./scripts/behaviour";
import { rand } from "./core/util";
import { RED } from "./core/colors";
import { PlayerControls } from "./scripts/player_controls";
import { SpawnObject } from "./scripts/spawn_object";

const gcText = "Spawned Geometry: ";
const fpsText = "FPS: ";
const geometryCounter = document.getElementById("geometry");
const fpsCounter = document.getElementById("framerate");
let renderer: Renderer | null = null;
let objects: Array<GameObject> = [];
let prevFrame = now();
let FPS = 0;

async function main() {
  let canvas = document.querySelector("canvas");
  renderer = new Renderer(canvas, canvas?.getContext("webgpu"));
  try {
    await renderer.init();
  } catch (err) {
    throw new Error("Failed to initialize renderer.");
  }
  let cursor = spawnGameObject(0.0, 0.0, 0.01, RED);
  cursor.setBehaviourFunction(new PlayerControls(cursor));
  //cursor.setBehaviourFunction(new SpawnObject(cursor, 0.3));
  for (let i = 0; i < 100; ++i) {
    let obj = spawnGameObject(rand(-0.75, 0.75), rand(-0.75, 0.75), 0.5, new Float32Array([rand(0, 1), rand(0, 1), rand(0, 1), 1]));
    obj.setBehaviourFunction(new WanderAround(obj, 0.001));
  }
  gameLoop();
}

function spawnGameObject(x: number, y: number, size: number, color: Float32Array) {
  if (!renderer) {
    throw Error("Texture creation failure! Renderer undefined.");
  }
  const texture = new Renderable(renderer, ([x, y]), ([size / 3 * 2, size]), color);
  const gameObject = new GameObject(texture.position, texture);
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

  if (renderer) {
    update(deltaTime);
    renderer.render();
    FPS = 1000 / deltaTime;
    if (geometryCounter && fpsCounter) {
      geometryCounter.innerHTML = gcText + renderer.geometryCount;
      fpsCounter.innerHTML = fpsText + FPS.toFixed(0);
    }
  }
  requestAnimationFrame(gameLoop);
}

export const spawnObject = (x: number, y: number, size: number, color: Float32Array) => {
  return spawnGameObject(x, y, size, color);
};

await main();

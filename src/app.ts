import now from "performance-now";
import { rand, detectGPUTier} from "./core/util";
import { Renderer } from "./core/renderer";
import { Renderable } from "./core/renderable";
import { GameObject } from "./core/game_object";
import { WanderAround } from "./scripts/behaviour";
import { BorderCollision } from "./scripts/collisions";
import { API, apiDropdownList, setAPI_UI, canInitWebGPU } from "./core/render_modes";
import { MIN_TRIANGLES, MAX_TRIANGLES } from "./config";
import { handleSystemInfoUI, setupUI } from "./ui";

const gcText = "Spawned Geometry: ";
const fpsText = "FPS: ";
const renderMode = document.getElementById("renderMode");
const geometryCounter = document.getElementById("geometry");
const fpsCounter = document.getElementById("framerate");
const avgFramerate = document.getElementById("avgFramerate");
const systemInfo = document.getElementById("system-info");
const gpuInfo = document.getElementById("gpu-type");
const wgpuSupport = document.getElementById("wgpu-support");

let canvas = document.querySelector("canvas");
let renderer: Renderer | null = null;
let objects: Array<GameObject> = [];
let prevFrame = now();
let FPS = 0;
let avgFPS = 0;
let framesPassed = 0;
let animationFrameId: number;
let switchGeneration = 0;

const geometrySlider = document.getElementById("geometryCount") as HTMLInputElement;
const triangleDisplay = document.getElementById("triangleCountDisplay");

setupUI((api, triangles) => {
  console.log("Switching to:", api.toUpperCase(), "with", triangles, "triangles");
  prevFrame = now();
  FPS = 0;
  avgFPS = 0;
  framesPassed = 0;
  objects = [];
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
  const myGeneration = ++switchGeneration;

  const oldCanvas = canvas;
  const localCanvas = document.createElement("canvas");
  document.body.appendChild(localCanvas);

  const newContext = localCanvas.getContext(newAPI === API.WEBGPU ? "webgpu" : "webgl2");
  if (!newContext) {
    console.warn(`Failed to initialize ${newAPI} context.`);
    localCanvas.remove();
    if (newAPI !== API.WEBGL) switchRenderMode(API.WEBGL, triangles);
    return;
  }

  const localRenderer = new Renderer(localCanvas, newContext);

  localRenderer.init()
    .then(() => {
      if (myGeneration !== switchGeneration) {
        localRenderer.destroy();
        localCanvas.remove();
        return;
      }
      if (renderer) {
        cancelAnimationFrame(animationFrameId);
        renderer.destroy();
      }
      oldCanvas?.remove();
      canvas = localCanvas;
      renderer = localRenderer;
      apiDropdownList.value = setAPI_UI(renderer.currentAPI);
      initGeometry(triangles);
      gameLoop();
    })
    .catch((err) => {
      console.warn(`${newAPI} init failed, falling back to WebGL.`, err);
      localRenderer.destroy();
      localCanvas.remove();
      if (myGeneration === switchGeneration && newAPI !== API.WEBGL) {
        switchRenderMode(API.WEBGL, triangles);
      }
    });
}

async function main() {
  const gpu = await detectGPUTier();
  const triangleCount = MIN_TRIANGLES;

  if (geometrySlider && triangleDisplay) {
    // Set initial value
    geometrySlider.value = triangleCount.toString();
    triangleDisplay.textContent = geometrySlider.value;

    // Update display when slider changes
    geometrySlider.addEventListener("input", () => {
      triangleDisplay.textContent = geometrySlider.value;
    });
  }
  
  const supportsWebGPU = await canInitWebGPU();
  const initialAPI = supportsWebGPU ? API.WEBGPU : API.WEBGL;

  if (gpu && gpuInfo) {
    gpuInfo.innerHTML = "GPU: " + gpu.gpu?.toUpperCase();
    await handleSystemInfoUI(gpuInfo);
  }

  if (wgpuSupport) {
    if (!supportsWebGPU) {
      wgpuSupport.style.color = 'red';
      wgpuSupport.innerHTML = "WebGPU is not supported by this browser or it has been disabled.";
    } else {
      wgpuSupport.style.color = 'lime';
      wgpuSupport.innerHTML = "WebGPU support confirmed.";
    }
  }

  switchRenderMode(initialAPI, triangleCount);
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

import now from "performance-now";
import { GameObject } from "./game_object";
import { Renderable } from "./renderable";
import { Renderer } from "./renderer";

export module Magnolia {
    let renderer: Renderer | null = null;
    let objects: Array<GameObject> = [];
    let prevFrame = now();
    let FPS = 0;

    export async function Init(canvas: HTMLCanvasElement | null, mode?: string) {
        if (!mode) {
            mode = "webgpu";
        }
        renderer = new Renderer(canvas, canvas?.getContext(mode));
        try {
            await renderer.init();
        } catch (err) {
            throw new Error("Failed to initialize renderer.");
        }
    }

    export function spawnGameObject(x: number, y: number, size: number, color: Float32Array) {
        if (!renderer) {
            throw Error("Texture creation failure! Renderer undefined.");
        }
        const texture = new Renderable(renderer, ([x, y]), ([size / 3 * 2, size]), color);
        const gameObject = new GameObject(texture.position, texture);
        renderer?.renderQueue.push(gameObject.texture);
        objects.push(gameObject);
        return gameObject;
    }

    export function Update() {
        const currentFrame = now();
        const deltaTime = currentFrame - prevFrame;
        objects.forEach(i => {
            i.update(deltaTime);
        });
        renderer?.render();
        FPS = 1000 / deltaTime;
    }

    export function getRenderer() {
        return renderer;
    }

    export function getFramerate() {
        return FPS.toFixed(0);
    }
}
import { Renderer } from "./renderer";

async function init() {
    let canvas = document.querySelector("canvas");
    let renderer = new Renderer();

    try {
        console.log("Initializing renderer...");
        await renderer.init(<HTMLCanvasElement> canvas);
    } catch (err) {
        throw new Error("Failed to initialize renderer.");
    }
}

await init();
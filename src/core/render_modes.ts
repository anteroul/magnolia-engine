export enum API {
    WEBGL = "webgl2",
    WEBGPU = "webgpu",
    SOFTWARE = "2d" // TODO
};

export let currentAPI: API;
export let renderModesEnabled: Boolean = false;

export function toggleRenderModeTests() {
    return !renderModesEnabled;
}
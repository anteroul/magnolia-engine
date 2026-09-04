export enum API {
    WEBGL = "webgl",
    WEBGPU = "webgpu",
    SOFTWARE = "2d" // TODO
};

const apiDropdownList = document.getElementById("apiSelect") as HTMLSelectElement;

export let currentAPI: API = <API> apiDropdownList.value;
export let renderModesEnabled: Boolean = false;

export function toggleRenderModeTests() {
    return !renderModesEnabled;
}
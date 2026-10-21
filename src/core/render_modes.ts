export enum API {
    WEBGL = "webgl",
    WEBGPU = "webgpu",
    SOFTWARE = "software"
};

export function contextTypeFor(api: API) {
    switch (api) {
        case API.WEBGPU:
            return "webgpu";
        case API.SOFTWARE:
            return "2d";
        default:
            return "webgl2";
    }
}

export const apiDropdownList = document.getElementById("apiSelect") as HTMLSelectElement;

export function setAPI_UI(api: string) {
    switch (api) {
        case ("Legacy WebGL"):
            return API.WEBGL;
        case ("WebGL"):
            return API.WEBGL;
        case ("WebGPU"):
            return API.WEBGPU;
        case ("Software"):
            return API.SOFTWARE;
        default:
            break;
    }
    return API.SOFTWARE;
}

export async function canInitWebGPU(): Promise<boolean> {
    if (!navigator.gpu) return false;
    try {
        const adapter = await navigator.gpu.requestAdapter();
        return !!adapter;
    } catch {
        return false;
    }
}

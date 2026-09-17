export enum API {
    WEBGL = "webgl",
    WEBGPU = "webgpu",
    SOFTWARE = "2d" // TODO
};

export const apiDropdownList = document.getElementById("apiSelect") as HTMLSelectElement;

export function setAPI_UI(api: string) {
    switch (api) {
        case ("Legacy WebGL"):
            return API.WEBGL;
        case ("WebGL"):
            return API.WEBGL;
        case ("WebGPU"):
            return API.WEBGPU;
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

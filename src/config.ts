const slider = document.getElementById("geometryCount") as HTMLInputElement | null;

const MIN_TRIANGLES = parseInt(slider?.getAttribute("min") ?? "1024") || 1024;
const MAX_TRIANGLES = parseInt(slider?.getAttribute("max") ?? "5120") || 5120;

export { MIN_TRIANGLES, MAX_TRIANGLES };

export enum GPU_BRAND {
    NVIDIA = 'nvidia',
    AMD = 'amd',
    INTEL = 'intel',
    APPLE = 'apple',
    QUALCOMM = 'qualcomm',
    ARM = 'arm',
    MATROX = 'matrox',
    UNKNOWN = 'unknown',
};

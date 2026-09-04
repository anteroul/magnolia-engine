import { API } from './core/render_modes';

export function setupUI(onSettingsChanged: (api: API, triangles: number) => void) {
    const apiSelect = document.getElementById("apiSelect") as HTMLSelectElement;
    const geometrySlider = document.getElementById("geometryCount") as HTMLInputElement;
    const applyButton = document.getElementById("applySettings") as HTMLButtonElement;
    let selectedAPI = apiSelect.value;

    applyButton.addEventListener("click", () => {
        if (apiSelect.value === "webgl") selectedAPI = API.WEBGL;
        if (apiSelect.value === "webgpu") selectedAPI = API.WEBGPU;
        if (apiSelect.value === "software") selectedAPI = API.SOFTWARE;
        const triangleCount = parseInt(geometrySlider.value);
        onSettingsChanged(<API> selectedAPI, triangleCount);
    });
}

import { API, renderModesEnabled } from './core/render_modes';

export function setupUI(onSettingsChanged: (api: API, triangles: number) => void) {
    const apiSelect = document.getElementById("apiSelect") as HTMLSelectElement;
    const geometrySlider = document.getElementById("geometryCount") as HTMLInputElement;
    const applyButton = document.getElementById("applySettings") as HTMLButtonElement;
    let currentAPI = API.WEBGPU;

    if (!renderModesEnabled) {
        applyButton.addEventListener("click", () => {
            let selectedAPI: API = currentAPI;
            if (apiSelect.value === "webgl") selectedAPI = API.WEBGL;
            if (apiSelect.value === "webgpu") selectedAPI = API.WEBGPU;
            if (apiSelect.value === "software") selectedAPI = API.SOFTWARE;
            const triangleCount = parseInt(geometrySlider.value);
            onSettingsChanged(<API> selectedAPI.toString(), triangleCount);
        });
    }
}

import { API, apiDropdownList } from './core/render_modes';
import { GPU_BRAND } from './config';
import { getGPUTier, TierResult } from 'detect-gpu';

export function setupUI(onSettingsChanged: (api: API, triangles: number) => void) {
    const apiSelect = apiDropdownList;
    const geometrySlider = document.getElementById("geometryCount") as HTMLInputElement;
    const applyButton = document.getElementById("applySettings") as HTMLButtonElement;
    let selectedAPI = apiSelect.value;

    applyButton.addEventListener("click", () => {
        if (apiSelect.value === "webgl") selectedAPI = API.WEBGL;
        if (apiSelect.value === "webgpu") selectedAPI = API.WEBGPU;
        if (apiSelect.value === "software") selectedAPI = API.SOFTWARE;
        const triangleCount = parseInt(geometrySlider.value);
        onSettingsChanged(<API>selectedAPI, triangleCount);
    });
}

function detectGPUBrand(rawGpuString: string): GPU_BRAND {
  const s = rawGpuString.toLowerCase();
  if (s.includes("nvidia")) return GPU_BRAND.NVIDIA;
  if (s.includes("amd") || s.includes("radeon")) return GPU_BRAND.AMD;
  if (s.includes("intel")) return GPU_BRAND.INTEL;
  if (s.includes("apple")) return GPU_BRAND.APPLE;
  if (s.includes("qualcomm") || s.includes("adreno")) return GPU_BRAND.QUALCOMM;
  if (s.includes("arm") || s.includes("mali")) return GPU_BRAND.ARM;
  if (s.includes("matrox")) return GPU_BRAND.MATROX;
  return GPU_BRAND.UNKNOWN;
}

async function getSystemInfoText(): Promise<{ brand: GPU_BRAND; text: string }> {
  const result: TierResult = await getGPUTier();
  const rawGpu = result.gpu ?? "unknown";
  const brand = detectGPUBrand(rawGpu);
  //const mobileTag = result.isMobile ? " [MOBILE]" : " [DISCRETE]";
  const text = `${result.device ?? ""} ${rawGpu.toUpperCase()} ${result.type}`.trim();
  return { brand, text };
}

const brandColors: Record<GPU_BRAND, string> = {
  [GPU_BRAND.AMD]: "red",
  [GPU_BRAND.NVIDIA]: "green",
  [GPU_BRAND.INTEL]: "cyan",
  [GPU_BRAND.APPLE]: "ivory",
  [GPU_BRAND.QUALCOMM]: "green",
  [GPU_BRAND.ARM]: "green",
  [GPU_BRAND.MATROX]: "green",
  [GPU_BRAND.UNKNOWN]: "orange",
};

export async function handleSystemInfoUI(systemInfo: HTMLElement) {
  const { brand, text } = await getSystemInfoText();
  systemInfo.textContent = "GPU: " + text;
  systemInfo.style.color = brandColors[brand] ?? "orange";
}
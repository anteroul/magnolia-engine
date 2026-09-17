import { vec2 } from "gl-matrix";
import { getGPUTier } from "detect-gpu";

export const rand = (min: number, max: number) => {
    if (min === undefined) {
        min = 0;
        max = 1;
    } else if (max === undefined) {
        max = min;
        min = 0;
    }
    return min + Math.random() * (max - min);
}

export const accelerate = (v: number, dt: number) => {
    return v / (dt * dt);
}

export const translate = (v: vec2, dx: number, dy: number) => {
    v[0] += dx;
    v[1] += dy;
    return v;
}

export function createTransformationMatrix(tx: number, ty: number, angle: number, scaleX: number, scaleY: number): Float32Array {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    return new Float32Array([
        cosAngle * scaleX, -sinAngle * scaleY, tx,
        sinAngle * scaleX, cosAngle * scaleY, ty,
        0, 0, 1
    ]);
}

export async function detectGPUTier() {
    try {
        const result = await getGPUTier();
        console.log("GPU tier:", result.tier, "| type:", result.type, "| gpu:", result.gpu ?? "unknown");
        return result;
    } catch (err) {
        console.warn("GPU tier detection failed:", err);
        return null;
    }
}

export function getOSName(): string {
    const platform = (navigator as any).userAgentData?.platform ?? navigator.platform ?? "unknown";
    return platform;
}
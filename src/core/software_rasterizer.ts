import { vec2, vec4 } from "gl-matrix";

// CPU scanline rasterizer. Draws into an ImageData buffer which is
// blitted to a 2D canvas once per frame.
export class SoftwareRasterizer {
    private _ctx: CanvasRenderingContext2D;
    private _image: ImageData;
    private _pixels: Uint32Array; // one RGBA pixel per element (little-endian: 0xAABBGGRR)
    private _width: number;
    private _height: number;

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this._ctx = ctx;
        this._width = width;
        this._height = height;
        this._image = ctx.createImageData(width, height);
        this._pixels = new Uint32Array(this._image.data.buffer);
    }

    clear() {
        this._pixels.fill(0xff000000); // opaque black
    }

    // Same geometry as the WebGPU shader: unit triangle * scale + pos, in NDC.
    drawTriangle(pos: vec2, scale: vec2, color: vec4) {
        const w = this._width;
        const h = this._height;
        // NDC -> pixel coordinates (y flipped)
        const x0 = (pos[0] + 1) * 0.5 * w;
        const y0 = (1 - (pos[1] + scale[1] * 0.5)) * 0.5 * h;
        const x1 = (pos[0] - scale[0] * 0.5 + 1) * 0.5 * w;
        const y1 = (1 - (pos[1] - scale[1] * 0.5)) * 0.5 * h;
        const x2 = (pos[0] + scale[0] * 0.5 + 1) * 0.5 * w;
        const y2 = y1;

        this.rasterize(x0, y0, x1, y1, x2, y2, color);
    }

    present() {
        this._ctx.putImageData(this._image, 0, 0);
    }

    private rasterize(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, color: vec4) {
        // Sort vertices by y so that a is top, c is bottom
        let t: number;
        if (by < ay) { t = ax; ax = bx; bx = t; t = ay; ay = by; by = t; }
        if (cy < ay) { t = ax; ax = cx; cx = t; t = ay; ay = cy; cy = t; }
        if (cy < by) { t = bx; bx = cx; cx = t; t = by; by = cy; cy = t; }

        const height = cy - ay;
        if (height <= 0) return;

        const w = this._width;
        const pixels = this._pixels;
        const alpha = color[3];
        const opaque = alpha >= 1;
        const r = clampByte(color[0]);
        const g = clampByte(color[1]);
        const b = clampByte(color[2]);
        const packed = (0xff << 24 | b << 16 | g << 8 | r) >>> 0;

        // Sample at pixel centers; rows whose center lies in [ay, cy)
        const yStart = Math.max(0, Math.ceil(ay - 0.5));
        const yEnd = Math.min(this._height, Math.ceil(cy - 0.5));

        const longSlope = (cx - ax) / height;
        const topSlope = by > ay ? (bx - ax) / (by - ay) : 0;
        const bottomSlope = cy > by ? (cx - bx) / (cy - by) : 0;

        for (let y = yStart; y < yEnd; y++) {
            const sy = y + 0.5;
            const xLong = ax + (sy - ay) * longSlope;
            const xShort = sy < by
                ? ax + (sy - ay) * topSlope
                : bx + (sy - by) * bottomSlope;

            const xl = xLong < xShort ? xLong : xShort;
            const xr = xLong < xShort ? xShort : xLong;
            const start = Math.max(0, Math.ceil(xl - 0.5));
            const end = Math.min(w, Math.ceil(xr - 0.5));
            if (end <= start) continue;

            const row = y * w;
            if (opaque) {
                pixels.fill(packed, row + start, row + end);
            } else {
                blendSpan(pixels, row + start, row + end, r, g, b, alpha);
            }
        }
    }
}

function clampByte(v: number) {
    return v <= 0 ? 0 : v >= 1 ? 255 : (v * 255 + 0.5) | 0;
}

// src-alpha / one-minus-src-alpha, matching the WebGPU pipeline's blend state
function blendSpan(pixels: Uint32Array, start: number, end: number, r: number, g: number, b: number, a: number) {
    const ia = 1 - a;
    for (let i = start; i < end; i++) {
        const dst = pixels[i];
        const dr = dst & 0xff;
        const dg = (dst >>> 8) & 0xff;
        const db = (dst >>> 16) & 0xff;
        const nr = (r * a + dr * ia) | 0;
        const ng = (g * a + dg * ia) | 0;
        const nb = (b * a + db * ia) | 0;
        pixels[i] = (0xff << 24 | nb << 16 | ng << 8 | nr) >>> 0;
    }
}

import { StaticBuffer } from "./buffer";
import { vec4 } from "gl-matrix";

export class ColorBuffer extends StaticBuffer {
    private _shader: GPUShaderModule;
    private _format: GPUTextureFormat;

    constructor(device: GPUDevice, color: vec4, format: GPUTextureFormat) {
        super(8, GPUBufferUsage.COPY_DST);

        this._shader = device.createShaderModule({
            label: 'vert',
            code: `
                @fragment fn main() -> @location(0) vec4f {
                    return vec4f(` + color[0] + "," + color[1] + "," + color[2] + "," + color[3] + `);
                }`
        });

        this._format = format;
    }

    setShader(shader: GPUShaderModule) {
        this._shader = shader;
    }

    get shader() {
        return this._shader;
    }

    get format() {
        return this._format;
    }
}
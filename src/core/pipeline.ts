// Per-instance layout: pos (vec2), scale (vec2), color (vec4)
export const INSTANCE_FLOATS = 8;
export const INSTANCE_STRIDE = INSTANCE_FLOATS * 4;

export async function createRenderPipeline(device: GPUDevice, format: GPUTextureFormat, shaderModule?: GPUShaderModule): Promise<GPURenderPipeline> {
    const pipelineDescriptor: GPURenderPipelineDescriptor = {
        label: "pipeline",
        layout: "auto", // Let WebGPU infer the pipeline layout
        vertex: {
            module: <GPUShaderModule> shaderModule,
            entryPoint: 'vs_main',
            buffers: [
                {
                    arrayStride: INSTANCE_STRIDE,
                    stepMode: 'instance',
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x2' },  // pos
                        { shaderLocation: 1, offset: 8, format: 'float32x2' },  // scale
                        { shaderLocation: 2, offset: 16, format: 'float32x4' }, // color
                    ]
                }
            ]
        },
        fragment: {
            module: <GPUShaderModule> shaderModule,
            entryPoint: 'fs_main',
            targets: [
                {
                    format: format,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add'
                        },
                        alpha: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add'
                        }
                    }
                }
            ]
        },
        primitive: {
            topology: 'triangle-list', // Drawing triangles
            cullMode: 'none',          // Typically no back-face culling for 2D
        }
    };

    return device.createRenderPipeline(pipelineDescriptor);
}

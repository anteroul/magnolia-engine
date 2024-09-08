import { SAMPLE_SHADER } from "./shader_loader";

export async function createRenderPipeline(device: GPUDevice, shaderModule?: GPUShaderModule): Promise<GPURenderPipeline> {
    if (!shaderModule) {
        shaderModule = device.createShaderModule({code: SAMPLE_SHADER});
    }

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
        label: "pipeline",
        layout: "auto", // Let WebGPU infer the pipeline layout
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [
                {
                    arrayStride: 4 * 2, // 2 float32s for position
                    attributes: [
                        {
                            shaderLocation: 0, // Position (vec2)
                            offset: 0,
                            format: 'float32x2'
                        }
                    ]
                },
                {
                    arrayStride: 4 * 4, // 4 float32s for color
                    attributes: [
                        {
                            shaderLocation: 1, // Color (vec4)
                            offset: 0,
                            format: 'float32x4'
                        }
                    ]
                }
            ]
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [
                {
                    format: 'bgra8unorm', // Assuming the texture format
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

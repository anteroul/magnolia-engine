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
            entryPoint: 'vs_main'
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

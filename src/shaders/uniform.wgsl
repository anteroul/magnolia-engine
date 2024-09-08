struct Uniforms {
    modelMatrix: mat3x3<f32>  // 3x3 matrix for 2D
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
    @location(0) position: vec2<f32>
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(1) color: vec4<f32>
};

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    let transformedPosition = uniforms.modelMatrix * vec3<f32>(input.position, 1.0);  // Apply transformation
    output.position = vec4<f32>(transformedPosition.xy, 0.0, 1.0);  // Output position in 2D
    output.color = vec4<f32>(1.0, 0.0, 0.0, 1.0);
    return output;
}

@fragment
fn fs_main(@location(1) color: vec4<f32>) -> @location(1) vec4<f32> {
    return color;
}
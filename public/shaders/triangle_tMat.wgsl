struct Uniforms {
    transform: mat3x3<f32>,
    color: vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    var positions = array<vec2<f32>, 3>(
        vec2<f32>( 0.0, 0.5),
        vec2<f32>(-0.5,-0.5),
        vec2<f32>( 0.5,-0.5)
    );

    let localPosition = vec3<f32>(positions[vertexIndex], 1.0);
    let worldPosition = uniforms.transform * localPosition;

    return vec4<f32>(worldPosition.xy, 0.0, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
    return uniforms.color;
}

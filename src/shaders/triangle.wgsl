struct Triangle {
    pos: vec2<f32>,
    scale: vec2<f32>,
    color: vec4<f32>
};

@group(0) @binding(0) var<uniform> triangle: Triangle;

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    var positions = array<vec2<f32>, 3> (
        vec2<f32>( 0.0,  0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>( 0.5, -0.5)
    );

    return vec4<f32>(positions[vertexIndex] * triangle.scale + triangle.pos, 0.0, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
    return triangle.color;
}
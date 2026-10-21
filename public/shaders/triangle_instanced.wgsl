struct Instance {
    @location(0) pos: vec2<f32>,
    @location(1) scale: vec2<f32>,
    @location(2) color: vec4<f32>
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32, instance: Instance) -> VertexOutput {
    var positions = array<vec2<f32>, 3> (
        vec2<f32>( 0.0,  0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>( 0.5, -0.5)
    );

    var out: VertexOutput;
    out.position = vec4<f32>(positions[vertexIndex] * instance.scale + instance.pos, 0.0, 1.0);
    out.color = instance.color;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    return in.color;
}

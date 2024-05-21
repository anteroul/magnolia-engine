// Vertex shader
attribute vec3 aPosition;

void main() {
    gl_Position = vec4(aPosition, 1.0);
}

// Fragment shader
precision mediump float;

void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color
}
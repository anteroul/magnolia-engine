attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 vColor;

void main() {
    gl_Position = aVertexPosition;
    vColor = aVertexColor;
}

//Fragment shader

varying lowp vec4 vColor;

void main() {
    gl_FragColor = vColor;
}
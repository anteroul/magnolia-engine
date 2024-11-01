attribute vec2 aVertexPosition;
attribute vec4 aVertexColor;

varying lowp vec4 vColor;

void main() {
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);  // No more matrix transformation
    vColor = aVertexColor;
}

//Fragment shader
varying lowp vec4 vColor;

void main() {
    gl_FragColor = vColor;
}
attribute vec2 aVertexPosition;
attribute vec4 aVertexColor;
uniform mat3 uTranslationMatrix;

varying lowp vec4 vColor;

void main() {
    vec3 position = vec3(aVertexPosition, 1.0); // Convert to 3D homogeneous coordinates
    position = uTranslationMatrix * position;   // Apply the translation matrix
    gl_Position = vec4(position.xy, 0.0, 1.0);  // Convert back to 4D vector for WebGL
    vColor = aVertexColor;
}

//Fragment shader
varying lowp vec4 vColor;

void main() {
    gl_FragColor = vColor;
}
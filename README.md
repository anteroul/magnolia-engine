# Magnolia WebGL/WebGPU Benchmarker v0.3.5
### Browser based WebGL/WebGPU benchmarker written in TypeScript.

### Changes:
- Major optimizations made for WebGPU rendering.
- Implemented Shader class to store different types of shaders.

### TODO:
- Timed benchmark-sequence, which gradually increases the amount of triangles to certain point where FPS is below 10 then changes API performing the same procedure.
- Write a script that automatically updates benchmark-results.
- Host the tool on a github.io page or alternative on your own domain.

### Wishlist:
- Scenes and SceneManager implementation (for the game engine).
- Support for more complex geometry (for the game engine).
- Desktop version
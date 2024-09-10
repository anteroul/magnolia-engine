import { KeyInputManager } from "../core/key_input";
import { GameObject } from "../game_object";

export function arrowKeyMovement(gameObject: GameObject) {
    if (KeyInputManager.isKeyDown('ArrowUp'))
        gameObject.moveTransform(0.0, 0.02);
    if (KeyInputManager.isKeyDown('ArrowDown'))
        gameObject.moveTransform(0.0, -0.02);
    if (KeyInputManager.isKeyDown('ArrowLeft'))
        gameObject.moveTransform(-0.02, 0.0);
    if (KeyInputManager.isKeyDown('ArrowRight'))
        gameObject.moveTransform(0.02, 0.0);
}
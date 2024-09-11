import { BehaviourScript } from "../core/behaviour_script";
import { GameObject } from "../core/game_object";
import { Input } from "../core/key_input";

export class PlayerControls extends BehaviourScript {
    constructor(obj: GameObject) {
        super(obj);
    }

    update() {
        if (Input.isKeyDown('ArrowUp'))
            this.gameObject.moveTransform(0.0, 0.02);
        if (Input.isKeyDown('ArrowDown'))
            this.gameObject.moveTransform(0.0, -0.02);
        if (Input.isKeyDown('ArrowLeft'))
            this.gameObject.moveTransform(-0.02, 0.0);
        if (Input.isKeyDown('ArrowRight'))
            this.gameObject.moveTransform(0.02, 0.0);
    }
}

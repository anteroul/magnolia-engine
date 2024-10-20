import { BehaviourScript } from "../core/behaviour_script";
import { GameObject } from "../core/game_object";

export class BorderCollision extends BehaviourScript {
    constructor(obj: GameObject) {
        super(obj);
    }
    
    update() {
        if (this.gameObject.position[0] + (this.gameObject.scale[0] / 2) > 1 || this.gameObject.position[0] - (this.gameObject.scale[0] / 2) < -1) {
            this.gameObject.ricochet(this.gameObject.velocity[0]);
        }
    
        if (this.gameObject.position[1] + (this.gameObject.scale[1] / 2) > 1 || this.gameObject.position[1] - (this.gameObject.scale[1] / 2) < -1) {
            this.gameObject.ricochet(this.gameObject.velocity[1]);
        }
    }
}
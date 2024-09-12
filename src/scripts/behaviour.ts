import { BehaviourScript } from "../core/behaviour_script";
import { GameObject } from "../core/game_object";
import { rand } from "../core/util";
import { vec2 } from "gl-matrix";

export class WanderAround extends BehaviourScript {
    private waypoint: vec2;
    private speed;

    constructor(obj: GameObject, speed: number) {
        super(obj);
        this.waypoint = ([rand(-0.5, 0.5), rand(-0.5, 0.5)]);
        this.speed = speed;
    }
    
    update() {
        if (this.gameObject.position[0] + (this.gameObject.scale[0] / 2) > 1 || this.gameObject.position[0] - (this.gameObject.scale[0] / 2) < -1) {
            this.waypoint[0] *= -1;
        }
    
        if (this.gameObject.position[1] + (this.gameObject.scale[1] / 2) > 1 || this.gameObject.position[1] - (this.gameObject.scale[1] / 2) < -1) {
            this.waypoint[1] *= -1;
        }
        
        this.gameObject.moveTransform(this.waypoint[0] * this.speed, this.waypoint[1] * this.speed);
    }
}
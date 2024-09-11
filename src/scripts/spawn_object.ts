import { BehaviourScript } from "../core/behaviour_script";
import { Input } from "../core/key_input";
import { GameObject } from "../core/game_object";
import { WanderAround } from "./behaviour";
import { spawnObject } from "../app";
import { rand } from "../core/util";

export class SpawnObject extends BehaviourScript {
    private range: number;

    constructor(obj: GameObject, range: number) {
        super(obj);
        this.range = range;
    }

    update() {
        if (Input.isKeyDown("Spacebar")) {
            let obj = spawnObject(
                rand(this.gameObject.position[0] - this.range, this.gameObject.position[0] + this.range),
                rand(this.gameObject.position[1] - this.range, this.gameObject.position[1] + this.range),
                rand(0.2, 0.5),
                new Float32Array([rand(0, 1), rand(0, 1), rand(0, 1), 1])
            );
            obj.setBehaviourFunction(new WanderAround(obj, 0.001));
        }
    }
}
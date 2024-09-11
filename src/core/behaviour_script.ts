import { GameObject } from "./game_object";

export class BehaviourScript {
    protected gameObject: GameObject;

    constructor(obj: GameObject) {
        this.gameObject = obj;
    }

    update() {}
}
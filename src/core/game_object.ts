import { vec2 } from "gl-matrix";
import { Renderable } from "./renderable";
import { accelerate, translate } from "./util";
import { BehaviourScript } from "./behaviour_script";

export class GameObject {
    private _position: vec2;
    private _texture: Renderable;
    private _scale: vec2;
    private _velocity: vec2 = ([0.0, 0.0]);
    private _behaviourScript: BehaviourScript[] = [];

    public time: number = 0.0;

    constructor(pos: vec2, texture: Renderable) {
        this._position = pos;
        this._texture = texture;
        this._scale = texture.scale;
        this._texture.translate(this._position);
    }

    update(deltaTime: number) {
        this.time = deltaTime;
        
        // call user defined update functions:
        this._behaviourScript.forEach(script => {
            script.update();
        });

        this._position = translate(this._position, this._velocity[0], this._velocity[1]);
        this._velocity[0] -= accelerate(this._velocity[0], deltaTime);
        this._velocity[1] -= accelerate(this._velocity[1], deltaTime);
        this._texture.translate(this._position);
        this._texture.setScale(this._scale);
    }

    moveTransform(x: number, y: number) {
        this._velocity[0] += accelerate(x, this.time) * this.time;
        this._velocity[1] += accelerate(y, this.time) * this.time;
    }

    scaleTransform(scale: number) {
        this._scale[0] *= scale;
        this._scale[1] *= scale;
    }

    setBehaviourFunction(script: BehaviourScript) {
        this._behaviourScript?.push(script);
    }

    ricochet(velocity: number) {
        if (velocity == this._velocity[0])
            this._velocity[0] *= -1;
        else if (velocity == this._velocity[1])
            this._velocity[1] *= -1;
    }

    get position() {
        return this._position;
    }

    get velocity() {
        return this._velocity;
    }

    get scale() {
        return this._scale;
    }

    get texture() {
        return this._texture;
    }
}

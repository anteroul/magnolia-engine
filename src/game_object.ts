import { vec2 } from "gl-matrix";
import { Renderable } from "./core/renderable";
import { accelerate, translate } from "./core/util";

export class GameObject {
    private _position: vec2;
    private _texture: Renderable;
    private _scale: vec2;
    private _velocity: vec2 = ([0.0, 0.0]);
    private _behaviourScript = (obj: GameObject) => {}; // custom user defined logic

    public time: number = 0.0;

    constructor(pos: vec2, texture: Renderable) {
        this._position = pos;
        this._texture = texture;
        this._scale = texture.scale;
        this._texture.translate(this._position);
    }

    updateBehaviour(script: (obj: GameObject) => void) {
        script(this);
    }

    update(deltaTime: number) {
        this.time = deltaTime;
        this.updateBehaviour(this._behaviourScript);
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

    setBehaviourFunction(script: { (gameObject: GameObject): void; (obj: GameObject): void; }) {
        this._behaviourScript = script;
    }

    get position() {
        return this._position;
    }

    get velocity() {
        return this._velocity;
    }

    get texture() {
        return this._texture;
    }
}

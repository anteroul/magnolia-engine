import { GameObject } from "../game_object";
import { rand } from "../core/util";

export function wanderAround(gameObject: GameObject) {
    const waypoint = ([rand(-0.5, 0.5), rand(-0.5, 0.5)]);
    const speed = 0.02;

    if (gameObject.position[0] > 1 || gameObject.position[0] < -1) {
        waypoint[0] *= -1;
    }

    if (gameObject.position[1] > 1 || gameObject.position[1] < -1) {
        waypoint[1] *= -1;
    }
    
    gameObject.moveTransform(waypoint[0] * speed, waypoint[1] * speed);
}
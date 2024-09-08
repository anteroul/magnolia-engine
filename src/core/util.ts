export const rand = (min: number, max: number) => {
    if (min === undefined) {
        min = 0;
        max = 1;
    } else if (max === undefined) {
        max = min;
        min = 0;
    }
    return min + Math.random() * (max - min);
}

export const accelerate = (v: number, dt: number) => {
    return v * (dt * dt);
}

export function createTransformationMatrix(tx: number, ty: number, angle: number, scaleX: number, scaleY: number): Float32Array {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    
    return new Float32Array([
        cosAngle * scaleX, -sinAngle * scaleY, tx,
        sinAngle * scaleX,  cosAngle * scaleY, ty,
        0,                 0,                 1
    ]);
}

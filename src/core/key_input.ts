module KeyInputManager {
    let keysDown: Array<string> = [];

    // Add event listeners for keyboard input
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Handle keydown event
    function handleKeyDown(event: KeyboardEvent) {
        if (keysDown.includes(event.code)) return;
        keysDown.push(event.code);
    }

    // Handle keyup event
    function handleKeyUp(event: KeyboardEvent) {
        keysDown = keysDown.filter(key => key != event.code);
    }

    export function isKeyDown(key: string) {
        return keysDown.includes(key)
    }
}

export const Input = KeyInputManager;
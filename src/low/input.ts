export default class Input {
  keys: Record<string, string>;
  down: Record<string, boolean>;
  pressed: Record<string, boolean>;

  constructor(keyMap: Record<string, string>) {
    this.keys = {};
    this.down = {};
    this.pressed = {};

    for (const [key, code] of Object.entries(keyMap)) {
      this.keys[code] = key;
      this.down[key] = false;
      this.pressed[key] = false;
    }

    document.addEventListener("keydown", (event) => {
      const key = this.keys[event.code];
      if (key) {
        this.down[key] = true;
        event.preventDefault();
      }
    });

    document.addEventListener("keyup", (event) => {
      const key = this.keys[event.code];
      if (key) {
        this.down[key] = false;
        this.pressed[key] = false;
        event.preventDefault();
      }
    });
  }

  isDown(key: string): boolean {
    return this.down[key] || false;
  }

  isPressed(key: string): boolean {
    if (this.pressed[key]) return false;
    if (this.down[key]) {
      this.pressed[key] = true;
      return true;
    }
    return false;
  }
}
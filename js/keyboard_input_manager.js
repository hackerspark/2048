export default class KeyboardInputManager {
  constructor() {
    this.events = {};
    this.listen();
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, data) {
    const callbacks = this.events[event];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  listen() {
    const map = {
      38: 0, // Up
      39: 1, // Right
      40: 2, // Down
      37: 3, // Left
      75: 0, // vim keybindings
      76: 1,
      74: 2,
      72: 3,
      87: 0, // W
      68: 1, // D
      83: 2, // S
      65: 3 // A
    };

    document.addEventListener("keydown", event => {
      const modifiers =
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
      const mapped = map[event.which];

      if (!modifiers) {
        if (mapped !== undefined) {
          event.preventDefault();
          this.emit("move", mapped);
        }

        if (event.which === 32) this.restart.bind(this)(event);
        if (event.which === 8) this.undo.bind(this)(event);
      }
    });

    const [retry] = document.getElementsByClassName("retry-button");
    retry.addEventListener("click", this.restart.bind(this));

    const undo = document.getElementById("undo-button");
    undo.addEventListener("click", this.undo.bind(this));

    // Listen to swipe events
    var touchStartClientX, touchStartClientY;
    var [gameContainer] = document.getElementsByClassName("game-container");

    gameContainer.addEventListener("touchstart", event => {
      if (event.touches.length > 1) return;

      touchStartClientX = event.touches[0].clientX;
      touchStartClientY = event.touches[0].clientY;
      event.preventDefault();
    });

    gameContainer.addEventListener("touchmove", event => {
      event.preventDefault();
    });

    gameContainer.addEventListener("touchend", event => {
      if (event.touches.length > 0) return;

      const dx = event.changedTouches[0].clientX - touchStartClientX;
      const absDx = Math.abs(dx);

      const dy = event.changedTouches[0].clientY - touchStartClientY;
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) > 10) {
        // (right : left) : (down : up)
        this.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0);
      }
    });
  }

  restart(event) {
    event.preventDefault();
    this.emit("restart");
  }

  undo(event) {
    event.preventDefault();
    this.emit("undo");
  }
}

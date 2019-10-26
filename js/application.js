// Wait till the browser is ready to render the game (avoids glitches)
import GameManager from "./game_manager.js";
import KeyboardInputManager from "./keyboard_input_manager.js";
import HTMLActuator from "./html_actuator.js";
import LocalScoreManager from "./local_score_manager.js";
import BottomlessStack from "./bottomless_stack.js";
import "../style/main.css";
window.requestAnimationFrame(function() {
  new GameManager(
    4,
    KeyboardInputManager,
    HTMLActuator,
    LocalScoreManager,
    BottomlessStack
  );
});

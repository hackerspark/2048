import Grid from "./grid.js";
import Tile from "./tile.js";
import { getMatch } from "./celerx.js";
export default class GameManager {
  constructor(size, InputManager, Actuator, ScoreManager, BottomlessStack) {
    this.size = size; // Size of the grid
    this.inputManager = new InputManager();
    this.scoreManager = new ScoreManager();
    this.actuator = new Actuator();

    // TODO: take the history size as a get query param.
    this.history = new BottomlessStack(100);

    this.startTiles = 2;

    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("undo", this.undo.bind(this));

    this.setup();
  }

  // Restart the game
  restart() {
    this.actuator.restart();
    this.setup();
  }

  undo() {
    this.loadSavedState();
    this.actuate();
    this.actuator.clearMessage();
  }

  saveState() {
    this.history.push({
      grid: this.grid.clone(),
      score: this.score,
      over: this.over,
      won: this.won
    });
  }

  loadSavedState() {
    var old_state = this.history.pop();
    this.grid = old_state.grid;
    this.score = old_state.score;
    this.over = old_state.over;
    this.won = old_state.won;
  }

  // Set up the game
  setup() {
    this.grid = new Grid(this.size);
    this.score = 0;
    this.over = false;
    this.won = false;

    // Add the initial tiles
    this.addStartTiles();
    console.log("Before ready");
    getMatch();

    console.log("after ready");

    // Update the actuator
    this.actuate();
  }

  // Set up the initial tiles to start the game with
  addStartTiles() {
    for (var i = 0; i < this.startTiles; i++) {
      this.addRandomTile();
    }
  }

  // Adds a tile in a random position
  addRandomTile() {
    if (this.grid.cellsAvailable()) {
      var value = Math.random() < 0.9 ? 2 : 4;
      var tile = new Tile(this.grid.randomAvailableCell(), value);

      this.grid.insertTile(tile);
    }
  }

  // Sends the updated grid to the actuator
  actuate() {
    if (this.scoreManager.get() < this.score) {
      this.scoreManager.set(this.score);
    }

    this.actuator.actuate(this.grid, {
      score: this.score,
      over: this.over,
      won: this.won,
      bestScore: this.scoreManager.get(),
      history: !this.history.isEmpty()
    });
  }

  // Save all tile positions and remove merger info
  prepareTiles() {
    this.grid.eachCell(function(x, y, tile) {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  }

  // Move a tile and its representation
  moveTile(tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  }

  // Move tiles on the grid in the specified direction
  move(direction) {
    // 0: up, 1: right, 2:down, 3: left
    var self = this;

    if (this.over || this.won) return; // Don't do anything if the game's over

    var cell, tile;

    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;

    // backup for undo
    this.saveState();

    // Save the current tile positions and remove merger information
    this.prepareTiles();

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function(x) {
      traversals.y.forEach(function(y) {
        cell = { x: x, y: y };
        tile = self.grid.cellContent(cell);

        if (tile) {
          var positions = self.findFarthestPosition(cell, vector);
          var next = self.grid.cellContent(positions.next);

          // Only one merger per row traversal?
          if (next && next.value === tile.value && !next.mergedFrom) {
            var merged = new Tile(positions.next, tile.value * 2);
            merged.mergedFrom = [tile, next];

            self.grid.insertTile(merged);
            self.grid.removeTile(tile);

            // Converge the two tiles' positions
            tile.updatePosition(positions.next);

            // Update the score
            self.score += merged.value;

            // The mighty 2048 tile
            if (merged.value === 2048) self.won = true;
          } else {
            self.moveTile(tile, positions.farthest);
          }

          if (!self.positionsEqual(cell, tile)) {
            moved = true; // The tile moved from its original cell!
          }
        }
      });
    });

    if (moved) {
      this.addRandomTile();

      if (!this.movesAvailable()) {
        this.over = true; // Game over!
      }

      this.actuate();
    }
  }

  // Get the vector representing the chosen direction
  getVector(direction) {
    // Vectors representing tile movement
    var map = {
      0: { x: 0, y: -1 }, // up
      1: { x: 1, y: 0 }, // right
      2: { x: 0, y: 1 }, // down
      3: { x: -1, y: 0 } // left
    };

    return map[direction];
  }

  // Build a list of positions to traverse in the right order
  buildTraversals(vector) {
    var traversals = { x: [], y: [] };

    for (var pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
  }

  findFarthestPosition(cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
      previous = cell;
      cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

    return {
      farthest: previous,
      next: cell // Used to check if a merge is required
    };
  }

  movesAvailable() {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  }

  // Check for available matches between tiles (more expensive check)
  tileMatchesAvailable() {
    var self = this;

    var tile;

    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x: x, y: y });

        if (tile) {
          for (var direction = 0; direction < 4; direction++) {
            var vector = self.getVector(direction);
            var cell = { x: x + vector.x, y: y + vector.y };

            var other = self.grid.cellContent(cell);

            if (other && other.value === tile.value) {
              return true; // These two tiles can be merged
            }
          }
        }
      }
    }

    return false;
  }

  positionsEqual(first, second) {
    return first.x === second.x && first.y === second.y;
  }
}

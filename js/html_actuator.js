import { submitScore } from "./celerx.js";
export default class HTMLActuator {
  constructor() {
    this.tileContainer = document.querySelector(".tile-container");
    this.scoreContainer = document.querySelector(".score-container");
    this.bestContainer = document.querySelector(".best-container");
    this.messageContainer = document.querySelector(".game-message");
    this.undoButton = document.querySelector("#undo-button");

    this.score = 0;
  }

  actuate(grid, metadata) {
    var self = this;

    window.requestAnimationFrame(function() {
      self.clearContainer(self.tileContainer);

      grid.cells.forEach(function(column) {
        column.forEach(function(cell) {
          if (cell) {
            self.addTile(cell);
          }
        });
      });

      self.updateScore(metadata.score);
      self.updateBestScore(metadata.bestScore);
      self.updateUndoButton(metadata.history);

      if (metadata.over) self.message(false); // You lose
      if (metadata.won) self.message(true); // You win!
    });
  }

  restart() {
    if (typeof ga !== "undefined") {
      ga("send", "event", "game", "restart");
    }
    this.clearMessage();
  }

  clearContainer(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  addTile(tile) {
    var self = this;

    var element = document.createElement("div");
    var position = tile.previousPosition || {
      x: tile.x,
      y: tile.y
    };
    var positionClass = this.positionClass(position);

    // We can't use classlist because it somehow glitches when replacing classes
    var classes = ["tile", "tile-" + tile.value, positionClass];
    this.applyClasses(element, classes);

    element.textContent = tile.value;

    if (tile.previousPosition) {
      // Make sure that the tile gets rendered in the previous position first
      window.requestAnimationFrame(function() {
        classes[2] = self.positionClass({
          x: tile.x,
          y: tile.y
        });
        self.applyClasses(element, classes); // Update the position
      });
    } else if (tile.mergedFrom) {
      classes.push("tile-merged");
      this.applyClasses(element, classes);

      // Render the tiles that merged
      tile.mergedFrom.forEach(function(merged) {
        self.addTile(merged);
      });
    } else {
      classes.push("tile-new");
      this.applyClasses(element, classes);
    }

    // Put the tile on the board
    this.tileContainer.appendChild(element);
  }

  applyClasses(element, classes) {
    element.setAttribute("class", classes.join(" "));
  }

  normalizePosition(position) {
    return { x: position.x + 1, y: position.y + 1 };
  }

  positionClass(position) {
    position = this.normalizePosition(position);
    return "tile-position-" + position.x + "-" + position.y;
  }

  updateScore(score) {
    this.clearContainer(this.scoreContainer);

    var difference = score - this.score;
    this.score = score;

    this.scoreContainer.textContent = this.score;

    if (difference > 0) {
      var addition = document.createElement("div");
      addition.classList.add("score-addition");
      addition.textContent = "+" + difference;

      this.scoreContainer.appendChild(addition);
    }
  }

  updateBestScore(bestScore) {
    this.bestContainer.textContent = bestScore;
  }

  updateUndoButton(active) {
    if (active) {
      this.undoButton.setAttribute("class", "active");
    } else {
      this.undoButton.setAttribute("class", "inactive");
    }
  }

  message(won) {
    var type = won ? "game-won" : "game-over";
    var message = won ? "You win!" : "Game over!";
    submitScore(this.score);
    if (typeof ga !== "undefined") {
      ga("send", "event", "game", "end", type, this.score);
    }

    this.messageContainer.classList.add(type);
    this.messageContainer.getElementsByTagName("p")[0].textContent = message;

    this.clearContainer(this.sharingContainer);
    this.sharingContainer.appendChild(this.scoreTweetButton());
    twttr.widgets.load();
  }

  clearMessage() {
    this.messageContainer.classList.remove("game-won", "game-over");
  }

  scoreTweetButton() {
    var tweet = document.createElement("a");
    tweet.classList.add("twitter-share-button");
    tweet.setAttribute("href", "https://twitter.com/share");
    tweet.setAttribute("data-via", "gabrielecirulli");
    tweet.textContent = "Tweet";

    var text =
      "I scored " +
      this.score +
      " points at 2048, a game where you " +
      "join numbers to score high! #2048game";
    tweet.setAttribute("data-text", text);

    return tweet;
  }
}

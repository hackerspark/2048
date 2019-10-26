export default class Grid {
  constructor(size) {
    this.size = size;
    this.cells = [];
    this.build();
  }

  clone() {
    const new_grid = new Grid(this.size);
    new_grid.build();

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        if (this.cells[x][y] == null) {
          new_grid.cells[x][y] = null;
        } else {
          new_grid.cells[x][y] = this.cells[x][y].clone();
        }
      }
    }

    return new_grid;
  }

  build() {
    for (let x = 0; x < this.size; x++) {
      let row = (this.cells[x] = []);

      for (let y = 0; y < this.size; y++) {
        row.push(null);
      }
    }
  }

  randomAvailableCell() {
    const cells = this.availableCells();

    if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)];
    }
  }

  availableCells() {
    let cells = [];

    this.eachCell((x, y, tile) => {
      if (!tile) {
        cells.push({ x: x, y: y });
      }
    });

    return cells;
  }

  eachCell(callback) {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        callback(x, y, this.cells[x][y]);
      }
    }
  }

  cellsAvailable() {
    return !!this.availableCells().length;
  }

  cellAvailable(cell) {
    return !this.cellOccupied(cell);
  }

  cellOccupied(cell) {
    return !!this.cellContent(cell);
  }

  cellContent(cell) {
    if (this.withinBounds(cell)) {
      return this.cells[cell.x][cell.y];
    } else {
      return null;
    }
  }

  // Inserts a tile at its position
  insertTile(tile) {
    this.cells[tile.x][tile.y] = tile;
  }

  removeTile(tile) {
    this.cells[tile.x][tile.y] = null;
  }

  withinBounds(position) {
    return (
      position.x >= 0 &&
      position.x < this.size &&
      position.y >= 0 &&
      position.y < this.size
    );
  }
}

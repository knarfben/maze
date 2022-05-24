// Original JavaScript code by Chirp Internet: chirpinternet.eu
// Please acknowledge use of this code by including this header.

class MazeBuilder {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.cols = 2 * this.width + 1;
    this.rows = 2 * this.height + 1;

    this.mazeJS = this.initArray();
    // console.log({ mazeJSInit: this.mazeJS });

    this.entrance = [];

    // place initial walls
    this.mazeJS.forEach((row, r) => {
      row.forEach((cell, c) => {
        switch (r) {
          case 0:
          case this.rows - 1:
            this.mazeJS[r][c] = ["wall"];
            break;

          default:
            if (r % 2 == 1) {
              if (c == 0 || c == this.cols - 1) {
                this.mazeJS[r][c] = ["wall"];
              }
            } else if (c % 2 == 0) {
              this.mazeJS[r][c] = ["wall"];
            }
        }
      });

      if (r == 0) {
        // place exit in top row
        let doorPos = this.posToSpace(this.rand(1, this.width));
        this.mazeJS[r][doorPos] = ["door", "exit"];
      }

      if (r == this.rows - 1) {
        // place entrance in bottom row
        let doorPos = this.posToSpace(this.rand(1, this.width));
        this.mazeJS[r][doorPos] = ["door", "entrance"];
        // console.log({ entrance: [r, doorPos] });
        this.entrance = [r, doorPos];
      }
    });

    // start partitioning
    this.partition(1, this.height - 1, 1, this.width - 1);
  }

  initArray() {
    return new Array(this.rows)
      .fill()
      .map(() => Array.from({ length: this.cols }, () => []));
  }

  rand(min, max) {
    return min + Math.floor(Math.random() * (1 + max - min));
  }

  posToSpace(x) {
    return 2 * (x - 1) + 1;
  }

  posToWall(x) {
    return 2 * x;
  }

  inBounds(r, c) {
    if (
      typeof this.mazeJS[r] == "undefined" ||
      typeof this.mazeJS[r][c] == "undefined"
    ) {
      return false; // out of bounds
    }
    return true;
  }

  shuffle(array) {
    // sauce: https://stackoverflow.com/a/12646864
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  partition(r1, r2, c1, c2) {
    // create partition walls
    // ref: https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_division_method

    let horiz, vert, x, y, start, end;

    if (r2 < r1 || c2 < c1) {
      return false;
    }

    if (r1 == r2) {
      horiz = r1;
    } else {
      x = r1 + 1;
      y = r2 - 1;
      start = Math.round(x + (y - x) / 4);
      end = Math.round(x + (3 * (y - x)) / 4);
      horiz = this.rand(start, end);
    }

    if (c1 == c2) {
      vert = c1;
    } else {
      x = c1 + 1;
      y = c2 - 1;
      start = Math.round(x + (y - x) / 3);
      end = Math.round(x + (2 * (y - x)) / 3);
      vert = this.rand(start, end);
    }

    for (let i = this.posToWall(r1) - 1; i <= this.posToWall(r2) + 1; i++) {
      for (let j = this.posToWall(c1) - 1; j <= this.posToWall(c2) + 1; j++) {
        if (i == this.posToWall(horiz) || j == this.posToWall(vert)) {
          this.mazeJS[i][j] = ["wall"];
        }
      }
    }

    let gaps = this.shuffle([true, true, true, false]);

    // create gaps in partition walls

    if (gaps[0]) {
      let gapPosition = this.rand(c1, vert);
      this.mazeJS[this.posToWall(horiz)][this.posToSpace(gapPosition)] = [];
    }

    if (gaps[1]) {
      let gapPosition = this.rand(vert + 1, c2 + 1);
      this.mazeJS[this.posToWall(horiz)][this.posToSpace(gapPosition)] = [];
    }

    if (gaps[2]) {
      let gapPosition = this.rand(r1, horiz);
      this.mazeJS[this.posToSpace(gapPosition)][this.posToWall(vert)] = [];
    }

    if (gaps[3]) {
      let gapPosition = this.rand(horiz + 1, r2 + 1);
      this.mazeJS[this.posToSpace(gapPosition)][this.posToWall(vert)] = [];
    }

    // recursively partition newly created chambers

    this.partition(r1, horiz - 1, c1, vert - 1);
    this.partition(horiz + 1, r2, c1, vert - 1);
    this.partition(r1, horiz - 1, vert + 1, c2);
    this.partition(horiz + 1, r2, vert + 1, c2);
  }

  isGap(...cells) {
    return cells.every((array) => {
      let row, col;
      [row, col] = array;
      if (this.mazeJS[row][col].length > 0) {
        if (!this.mazeJS[row][col].includes("door")) {
          return false;
        }
      }
      return true;
    });
  }

  countSteps(array, r, c, val, stop) {
    if (!this.inBounds(r, c)) {
      return false; // out of bounds
    }

    if (array[r][c] <= val) {
      return false; // shorter route already mapped
    }

    if (!this.isGap([r, c])) {
      return false; // not traversable
    }

    array[r][c] = val;

    if (this.mazeJS[r][c].includes(stop)) {
      return true; // reached destination
    }

    this.countSteps(array, r - 1, c, val + 1, stop);
    this.countSteps(array, r, c + 1, val + 1, stop);
    this.countSteps(array, r + 1, c, val + 1, stop);
    this.countSteps(array, r, c - 1, val + 1, stop);
  }

  getKeyLocation() {
    let fromEntrance = this.initArray();
    let fromExit = this.initArray();

    this.totalSteps = -1;

    for (let j = 1; j < this.cols - 1; j++) {
      if (this.mazeJS[this.rows - 1][j].includes("entrance")) {
        this.countSteps(fromEntrance, this.rows - 1, j, 0, "exit");
      }
      if (this.mazeJS[0][j].includes("exit")) {
        this.countSteps(fromExit, 0, j, 0, "entrance");
      }
    }

    let fc = -1,
      fr = -1;

    this.mazeJS.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (typeof fromEntrance[r][c] == "undefined") {
          return;
        }
        let stepCount = fromEntrance[r][c] + fromExit[r][c];
        if (stepCount > this.totalSteps) {
          fr = r;
          fc = c;
          this.totalSteps = stepCount;
        }
      });
    });

    return [fr, fc];
  }

  placeKey() {
    let fr, fc;
    [fr, fc] = this.getKeyLocation();
    console.log({ keyLocation: [fr, fc] });

    this.mazeJS[fr][fc] = ["key"];
  }

  display(id) {
    this.parentDiv = document.getElementById(id);

    if (!this.parentDiv) {
      alert('Cannot initialise maze - no element found with id "' + id + '"');
      return false;
    }

    while (this.parentDiv.firstChild) {
      this.parentDiv.removeChild(this.parentDiv.firstChild);
    }

    const container = document.createElement("div");
    container.id = "maze";
    container.dataset.steps = this.totalSteps;
    // console.log({ mazeBeforDisplay: this.mazeJS });
    this.mazeJS.forEach((row) => {
      let rowDiv = document.createElement("div");
      row.forEach((cell) => {
        let cellDiv = document.createElement("div");
        if (cell) {
          cellDiv.className = cell.join(" ");
          // console.log({ cell: cell.join(" ") });
        }
        rowDiv.appendChild(cellDiv);
      });
      container.appendChild(rowDiv);
    });

    this.parentDiv.appendChild(container);

    return true;
  }
}

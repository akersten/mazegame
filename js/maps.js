/**
 * The maze object.
 */
function maze(width, height) {
  this.width = width;
  this.height = height;
  console.log("Generating maze...");
  this.mazeData = generate_DFS(width, height);
  console.log("Maze generated!");

  this.size = width * height;

  if (width < 2 || height < 2) {
    alert("Invalid maze parameters!");
  }

  this.hasWall = function(x, y, dir) {
    var bits = this.mazeData[y * this.width + x];
    switch (dir) {
      case 0:
        return (bits & 0x80) > 0;
      case 1:
        return (bits & 0x40) > 0;
      case 2:
        return (bits & 0x20) > 0;
      case 3:
        return (bits & 0x10) > 0;
    }
  }

  /**
   * Print a textual representation of the maze to the debug console, just
   * to make sure our maze generation is doing sane things.
   */
  this.debugPrint = function() {
    for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < 3; j++) {
        //Each row has a top, middle, and bottom.
        var line = "";
        for (var k = 0; k < this.width; k++) {
          switch (j) {
            case 0:
              line += "*";
              if (this.hasWall(k, i, 0)) {
                line += "-";
              } else {
                line += " ";
              }
              line += "*"
              break;
            case 1:
              if (this.hasWall(k, i, 2)) {
                line += "|";
              } else {
                line += " ";
              }
              if (this.mazeData[i * width + k] & 0x01) {
                line += "H";
              }else {
              line += " "
              }
              if (this.hasWall(k, i, 1)) {
                line += "|";
              } else {
                line += " ";
              }
              break;
            case 2:
              line += "*";
              if (this.hasWall(k, i, 3)) {
                line += "-";
              } else {
                line += " ";
              }
              line += "*"
              break;
          }
        }
        console.log(line);
      }
    }
  }
}

/**
 * A simple algorithm for generating a maze is to do a random walk in DFS style.
 * Our maze will be an array of byte bitmaps representing "cells" of the maze.
 * Each cell can have walls, and these cell-wall structures constitute the maze.
 *
 * Here's the bit layout:
 * [WALLS (4 bits) | META (4 bits)]
 *
 * WALLS: [N | E | W | S]
 *         If a bit is set, there is a wall there. That is, this starts as 1111.
 * META: [Backtrack Direction (2 bits) | Visited | Home]
 *         Instead of using a stack, we'll save a backtrack direction for each
 *         cell (because these mazes might get big and we don't need overflow).
 *         Visited bit is for the DFS to determine if any neighbors of the
 *         current cell need exploring. Home bit is to let us know whether the
 *         backtrack direction is valid (or if generation has come to an end).
 */
function generate_DFS(width, height) {
  var msize = width * height;

  //Typed Arrays in JS!
  var mazeData = new Uint8Array(msize);

  if (mazeData.byteLength != msize) {
    alert("Something horrible has happened during maze generation!" +
          "\nYour browser probably doesn't support typed arrays.");
  }

  //Set the initial state of the maze: everything is a wall, nothing is visited,
  //and all backtrack directions are 00 to easily mask them later.
  for (var i = 0; i < msize; i++) {
    mazeData[i] = 0xF0; //1111 0000
  }

  /**
   * Internal helper function to return a random neighboring cell ID which isn't
   * outside of the maze.
   *
   * @return The cell index of a random unvisited neighbor. -1 if none exist.
   */
  function getRandomUnvisitedNeighbor(where) {
    if (where < 0 || where >= msize) {
      alert("Index out of bounds: " + where);
      return -1;
    }

    //Build a list of candidate neighbors. A neighbor is not a candidate if it
    //would be outside of the maze (border edge cases) or if it's visited.
    var candidates = [];

    //North
    if (where >= width) {
      if ((mazeData[where - width] & 0x02) == 0) {
        candidates.push(where - width);
      }
    }

    //South
    if (where + width < msize) {
      if ((mazeData[where + width] & 0x02) == 0) {
        candidates.push(where + width);
      }
    }

    //West
    if (where % width != 0) {
      if ((mazeData[where - 1] & 0x02) == 0) {
        candidates.push(where - 1);
      }
    }

    //East
    if ((where + 1) % width != 0) {
      if ((mazeData[where + 1] & 0x02) == 0) {
        candidates.push(where + 1);
      }
    }

    console.log("Candidates length was " + candidates.length);

    if (candidates.length == 0) {
      return -1;
    }

    return candidates[~~(Math.random() * candidates.length)];
  }

  /**
   * Because we store the backtrack direction in two bits, we need to be able to
   * get the cell ID of the neighbor we mean to backtrack to.
   *
   * @return the cell ID of where we arrive by travelling in `dir` from `whence`
   *         where values for `dir` are 00 = N, 01 = E, 10 = W, 11 = S.
   */
  function getNeighbor(whence, dir) {
    if (whence < 0 || whence >= msize || dir < 0 || dir > 3) {
      alert("Internal argument error; dir: " + dir + "; whence: " + whence);
      return -1;
    }

    //North
    if (dir == 0) {
      if (whence >= width) {
        return whence - width;
      } else {
        return -1;
      }
    }

    //South
    if (dir == 3) {
      if (whence + width < msize) {
        return whence + width;
      } else {
        return -1;
      }
    }

    //West
    if (dir == 2) {
      if (whence % width != 0) {
        return whence - 1;
      } else {
        return -1;
      }
    }

    //East
    if (dir == 1) {
      if ((whence + 1) % width != 0) {
        return whence + 1;
      } else {
        return -1;
      }
    }

    return -1;
  }

  //Pick a random cell to start from.
  var curCell = ~~(Math.random() * msize);
  mazeData[curCell] |= 0x01;

  var dbg = 0;
  while (dbg < 15) {
    //Pick an unvisited neighbor at random.
    var canCell = getRandomUnvisitedNeighbor(curCell);

    if (canCell == -1) {
      //This cell has no candidate neighbors, so backtrack from this cell, or
      //terminate if this is the home cell.
      if ((mazeData[curCell] & 0x01) == 1) {
        break;
      }

      dbg++;
      curCell = getNeighbor(curCell, (curCell & 0x0C) >> 2);
      continue;
    }

    //Set new cell as visited.
    mazeData[canCell] |= 0x02;

    //See how we approached the new cell and demolish the appropriate walls.
    //Also, set the backtrack data on the candidate cell.
    switch (canCell - curCell) {
      case 1:
        //Went east
        mazeData[canCell] &= 0xDF;
        mazeData[curCell] &= 0xBF;

        //And should go back west
        mazeData[canCell] |= 0x08;
        break;
      case -1:
        //Went west
        mazeData[canCell] &= 0xBF;
        mazeData[curCell] &= 0xDF;

        //And should go back east
        mazeData[canCell] |= 0x04;
        break;
      case -width:
        //Went north
        mazeData[canCell] &= 0xEF;
        mazeData[curCell] &= 0x7F;

        //And should go back south
        mazeData[canCell] |= 0x0C;
        break;
      case width: //Went south
        mazeData[canCell] &= 0x7F;
        mazeData[curCell] &= 0xEF;

        //And should go back north
        mazeData[canCell] |= 0x00;
        break;
    }

    //Set the new cell as the current cell.
    curCell = canCell;
  }

  return mazeData;
}
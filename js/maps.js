/**
 * The maze object.
 */
function maze(width, height) {
  if (width < 2 || height < 2) {
    alert("Invalid maze parameters!");
  }

  this.width = width;
  this.height = height;
  this.mazeData = generate_DFS(width, height);
  this.size = width * height;

  //Find out where the starting position in this labrynth will be.
  this.findHomeCell = function() {
    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        if (this.mazeData[i * width + j] & 0x01) {
          console.log("Home cell found at " + j + "," + i);
          return i * width + j;
        }
      }
    }
    return -1;
  }
  this.homecell = this.findHomeCell();
  if (this.homecell == -1) {
    alert("Couldn't determine home cell.");
  }

  /**
   * Whether this maze has a wall in a certain direction of a particular cell.
   *
   * @return true if there is a wall in the `dir` direction from the cell at
   *         `x`*`y`, false otherwise.
   */
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
                //By the way, this is the home square...

              }else {
                switch((this.mazeData[i * width + k] & 0x0C) >> 2) {
                  case 0:
                    line += "^";
                    break;
                  case 1:
                    line += ">";
                    break;
                  case 2:
                    line += "<";
                    break;
                  case 3:
                    line += "v";
                    break;
                }

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
 *
 * @return A typed array containing `width` * `height` entries of the above.
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
      alert("Neighbor index out of bounds: " + where);
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
  mazeData[curCell] |= 0x03; //Home is both visited and the home cell.

  while (true) {
    //Pick an unvisited neighbor at random.
    var canCell = getRandomUnvisitedNeighbor(curCell);

    if (canCell == -1) {
      //This cell has no candidate neighbors, so backtrack from this cell, or
      //terminate if this is the home cell.
      if ((mazeData[curCell] & 0x01) == 1) {
        break;
      }

      curCell = getNeighbor(curCell, (mazeData[curCell] & 0x0C) >> 2);
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

  //Pick a random edge cell from which to knock out the exit.


  return mazeData;
}


/**
 * Generates THREE.js geometry for maze data as specified above.
 * Uses built-in merge functionality to make it all one mesh instead of a bunch
 * of individual cubes. Hopefully THREE.js is smart enough to do internal face
 * culling and optimization.
 *
 * @return A geometry representing the maze.
 */
function generateMazeGeometry(mazeObj) {
  /**
   * Translate all points in a geometry `n` units in the x direction.
   */
  function transx(geo, n) {
    for (var i = 0; i < geo.vertices.length; i++) {
      geo.vertices[i].x += n;
    }
  }

  /**
   * Translate all points in a geometry `n` units in the z direction.
   */
  function transz(geo, n) {
    for (var i = 0; i < geo.vertices.length; i++) {
      geo.vertices[i].z += n;
    }
  }

  var blockSize = 25;

  //We'll have the upper-left cornerstone be our anchor. Generate it first and
  //attach anything else to it.
  var geo = new THREE.CubeGeometry(blockSize, blockSize, blockSize);

  //For each row, look north and east and add a block if there's a wall there.
  //We'll manually add the south-border and west-border (if walls exist).
  //This process is to avoid overlap by placing cubes twice for the same wall,
  //since there's redundant information in the data structure.
  for (var i = 0; i < mazeObj.height; i++) {
    for (var j = 0; j < mazeObj.width; j++) {
      //XXX: There's a tiny bit of overlap in some of the generated meshes, once
      //in a while they'll generate in the same spot. I don't think it really
      //matters since the merge will optimize that out(?) but just something to
      //know.
      if (j == 0) {
        //Touches west border, manual corner case
        if (mazeObj.hasWall(j, i, 2)) {
          var tmp = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
          transz(tmp, (2 * i + 1) * blockSize);
          THREE.GeometryUtils.merge(geo,tmp);

          var tmp = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
          transz(tmp, (2 * i + 2) * blockSize);
          THREE.GeometryUtils.merge(geo,tmp);
        }
      }

      if (mazeObj.hasWall(j, i, 0)) {
        var tmp = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
        transz(tmp, 2 * i * blockSize);
        transx(tmp, (2 * j + 1) * blockSize);
        THREE.GeometryUtils.merge(geo,tmp);

        //Randomly don't generate this, to give the maze some more variety.
        if (!(i > 0 && i < mazeObj.height - 1 && j > 0 && j < mazeObj.width - 1 && Math.random() > 0.6)) {
          var tmp = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
          transz(tmp, 2 * i * blockSize);
          transx(tmp, (2 * j + 2) * blockSize);
          THREE.GeometryUtils.merge(geo,tmp);
        }
      }

      if (mazeObj.hasWall(j, i, 1)) {
        var tmp = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
        transz(tmp, (2 * i + 1) * blockSize);
        transx(tmp, (2 * j + 2) * blockSize);
        THREE.GeometryUtils.merge(geo,tmp);
        if (!(i > 0 && i < mazeObj.height - 1 && j > 0 && j < mazeObj.width - 1 && Math.random() > 0.6)) {
          var tmp = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
          transz(tmp, (2 * i) * blockSize);
          transx(tmp, (2 * j + 2) * blockSize);
          THREE.GeometryUtils.merge(geo,tmp);
        }
      }

      if (i == mazeObj.height - 1) {
        //Touches south border, manual corner case
        if (mazeObj.hasWall(j, i, 3)) {
          var tmp = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
          transz(tmp, 2 * (i + 1) * blockSize);
          transx(tmp, (2 * j + 1) * blockSize);
          THREE.GeometryUtils.merge(geo,tmp);

          var tmp = new THREE.CubeGeometry(blockSize, blockSize, blockSize);
          transz(tmp, 2 * (i + 1) * blockSize);
          transx(tmp, (2 * j + 2) * blockSize);
          THREE.GeometryUtils.merge(geo,tmp);
        }
      }
    }
  }

  return geo;
}
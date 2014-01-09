
/**
 * A simple algorithm for generating a maze is to do a random walk in DFS style.
 * Our maze will be an array of byte bitmaps representing "cells" of the maze.
 * Each cell can have walls, and these cell-wall structures constitute the maze.
 *
 * Here's the bit layout:
 * [0 | WALLS (4 bits) | META (3 bits)]
 *
 * WALLS: [N | E | W | S]
 *         If a bit is set, there is a wall there. That is, this starts as 1111.
 * META: [Backtrack Direction (2 bits) | Visited]
 *         Instead of using a stack, we'll save a backtrack direction for each
 *         cell (because these mazes might get big and we don't need overflow).
 *         Visited bit is for the DFS to determine if any neighbors of the
 *         current cell need exploring.
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
    mazeData[i] = 0x78; //0111 1000
  }


}
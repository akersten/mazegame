/**
 * The main game object.
 */
function game() {
  this.loaded = false;

  //First we'll generate the actual maze data.
  this.currentMaze = new maze(5,5);
  this.currentMaze.debugPrint();

  //Then, generate the world geometry.
  var currentMazeGeometry = generateMazeGeometry(this.currentMaze);
  this.currentMazeMesh = new THREE.Mesh(currentMazeGeometry,new THREE.MeshBasicMaterial(
    { color: 0xBBFFCC, wireframe: true }));

  this.loaded = true;
}




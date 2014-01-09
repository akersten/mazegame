/**
 * The main game object.
 */
function game() {
  this.loaded = false;

  //First we'll generate the actual maze data.
  this.currentMaze = new maze(2,2);
  this.currentMaze.debugPrint();

  //Then, generate the world geometry.
  var currentMazeGeometry = generateMazeGeometry(this.currentMaze);
  this.currentMazeMesh = new THREE.Mesh(currentMazeGeometry,new THREE.MeshBasicMaterial(
    { color: 0xBBFFCC, wireframe: true }));

  var playerGeometry = new THREE.SphereGeometry(10, 3, 2);
  this.playerMesh = new THREE.Mesh(playerGeometry, new THREE.MeshBasicMaterial(
    {color: 0xFFBBEE, wireframe: true }));

  //Move the player to where they should be...
  this.playerMesh.position.x = 2 * (this.currentMaze.homecell % this.currentMaze.width) * 25 + 25;
  this.playerMesh.position.z = 2 * ~~(this.currentMaze.homecell / this.currentMaze.width) * 25 + 25;

  this.loaded = true;
}




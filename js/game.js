var camera, scene, renderer, gameTimer;
/**
 * The main game object.
 */
function game() {
  this.loaded = false;

  //First we'll generate the actual maze data.
  this.currentMaze = new maze(10,10);
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



function wouldPlayerCollideWithMaze(direction, distance) {
  var ray = new THREE.Raycaster(g.playerMesh.position, direction, 0, distance + 1);
  var colliders = ray.intersectObject(g.currentMazeMesh, false);

  return (colliders.length > 0 && colliders[0].distance < distance);
}